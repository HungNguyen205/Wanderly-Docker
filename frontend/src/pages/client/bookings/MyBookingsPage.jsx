import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';
import PaymentModal from '@/components/client/bookings/PaymentModal';
import { toast } from 'react-toastify';
import { 
    Package, Calendar, Clock, MapPin, ChevronRight, 
    Filter, Search, AlertCircle, CheckCircle2, XCircle, 
    Loader2, RefreshCw, Wallet
} from 'lucide-react';

const statusConfig = {
    pending: { 
        label: 'Pending', 
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: Clock
    },
    confirmed: { 
        label: 'Confirmed', 
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        icon: CheckCircle2
    },
    completed: { 
        label: 'Completed', 
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle2
    },
    cancelled: { 
        label: 'Cancelled', 
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle
    }
};

const MyBookingsPage = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Load bookings
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            toast.info('Please login to view your bookings');
            navigate('/login');
            return;
        }
        loadBookings();
    }, [statusFilter, pagination.page, navigate]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            
            if (!token) {
                setLoading(false);
                return;
            }
            
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit
            });
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`/api/bookings/my?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                toast.error('Session expired. Please login again.');
                navigate('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load bookings');
            }

            const data = await response.json();
            setBookings(data.data?.bookings || []);
            setPagination(prev => ({
                ...prev,
                total: data.data?.pagination?.total || 0,
                totalPages: data.data?.pagination?.totalPages || 0
            }));
        } catch (error) {
            console.error('Error loading bookings:', error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // Format date
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const StatusBadge = ({ status }) => {
        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                <Icon className="w-4 h-4" />
                {config.label}
            </span>
        );
    };

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <Package className="w-8 h-8 text-indigo-600" />
                                My Bookings
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Manage and track your bookings
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>

                            <button
                                onClick={loadBookings}
                                className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Bookings List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No bookings found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {statusFilter 
                                    ? `You don't have any ${statusFilter} bookings.` 
                                    : "You haven't made any bookings yet."}
                            </p>
                            <button
                                onClick={() => navigate('/services')}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Browse Services
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bookings.map((booking) => (
                                <div
                                    key={booking.BookingId}
                                    onClick={() => navigate(`/bookings/${booking.BookingId}`)}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                    #{booking.BookingCode}
                                                </span>
                                                <StatusBadge status={booking.Status} />
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(booking.CreatedAt)}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Package className="w-4 h-4" />
                                                    {booking.ItemCount} item{booking.ItemCount > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {booking.Status === 'pending' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedBooking(booking);
                                                        setShowPaymentModal(true);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-md transition-all"
                                                >
                                                    <Wallet className="w-4 h-4" />
                                                    Pay Now
                                                </button>
                                            )}
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {formatPrice(booking.TotalAmount)}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {selectedBooking && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedBooking(null);
                    }}
                    booking={selectedBooking}
                    onPaymentSuccess={() => {
                        toast.success('Payment successful! Your booking is now confirmed.');
                        setShowPaymentModal(false);
                        setSelectedBooking(null);
                        loadBookings();
                    }}
                />
            )}
        </>
    );
};

export default MyBookingsPage;

