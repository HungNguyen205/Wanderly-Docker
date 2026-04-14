import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('accessToken');
            const user = localStorage.getItem('user');

            if (!token || !user) {
                setIsAuthorized(false);
                setIsLoading(false);
                return;
            }

            // User is logged in
            setIsAuthorized(true);
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-pink-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

