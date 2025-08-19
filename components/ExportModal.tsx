import React, { useState } from 'react';
import { AttendanceRecord } from '../types';
import { exportToCSV, exportToPDF, exportToExcel } from '../services/exportService';
import { FileCsvIcon, FilePdfIcon, FileExcelIcon } from './icons';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    records: AttendanceRecord[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, records }) => {
    const today = new Date().toISOString().split('T')[0];
    const oneMonthAgo = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(oneMonthAgo);
    const [endDate, setEndDate] = useState(today);

    const getFilteredRecords = () => {
        return records
            .filter(record => {
                const recordDate = new Date(record.date);
                const start = new Date(startDate);
                const end = new Date(endDate);
                // set hours to avoid timezone issues
                start.setHours(0,0,0,0);
                end.setHours(23,59,59,999);
                return recordDate >= start && recordDate <= end;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    const handleExport = (
        exportFn: (records: AttendanceRecord[], filename: string) => void,
        filetype: string,
        extension: string
    ) => {
        const filteredRecords = getFilteredRecords();
        if (filteredRecords.length === 0) {
            alert(`No records in the selected date range to export as ${filetype}.`);
            return;
        }
        exportFn(filteredRecords, `attendance_${startDate}_to_${endDate}.${extension}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-2xl shadow-xl p-8 w-full max-w-lg m-4">
                <h2 className="text-2xl font-bold mb-2 text-neutral">Export Records</h2>
                <p className="text-sm text-gray-500 mb-6">Select a date range and format for your export.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <button onClick={() => handleExport(exportToCSV, 'CSV', 'csv')} className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-secondary hover:bg-green-600 text-white font-semibold rounded-lg transition-colors">
                        <FileCsvIcon /> Export as CSV
                    </button>
                    <button onClick={() => handleExport(exportToPDF, 'PDF', 'pdf')} className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-error hover:bg-red-600 text-white font-semibold rounded-lg transition-colors">
                        <FilePdfIcon /> Export as PDF
                    </button>
                    <button onClick={() => handleExport(exportToExcel, 'Excel', 'xlsx')} className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-info hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
                        <FileExcelIcon /> Export as Excel
                    </button>
                </div>
                
                <div className="flex justify-end pt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-4 bg-base-200 hover:bg-base-300 text-gray-700 font-semibold rounded-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};