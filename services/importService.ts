
import { AttendanceRecord } from '../types';
import * as XLSX from 'xlsx';
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Generates and downloads a template Excel file for importing records.
 */
export const generateTemplateFile = () => {
    const templateData = [
        { date: '2024-08-01', institution: 'Example High School', participants: 50 }
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Template");

    // Auto-size columns for better readability
    worksheet['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 15 }];
    
    XLSX.writeFile(workbook, 'Attendance_Template.xlsx');
};


const API_KEY = process.env.API_KEY;

const fileToGenerativePart = (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string; }; }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};

const parsePdfWithGemini = async (file: File): Promise<{ success: boolean; data?: Omit<AttendanceRecord, 'id'>[]; error?: string }> => {
    if (!API_KEY) {
        return { success: false, error: "Cannot process PDF. API_KEY environment variable not set for AI features." };
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const model = 'gemini-2.5-flash';

    try {
        const filePart = await fileToGenerativePart(file);
        
        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING, description: 'The date of the event in YYYY-MM-DD format.' },
                    institution: { type: Type.STRING, description: 'The name of the school or institution.' },
                    participants: { type: Type.INTEGER, description: 'The number of participants as a whole number.' }
                },
                required: ['date', 'institution', 'participants']
            }
        };

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    filePart,
                    { text: `You are an intelligent data extraction service. Analyze the provided document. Your task is to find any data that looks like a table of attendance records. The table should have columns that can be mapped to 'date', 'institution', and 'participants'. Extract all rows from this table. Ignore any other text or summaries in the document. Ensure dates are formatted as YYYY-MM-DD. Provide the extracted data only in the specified JSON format.` }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            }
        });

        const jsonStr = response.text.trim();
        const parsedData = JSON.parse(jsonStr);

        if (!Array.isArray(parsedData)) {
            throw new Error("AI returned data in an unexpected format.");
        }
        
        const validRecords: Omit<AttendanceRecord, 'id'>[] = [];
        for (const item of parsedData) {
            const date = new Date(item.date);
            if (!item.date || isNaN(date.getTime())) continue;
            if (!item.institution || typeof item.institution !== 'string') continue;
            if (typeof item.participants !== 'number' || item.participants <= 0) continue;
            
            validRecords.push({
                date: new Date(item.date).toISOString().split('T')[0],
                institution: item.institution,
                participants: Math.round(item.participants)
            });
        }
        
        if (validRecords.length === 0) {
            return { success: false, error: 'The AI could not find any valid attendance records in the PDF.' };
        }

        return { success: true, data: validRecords };

    } catch (error) {
        console.error("Error processing PDF with Gemini:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to extract data from PDF: ${errorMessage}` };
    }
};


/**
 * Parses an uploaded CSV, Excel, or PDF file, validates its content, and returns structured data or an error.
 * @param file The file to parse.
 * @returns A promise resolving to an object with success status, data, or an error message.
 */
export const parseImportedFile = (
    file: File
): Promise<{ success: boolean; data?: Omit<AttendanceRecord, 'id'>[]; error?: string }> => {
    
    if (file.type === 'application/pdf') {
        return parsePdfWithGemini(file);
    }
    
    // Fallback to existing logic for CSV/Excel
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    resolve({ success: false, error: 'The uploaded file is empty or has no data.' });
                    return;
                }

                const headers = Object.keys(json[0]).map(h => h.trim().toLowerCase());
                const requiredHeaders = ['date', 'institution', 'participants'];
                
                for (const requiredHeader of requiredHeaders) {
                    if (!headers.includes(requiredHeader)) {
                        resolve({ success: false, error: `Missing required column: '${requiredHeader}'. Please use the template.` });
                        return;
                    }
                }

                const validRecords: Omit<AttendanceRecord, 'id'>[] = [];
                for (let i = 0; i < json.length; i++) {
                    const row = json[i];
                    const dateKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'date');
                    const institutionKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'institution');
                    const participantsKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'participants');

                    const dateValue = dateKey ? row[dateKey] : null;
                    const institution = institutionKey ? row[institutionKey] : null;
                    const participants = participantsKey ? row[participantsKey] : null;

                    if (!dateValue || !(dateValue instanceof Date) || isNaN(dateValue.getTime())) {
                       resolve({ success: false, error: `Invalid or missing date on row ${i + 2}. Please use YYYY-MM-DD format.` });
                       return;
                    }
                    const formattedDate = dateValue.toISOString().split('T')[0];

                    if (typeof institution !== 'string' || institution.trim() === '') {
                        resolve({ success: false, error: `Invalid or missing institution name on row ${i + 2}.` });
                        return;
                    }

                    const numParticipants = Number(participants);
                    if (isNaN(numParticipants) || numParticipants <= 0) {
                        resolve({ success: false, error: `Invalid or missing participant count on row ${i + 2}. Must be a positive number.` });
                        return;
                    }
                    
                    validRecords.push({
                        date: formattedDate,
                        institution: institution.trim(),
                        participants: numParticipants,
                    });
                }

                resolve({ success: true, data: validRecords });

            } catch (err) {
                console.error("File parsing error:", err);
                resolve({ success: false, error: 'Failed to parse the file. Please ensure it is a valid CSV or Excel file.' });
            }
        };

        reader.onerror = () => {
            resolve({ success: false, error: 'Failed to read the file.' });
        };

        reader.readAsArrayBuffer(file);
    });
};
