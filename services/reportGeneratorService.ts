import { AttendanceRecord } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.API_KEY;

// Absa's red color for branding
const BRAND_COLOR = '#E80000';

const generateExecutiveSummary = async (records: AttendanceRecord[]): Promise<string> => {
    const dataSummary = records.map(r => `- On ${r.date}, ${r.institution} had ${r.participants} participants.`).join('\n');
    const prompt = `
        You are a professional analyst writing an executive summary for a corporate social responsibility report.
        The report is for a program called "Absa Money Matters".
        Based on the following attendance data, write a formal, optimistic executive summary.

        The summary should:
        - Start with a strong opening statement about the program's impact.
        - Highlight key achievements like total reach (participants) and number of events.
        - Mention the trend of participation if one is apparent.
        - Keep the tone professional, positive, and suitable for a corporate report.
        - The entire summary should be a single paragraph of about 80-100 words.

        Data:
        ${dataSummary}
    `;
    
    if (!API_KEY) {
        throw new Error("API Key for Gemini is not configured.");
    }
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
};


export const generateComprehensiveReport = async (
    records: AttendanceRecord[],
    startDate: string,
    endDate: string,
    chartElement: HTMLElement | null
): Promise<void> => {
    if (!chartElement) {
        throw new Error('Chart element not found for report generation.');
    }
    
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 0;
    
    const addHeader = () => {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Absa Money Matters - Comprehensive Program Report', 14, 10);
        doc.line(14, 12, pageWidth - 14, 12);
    };
    
    const addFooter = () => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            const text = `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleDateString()}`;
            doc.text(text, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
    };

    // --- PAGE 1: TITLE PAGE ---
    doc.setFontSize(32);
    doc.setTextColor(BRAND_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text('Absa Money Matters', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Program Report', pageWidth / 2, pageHeight / 2 - 5, { align: 'center' });
    
    doc.setDrawColor(BRAND_COLOR);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 50, pageHeight / 2 + 5, pageWidth / 2 + 50, pageHeight / 2 + 5);

    doc.setFontSize(12);
    doc.text(`Reporting Period: ${startDate} to ${endDate}`, pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });
    doc.text(`Generated: ${new Date().toUTCString()}`, pageWidth / 2, pageHeight / 2 + 28, { align: 'center' });

    // --- CALCULATE STATS ---
    const totalParticipants = records.reduce((sum, r) => sum + r.participants, 0);
    const totalEvents = records.length;
    const averageParticipants = totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0;
    
    // --- PAGE 2: SUMMARY & METRICS ---
    doc.addPage();
    addHeader();
    currentY = 25;

    // AI Executive Summary
    doc.setFontSize(18);
    doc.setTextColor(BRAND_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 14, currentY);
    currentY += 10;
    
    const summaryText = await generateExecutiveSummary(records);
    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 28);
    doc.text(summaryLines, 14, currentY);
    currentY += summaryLines.length * 5 + 15;

    // Key Metrics
    doc.setFontSize(18);
    doc.setTextColor(BRAND_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text('Program at a Glance', 14, currentY);
    
    autoTable(doc, {
        startY: currentY + 8,
        body: [
            ['Total Events Recorded', totalEvents.toLocaleString()],
            ['Total Participants Reached', totalParticipants.toLocaleString()],
            ['Average Participants per Event', averageParticipants.toLocaleString()],
        ],
        theme: 'grid',
        styles: {
            fontSize: 12,
            cellPadding: 4,
        },
        headStyles: {
            fillColor: BRAND_COLOR
        },
        columnStyles: {
            0: { fontStyle: 'bold', fillColor: '#f0f0f0' }
        }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // --- PAGE 3: CHART VISUALIZATION ---
    doc.addPage();
    addHeader();
    currentY = 25;
    
    doc.setFontSize(18);
    doc.setTextColor(BRAND_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text('Attendance Visualization', 14, currentY);
    currentY += 10;

    const canvas = await html2canvas(chartElement, { scale: 2, backgroundColor: null });
    const imgData = canvas.toDataURL('image/png');
    const imgProps = doc.getImageProperties(imgData);
    const imgWidth = pageWidth - 28;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    doc.addImage(imgData, 'PNG', 14, currentY, imgWidth, imgHeight);
    currentY += imgHeight + 15;
    
    // --- PAGE 4: DETAILED RECORDS ---
    doc.addPage();
    addHeader();
    currentY = 25;

    doc.setFontSize(18);
    doc.setTextColor(BRAND_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Attendance Log', 14, currentY);
    
    const tableColumn = ["Date", "Institution", "Participants"];
    const tableRows = records.map(r => [
        r.date,
        r.institution,
        r.participants.toLocaleString(),
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY + 8,
        theme: 'striped',
        headStyles: {
            fillColor: BRAND_COLOR,
            textColor: 255,
            fontStyle: 'bold'
        },
    });

    // --- FINALIZE ---
    addFooter();
    doc.save(`Absa_Money_Matters_Report_${startDate}_to_${endDate}.pdf`);
};