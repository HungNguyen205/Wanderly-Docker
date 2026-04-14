// File: src/components/Settings/UI/ProfileTextAreaField.jsx
import React from 'react';
import { Info } from 'lucide-react';

const ProfileTextAreaField = ({ label, name, value, icon: Icon = Info, disabled, onChange }) => (
    <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center mb-2">
            <Icon className="mr-2 w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {label}
        </label>
        <textarea
            name={name}
            rows="4"
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition duration-300 resize-none
                        ${disabled
                    ? 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30'
                }`}
        />
    </div>
);

export default ProfileTextAreaField;