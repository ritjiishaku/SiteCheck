import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { format, parseISO } from 'date-fns'

interface ReportData {
  company_name: string
  report_type: string
  date_from: Date
  date_to: Date
  total_patients_seen: number
  total_drugs_used: { drug_name: string; quantity_dispensed: number; unit: string }[]
  medic_breakdown: { medic_id: string; patients_seen: number }[]
  patients: {
    full_name: string
    staff_code: string
    department: string
    date_of_visit: string
    diagnosis: string
    treatment: string
  }[]
}

export async function generatePdf(data: ReportData): Promise<Buffer> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(20)
  doc.setTextColor(26, 158, 120)
  doc.text('SiteCheck', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(14)
  doc.setTextColor(26, 37, 48)
  doc.text(`${data.report_type} Report`, pageWidth / 2, 30, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(58, 74, 88)
  const from = format(typeof data.date_from === 'string' ? parseISO(data.date_from as string) : data.date_from, 'dd/MM/yyyy')
  const to = format(typeof data.date_to === 'string' ? parseISO(data.date_to as string) : data.date_to, 'dd/MM/yyyy')
  doc.text(`Period: ${from} - ${to}`, pageWidth / 2, 38, { align: 'center' })
  doc.text(`Company: ${data.company_name}`, pageWidth / 2, 44, { align: 'center' })

  doc.setDrawColor(26, 158, 120)
  doc.setLineWidth(0.5)
  doc.line(14, 52, pageWidth - 14, 52)

  doc.setFontSize(11)
  doc.setTextColor(26, 37, 48)
  doc.text('Summary', 14, 62)

  doc.setFontSize(10)
  doc.setTextColor(58, 74, 88)
  doc.text(`Total patients seen: ${data.total_patients_seen}`, 14, 72)
  doc.text(`Total unique drugs used: ${data.total_drugs_used.length}`, 14, 80)

  if (data.medic_breakdown.length > 0) {
    doc.setFontSize(11)
    doc.setTextColor(26, 37, 48)
    doc.text('Medic Breakdown', 14, 96)

    const medicRows = data.medic_breakdown.map((m) => [m.medic_id.slice(0, 8), String(m.patients_seen)])
    autoTable(doc, {
      startY: 100,
      head: [['Medic ID', 'Patients Seen']],
      body: medicRows,
      theme: 'striped',
      headStyles: { fillColor: [26, 158, 120] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] },
      styles: { fontSize: 9 },
    })
  }

  const docAny = doc as unknown as { lastAutoTable?: { finalY: number } }
  let yPos = (docAny.lastAutoTable?.finalY ?? 106) + 10
  if (yPos > 230) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(11)
  doc.setTextColor(26, 37, 48)
  doc.text('Patient Details', 14, yPos)
  yPos += 6

  const patientRows = data.patients.map((p) => [
    p.full_name,
    p.staff_code,
    p.department,
    p.date_of_visit,
    p.diagnosis,
    p.treatment,
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Name', 'Staff Code', 'Department', 'Date', 'Diagnosis', 'Treatment']],
    body: patientRows,
    theme: 'striped',
    headStyles: { fillColor: [26, 158, 120] as [number, number, number], textColor: [255, 255, 255] as [number, number, number] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22 },
      4: { cellWidth: 40 },
      5: { cellWidth: 40 },
    },
  })

  const finalY = (docAny.lastAutoTable?.finalY ?? yPos) + 15
  doc.setFontSize(8)
  doc.setTextColor(58, 74, 88)
  doc.text(`Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')} WAT`, pageWidth / 2, finalY, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}
