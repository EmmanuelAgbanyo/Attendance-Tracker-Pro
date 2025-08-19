
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AttendanceRecord } from '../types';
import { ChartBarIcon } from './icons';

type AggregationLevel = 'Daily' | 'Weekly' | 'Monthly';

// Helper to get the start of the week (Monday)
const getWeekStartDate = (d: Date): Date => {
    const date = new Date(d);
    const day = date.getDay(); // Sunday - 0, Monday - 1, ...
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust so Monday is the first day
    return new Date(new Date(date.setDate(diff)).setHours(0, 0, 0, 0));
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-base-100 p-3 rounded-lg shadow-lg border border-base-300 outline-none">
                <p className="text-sm font-bold text-neutral mb-1">{label}</p>
                <p className="text-sm" style={{ color: 'var(--primary)' }}>
                    <span className="font-semibold">Participants:</span> {payload[0].value.toLocaleString()}
                </p>
                {payload[0].payload.eventCount && (
                     <p className="text-xs text-gray-500">
                        {payload[0].payload.eventCount} event(s) aggregated
                     </p>
                )}
            </div>
        );
    }
    return null;
};


export const AttendanceChart: React.FC<{ data: AttendanceRecord[] }> = ({ data }) => {
    const [aggregation, setAggregation] = useState<AggregationLevel>('Monthly');

    const { chartData, averageParticipants } = useMemo(() => {
        if (!data || data.length === 0) return { chartData: [], averageParticipants: 0 };
        
        const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let aggregated: Record<string, { total: number; count: number; }> = {};
        
        if (aggregation === 'Daily') {
             aggregated = sortedData.reduce((acc, record) => {
                const day = record.date; // YYYY-MM-DD
                if (!acc[day]) acc[day] = { total: 0, count: 0 };
                acc[day].total += record.participants;
                acc[day].count += 1;
                return acc;
            }, {} as Record<string, { total: number; count: number; }>);

        } else if (aggregation === 'Weekly') {
            aggregated = sortedData.reduce((acc, record) => {
                const weekStartDate = getWeekStartDate(new Date(record.date));
                const weekKey = weekStartDate.toISOString().split('T')[0]; // Use ISO string for a reliable key
                if (!acc[weekKey]) acc[weekKey] = { total: 0, count: 0 };
                acc[weekKey].total += record.participants;
                acc[weekKey].count += 1;
                return acc;
            }, {} as Record<string, { total: number; count: number; }>);

        } else { // Monthly
            aggregated = sortedData.reduce((acc, record) => {
                const month = new Date(record.date).toLocaleString('default', { month: 'short', year: 'numeric' });
                if (!acc[month]) acc[month] = { total: 0, count: 0 };
                acc[month].total += record.participants;
                acc[month].count += 1;
                return acc;
            }, {} as Record<string, { total: number; count: number; }>);
        }
        
        const finalChartData = Object.keys(aggregated).map(key => {
            let name = key;
            if (aggregation === 'Weekly') {
                 // Create a user-friendly label from the ISO date key
                const dateFromKey = new Date(`${key}T00:00:00Z`); // Treat key as UTC to avoid timezone shifts
                name = `W/C ${dateFromKey.toLocaleDateString('default', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
            } else if (aggregation === 'Daily') {
                const dateFromKey = new Date(`${key}T00:00:00Z`);
                name = dateFromKey.toLocaleDateString('default', { month: 'short', day: 'numeric', timeZone: 'UTC' });
            }
            return {
                name: name,
                Participants: aggregated[key].total,
                eventCount: aggregated[key].count,
            };
        });

        const totalParticipants = finalChartData.reduce((sum, item) => sum + item.Participants, 0);
        const avg = finalChartData.length > 0 ? Math.round(totalParticipants / finalChartData.length) : 0;
        
        return { chartData: finalChartData, averageParticipants: avg };
    }, [data, aggregation]);


    const AggregationButton: React.FC<{ level: AggregationLevel }> = ({ level }) => {
        const isActive = aggregation === level;
        return (
            <button
                onClick={() => setAggregation(level)}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                    isActive
                        ? 'bg-primary text-primary-content shadow-sm'
                        : 'bg-base-200 hover:bg-base-300 text-neutral'
                }`}
            >
                {level}
            </button>
        );
    };

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-base-200/50 rounded-lg p-4">
                <ChartBarIcon className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-bold text-neutral">No Data Available</h3>
                <p>Add a record to start visualizing your attendance data.</p>
            </div>
        );
    }
    
    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex justify-end items-center mb-4">
                 <div className="flex items-center gap-2 p-1 bg-base-200 rounded-lg">
                    <AggregationButton level="Daily" />
                    <AggregationButton level="Weekly" />
                    <AggregationButton level="Monthly" />
                </div>
            </div>
            <div className="flex-grow" style={{minHeight: '300px'}}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5, }}
                    >
                        <defs>
                            <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary, #6366F1)" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="var(--primary, #6366F1)" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#6B7280', fontSize: 12 }} 
                            axisLine={{ stroke: '#E5E7EB' }} 
                            tickLine={false}
                        />
                        <YAxis 
                            tick={{ fill: '#6B7280', fontSize: 12 }} 
                            axisLine={false} 
                            tickLine={false}
                            width={50}
                            tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(value as number)}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary, #6366F1)', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                        <Legend verticalAlign="top" align="left" height={36} iconSize={10} wrapperStyle={{ fontSize: '14px', paddingLeft: '60px' }}/>
                        <ReferenceLine 
                             y={averageParticipants} 
                             label={{ value: `Avg: ${averageParticipants.toLocaleString()}`, position: 'insideTopRight', fill: '#9CA3AF', fontSize: 10 }} 
                             stroke="var(--accent, #F59E0B)" 
                             strokeDasharray="4 4" 
                             strokeWidth={1.5}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="Participants" 
                            stroke="var(--primary, #6366F1)" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorParticipants)" 
                            name="Total Participants"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
