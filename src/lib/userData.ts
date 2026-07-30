import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type FirestoreError,
  type Timestamp
} from 'firebase/firestore'
import { getDownloadURL, getStorage, ref } from 'firebase/storage'
import { db, firebaseProjectId } from './firebase'
import type { AnalysisReport, Classification, LabMetric } from './labAnalysis'

export type RemoteRecord = { id: string; createdAt: number; data: DocumentData; downloadUrl?: string; fileMissing?: boolean }
export type DataState = {
  reports: AnalysisReport[]
  usage: RemoteRecord[]
  datasets: RemoteRecord[]
  preferences: DocumentData | null
  loading: boolean
  offline: boolean
  error: '' | 'permission-denied' | 'read-failure' | 'invalid-data'
}

const empty: DataState = { reports: [], usage: [], datasets: [], preferences: null, loading: true, offline: !navigator.onLine, error: '' }

function time(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') return (value as Timestamp).toMillis()
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Date.parse(value) || 0
  return 0
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function metric(value: unknown): LabMetric | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const numeric = Number(item.value)
  const classificationValue = String(item.classification ?? item.finalStatus ?? 'Normal')
  const classification: Classification = classificationValue.toLowerCase().includes('anomal') || classificationValue.toLowerCase().includes('high') || classificationValue.toLowerCase().includes('low')
    ? 'Anomaly' : classificationValue.toLowerCase() === 'good' ? 'Good' : 'Normal'
  const name = String(item.name ?? item.attribute ?? '')
  if (!name || !Number.isFinite(numeric)) return null
  return {
    name,
    value: numeric,
    unit: String(item.unit ?? ''),
    referenceRange: String(item.referenceRange ?? 'Not provided'),
    extractionStatus: String(item.extractionStatus ?? item.sourceStatus ?? '').toLowerCase() === 'correct' ? 'Correct' : 'Extracted',
    classification
  }
}

function report(id: string, data: DocumentData): AnalysisReport | null {
  const metrics = Array.isArray(data.metrics) ? data.metrics.map(metric).filter((item): item is LabMetric => !!item) : []
  const created = time(data.createdAt ?? data.analysisDate ?? data.date)
  const type = String(data.type ?? data.reportType ?? data.title ?? 'Laboratory Analysis')
  if (!type || (!created && !metrics.length && !data.summary)) return null
  return {
    id,
    fileName: String(data.fileName ?? data.filename ?? ''),
    type,
    date: new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(created || Date.now())),
    metrics,
    summary: String(data.summary ?? 'Analysis completed.'),
    findings: strings(data.findings),
    recommendations: strings(data.recommendations),
    status: 'Analyzed'
  }
}

function errorType(error: FirestoreError): DataState['error'] {
  return error.code === 'permission-denied' ? 'permission-denied' : 'read-failure'
}

export function useUserData(uid: string | undefined, refreshKey = 0): DataState {
  const [state, setState] = useState<DataState>(empty)

  useEffect(() => {
    if (!uid) {
      setState({ ...empty, loading: false })
      return
    }
    console.info('[BiasSense] Firebase project:', firebaseProjectId)
    console.info('[BiasSense] Authenticated UID:', uid)
    const paths = ['usage', 'datasets', 'analyses', 'reports'] as const
    const loaded = new Set<string>()
    const values: Record<string, RemoteRecord[]> = {}
    const unsubscribers = paths.map((name) => {
      const path = `users/${uid}/${name}`
      console.info('[BiasSense] Reading Firestore path:', path)
      return onSnapshot(collection(db, 'users', uid, name), { includeMetadataChanges: true }, async (snapshot) => {
        const records: RemoteRecord[] = snapshot.docs.map((item) => ({
          id: item.id,
          createdAt: time(item.data().createdAt ?? item.data().analysisDate ?? item.data().updatedAt),
          data: item.data()
        })).sort((a, b) => b.createdAt - a.createdAt)
        if (name === 'datasets') {
          await Promise.all(records.map(async (item) => {
            const storagePath = item.data.storagePath ?? item.data.filePath
            if (typeof storagePath !== 'string' || !storagePath) return
            try { item.downloadUrl = await getDownloadURL(ref(getStorage(), storagePath)) }
            catch { item.fileMissing = true }
          }))
        }
        values[name] = records
        loaded.add(name)
        const combined = [...(values.analyses ?? []), ...(values.reports ?? [])]
        const unique = new Map(combined.map((item) => [item.id, item]))
        const parsed = [...unique.values()].sort((a, b) => b.createdAt - a.createdAt).map((item) => report(item.id, item.data))
        const invalid = combined.length > 0 && parsed.every((item) => !item)
        setState({
          reports: parsed.filter((item): item is AnalysisReport => !!item),
          usage: values.usage ?? [],
          datasets: values.datasets ?? [],
          preferences: values.preferences?.[0]?.data ?? null,
          loading: loaded.size < paths.length + 1,
          offline: !navigator.onLine,
          error: invalid ? 'invalid-data' : ''
        })
      }, (error) => {
        console.error('[BiasSense] Firestore read failed:', path, error.code, error.message)
        setState((current) => ({ ...current, loading: false, error: errorType(error) }))
      })
    })
    const preferencesPath = `users/${uid}/settings/preferences`
    console.info('[BiasSense] Reading Firestore path:', preferencesPath)
    unsubscribers.push(onSnapshot(doc(db, 'users', uid, 'settings', 'preferences'), { includeMetadataChanges: true }, (snapshot) => {
      values.preferences = snapshot.exists() ? [{ id: snapshot.id, createdAt: time(snapshot.data().updatedAt), data: snapshot.data() }] : []
      loaded.add('preferences')
      setState((current) => ({
        ...current,
        preferences: values.preferences[0]?.data ?? null,
        loading: loaded.size < paths.length + 1,
        offline: !navigator.onLine
      }))
    }, (error) => {
      console.error('[BiasSense] Firestore read failed:', preferencesPath, error.code, error.message)
      setState((current) => ({ ...current, loading: false, error: errorType(error) }))
    }))
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [uid, refreshKey])

  useEffect(() => {
    const updateOnlineStatus = () => setState((current) => ({ ...current, offline: !navigator.onLine }))
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  return useMemo(() => state, [state])
}

export async function saveAnalysis(uid: string, value: AnalysisReport) {
  const path = `users/${uid}/analyses/${value.id}`
  console.info('[BiasSense] Writing Firestore path:', path)
  await setDoc(doc(db, 'users', uid, 'analyses', value.id), {
    userId: uid,
    fileName: (value.fileName || 'Scanned document').slice(0, 180),
    reportType: value.type,
    analysisDate: Date.now(),
    metrics: value.metrics.map((item) => ({
      attribute: item.name,
      value: item.value,
      unit: item.unit,
      referenceRange: item.referenceRange,
      sourceStatus: item.extractionStatus,
      finalStatus: item.classification,
      classification: item.classification
    })),
    findings: value.findings,
    recommendations: value.recommendations,
    summary: value.summary,
    status: 'Completed',
    createdAt: serverTimestamp()
  })
}

export async function savePreferences(uid: string, preferences: Record<string, unknown>) {
  const path = `users/${uid}/settings/preferences`
  console.info('[BiasSense] Writing Firestore path:', path)
  await setDoc(doc(db, 'users', uid, 'settings', 'preferences'), { ...preferences, updatedAt: serverTimestamp() }, { merge: true })
}
