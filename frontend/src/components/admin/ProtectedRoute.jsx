import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function AdminProtectedRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('accessToken');
            const adminUser = localStorage.getItem('adminUser');
            const user = localStorage.getItem('user');

            if (!token) {
                setIsAuthorized(false);
                setIsLoading(false);
                return;
            }

            // Check if user is admin
            let userData = null;
            if (adminUser) {
                try {
                    userData = JSON.parse(adminUser);
                } catch (e) {
                    console.error('Error parsing adminUser:', e);
                }
            } else if (user) {
                try {
                    userData = JSON.parse(user);
                    // Check if user has admin role (RoleId === 1 for admin)
                    if (userData.RoleId === 1 || userData.roleId === 1 || userData.Role === 'admin') {
                        setIsAuthorized(true);
                        setIsLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing user:', e);
                }
            }

            // If adminUser exists, user is authorized
            if (adminUser || (userData && (userData.Role === 'admin' || userData.RoleId === 1 || userData.roleId === 1))) {
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }

            setIsLoading(false);
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-pink-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Checking authorization...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}

