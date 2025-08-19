
import React, { useState, useMemo, useRef } from 'react';
import { AttendanceRecord, ToastMessage } from './types';
import { useAttendance } from './hooks/useAttendance';
import { Header } from './components/Header';
import { DashboardMetrics } from './components/DashboardMetrics';
import { AttendanceChart } from './components/AttendanceChart';
import { AttendanceTable } from './components/AttendanceTable';
import { AddRecordModal } from './components/AddRecordModal';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { InsightCard } from './components/InsightCard';
import { Toast } from './components/Toast';
import { ReportModal } from './components/ReportModal';
import { PlusIcon } from './components/icons';

const App: React.FC = () => {
    const {
        records,
        addRecord,
        updateRecord,
        deleteRecord,
        bulkAddRecords,
        loading: recordsLoading,
    } = useAttendance();

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isExportModalOpen, setExportModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState<AttendanceRecord | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ id: Date.now(), message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleAddClick = () => {
        setRecordToEdit(null);
        setAddModalOpen(true);
    };

    const handleEditClick = (record: AttendanceRecord) => {
        setRecordToEdit(record);
        setAddModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            deleteRecord(id);
            showToast('Record deleted successfully!', 'success');
        }
    };

    const handleSaveRecord = (record: AttendanceRecord) => {
        if (record.id) {
            updateRecord(record);
            showToast('Record updated successfully!', 'success');
        } else {
            addRecord({ ...record, id: `rec_${Date.now()}` });
            showToast('Record added successfully!', 'success');
        }
        setAddModalOpen(false);
        setRecordToEdit(null);
    };
    
    const handleImportSuccess = (newRecords: Omit<AttendanceRecord, 'id'>[]) => {
        bulkAddRecords(newRecords);
        showToast(`${newRecords.length} record(s) imported successfully!`, 'success');
        setImportModalOpen(false);
    };

    const dashboardStats = useMemo(() => {
        const totalParticipants = records.reduce((sum, record) => sum + record.participants, 0);
        const totalEvents = records.length;
        const averageParticipants = totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0;
        return { totalParticipants, totalEvents, averageParticipants };
    }, [records]);

    return (
        <div className="min-h-screen bg-base-200 text-neutral font-sans">
            <Header 
                onImportClick={() => setImportModalOpen(true)}
                onExportClick={() => setExportModalOpen(true)} 
                onReportClick={() => setReportModalOpen(true)} 
            />

            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
                {/* Dashboard Section */}
                <DashboardMetrics stats={dashboardStats} />

                {/* Main Content: Chart and Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-base-100 p-6 rounded-2xl shadow-md" ref={chartContainerRef}>
                        <h2 className="text-xl font-bold text-neutral mb-4">Attendance Over Time</h2>
                        <div style={{ height: '400px' }}>
                           <AttendanceChart data={records} />
                        </div>
                    </div>
                    <div className="lg:col-span-1 bg-base-100 p-6 rounded-2xl shadow-md">
                         <InsightCard records={records} showToast={showToast}/>
                    </div>
                </div>

                {/* Records Table Section */}
                <div className="bg-base-100 p-4 sm:p-6 rounded-2xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-neutral">All Records</h2>
                        <button
                            onClick={handleAddClick}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-focus text-primary-content font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                        >
                            <PlusIcon />
                            Add Record
                        </button>
                    </div>
                    {recordsLoading ? (
                        <p>Loading records...</p>
                    ) : (
                        <AttendanceTable
                            records={records}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                        />
                    )}
                </div>
            </main>

            {/* Modals */}
            {isAddModalOpen && (
                <AddRecordModal
                    isOpen={isAddModalOpen}
                    onClose={() => {
                        setAddModalOpen(false);
                        setRecordToEdit(null);
                    }}
                    onSave={handleSaveRecord}
                    recordToEdit={recordToEdit}
                />
            )}
            
            {isImportModalOpen && (
                <ImportModal
                    isOpen={isImportModalOpen}
                    onClose={() => setImportModalOpen(false)}
                    onImportSuccess={handleImportSuccess}
                />
            )}

            {isExportModalOpen && (
                 <ExportModal
                    isOpen={isExportModalOpen}
                    onClose={() => setExportModalOpen(false)}
                    records={records}
                />
            )}

            {isReportModalOpen && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setReportModalOpen(false)}
                    records={records}
                    chartElement={chartContainerRef.current}
                    showToast={showToast}
                />
            )}

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default App;
