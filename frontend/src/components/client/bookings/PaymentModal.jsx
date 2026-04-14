import React, { useState } from 'react';
import { X, CreditCard, Wallet, Building2, CheckCircle2, Loader2, Shield } from 'lucide-react';

const paymentMethods = [
    {
        id: 'credit_card',
        name: 'Credit/Debit Card',
        icon: CreditCard,
        description: 'Visa, Mastercard, JCB',
        color: 'from-blue-500 to-indigo-600'
    },
    {
        id: 'e_wallet',
        name: 'E-Wallet',
        icon: Wallet,
        description: 'Momo, ZaloPay, VNPay',
        color: 'from-pink-500 to-rose-600'
    },
    {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        icon: Building2,
        description: 'Direct bank transfer',
        color: 'from-emerald-500 to-teal-600'
    }
];

const PaymentModal = ({ isOpen, onClose, booking, onPaymentSuccess }) => {
    const [selectedMethod, setSelectedMethod] = useState('credit_card');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
    };

    const handlePayment = async () => {
        setProcessing(true);

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const token = localStorage.getItem('accessToken');

            // Create transaction
            const response = await fetch(`/api/bookings/${booking.BookingId}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: booking.TotalAmount,
                    paymentMethod: selectedMethod,
                    gatewayId: 1, // Mock gateway
                    currency: 'VND',
                    status: 'succeeded' // Mock: auto success
                })
            });

            if (response.ok) {
                setSuccess(true);

                // Wait a bit to show success animation
                setTimeout(() => {
                    onPaymentSuccess();
                    onClose();
                    setSuccess(false);
                }, 1500);
            } else {
                const data = await response.json();
                alert(data.message || 'Payment failed');
                setProcessing(false);
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
            setProcessing(false);
        }
    };

    // Success State
    if (success) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-bounce">
                        <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Payment Successful! 🎉
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your booking has been confirmed.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!processing ? onClose : undefined}
            ></div>

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Complete Payment
                    </h3>
                    {!processing && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Order Summary */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Booking Code</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{booking.BookingCode}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Amount to Pay</span>
                            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {formatPrice(booking.TotalAmount)}
                            </span>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Select Payment Method
                        </label>
                        <div className="space-y-3">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon;
                                const isSelected = selectedMethod === method.id;

                                return (
                                    <button
                                        key={method.id}
                                        onClick={() => !processing && setSelectedMethod(method.id)}
                                        disabled={processing}
                                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${isSelected
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {method.name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {method.description}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <CheckCircle2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Security Note */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                        <Shield className="w-4 h-4" />
                        <span>Your payment information is secure and encrypted</span>
                    </div>

                    {/* Pay Button */}
                    <button
                        onClick={handlePayment}
                        disabled={processing}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing Payment...
                            </>
                        ) : (
                            <>
                                Pay {formatPrice(booking.TotalAmount)}
                            </>
                        )}
                    </button>

                    {/* Test Mode Notice */}
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                        🧪 Test Mode: Payment will be simulated
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;

