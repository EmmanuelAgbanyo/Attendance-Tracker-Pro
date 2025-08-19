
import React from 'react';
import { UsersIcon, CalendarIcon, ScaleIcon } from './icons';

interface DashboardMetricsProps {
    stats: {
        totalParticipants: number;
        totalEvents: number;
        averageParticipants: number;
    };
}

const MetricCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string }> = ({ icon, title, value, color }) => (
    <div className="bg-base-100 p-6 rounded-2xl shadow-md flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-neutral">{value}</p>
        </div>
    </div>
);


export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
                icon={<UsersIcon className="h-6 w-6 text-white" />}
                title="Total Participants"
                value={stats.totalParticipants.toLocaleString()}
                color="bg-info"
            />
            <MetricCard
                icon={<CalendarIcon className="h-6 w-6 text-white" />}
                title="Total Events Recorded"
                value={stats.totalEvents.toLocaleString()}
                color="bg-accent"
            />
            <MetricCard
                icon={<ScaleIcon className="h-6 w-6 text-white" />}
                title="Average Participants"
                value={stats.averageParticipants.toLocaleString()}
                color="bg-secondary"
            />
        </div>
    );
};
