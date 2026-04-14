import React from 'react';
import { X, AlertTriangle, Trash2, Ban } from 'lucide-react';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message, 
    confirmText = "Delete", 
    cancelText = "Cancel", 
    isDanger = true,
    icon = "trash" // "trash" | "ban" | "warning"
}) => {
    if (!isOpen) return null;

    const IconComponent = {
        trash: Trash2,
        ban: Ban,
        warning: AlertTriangle
    }[icon] || Trash2;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                {/* Close button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Body */}
                <div className="px-6 pt-8 pb-6">
                    {/* Icon */}
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        isDanger 
                            ? 'bg-red-100 dark:bg-red-900/30' 
                            : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                        <IconComponent className={`w-8 h-8 ${
                            isDanger 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-blue-600 dark:text-blue-400'
                        }`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-600 dark:text-gray-400 text-center text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-500 transition focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-500"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isDanger 
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;

