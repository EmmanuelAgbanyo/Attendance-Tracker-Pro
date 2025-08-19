
import { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord } from '../types';

const STORAGE_KEY = 'attendanceRecords';

const initialRecords: AttendanceRecord[] = [
    { id: 'rec_1704067200000', date: '2024-06-15', institution: 'Oakridge International', participants: 120 },
    { id: 'rec_1706745600000', date: '2024-06-28', institution: 'Maple Leaf Academy', participants: 85 },
    { id: 'rec_1709251200000', date: '2024-07-05', institution: 'Sunset Elementary', participants: 210 },
    { id: 'rec_1711929600000', date: '2024-07-18', institution: 'Northwood High School', participants: 95 },
];


export const useAttendance = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Effect for initial loading from localStorage
    useEffect(() => {
        try {
            const storedRecords = localStorage.getItem(STORAGE_KEY);
            if (storedRecords) {
                setRecords(JSON.parse(storedRecords));
            } else {
                // On first load, initialize with sample data
                setRecords(initialRecords);
            }
        } catch (error) {
            console.error('Failed to load records from localStorage', error);
            setRecords(initialRecords); // Fallback on error
        } finally {
            setLoading(false);
        }
    }, []); // Runs only once on mount

    // Effect for persisting records to localStorage whenever they change
    useEffect(() => {
        // Don't persist during the initial loading phase
        if (!loading) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
            } catch (error) {
                console.error('Failed to save records to localStorage', error);
            }
        }
    }, [records, loading]); // Runs whenever 'records' or 'loading' state changes

    const addRecord = useCallback((newRecord: AttendanceRecord) => {
        setRecords(prevRecords => [...prevRecords, newRecord]);
    }, []);

    const updateRecord = useCallback((updatedRecord: AttendanceRecord) => {
        setRecords(prevRecords => 
            prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r)
        );
    }, []);

    const deleteRecord = useCallback((id: string) => {
        setRecords(prevRecords => prevRecords.filter(r => r.id !== id));
    }, []);

    const bulkAddRecords = useCallback((newRecords: Omit<AttendanceRecord, 'id'>[]) => {
        const recordsWithIds = newRecords.map((record, index) => ({
            ...record,
            id: `rec_${Date.now()}_${index}`
        }));
        setRecords(prevRecords => [...prevRecords, ...recordsWithIds]);
    }, []);
    

    return { records, addRecord, updateRecord, deleteRecord, bulkAddRecords, loading };
};
