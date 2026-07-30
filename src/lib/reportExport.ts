import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AnalysisReport } from './labAnalysis'

export function reportPdf(report: AnalysisReport) {
  const pdf = new jsPDF()
  pdf.setFontSize(20); pdf.text('BiasSense AI', 14, 18)
  pdf.setFontSize(14); pdf.text(report.type, 14, 29)
  pdf.setFontSize(9); pdf.text(`Analyzed: ${report.date}`, 14, 36)
  autoTable(pdf, { startY:42, head:[['Lab test','Result','Unit','Reference range','Status','Classification']], body:report.metrics.map((metric)=>[metric.name,String(metric.value),metric.unit,metric.referenceRange,metric.extractionStatus,metric.classification]), styles:{fontSize:7}, headStyles:{fillColor:[8,120,140]} })
  let y = (pdf as jsPDF & { lastAutoTable?: { finalY:number } }).lastAutoTable?.finalY || 60
  const section=(title:string,lines:string[])=>{pdf.setFontSize(12);pdf.text(title,14,y+10);y+=16;pdf.setFontSize(8);for(const line of lines){const wrapped=pdf.splitTextToSize(`• ${line}`,180);pdf.text(wrapped,14,y);y+=wrapped.length*4+2;if(y>275){pdf.addPage();y=15}}}
  section('Summary',[report.summary]);section('Key findings',report.findings);section('Recommendations',report.recommendations)
  pdf.setFontSize(7);pdf.text('Private local analysis. Informational decision support only; not a medical diagnosis.',14,290)
  return pdf
}
