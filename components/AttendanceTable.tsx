
import React, { useState, useMemo } from 'react';
import { AttendanceRecord } from '../types';
import { EditIcon, TrashIcon, SortAscIcon, SortDescIcon } from './icons';

interface AttendanceTableProps {
    records: AttendanceRecord[];
    onEdit: (record: AttendanceRecord) => void;
    onDelete: (id: string) => void;
}

type SortKey = keyof AttendanceRecord;
type SortOrder = 'asc' | 'desc';

export const AttendanceTable: React.FC<AttendanceTableProps> = ({ records, onEdit, onDelete }) => {
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const sortedRecords = useMemo(() => {
        return [...records].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];

            let comparison = 0;
            if (valA > valB) {
                comparison = 1;
            } else if (valA < valB) {
                comparison = -1;
            }
            return sortOrder === 'desc' ? comparison * -1 : comparison;
        });
    }, [records, sortKey, sortOrder]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };
    
    const SortIndicator: React.FC<{ columnKey: SortKey }> = ({ columnKey }) => {
        if (sortKey !== columnKey) return null;
        return sortOrder === 'asc' ? <SortAscIcon /> : <SortDescIcon />;
    };

    if (records.length === 0) {
        return <p className="text-center text-gray-500 py-8">No records found. Click "Add Record" to start.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-base-300">
                <thead className="bg-base-200">
                    <tr>
                        {([
                            { key: 'date', label: 'Date' },
                            { key: 'institution', label: 'Institution' },
                            { key: 'participants', label: 'Participants' }
                        ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                            <th
                                key={key}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort(key)}
                            >
                                <div className="flex items-center gap-2">
                                  {label}
                                  <SortIndicator columnKey={key} />
                                </div>
                            </th>
                        ))}
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-base-100 divide-y divide-base-200">
                    {sortedRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-base-200 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral">{record.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.institution}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.participants.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-4">
                                    <button onClick={() => onEdit(record)} className="text-info hover:text-blue-700">
                                        <EditIcon />
                                    </button>
                                    <button onClick={() => onDelete(record.id)} className="text-error hover:text-red-700">
                                        <TrashIcon />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
