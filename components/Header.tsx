
import React from 'react';
import { ChartBarIcon, ExportIcon, DocumentReportIcon, ImportIcon } from './icons';

interface HeaderProps {
    onImportClick: () => void;
    onExportClick: () => void;
    onReportClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onImportClick, onExportClick, onReportClick }) => {
    return (
        <header className="bg-base-100 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-content p-2 rounded-lg">
                           <ChartBarIcon className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-neutral">
                            Attendance Tracker Pro
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={onImportClick}
                            className="flex items-center gap-2 bg-info hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                        >
                            <ImportIcon />
                            <span className="hidden sm:inline">Import</span>
                        </button>
                         <button
                            onClick={onReportClick}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                        >
                            <DocumentReportIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">Generate Report</span>
                        </button>
                        <button
                            onClick={onExportClick}
                            className="flex items-center gap-2 bg-secondary hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                        >
                            <ExportIcon />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
