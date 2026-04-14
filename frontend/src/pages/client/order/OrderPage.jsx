import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';

const OrderPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-pink-100 pt-24 pb-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="mb-8">
                        <span className="material-symbols-outlined text-8xl text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 mb-4">
                            shopping_bag
                        </span>
                    </div>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 mb-4">
                        Orders
                    </h1>
                    <p className="text-gray-600 mb-8 text-lg">
                        Manage your bookings and orders here. This page is coming soon!
                    </p>
                    <button
                        onClick={() => navigate('/home')}
                        className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold shadow-lg hover:from-rose-600 hover:to-pink-600 transition duration-300"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </>
    );
};

export default OrderPage;

