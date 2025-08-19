
import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types';

interface AddRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: AttendanceRecord) => void;
    recordToEdit: AttendanceRecord | null;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({ isOpen, onClose, onSave, recordToEdit }) => {
    const [date, setDate] = useState('');
    const [institution, setInstitution] = useState('');
    const [participants, setParticipants] = useState('');

    useEffect(() => {
        if (recordToEdit) {
            setDate(recordToEdit.date);
            setInstitution(recordToEdit.institution);
            setParticipants(recordToEdit.participants.toString());
        } else {
            // Default to today's date for new records
            setDate(new Date().toISOString().split('T')[0]);
            setInstitution('');
            setParticipants('');
        }
    }, [recordToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numParticipants = parseInt(participants, 10);
        if (!date || !institution || isNaN(numParticipants) || numParticipants <= 0) {
            alert('Please fill all fields correctly. Participants must be a positive number.');
            return;
        }
        onSave({
            id: recordToEdit?.id || '',
            date,
            institution,
            participants: numParticipants,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-2xl shadow-xl p-8 w-full max-w-md m-4">
                <h2 className="text-2xl font-bold mb-6 text-neutral">
                    {recordToEdit ? 'Edit Record' : 'Add New Record'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            id="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="institution" className="block text-sm font-medium text-gray-700">School / Institution</label>
                        <input
                            type="text"
                            id="institution"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            placeholder="e.g., Northwood High School"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="participants" className="block text-sm font-medium text-gray-700">Number of Participants</label>
                        <input
                            type="number"
                            id="participants"
                            value={participants}
                            onChange={(e) => setParticipants(e.target.value)}
                            placeholder="e.g., 75"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            required
                            min="1"
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-2 px-4 bg-base-200 hover:bg-base-300 text-gray-700 font-semibold rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="py-2 px-4 bg-primary hover:bg-primary-focus text-primary-content font-semibold rounded-lg"
                        >
                            {recordToEdit ? 'Save Changes' : 'Add Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
