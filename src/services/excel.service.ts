import ExcelJS from 'exceljs'
import { format } from 'date-fns'

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

export async function generateExcel(data: ReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SiteCheck'
  workbook.created = new Date()

  // ── Summary sheet ──
  const summarySheet = workbook.addWorksheet('Summary')
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ]

  summarySheet.addRow({ metric: 'Company', value: data.company_name })
  summarySheet.addRow({ metric: 'Report Type', value: data.report_type })
  summarySheet.addRow({
    metric: 'Period',
    value: `${format(data.date_from, 'dd/MM/yyyy')} - ${format(data.date_to, 'dd/MM/yyyy')}`,
  })
  summarySheet.addRow({ metric: 'Total Patients Seen', value: data.total_patients_seen })
  summarySheet.addRow({ metric: 'Total Drugs Used', value: data.total_drugs_used.length })
  summarySheet.addRow({ metric: '', value: '' })

  // Header styling
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A9E78' } }
  summarySheet.getRow(1).alignment = { horizontal: 'center' }

  // Medic breakdown sub-table
  if (data.medic_breakdown.length > 0) {
    summarySheet.addRow({ metric: 'Medic Breakdown', value: '' })
    summarySheet.addRow({ metric: 'Medic ID', value: 'Patients Seen' })
    summarySheet.getRow(summarySheet.rowCount).font = { bold: true }
    data.medic_breakdown.forEach((m) => {
      summarySheet.addRow({ metric: m.medic_id.slice(0, 8), value: m.patients_seen })
    })
  }

  // ── Patients sheet ──
  const patientSheet = workbook.addWorksheet('Patients')
  patientSheet.columns = [
    { header: 'Full Name', key: 'full_name', width: 25 },
    { header: 'Staff Code', key: 'staff_code', width: 15 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Date of Visit', key: 'date_of_visit', width: 15 },
    { header: 'Diagnosis', key: 'diagnosis', width: 30 },
    { header: 'Treatment', key: 'treatment', width: 30 },
  ]

  data.patients.forEach((p) => patientSheet.addRow(p))

  // Style header row
  const headerRow = patientSheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A9E78' } }
  headerRow.alignment = { horizontal: 'center' }

  // Auto-filter
  patientSheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: data.patients.length + 1, column: 6 } }

  const buf = await workbook.xlsx.writeBuffer()
  return Buffer.from(buf)
}
