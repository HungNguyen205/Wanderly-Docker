import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';
import ConfirmationModal from '@/components/client/common/ConfirmationModal';
import PaymentModal from '@/components/client/bookings/PaymentModal';
import { toast } from 'react-toastify';
import {
    ChevronLeft, Package, Calendar, Clock, MapPin, User, Mail, Phone,
    CheckCircle2, XCircle, AlertCircle, CreditCard, Receipt,
    Loader2, Trash2, Ban, CheckCheck, Wallet
} from 'lucide-react';

const statusConfig = {
    pending: {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
        icon: Clock,
        description: 'Waiting for payment'
    },
    confirmed: {
        label: 'Confirmed',
        color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
        icon: CheckCircle2,
        description: 'Payment received, ready to use'
    },
    completed: {
        label: 'Completed',
        color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
        icon: CheckCheck,
        description: 'Service completed'
    },
    cancelled: {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
        icon: XCircle,
        description: 'Booking was cancelled'
    }
};

const transactionStatusConfig = {
    pending: { label: 'Pending', color: 'text-yellow-600 dark:text-yellow-400' },
    succeeded: { label: 'Succeeded', color: 'text-green-600 dark:text-green-400' },
    failed: { label: 'Failed', color: 'text-red-600 dark:text-red-400' }
};

const BookingDetailPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [items, setItems] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Get current user from localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setCurrentUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        }
        loadBookingDetail();
    }, [bookingId]);

    const loadBookingDetail = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`/api/bookings/${bookingId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    toast.error('Booking not found');
                    navigate('/bookings');
                    return;
                }
                throw new Error('Failed to load booking');
            }

            const data = await response.json();
            setBooking(data.data?.booking || null);
            setItems(data.data?.items || []);
            setTransactions(data.data?.transactions || []);
        } catch (error) {
            console.error('Error loading booking:', error);
            toast.error('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = () => {
        setShowCancelModal(true);
    };

    const confirmCancelBooking = async () => {
        try {
            setCancelling(true);
            const token = localStorage.getItem('accessToken');

            const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // Show specific error message from backend
                const errorMessage = data.message || 'Failed to cancel booking';
                toast.error(errorMessage);
                console.error('Cancel booking error:', data);
                return;
            }

            toast.success(data.message || 'Booking cancelled successfully');
            setShowCancelModal(false);
            loadBookingDetail();
        } catch (error) {
            console.error('Error cancelling booking:', error);
            toast.error('Failed to cancel booking');
        } finally {
            setCancelling(false);
        }
    };

    // Format helpers
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '-';
        if (typeof timeStr === 'string' && timeStr.includes('T')) {
            const timePart = timeStr.split('T')[1];
            if (timePart) {
                const cleanTime = timePart.replace(/[Z+-].*$/, '');
                return cleanTime.substring(0, 5);
            }
        }
        return timeStr.toString().substring(0, 5);
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                </div>
            </>
        );
    }

    if (!booking) return null;

    const statusInfo = statusConfig[booking.Status] || statusConfig.pending;
    const StatusIcon = statusInfo.icon;
    const canCancel = ['pending', 'confirmed'].includes(booking.Status);
    
    // Check if current user is the owner of this booking
    const currentUserId = currentUser?.UserId || currentUser?.userId || currentUser?.id;
    const bookingUserId = booking.UserId || booking.userId;
    const isOwner = currentUserId && bookingUserId && Number(currentUserId) === Number(bookingUserId);

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Back Button & Title */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/bookings')}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-4"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back to My Bookings
                        </button>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Booking #{booking.BookingCode}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    Created on {formatDateTime(booking.CreatedAt)}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {isOwner && booking.Status === 'pending' && (
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all"
                                    >
                                        <Wallet className="w-5 h-5" />
                                        Pay Now
                                    </button>
                                )}
                                {isOwner && canCancel && (
                                    <button
                                        onClick={handleCancelBooking}
                                        disabled={cancelling}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                                    >
                                        {cancelling ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Ban className="w-5 h-5" />
                                        )}
                                        Cancel Booking
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className={`p-6 rounded-2xl border-2 mb-8 ${statusInfo.color}`}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20">
                                <StatusIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{statusInfo.label}</h3>
                                <p className="opacity-80">{statusInfo.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Booking Items */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Package className="w-6 h-6 text-indigo-500" />
                                    Booking Items
                                </h2>

                                {items.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                        No items in this booking
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {items.map((item) => (
                                            <div
                                                key={item.BookingItemId}
                                                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                                            {item.ServiceName}
                                                        </h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {item.CategoryName}
                                                        </p>
                                                    </div>
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                        {formatPrice(item.ItemTotal)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        {formatDate(item.AvailabilityDate)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        {formatTime(item.StartTime)} - {formatTime(item.EndTime)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                                        <MapPin className="w-4 h-4 text-gray-400" />
                                                        {item.LocationName || item.LocationCity || 'N/A'}
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        {formatPrice(item.Price)} × {item.Quantity}
                                                    </span>
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        Provider: {item.ProviderName}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Transactions */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <CreditCard className="w-6 h-6 text-indigo-500" />
                                    Payment History
                                </h2>

                                {transactions.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Receipt className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">
                                            No payments yet
                                        </p>
                                        {booking.Status === 'pending' && (
                                            <button className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
                                                Pay Now
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {transactions.map((tx) => (
                                            <div
                                                key={tx.TransactionId}
                                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {tx.PaymentMethod} - {tx.GatewayName}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {formatDateTime(tx.TransactionDate)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        {formatPrice(tx.Amount)}
                                                    </p>
                                                    <p className={`text-sm font-medium ${transactionStatusConfig[tx.Status]?.color || ''}`}>
                                                        {transactionStatusConfig[tx.Status]?.label || tx.Status}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Price Summary */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                                    Price Summary
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(booking.Subtotal)}</span>
                                    </div>
                                    {booking.DiscountAmount > 0 && (
                                        <div className="flex justify-between text-green-600 dark:text-green-400">
                                            <span>Discount</span>
                                            <span>-{formatPrice(booking.DiscountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                                        <span className="font-bold text-gray-900 dark:text-white">Total</span>
                                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                            {formatPrice(booking.TotalAmount)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                                    Customer Information
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {booking.CustomerName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {booking.CustomerEmail}
                                        </span>
                                    </div>
                                    {booking.CustomerPhone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {booking.CustomerPhone}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Need Help */}
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6">
                                <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">
                                    Need Help?
                                </h3>
                                <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                                    If you have any questions about your booking, please contact us.
                                </p>
                                <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Booking Confirmation Modal */}
            <ConfirmationModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={confirmCancelBooking}
                title="Cancel Booking"
                message={`Are you sure you want to cancel booking #${booking?.BookingCode}? This action cannot be undone and you may be charged a cancellation fee depending on the cancellation policy.`}
                confirmText="Yes, Cancel Booking"
                cancelText="Keep Booking"
                isDanger={true}
                icon="ban"
            />

            {/* Payment Modal */}
            {booking && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    booking={booking}
                    onPaymentSuccess={() => {
                        toast.success('Payment successful! Your booking is now confirmed.');
                        loadBookingDetail();
                    }}
                />
            )}
        </>
    );
};

export default BookingDetailPage;

