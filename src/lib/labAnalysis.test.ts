import { describe, expect, it } from 'vitest'
import { analyzeText } from './labAnalysis'

describe('CSV laboratory analysis', () => {
  it('extracts common comma-separated laboratory rows', () => {
    const report = analyzeText([
      'Test,Result,Unit,Reference Range',
      'Hemoglobin,13.5,g/dL,12-16',
      'LDL,105,mg/dL,<100',
      'HbA1c,6.1,%,4-5.6'
    ].join('\n'))

    expect(report.metrics.map((metric) => metric.name)).toEqual(['Hemoglobin', 'LDL', 'HbA1c'])
    expect(report.type).toBe('Complete Blood Count')
    expect(report.metrics[1].classification).toBe('Anomaly')
  })

  it('does not crash on irregular or incomplete rows', () => {
    const report = analyzeText('Test;Value\nLDL;not available\nVitamin D;\nCreatinine;1.1;mg/dL')
    expect(report.metrics).toHaveLength(1)
    expect(report.metrics[0].name).toBe('Creatinine')
  })

  it('extracts every metric from flattened PDF text like the reference report', () => {
    const report = analyzeText('Extracted Data Lab test Result Status Analysis Hemoglobin 13.8 g/dL Correct Normal Reference: Male 13.5-17.5; Female 12.0-15.5 g/dL Blood Sugar 95 mg/dL Correct Good Reference: 70-140 mg/dL Cholesterol 180 mg/dL Correct Anomaly Reference: Desirable <200 mg/dL HDL 55 mg/dL Correct Normal Reference: >=40 mg/dL LDL 95 mg/dL Correct Good Reference: Optimal <100 mg/dL Triglycerides 130 mg/dL Correct Anomaly Reference: Normal <150 mg/dL Creatinine 1 mg/dL Correct Normal Reference: 0.6-1.3 mg/dL Findings')
    expect(report.type).toBe('Lipid Profile')
    expect(report.metrics).toHaveLength(7)
    expect(report.metrics.map((metric) => metric.classification)).toEqual(['Normal', 'Good', 'Anomaly', 'Normal', 'Good', 'Anomaly', 'Normal'])
    expect(report.metrics.every((metric) => metric.extractionStatus === 'Correct')).toBe(true)
  })
})
