
import React, { useState, useCallback } from 'react';
import { AttendanceRecord } from '../types';
import { parseImportedFile, generateTemplateFile } from '../services/importService';
import { CloudArrowUpIcon, DocumentArrowDownIcon, XCircleIcon } from './icons';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: (records: Omit<AttendanceRecord, 'id'>[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const resetState = () => {
        setFile(null);
        setIsProcessing(false);
        setError(null);
        setIsDragging(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileSelect = (selectedFile: File | null) => {
        if (selectedFile) {
            const allowedTypes = [
                'text/csv', 
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                'application/vnd.ms-excel',
                'application/pdf'
            ];
            if (!allowedTypes.includes(selectedFile.type)) {
                setError('Invalid file type. Please upload a CSV, Excel, or PDF file.');
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, action: 'enter' | 'leave' | 'drop') => {
        e.preventDefault();
        e.stopPropagation();
        if (action === 'enter') setIsDragging(true);
        if (action === 'leave') setIsDragging(false);
        if (action === 'drop') {
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Please select a file to import.');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const result = await parseImportedFile(file);
            if (result.success && result.data) {
                onImportSuccess(result.data);
                handleClose();
            } else {
                setError(result.error || 'An unknown error occurred during parsing.');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setError(message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-2xl shadow-xl p-8 w-full max-w-lg m-4 flex flex-col">
                <h2 className="text-2xl font-bold mb-2 text-neutral">Import Records</h2>
                <p className="text-sm text-gray-500 mb-4">Upload a CSV, Excel, or PDF file with your attendance data.</p>
                <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); generateTemplateFile(); }}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6"
                >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    Download Excel Template
                </a>
                
                <div 
                    onDragEnter={(e) => handleDragEvents(e, 'enter')}
                    onDragLeave={(e) => handleDragEvents(e, 'leave')}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDragEvents(e, 'drop')}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-primary bg-indigo-50' : 'border-base-300 bg-base-200'}`}
                >
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, .pdf, application/pdf"
                        onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="mt-2 text-gray-600">
                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">CSV, Excel (XLSX), or PDF</p>
                    </label>
                </div>

                {file && (
                    <div className="mt-4 text-center text-sm text-gray-700">
                        Selected file: <span className="font-semibold">{file.name}</span>
                    </div>
                )}

                {error && (
                    <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-start gap-3">
                        <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"/>
                        <span className="block sm:inline whitespace-pre-wrap">{error}</span>
                    </div>
                )}
                
                <div className="flex justify-end gap-4 pt-8 mt-auto">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isProcessing}
                        className="py-2 px-4 bg-base-200 hover:bg-base-300 text-gray-700 font-semibold rounded-lg disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!file || isProcessing}
                        className="py-2 px-6 bg-primary hover:bg-primary-focus text-primary-content font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                         {isProcessing ? (
                           <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Processing...
                           </>
                        ) : 'Import'}
                    </button>
                </div>
            </div>
        </div>
    );
};
