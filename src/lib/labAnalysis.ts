import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { createWorker } from 'tesseract.js'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

export type Classification = 'Normal' | 'Good' | 'Anomaly'
export type LabMetric = {
  name: string
  value: number
  unit: string
  referenceRange: string
  extractionStatus: 'Extracted' | 'Correct'
  classification: Classification
}
export type AnalysisReport = {
  id: string
  fileName?: string
  type: string
  date: string
  metrics: LabMetric[]
  summary: string
  findings: string[]
  recommendations: string[]
  status: 'Analyzed'
}

const supported = [
  'hemoglobin','haemoglobin','hgb','wbc','rbc','platelet','hematocrit','mcv','mch','mchc',
  'cholesterol','hdl','ldl','triglycerides','hba1c','glucose','blood sugar',
  'tsh','t3','t4','creatinine','egfr','urea','bun','alt','ast','alp','bilirubin',
  'vitamin d','vitamin b12','ferritin','calcium','sodium','potassium'
]
const displayNames: Record<string,string> = { hgb:'Hemoglobin', haemoglobin:'Hemoglobin', 'blood sugar':'Blood Sugar', egfr:'eGFR', hba1c:'HbA1c', tsh:'TSH', hdl:'HDL', ldl:'LDL', wbc:'WBC', rbc:'RBC', alt:'ALT', ast:'AST', alp:'ALP', bun:'BUN' }

export async function readDocument(file: File, progress: (value: number, stage: string) => void): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  progress(12, 'Reading document securely')
  if (!file.size) throw new Error('The selected document is empty.')
  if (ext === 'txt') {
    const text = await file.text()
    if (!text.trim()) throw new Error('No readable text was found in this document.')
    return text
  }
  if (ext === 'csv') {
    progress(28, 'Reading CSV rows and columns')
    const raw = await file.text()
    if (!raw.trim()) throw new Error('No readable CSV rows were found.')
    try {
      const workbook = XLSX.read(raw, { type: 'string', raw: false })
      const text = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name]
        return sheet ? XLSX.utils.sheet_to_csv(sheet, { FS: ' ' }) : ''
      }).join('\n')
      return text.trim() || raw.replace(/[;,\t]+/g, ' ')
    } catch {
      // CSV remains readable text even when it contains irregular quoting.
      return raw.replace(/[;,\t]+/g, ' ')
    }
  }
  if (ext === 'xlsx' || ext === 'xls') {
    progress(30, 'Reading spreadsheet cells')
    const book = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const text = book.SheetNames.map((name) => {
      const sheet = book.Sheets[name]
      return sheet ? XLSX.utils.sheet_to_csv(sheet) : ''
    }).join('\n')
    if (!text.trim()) throw new Error('No readable spreadsheet cells were found.')
    return text
  }
  if (ext === 'docx') {
    progress(30, 'Reading Word document text')
    const response = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    const text = response && typeof response.value === 'string' ? response.value : ''
    if (!text.trim()) throw new Error('No readable text was found in this Word document.')
    return text
  }
  if (ext === 'doc') throw new Error('Legacy DOC files cannot be read safely. Save it as DOCX or PDF and try again.')
  if (ext === 'pdf') {
    progress(22, 'Opening PDF securely')
    const data = new Uint8Array(await file.arrayBuffer())
    const document = await pdfjs.getDocument({ data }).promise
    const pages: string[] = []
    for (let index = 1; index <= document.numPages; index++) {
      progress(15 + Math.round(index / document.numPages * 50), `Reading PDF page ${index} of ${document.numPages}`)
      const page = await document.getPage(index)
      const content = await page.getTextContent()
      pages.push(content.items.map((item) => 'str' in item ? item.str : '').join(' '))
    }
    const text = pages.join('\n')
    if (text.trim().length > 10) return text
    throw new Error('This PDF appears to contain scanned images. Export its pages as JPG or PNG for local OCR.')
  }
  if (['jpg','jpeg','png','webp'].includes(ext || '')) {
    progress(22, 'Starting private on-device OCR')
    const worker = await createWorker('eng', undefined, { logger: (message) => {
      if (message.status === 'recognizing text') progress(25 + Math.round((message.progress || 0) * 60), 'Scanning visible test names and values')
    } })
    try {
      const response = await worker.recognize(file)
      const text = response?.data?.text || ''
      if (!text.trim()) throw new Error('OCR could not find readable text. Try a sharper, well-lit image.')
      return text
    } finally { await worker.terminate() }
  }
  throw new Error('This document type is not supported.')
}

export function analyzeText(text: string, fileName?: string): AnalysisReport {
  if (typeof text !== 'string' || !text.trim()) throw new Error('No readable laboratory text was available for analysis.')
  const normalized = text.replace(/[|,;\t]+/g, ' ').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
  const metrics: LabMetric[] = []
  const occurrences = supported.flatMap((test) => {
    const matches = [...normalized.matchAll(new RegExp(`\\b${test.replace(/\s+/g, '\\s+')}\\b`, 'gi'))]
    return matches.map((match) => ({ test, index: match.index ?? -1, length: match[0].length }))
  }).filter((item) => item.index >= 0).sort((a, b) => a.index - b.index)
    .filter((item, index, all) => !all.slice(0, index).some((previous) => previous.index === item.index && previous.length >= item.length))

  for (let occurrenceIndex = 0; occurrenceIndex < occurrences.length; occurrenceIndex += 1) {
    try {
      const occurrence = occurrences[occurrenceIndex]
      const nextIndex = occurrences[occurrenceIndex + 1]?.index ?? normalized.length
      const segment = normalized.slice(occurrence.index, nextIndex)
      const afterName = segment.slice(occurrence.length)
      const valueMatch = afterName.match(/[-+]?\d+(?:\.\d+)?/)
      if (!valueMatch) continue
      const value = Number(valueMatch[0])
      if (!Number.isFinite(value)) continue
      const remainder = afterName.slice((valueMatch.index ?? 0) + valueMatch[0].length).trim()
      const unitMatch = remainder.match(/(?:[x×]?\s*10\^?\d+\/[A-Za-zµ]+|[A-Za-zµ%/]+(?:\/[A-Za-z]+)?)/)
      const explicitReference = remainder.match(/Reference:\s*(.*?)(?=\s+(?:Findings|Status|Analysis)$|$)/i)?.[1]?.trim()
      const rangeMatch = remainder.match(/(?:\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?|[<>]=?\s*\d+(?:\.\d+)?)/)
      const classification: Classification = value < 80 ? 'Normal' : value < 100 ? 'Good' : 'Anomaly'
      const name = displayNames[occurrence.test] || occurrence.test.replace(/\b\w/g, (letter) => letter.toUpperCase())
      const sourceStatus = /\bcorrect\b/i.test(remainder) ? 'Correct' : 'Extracted'
      if (!metrics.some((metric) => metric.name.toLowerCase() === name.toLowerCase())) metrics.push({ name, value, unit: unitMatch?.[0] || '', referenceRange: explicitReference || rangeMatch?.[0] || 'Not visible', extractionStatus: sourceStatus, classification })
    } catch {
      // A malformed row should never stop the remaining document analysis.
    }
  }
  const type = detectType(normalized)
  const counts = count(metrics)
  const summary = metrics.length
    ? `Local analysis extracted ${metrics.length} supported metrics from this ${type}. ${counts.Normal} Normal, ${counts.Good} Good, and ${counts.Anomaly} Anomaly results were classified using numeric values. This output is decision support and not a medical diagnosis.`
    : `No structured metrics were detected in this ${type}. Upload a clearer document containing visible laboratory test names and numeric values.`
  const id = globalThis.crypto?.randomUUID?.() || `analysis-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return { id, fileName, type, date: new Intl.DateTimeFormat('en', { dateStyle:'medium', timeStyle:'short' }).format(new Date()), metrics, summary, findings: findings(metrics), recommendations: recommendations(metrics), status:'Analyzed' }
}

function detectType(text: string) {
  const value = text.toLowerCase()
  const profiles = [
    { type:'Complete Blood Count', terms:['hemoglobin','haemoglobin','wbc','rbc','platelet','hematocrit','mcv','mch'] },
    { type:'Lipid Profile', terms:['cholesterol','hdl','ldl','triglyceride','lipid profile'] },
    { type:'Thyroid Profile', terms:['tsh','thyroid','free t3','free t4'] },
    { type:'Kidney Function Report', terms:['creatinine','egfr','urea','kidney','renal','bun'] },
    { type:'Liver Function Report', terms:['bilirubin','alt','ast','alp','liver'] }
  ]
  const ranked = profiles.map((profile) => ({ ...profile, score:profile.terms.reduce((score, term) => score + (value.includes(term) ? 1 : 0), 0) })).sort((a,b)=>b.score-a.score)
  return ranked[0].score > 0 ? ranked[0].type : 'Laboratory Analysis'
}
export function count(metrics: LabMetric[]) { return metrics.reduce((total, metric) => ({ ...total, [metric.classification]: total[metric.classification] + 1 }), { Normal:0, Good:0, Anomaly:0 }) }
function metric(metrics: LabMetric[], names: string[]) { return metrics.find((item) => names.some((name) => item.name.toLowerCase().includes(name))) }
function findings(metrics: LabMetric[]) {
  const result: string[] = []
  const add = (condition:boolean, text:string) => { if (condition) result.push(text) }
  const hemoglobin=metric(metrics,['hemoglobin']); add(!!hemoglobin && hemoglobin.value < 12, 'Hemoglobin appears low and may warrant clinical review in context.')
  const ldl=metric(metrics,['ldl']); add(!!ldl && ldl.value >= 100, 'LDL is elevated or borderline based on the extracted value.')
  const a1c=metric(metrics,['hba1c'])
  if (a1c && a1c.value >= 5.7) result.push(`HbA1c is in a ${a1c.value >= 6.5 ? 'diabetes-range' : 'prediabetes-range'} value band and should be confirmed clinically.`)
  const vitaminD=metric(metrics,['vitamin d']); add(!!vitaminD && vitaminD.value < 30, 'Vitamin D appears low.')
  const b12=metric(metrics,['vitamin b12']); add(!!b12 && b12.value < 200, 'Vitamin B12 appears low.')
  const creatinine=metric(metrics,['creatinine']); add(!!creatinine && creatinine.value > 1.3, 'Creatinine appears high.')
  const egfr=metric(metrics,['egfr']); add(!!egfr && egfr.value < 60, 'eGFR appears low and requires professional interpretation.')
  const tsh=metric(metrics,['tsh'])
  if (tsh && (tsh.value < .4 || tsh.value > 4)) result.push(`TSH appears ${tsh.value < .4 ? 'low' : 'high'}.`)
  metrics.filter((item) => item.classification !== 'Normal' && !result.some((line) => line.toLowerCase().includes(item.name.toLowerCase()))).forEach((item) => result.push(`${item.name} is classified as ${item.classification} by the local numeric rule.`))
  return result.length ? result : ['No abnormal or borderline values were identified by the supported local rules.']
}
function recommendations(metrics: LabMetric[]) {
  const items = ['Discuss results with a qualified healthcare professional who can consider symptoms and clinical history.', 'Compare these values with previous reports and the laboratory’s printed reference ranges.']
  if (metrics.some((item) => item.classification !== 'Normal')) items.push('Ask whether relevant follow-up or confirmatory tests are appropriate.', 'Review diet, exercise, medicines, and health history with a professional where relevant.')
  return items
}
