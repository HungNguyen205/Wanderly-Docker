import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';
import { toast } from 'react-toastify';
import { MapPin, Star, Image as ImageIcon } from 'lucide-react';

// Placeholder images by category
const categoryPlaceholders = {
    'accommodation': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
    'hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
    'tour': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80',
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
    'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80'
};

// Get service image - prioritize PrimaryImageUrl from API
const getServiceImage = (service) => {
    if (service.PrimaryImageUrl) return service.PrimaryImageUrl;
    const categoryName = (service.ServiceTypeName || service.CategoryName || '').toLowerCase();
    for (const [key, url] of Object.entries(categoryPlaceholders)) {
        if (categoryName.includes(key)) return url;
    }
    return categoryPlaceholders.default;
};

const ProviderPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [roleId, setRoleId] = useState(null);
    const [providerId, setProviderId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [recentBookings, setRecentBookings] = useState([]);
    const [stats, setStats] = useState({
        totalServices: 0,
        activeServices: 0,
        pendingServices: 0,
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
    });
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, serviceId: null, serviceName: '' });
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        // Get user info from localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                setRoleId(userData.RoleId || userData.roleId || null);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        setLoading(false);
    }, []);

    // Load provider info, services, stats and bookings when user is a provider
    useEffect(() => {
        if (user && roleId === 3) {
            loadProviderInfo();
        }
    }, [user, roleId]);

    // Load provider info to get providerId
    const loadProviderInfo = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const response = await fetch('/api/providers/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const pid = data.data?.ProviderId || data.data?.providerId || data.ProviderId;
                if (pid) {
                    setProviderId(pid);
                    loadServices();
                    loadProviderStats(pid);
                    loadRecentBookings(pid);
                }
            }
        } catch (error) {
            console.error('Error loading provider info:', error);
            // Still try to load services
            loadServices();
        }
    };

    // Load provider statistics
    const loadProviderStats = async (pid) => {
        if (!pid) return;
        try {
            setLoadingStats(true);
            const token = localStorage.getItem('accessToken');

            // Load booking stats
            const bookingStatsResponse = await fetch(`/api/bookings/provider/${pid}/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (bookingStatsResponse.ok) {
                const data = await bookingStatsResponse.json();
                const summary = data.data?.summary || {};
                setStats(prev => ({
                    ...prev,
                    totalBookings: summary.TotalBookings || 0,
                    totalRevenue: summary.TotalRevenue || 0,
                }));
            }

            // Load average rating
            const ratingResponse = await fetch(`/api/reviews/provider/${pid}/average`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                const ratingStats = ratingData.data?.stats || {};
                setStats(prev => ({
                    ...prev,
                    averageRating: ratingStats.AverageRating || 0,
                }));
            }
        } catch (error) {
            console.error('Error loading provider stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    // Load recent bookings
    const loadRecentBookings = async (pid) => {
        if (!pid) return;
        try {
            setLoadingBookings(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/bookings/provider/${pid}?page=1&limit=5`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRecentBookings(data.data?.bookings || []);
            }
        } catch (error) {
            console.error('Error loading recent bookings:', error);
        } finally {
            setLoadingBookings(false);
        }
    };

    const loadServices = async () => {
        try {
            setLoadingServices(true);
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Fetch services for current provider
            const response = await fetch('/api/services/provider', { headers });

            if (response.ok) {
                const data = await response.json();
                // Handle different response formats
                const servicesList = data.data?.services || data.data || data.services || (Array.isArray(data) ? data : []);
                console.log('Services loaded:', servicesList);
                console.log('First service:', servicesList[0]);
                setServices(servicesList || []);

                // Calculate stats
                const active = (servicesList || []).filter(s => s.Status === 'active' || s.status === 'active').length;
                const pending = (servicesList || []).filter(s => s.Status === 'pending' || s.status === 'pending').length;
                setStats({
                    totalServices: (servicesList || []).length,
                    activeServices: active,
                    pendingServices: pending,
                });
            } else if (response.status === 403) {
                // 403 Forbidden - user might not be a provider yet or no services
                // Return empty array instead of showing error
                console.log('No access to services or user is not a provider yet');
                setServices([]);
                setStats({
                    totalServices: 0,
                    activeServices: 0,
                    pendingServices: 0,
                });
            } else if (response.status === 404) {
                // 404 Not Found - no services found, return empty array
                console.log('No services found');
                setServices([]);
                setStats({
                    totalServices: 0,
                    activeServices: 0,
                    pendingServices: 0,
                });
            } else {
                // Other errors - still return empty array but log the error
                console.error('Failed to load services:', response.status, response.statusText);
                setServices([]);
                setStats({
                    totalServices: 0,
                    activeServices: 0,
                    pendingServices: 0,
                });
            }
        } catch (error) {
            console.error('Error loading services:', error);
            // On error, return empty array instead of showing error toast
            setServices([]);
            setStats({
                totalServices: 0,
                activeServices: 0,
                pendingServices: 0,
            });
        } finally {
            setLoadingServices(false);
        }
    };

    // Handle delete service
    const handleDeleteService = async (serviceId, serviceName, e) => {
        e?.stopPropagation(); // Prevent card click
        setDeleteConfirm({ show: true, serviceId, serviceName });
    };

    const confirmDeleteService = async () => {
        if (!deleteConfirm.serviceId) return;

        try {
            setDeleting(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/services/${deleteConfirm.serviceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || 'Service deleted successfully');
                setDeleteConfirm({ show: false, serviceId: null, serviceName: '' });
                // Reload services and stats
                loadServices();
                if (providerId) {
                    loadProviderStats(providerId);
                }
            } else {
                toast.error(data.message || 'Failed to delete service');
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            toast.error('An error occurred while deleting the service');
        } finally {
            setDeleting(false);
        }
    };

    const handleRegisterProvider = async () => {
        // Check if user is logged in
        if (!user) {
            toast.info('Please login to register as a provider');
            navigate('/login');
            return;
        }

        // Check if already a provider
        if (roleId === 3) {
            toast.info('You are already a provider!');
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Call API to register as provider
            const res = await fetch('/api/providers/register', {
                method: 'POST',
                headers,
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Successfully registered as provider!');
                // Update user role in localStorage (keep single canonical key)
                const updatedUser = { ...user, RoleId: 3 };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setRoleId(3);
                // Optionally reload page or navigate
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                toast.error(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Error registering as provider:', error);
            toast.error('An error occurred. Please try again later.');
        }
    };

    // Show loading state
    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12 px-4 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                    </div>
                </div>
            </>
        );
    }

    // If user is logged in and is a provider (roleId === 3), show provider dashboard
    if (user && roleId === 3) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12 px-4">
                    <div className="max-w-7xl mx-auto">
                        {/* Welcome Header */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mb-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
                                        <span className="material-symbols-outlined text-white text-3xl">business_center</span>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
                                            Provider Dashboard
                                        </h1>
                                        <p className="text-gray-600 dark:text-gray-400">Welcome back, {user.FullName || user.Email || 'Provider'}!</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/provider/services/create')}
                                    className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    Add New Service
                                </button>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            {/* Total Services */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">inventory</span>
                                    </div>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">+12%</span>
                                </div>
                                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Services</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalServices}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{stats.activeServices} active, {stats.pendingServices} pending</p>
                            </div>

                            {/* Total Orders */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30">
                                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">shopping_cart</span>
                                    </div>
                                    {loadingStats ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                    ) : (
                                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                                            {stats.totalBookings > 0 ? 'Active' : 'New'}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Bookings</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {loadingStats ? '...' : stats.totalBookings}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                    {recentBookings.length > 0 ? `${recentBookings.length} recent` : 'No recent bookings'}
                                </p>
                            </div>

                            {/* Revenue */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">payments</span>
                                    </div>
                                    {loadingStats ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                                    ) : (
                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded">
                                            VND
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Revenue</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {loadingStats ? '...' : new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                        maximumFractionDigits: 0
                                    }).format(stats.totalRevenue || 0)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Last 30 days</p>
                            </div>

                            {/* Rating */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                                        <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    {loadingStats ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                    ) : (
                                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
                                            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Average Rating</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {loadingStats ? '...' : (stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A')}
                                    </p>
                                    {stats.averageRating > 0 && !loadingStats && (
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${star <= Math.round(stats.averageRating)
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-gray-300 dark:text-gray-600'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Based on reviews</p>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Recent Orders */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Recent Orders */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
                                        <button
                                            onClick={() => navigate('/provider/orders')}
                                            className="text-sm text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
                                        >
                                            View All
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </button>
                                    </div>
                                    {loadingBookings ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-2"></div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Loading orders...</p>
                                            </div>
                                        </div>
                                    ) : recentBookings.length === 0 ? (
                                        <div className="text-center py-12">
                                            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                                                shopping_cart
                                            </span>
                                            <p className="text-gray-600 dark:text-gray-400 mb-2">No recent orders</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500">Orders will appear here once customers book your services</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {recentBookings.map((booking) => {
                                                const formatPrice = (price) => {
                                                    return new Intl.NumberFormat('vi-VN', {
                                                        style: 'currency',
                                                        currency: 'VND',
                                                        maximumFractionDigits: 0
                                                    }).format(price || 0);
                                                };

                                                const formatDate = (dateStr) => {
                                                    if (!dateStr) return 'Unknown';
                                                    const date = new Date(dateStr);
                                                    const now = new Date();
                                                    const diffMs = now - date;
                                                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                                                    if (diffDays === 0) return 'Today';
                                                    if (diffDays === 1) return 'Yesterday';
                                                    if (diffDays < 7) return `${diffDays} days ago`;
                                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                };

                                                const statusColors = {
                                                    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                                                    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                                    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                                                    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                                                };

                                                return (
                                                    <div
                                                        key={booking.BookingId}
                                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                                        onClick={() => navigate(`/bookings/${booking.BookingId}`)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-white">receipt</span>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900 dark:text-white">
                                                                    Booking #{booking.BookingCode}
                                                                </h3>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {booking.ServiceName || 'Service'}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${statusColors[booking.Status] || statusColors.pending}`}>
                                                                        {booking.Status || 'pending'}
                                                                    </span>
                                                                    {booking.CustomerName && (
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            • {booking.CustomerName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-gray-900 dark:text-white">
                                                                {formatPrice(booking.TotalAmount)}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                                {formatDate(booking.CreatedAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* My Services */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Services</h2>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={loadServices}
                                                disabled={loadingServices}
                                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-rose-500 font-medium flex items-center gap-1 disabled:opacity-50"
                                            >
                                                <span className={`material-symbols-outlined text-sm ${loadingServices ? 'animate-spin' : ''}`}>
                                                    {loadingServices ? 'progress_activity' : 'refresh'}
                                                </span>
                                                Refresh
                                            </button>
                                            <button
                                                onClick={() => navigate('/provider/services/create')}
                                                className="text-sm text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
                                            >
                                                Add New
                                                <span className="material-symbols-outlined text-sm">add</span>
                                            </button>
                                        </div>
                                    </div>
                                    {loadingServices ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-2"></div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Loading services...</p>
                                            </div>
                                        </div>
                                    ) : services.length === 0 ? (
                                        <div className="text-center py-12">
                                            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                                                inventory_2
                                            </span>
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">No services yet</p>
                                            <button
                                                onClick={() => navigate('/provider/services/create')}
                                                className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto"
                                            >
                                                <span className="material-symbols-outlined">add</span>
                                                Create Your First Service
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {services.slice(0, 6).map((service, index) => {
                                                const serviceId = service.ServiceId || service.ServiceID || service.serviceId || service.id || `service-${index}`;
                                                const serviceName = service.Name || service.name || 'Unnamed Service';
                                                const serviceDesc = service.Description || service.description || 'No description';
                                                const serviceStatus = service.Status || service.status || 'pending';
                                                const isActive = serviceStatus === 'active';
                                                const categoryName = service.ServiceTypeName || service.CategoryName || service.categoryName || 'Service';
                                                const locationName = service.LocationName || service.locationName || '';
                                                const rating = service.AverageRating || 0;
                                                const imageUrl = getServiceImage(service);

                                                return (
                                                    <div
                                                        key={serviceId || `service-${index}`}
                                                        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all cursor-pointer group"
                                                        onClick={() => {
                                                            if (serviceId && serviceId !== `service-${index}`) {
                                                                navigate(`/provider/services/${serviceId}`);
                                                            } else {
                                                                toast.error('Service ID is missing');
                                                            }
                                                        }}
                                                    >
                                                        {/* Image */}
                                                        <div className="relative h-40 overflow-hidden">
                                                            <img
                                                                src={imageUrl}
                                                                alt={serviceName}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                onError={(e) => {
                                                                    e.target.src = categoryPlaceholders.default;
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                                                            {/* Status Badge */}
                                                            <div className="absolute top-3 right-3">
                                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${isActive
                                                                        ? 'bg-green-500 text-white'
                                                                        : 'bg-yellow-500 text-white'
                                                                    }`}>
                                                                    {isActive ? 'Active' : 'Pending'}
                                                                </span>
                                                            </div>

                                                            {/* Category Badge */}
                                                            <div className="absolute top-3 left-3">
                                                                <span className="px-2.5 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                    {categoryName}
                                                                </span>
                                                            </div>

                                                            {/* Rating */}
                                                            {rating > 0 && (
                                                                <div className="absolute bottom-3 right-3">
                                                                    <span className="px-2 py-1 bg-amber-400 rounded-lg text-xs font-bold text-gray-900 flex items-center gap-1">
                                                                        <Star className="w-3 h-3 fill-current" />
                                                                        {rating.toFixed(1)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="p-4">
                                                            <div className="flex items-start justify-between mb-1">
                                                                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors flex-1">
                                                                    {serviceName}
                                                                </h3>
                                                                <button
                                                                    onClick={(e) => handleDeleteService(serviceId, serviceName, e)}
                                                                    className="ml-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                    title="Delete service"
                                                                >
                                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                                </button>
                                                            </div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 min-h-[40px]">
                                                                {serviceDesc}
                                                            </p>
                                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                                {locationName && (
                                                                    <div className="flex items-center gap-1">
                                                                        <MapPin className="w-3.5 h-3.5" />
                                                                        <span className="line-clamp-1">{locationName}</span>
                                                                    </div>
                                                                )}
                                                                <span className="text-rose-500 dark:text-rose-400 font-medium">
                                                                    View Details →
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {services.length > 6 && (
                                        <div className="mt-4 text-center">
                                            <button
                                                onClick={() => navigate('/provider/services')}
                                                className="text-sm text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 mx-auto"
                                            >
                                                View All {services.length} Services
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Quick Actions & Info */}
                            <div className="space-y-6">
                                {/* Quick Actions */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => navigate('/provider/services/create')}
                                            className="w-full p-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg transition-all duration-300 flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="material-symbols-outlined">add</span>
                                                Add Service
                                            </span>
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </button>
                                        <button
                                            onClick={() => navigate('/provider/orders')}
                                            className="w-full p-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="material-symbols-outlined">shopping_cart</span>
                                                View Orders
                                            </span>
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </button>
                                        <button
                                            onClick={() => navigate('/provider/analytics')}
                                            className="w-full p-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="material-symbols-outlined">analytics</span>
                                                Analytics
                                            </span>
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </button>
                                        <button
                                            onClick={() => navigate('/provider/settings')}
                                            className="w-full p-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="material-symbols-outlined">settings</span>
                                                Settings
                                            </span>
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Account Status */}
                                <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <span className="material-symbols-outlined">verified</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Account Status</h3>
                                            <p className="text-sm opacity-90">Verified Provider</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="opacity-90">Verification</span>
                                            <span className="font-bold">✓ Verified</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="opacity-90">Revenue Share</span>
                                            <span className="font-bold">85%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="opacity-90">Next Payout</span>
                                            <span className="font-bold">Dec 5, 2025</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notifications */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Notifications</h2>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">New Order Received</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">2 hours ago</p>
                                        </div>
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">Payment Processed</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">1 day ago</p>
                                        </div>
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-500">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">Review Received</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">2 days ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {deleteConfirm.show && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Service</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-6">
                                Are you sure you want to delete <span className="font-bold">"{deleteConfirm.serviceName}"</span>? This will permanently remove the service and all associated data.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm({ show: false, serviceId: null, serviceName: '' })}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteService}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deleting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Show introduction page for non-providers or not logged in users
    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-pink-100 pt-24 pb-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <div className="mb-8">
                            <span className="material-symbols-outlined text-8xl text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 mb-4">
                                business_center
                            </span>
                        </div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500 mb-4">
                            Become a Provider
                        </h1>
                        <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
                            Join our provider community and offer quality travel services to customers
                        </p>
                    </div>

                    {/* Benefits Section */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            Benefits of Becoming a Provider
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50">
                                <span className="material-symbols-outlined text-4xl text-rose-500 mb-3 block">
                                    monetization_on
                                </span>
                                <h3 className="font-bold text-gray-900 mb-2">Stable Income</h3>
                                <p className="text-sm text-gray-600">
                                    Earn income by providing quality travel services
                                </p>
                            </div>
                            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50">
                                <span className="material-symbols-outlined text-4xl text-cyan-500 mb-3 block">
                                    groups
                                </span>
                                <h3 className="font-bold text-gray-900 mb-2">Reach Customers</h3>
                                <p className="text-sm text-gray-600">
                                    Connect with thousands of potential customers on the platform
                                </p>
                            </div>
                            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
                                <span className="material-symbols-outlined text-4xl text-amber-500 mb-3 block">
                                    support_agent
                                </span>
                                <h3 className="font-bold text-gray-900 mb-2">24/7 Support</h3>
                                <p className="text-sm text-gray-600">
                                    Our support team is always ready to help you anytime
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl shadow-2xl p-8 mb-8 text-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div>
                                <div className="text-4xl font-extrabold mb-2">500+</div>
                                <div className="text-sm opacity-90">Active Providers</div>
                            </div>
                            <div>
                                <div className="text-4xl font-extrabold mb-2">10K+</div>
                                <div className="text-sm opacity-90">Happy Customers</div>
                            </div>
                            <div>
                                <div className="text-4xl font-extrabold mb-2">98%</div>
                                <div className="text-sm opacity-90">Satisfaction Rate</div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced CTA Section */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-100 to-blue-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10 text-center">
                            {!user ? (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                                            Ready to Start Your Journey?
                                        </h2>
                                        <p className="text-lg text-gray-600 mb-2 max-w-2xl mx-auto">
                                            Join hundreds of successful providers earning income while helping travelers discover amazing experiences
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Get started in just 2 minutes - No credit card required
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                                        <button
                                            onClick={() => navigate('/register')}
                                            className="group relative px-10 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-lg shadow-2xl hover:from-rose-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 hover:shadow-rose-500/50 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                rocket_launch
                                            </span>
                                            <span>Get Started Free</span>
                                            <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
                                        </button>
                                        <button
                                            onClick={() => navigate('/login')}
                                            className="px-10 py-4 bg-white text-rose-600 border-2 border-rose-500 rounded-full font-bold text-lg shadow-lg hover:bg-rose-50 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">
                                                login
                                            </span>
                                            <span>Sign In</span>
                                        </button>
                                    </div>

                                    {/* Trust indicators */}
                                    <div className="flex flex-wrap justify-center items-center gap-6 pt-6 text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-500 text-lg">
                                                verified
                                            </span>
                                            <span>Verified Providers</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-500 text-lg">
                                                security
                                            </span>
                                            <span>Secure Platform</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-purple-500 text-lg">
                                                support_agent
                                            </span>
                                            <span>24/7 Support</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                                            You're One Step Away!
                                        </h2>
                                        <p className="text-lg text-gray-600 mb-2 max-w-2xl mx-auto">
                                            Start offering your travel services and connect with thousands of travelers looking for unique experiences
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mb-4">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                                                Free registration
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                                                No setup fees
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                                                Instant approval
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate('/provider/register')}
                                        className="group relative px-12 py-5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 text-white rounded-full font-bold text-xl shadow-2xl hover:shadow-rose-500/50 transition-all duration-300 transform hover:scale-105 animate-pulse hover:animate-none flex items-center gap-3 mx-auto"
                                    >
                                        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></span>
                                        <span className="material-symbols-outlined text-2xl relative z-10">
                                            how_to_reg
                                        </span>
                                        <span className="relative z-10">Become a Provider Now</span>
                                        <span className="material-symbols-outlined text-xl relative z-10 group-hover:translate-x-1 transition-transform">
                                            arrow_forward
                                        </span>
                                    </button>

                                    {/* Additional info */}
                                    <div className="pt-4">
                                        <p className="text-sm text-gray-500">
                                            <span className="font-semibold text-gray-700">What happens next?</span> After registration, you'll receive an email with setup instructions and access to your provider dashboard.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Testimonials Section */}
                    <div className="mt-8">
                        <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
                            What Our Providers Say
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-rose-500">
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src="https://i.pravatar.cc/150?img=12"
                                        alt="Provider"
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <h4 className="font-bold text-gray-900">Nguyễn Văn A</h4>
                                        <p className="text-sm text-gray-500">Travel Guide Provider</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 italic">
                                    "Joining as a provider was the best decision! I've connected with amazing travelers and increased my income by 300% in just 3 months."
                                </p>
                                <div className="flex gap-1 mt-3">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="text-yellow-400 text-sm">★</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500">
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src="https://i.pravatar.cc/150?img=13"
                                        alt="Provider"
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <h4 className="font-bold text-gray-900">Trần Thị B</h4>
                                        <p className="text-sm text-gray-500">Accommodation Host</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 italic">
                                    "The platform is user-friendly and the support team is always helpful. My bookings have doubled since I started!"
                                </p>
                                <div className="flex gap-1 mt-3">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="text-yellow-400 text-sm">★</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProviderPage;

