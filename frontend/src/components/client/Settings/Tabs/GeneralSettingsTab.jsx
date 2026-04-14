// File: src/components/Settings/Tabs/GeneralSettingsTab.jsx
import React from 'react';
import { Settings, Palette, Languages, Clock } from 'lucide-react';

const GeneralSettingsTab = () => {
    return (
        <div className="space-y-8">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">User Experience</h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Customize your application preferences</p>
            </div>

            <div className="space-y-5">
                {/* Theme/Mode */}
                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                        <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <div>
                            <label htmlFor="theme" className="font-medium text-gray-900 dark:text-white block">
                                Display Theme
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Choose your preferred color scheme</p>
                        </div>
                    </div>
                    <select 
                        id="theme" 
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                    >
                        <option>System Default</option>
                        <option>Light</option>
                        <option>Dark</option>
                    </select>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                        <Languages className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <div>
                            <label htmlFor="language" className="font-medium text-gray-900 dark:text-white block">
                                Application Language
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Select your preferred language</p>
                        </div>
                    </div>
                    <select 
                        id="language" 
                        defaultValue="en" 
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                    >
                        <option value="en">English (US)</option>
                        <option value="vi">Vietnamese (Việt Nam)</option>
                        <option value="jp">Japanese (日本語)</option>
                    </select>
                </div>

                {/* Timezone/Region */}
                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <div>
                            <label htmlFor="timezone" className="font-medium text-gray-900 dark:text-white block">
                                Timezone
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Set your local timezone</p>
                        </div>
                    </div>
                    <select 
                        id="timezone" 
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                    >
                        <option>Asia/Ho_Chi_Minh</option>
                        <option>America/New_York</option>
                        <option>Europe/London</option>
                        <option>Asia/Tokyo</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettingsTab;