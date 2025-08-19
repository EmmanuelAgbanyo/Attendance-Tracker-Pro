
import React, { useState, useCallback } from 'react';
import { AttendanceRecord } from '../types';
import { getAIInsights } from '../services/geminiService';
import { LightBulbIcon, SparklesIcon } from './icons';

interface InsightCardProps {
    records: AttendanceRecord[];
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ records, showToast }) => {
    const [insights, setInsights] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleGetInsights = useCallback(async () => {
        if (records.length < 3) {
            showToast('Add at least 3 records to get meaningful insights.', 'info');
            return;
        }

        setIsLoading(true);
        setInsights('');
        try {
            const result = await getAIInsights(records);
            setInsights(result);
            showToast('Insights generated successfully!', 'success');
        } catch (error) {
            console.error("Failed to get AI insights:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setInsights(`Failed to generate insights. Please check your API key and try again.\nError: ${errorMessage}`);
            showToast('Failed to generate insights.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [records, showToast]);
    
    const formattedInsights = insights.split('\n').map((line, index) => {
        line = line.replace(/^\* /, '');
        if (line.startsWith('##')) {
            return <h3 key={index} className="text-lg font-bold mt-4 mb-2">{line.replace('##', '').trim()}</h3>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
             return <strong key={index} className="font-semibold text-neutral">{line.replace(/\*\*/g, '')}</strong>;
        }
        return line ? <li key={index} className="mb-2">{line}</li> : null;
    });

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <LightBulbIcon className="h-6 w-6 text-accent" />
                <h3 className="text-xl font-bold text-neutral">AI Insights</h3>
            </div>
            <div className="flex-grow bg-base-200 p-4 rounded-lg overflow-y-auto h-64">
                {isLoading ? (
                     <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="ml-3 text-gray-600">Generating insights...</p>
                     </div>
                ) : insights ? (
                    <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                        {formattedInsights}
                    </ul>
                ) : (
                    <div className="text-center text-gray-500 h-full flex flex-col justify-center">
                        <p>Click the button below to analyze your attendance data and uncover trends.</p>
                    </div>
                )}
            </div>
            <button
                onClick={handleGetInsights}
                disabled={isLoading}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-accent hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <SparklesIcon />
                {isLoading ? 'Analyzing...' : 'Generate Insights'}
            </button>
        </div>
    );
};
