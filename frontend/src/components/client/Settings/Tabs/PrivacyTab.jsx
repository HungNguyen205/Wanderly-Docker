// File: src/components/Settings/Tabs/PrivacyTab.jsx
import React from 'react';
import { Shield, Trash2, Eye, Database } from 'lucide-react';

const PrivacyTab = () => {
    return (
        <div className="space-y-8">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Data Sharing & Visibility</h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Control how your information is shared and displayed</p>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <div>
                                <label htmlFor="visibility" className="font-medium text-gray-900 dark:text-white cursor-pointer block">
                                    Allow others to see my Bio
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Make your bio visible to other users</p>
                            </div>
                        </div>
                        <input 
                            type="checkbox" 
                            id="visibility" 
                            defaultChecked 
                            className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" 
                        />
                    </div>
                    <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <div>
                                <label htmlFor="data_sharing" className="font-medium text-gray-900 dark:text-white cursor-pointer block">
                                    Share anonymous usage data
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Help us improve by sharing anonymous analytics</p>
                            </div>
                        </div>
                        <input 
                            type="checkbox" 
                            id="data_sharing" 
                            className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" 
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                    <h4 className="text-xl font-bold text-red-600 dark:text-red-400">Account Management</h4>
                </div>
                <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition duration-300 shadow-md flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Delete Account Permanently
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyTab;