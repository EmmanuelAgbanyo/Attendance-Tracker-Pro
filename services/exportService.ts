import { AttendanceRecord } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// The jspdf-autotable plugin extends jsPDF instances with an `autoTable` method.
// Since the types can be tricky, we cast the jsPDF instance to `any` to call it.

/**
 * Converts an array of objects to a CSV string.
 * @param data The array of objects.
 * @param columns The keys of the object to include in the CSV.
 * @returns The CSV string.
 */
function convertToCSV(data: any[], columns: string[]): string {
    const header = columns.join(',');
    const rows = data.map(row => {
        return columns.map(col => {
            let cell = row[col] === null || row[col] === undefined ? '' : row[col];
            cell = String(cell).replace(/"/g, '""'); // Escape double quotes
            if (String(cell).includes(',')) {
                cell = `"${cell}"`; // Wrap in quotes if it contains a comma
            }
            return cell;
        }).join(',');
    });
    return [header, ...rows].join('\n');
}

/**
 * Triggers a browser download for a CSV file.
 * @param records The attendance records to export.
 * @param filename The desired filename for the downloaded file.
 */
export const exportToCSV = (records: AttendanceRecord[], filename: string) => {
    const columns: (keyof AttendanceRecord)[] = ['date', 'institution', 'participants'];
    const csvString = convertToCSV(records, columns);
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Triggers a browser download for a PDF file.
 * @param records The attendance records to export.
 * @param filename The desired filename for the downloaded file.
 */
export const exportToPDF = (records: AttendanceRecord[], filename:string) => {
    const doc = new jsPDF();
    
    const tableColumn = ["Date", "Institution", "Participants"];
    const tableRows: (string | number)[][] = [];

    records.forEach(record => {
        const recordData = [
            record.date,
            record.institution,
            record.participants.toLocaleString(),
        ];
        tableRows.push(recordData);
    });
    
    const totalParticipants = records.reduce((sum, record) => sum + record.participants, 0);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        didDrawPage: (data: any) => {
            // Header
            doc.setFontSize(20);
            doc.setTextColor(40);
            doc.text("Attendance Records", data.settings.margin.left, 15);
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Participants: ${totalParticipants.toLocaleString()}`, 14, finalY + 15);

    doc.save(filename);
};

/**
 * Triggers a browser download for an Excel file (XLSX).
 * @param records The attendance records to export.
 * @param filename The desired filename for the downloaded file.
 */
export const exportToExcel = (records: AttendanceRecord[], filename: string) => {
    // Create a new array with just the data we want, to ensure column order
    const dataToExport = records.map(rec => ({
        Date: rec.date,
        Institution: rec.institution,
        Participants: rec.participants,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    // Add a summary row for total participants
    const totalParticipants = records.reduce((sum, record) => sum + record.participants, 0);
    XLSX.utils.sheet_add_aoa(worksheet, [
        [], // empty row for spacing
        ["Total Participants:", totalParticipants]
    ], { origin: -1 }); // Appends to the end of the sheet

    // Auto-size columns for better readability
    const cols = [
        { wch: 12 }, // Date
        { wch: 30 }, // Institution
        { wch: 15 }, // Participants
    ];
    worksheet['!cols'] = cols;

    XLSX.writeFile(workbook, filename);
};