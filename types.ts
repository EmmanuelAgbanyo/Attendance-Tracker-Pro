
export interface AttendanceRecord {
    id: string;
    date: string; // YYYY-MM-DD format
    institution: string;
    participants: number;
}

export interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}
