
import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InfoCircleIcon, XMarkIcon } from './icons';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

const toastConfig = {
    success: {
        bg: 'bg-green-500',
        icon: <CheckCircleIcon className="h-6 w-6 text-white" />
    },
    error: {
        bg: 'bg-red-500',
        icon: <XCircleIcon className="h-6 w-6 text-white" />
    },
    info: {
        bg: 'bg-blue-500',
        icon: <InfoCircleIcon className="h-6 w-6 text-white" />
    }
};

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    const { bg, icon } = toastConfig[type];

    return (
        <div className={`fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 text-white ${bg} rounded-lg shadow-lg z-50`}>
            <div className="flex-shrink-0">
                {icon}
            </div>
            <div className="ml-3 text-sm font-medium">
                {message}
            </div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8"
                onClick={onClose}
                aria-label="Close"
            >
                <span className="sr-only">Close</span>
                <XMarkIcon className="text-black"/>
            </button>
        </div>
    );
};
