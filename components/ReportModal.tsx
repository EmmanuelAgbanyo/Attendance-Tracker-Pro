
import React, { useState, useMemo, useEffect } from 'react';
import { AttendanceRecord } from '../types';
import { generateComprehensiveReport } from '../services/reportGeneratorService';
import { DocumentReportIcon } from './icons';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    records: AttendanceRecord[];
    chartElement: HTMLElement | null;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type FilterType = 'preset' | 'month' | 'range';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors focus:outline-none ${
            active
                ? 'bg-base-100 border-b-2 border-primary text-primary'
                : 'bg-transparent text-gray-500 hover:text-neutral'
        }`}
    >
        {children}
    </button>
);

const PresetButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="px-3 py-1.5 text-sm font-semibold rounded-full bg-base-200 hover:bg-primary hover:text-primary-content transition-all"
    >
        {children}
    </button>
);

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, records, chartElement, showToast }) => {
    const [filterType, setFilterType] = useState<FilterType>('preset');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // State for date range
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // State for month selection
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        records.forEach(record => {
            months.add(record.date.substring(0, 7)); // 'YYYY-MM'
        });
        return Array.from(months).sort().reverse();
    }, [records]);
    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || '');

    const handlePreset = (preset: 'last30' | 'thisMonth' | 'lastMonth' | 'thisYear') => {
        setFilterType('preset');
        const end = new Date();
        let start = new Date();

        switch (preset) {
            case 'last30':
                start.setDate(end.getDate() - 30);
                break;
            case 'thisMonth':
                start = new Date(end.getFullYear(), end.getMonth(), 1);
                break;
            case 'lastMonth':
                start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
                end.setDate(0); // Sets end date to last day of previous month
                break;
            case 'thisYear':
                start = new Date(end.getFullYear(), 0, 1);
                break;
        }
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    useEffect(() => {
        if (isOpen) {
            // Set default preset when modal opens
            handlePreset('last30');
            if (availableMonths.length > 0 && !selectedMonth) {
                setSelectedMonth(availableMonths[0]);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, availableMonths]);
    
    const { reportStartDate, reportEndDate, filteredRecords } = useMemo(() => {
        let start: string, end: string;

        if (filterType === 'month' && selectedMonth) {
            const year = parseInt(selectedMonth.split('-')[0], 10);
            const month = parseInt(selectedMonth.split('-')[1], 10) - 1;
            const startDateObj = new Date(Date.UTC(year, month, 1));
            const endDateObj = new Date(Date.UTC(year, month + 1, 0)); // 0 gives last day of previous month
            start = startDateObj.toISOString().split('T')[0];
            end = endDateObj.toISOString().split('T')[0];
        } else { // 'range' or 'preset'
            start = startDate;
            end = endDate;
        }
        
        if (!start || !end || start > end) {
            return { reportStartDate: start || '', reportEndDate: end || '', filteredRecords: [] };
        }

        const filtered = records.filter(record => {
            // YYYY-MM-DD string comparison is reliable and avoids timezone issues.
            return record.date >= start && record.date <= end;
        }).sort((a, b) => a.date.localeCompare(b.date));

        return {
            reportStartDate: start,
            reportEndDate: end,
            filteredRecords: filtered
        };
    }, [records, filterType, startDate, endDate, selectedMonth]);

    const handleGenerateReport = async () => {
        if (filteredRecords.length === 0) {
            showToast('No records in the selected date range to generate a report.', 'info');
            return;
        }
        if (!chartElement) {
            showToast('Chart component not ready. Please try again.', 'error');
            return;
        }

        setIsGenerating(true);
        try {
            await generateComprehensiveReport(filteredRecords, reportStartDate, reportEndDate, chartElement);
            showToast('Report generated successfully!', 'success');
            onClose();
        } catch (error) {
            console.error('Report generation failed:', error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            showToast(`Report generation failed: ${errorMessage}`, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-2xl shadow-xl p-8 w-full max-w-lg m-4">
                <h2 className="text-2xl font-bold mb-2 text-neutral">Generate Comprehensive Report</h2>
                <p className="text-sm text-gray-500 mb-6">Select records for the report. This will include an AI-powered summary and attendance chart.</p>
                
                <div className="border-b border-base-300 -mx-8 px-8">
                     <div className="flex space-x-2">
                        <TabButton active={filterType === 'preset'} onClick={() => handlePreset('last30')}>Presets</TabButton>
                        <TabButton active={filterType === 'month'} onClick={() => setFilterType('month')}>By Month</TabButton>
                        <TabButton active={filterType === 'range'} onClick={() => setFilterType('range')}>Custom Range</TabButton>
                    </div>
                </div>

                <div className="py-6 min-h-[140px]">
                    {filterType === 'preset' && (
                        <div className="flex flex-wrap gap-3 items-center">
                           <PresetButton onClick={() => handlePreset('last30')}>Last 30 Days</PresetButton>
                           <PresetButton onClick={() => handlePreset('thisMonth')}>This Month</PresetButton>
                           <PresetButton onClick={() => handlePreset('lastMonth')}>Last Month</PresetButton>
                           <PresetButton onClick={() => handlePreset('thisYear')}>This Year</PresetButton>
                        </div>
                    )}
                    {filterType === 'month' && (
                        <div>
                            <label htmlFor="monthSelect" className="block text-sm font-medium text-gray-700">Select Month</label>
                            <select
                                id="monthSelect"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            >
                                {availableMonths.map(month => (
                                    <option key={month} value={month}>
                                        {new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </option>
                                ))}
                            </select>
                            {availableMonths.length === 0 && <p className="text-sm text-gray-500 mt-2">No data available to filter by month.</p>}
                        </div>
                    )}
                    {filterType === 'range' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="reportStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                                <input
                                    type="date"
                                    id="reportStartDate"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label htmlFor="reportEndDate" className="block text-sm font-medium text-gray-700">End Date</label>
                                <input
                                    type="date"
                                    id="reportEndDate"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                <p className="text-sm text-center text-gray-500 mb-6 bg-base-200 p-2 rounded-md">
                    Report will include <span className="font-bold text-neutral">{filteredRecords.length}</span> record(s) from <span className="font-bold text-neutral">{reportStartDate}</span> to <span className="font-bold text-neutral">{reportEndDate}</span>.
                </p>

                <div className="space-y-3">
                     <button 
                        onClick={handleGenerateReport} 
                        disabled={isGenerating || filteredRecords.length === 0}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-primary hover:bg-primary-focus text-white font-semibold rounded-lg transition-colors disabled:bg-primary-focus/50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                           <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Generating Report...
                           </>
                        ) : (
                            <>
                               <DocumentReportIcon /> Generate & Download Report
                            </>
                        )}
                    </button>
                </div>
                
                <div className="flex justify-end pt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isGenerating}
                        className="py-2 px-4 bg-base-200 hover:bg-base-300 text-gray-700 font-semibold rounded-lg disabled:opacity-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
