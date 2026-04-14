// File: src/components/Settings/Tabs/SecurityTab.jsx
import React, { useState } from 'react';
import { Lock, Save, Shield } from 'lucide-react';
import ProfileInputField from '../UI/ProfileInputField';

const SecurityTab = ({ PRIMARY_COLOR_CLASSES }) => {
    const buttonPrimary = `px-6 py-3 rounded-xl font-semibold text-white ${PRIMARY_COLOR_CLASSES} shadow-lg flex items-center justify-center gap-2 disabled:opacity-50`;
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handlePasswordChange = (e) => {
        setPasswordData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="space-y-8">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h4>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">You will need to re-login after changing your password.</p>
                <div className="space-y-5">
                    <ProfileInputField 
                        label="Current Password" 
                        name="currentPassword" 
                        value={passwordData.currentPassword}
                        icon={Lock} 
                        disabled={false} 
                        type="password"
                        onChange={handlePasswordChange}
                    />
                    <ProfileInputField 
                        label="New Password" 
                        name="newPassword" 
                        value={passwordData.newPassword}
                        icon={Lock} 
                        disabled={false} 
                        type="password"
                        onChange={handlePasswordChange}
                    />
                    <ProfileInputField 
                        label="Confirm New Password" 
                        name="confirmPassword" 
                        value={passwordData.confirmPassword}
                        icon={Lock} 
                        disabled={false} 
                        type="password"
                        onChange={handlePasswordChange}
                    />
                </div>
                <div className="pt-6 flex justify-end">
                    <button className={buttonPrimary}>
                        <Save className="w-4 h-4" /> Update Password
                    </button>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</h4>
                </div>
                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white mb-1">Enable 2FA for an extra layer of security</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Protect your account with two-factor authentication</p>
                    </div>
                    <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition duration-300 shadow-md">
                        Enable
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecurityTab;