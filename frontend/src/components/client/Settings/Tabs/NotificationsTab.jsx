// File: src/components/Settings/Tabs/NotificationsTab.jsx
import React from 'react';
import { Bell, Mail, MessageSquare } from 'lucide-react';

const NotificationsTab = () => {
    return (
        <div className="space-y-8">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Email Notifications</h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose what email notifications you want to receive</p>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <div>
                                <label htmlFor="news" className="font-medium text-gray-900 dark:text-white cursor-pointer block">
                                    Product News and Updates
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Stay updated with new features and improvements</p>
                            </div>
                        </div>
                        <input 
                            type="checkbox" 
                            id="news" 
                            defaultChecked 
                            className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" 
                        />
                    </div>
                    <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <div>
                                <label htmlFor="marketing" className="font-medium text-gray-900 dark:text-white cursor-pointer block">
                                    Marketing and Promotions
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Receive special offers and promotional content</p>
                            </div>
                        </div>
                        <input 
                            type="checkbox" 
                            id="marketing" 
                            className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" 
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Desktop Notifications</h4>
                </div>
                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white mb-1">Allow browser notifications for new messages</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get notified instantly when you receive new messages</p>
                    </div>
                    <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition duration-300 shadow-md">
                        Manage
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationsTab;