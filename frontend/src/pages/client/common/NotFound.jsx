import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-pink-100 flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 mb-4">
                        404
                    </h1>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        The page you are looking for doesn't exist or has been moved.
                    </p>
                    <button
                        onClick={() => navigate('/home')}
                        className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold shadow-lg hover:from-rose-600 hover:to-pink-600 transition duration-300"
                    >
                        Go Back Home
                    </button>
                </div>
            </div>
        </>
    );
};

export default NotFound;