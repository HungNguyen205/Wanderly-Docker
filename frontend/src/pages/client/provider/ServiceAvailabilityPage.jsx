import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';
import ConfirmationModal from '@/components/client/common/ConfirmationModal';
import { toast } from 'react-toastify';

const ServiceAvailabilityPage = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();

    const [service, setService] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, slot: null });
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

    // Filters
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        status: ''
    });

    // Form data for create/edit
    const [formData, setFormData] = useState({
        AvailabilityDate: '',
        StartTime: '08:00',
        EndTime: '17:00',
        Price: '',
        TotalUnits: 1,
        Status: 'open'
    });

    // Bulk create form
    const [bulkForm, setBulkForm] = useState({
        StartDate: '',
        EndDate: '',
        StartTime: '08:00',
        EndTime: '17:00',
        Price: '',
        TotalUnits: 1,
        ExcludeWeekends: false
    });

    const getAuthHeaders = () => {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    };

    // Load service details
    const loadService = useCallback(async () => {
        try {
            const res = await fetch(`/api/services/${serviceId}`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setService(data.data);
            } else {
                toast.error('Service not found');
                navigate('/provider');
            }
        } catch (error) {
            console.error('Error loading service:', error);
            toast.error('Failed to load service');
        }
    }, [serviceId, navigate]);

    // Load availability
    const loadAvailability = useCallback(async (page = 1) => {
        try {
            setLoadingAvailability(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });

            if (filters.fromDate) params.append('fromDate', filters.fromDate);
            if (filters.toDate) params.append('toDate', filters.toDate);
            if (filters.status) params.append('status', filters.status);

            const res = await fetch(`/api/service-availabilities/service/${serviceId}?${params}`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setAvailability(data.data.availability || []);
                setPagination(prev => ({
                    ...prev,
                    ...data.data.pagination
                }));
            }
        } catch (error) {
            console.error('Error loading availability:', error);
            toast.error('Failed to load availability');
        } finally {
            setLoadingAvailability(false);
        }
    }, [serviceId, filters, pagination.limit]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await loadService();
            await loadAvailability();
            setLoading(false);
        };
        init();
    }, [loadService]);

    useEffect(() => {
        if (!loading) {
            loadAvailability(pagination.page);
        }
    }, [filters]);

    // Create availability
    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.AvailabilityDate || !formData.Price || !formData.TotalUnits) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            const res = await fetch('/api/service-availabilities', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ServiceId: parseInt(serviceId),
                    ...formData,
                    Price: parseFloat(formData.Price),
                    TotalUnits: parseInt(formData.TotalUnits)
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('Availability slot created successfully');
                setShowCreateModal(false);
                resetForm();
                loadAvailability(pagination.page);
            } else {
                toast.error(data.message || 'Failed to create availability');
            }
        } catch (error) {
            console.error('Error creating availability:', error);
            toast.error('An error occurred');
        }
    };

    // Update availability
    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!editingSlot) return;

        try {
            const res = await fetch(`/api/service-availabilities/${editingSlot.AvailabilityId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    AvailabilityDate: formData.AvailabilityDate,
                    StartTime: formData.StartTime,
                    EndTime: formData.EndTime,
                    Price: parseFloat(formData.Price),
                    TotalUnits: parseInt(formData.TotalUnits),
                    Status: formData.Status
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('Availability updated successfully');
                setEditingSlot(null);
                setShowCreateModal(false);
                resetForm();
                loadAvailability(pagination.page);
            } else {
                toast.error(data.message || 'Failed to update availability');
            }
        } catch (error) {
            console.error('Error updating availability:', error);
            toast.error('An error occurred');
        }
    };

    // Delete availability - show confirmation modal
    const handleDelete = (slot) => {
        setDeleteModal({ show: true, slot });
    };

    // Confirm delete availability
    const confirmDelete = async () => {
        const slot = deleteModal.slot;
        if (!slot) return;

        try {
            const res = await fetch(`/api/service-availabilities/${slot.AvailabilityId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('Availability deleted successfully');
                loadAvailability(pagination.page);
            } else {
                toast.error(data.message || 'Failed to delete availability');
            }
        } catch (error) {
            console.error('Error deleting availability:', error);
            toast.error('An error occurred');
        }
    };

    // Bulk create
    const handleBulkCreate = async (e) => {
        e.preventDefault();

        if (!bulkForm.StartDate || !bulkForm.EndDate || !bulkForm.Price || !bulkForm.TotalUnits) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            const res = await fetch('/api/service-availabilities/bulk', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ServiceId: parseInt(serviceId),
                    ...bulkForm,
                    Price: parseFloat(bulkForm.Price),
                    TotalUnits: parseInt(bulkForm.TotalUnits)
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(data.message || `${data.data?.createdCount || 0} slots created successfully`);
                setShowBulkModal(false);
                resetBulkForm();
                loadAvailability(1);
            } else {
                toast.error(data.message || 'Failed to create availability slots');
            }
        } catch (error) {
            console.error('Error bulk creating:', error);
            toast.error('An error occurred');
        }
    };

    const resetForm = () => {
        setFormData({
            AvailabilityDate: '',
            StartTime: '08:00',
            EndTime: '17:00',
            Price: '',
            TotalUnits: 1,
            Status: 'open'
        });
    };

    const resetBulkForm = () => {
        setBulkForm({
            StartDate: '',
            EndDate: '',
            StartTime: '08:00',
            EndTime: '17:00',
            Price: '',
            TotalUnits: 1,
            ExcludeWeekends: false
        });
    };

    const openEditModal = (slot) => {
        setEditingSlot(slot);
        setFormData({
            AvailabilityDate: slot.AvailabilityDate?.split('T')[0] || '',
            StartTime: slot.StartTime || '08:00',
            EndTime: slot.EndTime || '17:00',
            Price: slot.Price?.toString() || '',
            TotalUnits: slot.TotalUnits || 1,
            Status: slot.Status || 'open'
        });
        setShowCreateModal(true);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';

        // If it's already in HH:mm or HH:mm:ss format (no date part)
        if (typeof timeStr === 'string' && timeStr.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
            return timeStr.substring(0, 5);
        }

        // If it's a datetime string (e.g., "1970-01-01T08:00:00.000Z" from SQL TIME)
        // Extract just the time part after 'T' and before any timezone indicator
        if (typeof timeStr === 'string' && timeStr.includes('T')) {
            const timePart = timeStr.split('T')[1];
            if (timePart) {
                // Remove timezone info (Z or +00:00) and get HH:mm
                const cleanTime = timePart.replace(/[Z+-].*$/, '');
                return cleanTime.substring(0, 5);
            }
        }

        // Fallback: return first 5 characters
        return timeStr.toString().substring(0, 5);
    };

    const formatPrice = (price) => {
        if (!price) return '0';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const getStatusBadge = (status) => {
        const styles = {
            open: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            closed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            full: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        };
        return styles[status] || styles.open;
    };

    // Generate hour and minute options for 24h format
    const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    // Helper to parse time string into hour and minute
    const parseTime = (timeStr) => {
        if (!timeStr) return { hour: '08', minute: '00' };
        const [hour, minute] = timeStr.split(':');
        return { hour: hour || '08', minute: minute || '00' };
    };

    // Helper to combine hour and minute into time string
    const combineTime = (hour, minute) => `${hour}:${minute}`;

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

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate(`/provider/services/${serviceId}`)}
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">arrow_back</span>
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Manage Availability
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {service?.Name || 'Service'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setEditingSlot(null); resetForm(); setShowCreateModal(true); }}
                                    className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-medium shadow hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    Add Slot
                                </button>
                                <button
                                    onClick={() => setShowBulkModal(true)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">date_range</span>
                                    Bulk Create
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
                                <input
                                    type="date"
                                    value={filters.fromDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
                                <input
                                    type="date"
                                    value={filters.toDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                    <option value="full">Full</option>
                                </select>
                            </div>
                            <button
                                onClick={() => setFilters({ fromDate: '', toDate: '', status: '' })}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">clear</span>
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Availability Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {loadingAvailability ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-4"></div>
                                <p className="text-gray-600 dark:text-gray-400">Loading availability...</p>
                            </div>
                        ) : availability.length === 0 ? (
                            <div className="p-12 text-center">
                                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                                    event_busy
                                </span>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">No availability slots found</p>
                                <button
                                    onClick={() => { setEditingSlot(null); resetForm(); setShowCreateModal(true); }}
                                    className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    Create First Slot
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">Date</th>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">Time</th>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">Price</th>
                                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">Capacity</th>
                                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">Booked</th>
                                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">Available</th>
                                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">Status</th>
                                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {availability.map((slot) => (
                                                <tr key={slot.AvailabilityId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                                                        {formatDate(slot.AvailabilityDate)}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                        {formatTime(slot.StartTime)} - {formatTime(slot.EndTime)}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-900 dark:text-white font-semibold">
                                                        {formatPrice(slot.Price)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                                        {slot.TotalUnits}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                                        {slot.BookedUnits || 0}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`font-bold ${(slot.TotalUnits - (slot.BookedUnits || 0)) > 0
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                            }`}>
                                                            {slot.TotalUnits - (slot.BookedUnits || 0)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusBadge(slot.Status)}`}>
                                                            {slot.Status?.charAt(0).toUpperCase() + slot.Status?.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openEditModal(slot)}
                                                                className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(slot)}
                                                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => loadAvailability(pagination.page - 1)}
                                                disabled={pagination.page <= 1}
                                                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => loadAvailability(pagination.page + 1)}
                                                disabled={pagination.page >= pagination.totalPages}
                                                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {editingSlot ? 'Edit Availability' : 'Add Availability Slot'}
                                </h2>
                                <button
                                    onClick={() => { setShowCreateModal(false); setEditingSlot(null); resetForm(); }}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <span className="material-symbols-outlined text-gray-500">close</span>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={editingSlot ? handleUpdate : handleCreate} className="p-6 space-y-4">
                            {/* Step 1: Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.AvailabilityDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, AvailabilityDate: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                    required
                                />
                            </div>
                            {/* Step 2: Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Start Time
                                    </label>
                                    <div className="flex gap-2 items-center">
                                        <select
                                            value={parseTime(formData.StartTime).hour}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                StartTime: combineTime(e.target.value, parseTime(prev.StartTime).minute)
                                            }))}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                        >
                                            {hourOptions.map(h => (
                                                <option key={`sh-${h}`} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <span className="text-gray-500 font-bold">:</span>
                                        <select
                                            value={parseTime(formData.StartTime).minute}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                StartTime: combineTime(parseTime(prev.StartTime).hour, e.target.value)
                                            }))}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                        >
                                            {minuteOptions.map(m => (
                                                <option key={`sm-${m}`} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        End Time
                                    </label>
                                    <div className="flex gap-2 items-center">
                                        <select
                                            value={parseTime(formData.EndTime).hour}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                EndTime: combineTime(e.target.value, parseTime(prev.EndTime).minute)
                                            }))}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                        >
                                            {hourOptions.map(h => (
                                                <option key={`eh-${h}`} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <span className="text-gray-500 font-bold">:</span>
                                        <select
                                            value={parseTime(formData.EndTime).minute}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                EndTime: combineTime(parseTime(prev.EndTime).hour, e.target.value)
                                            }))}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                        >
                                            {minuteOptions.map(m => (
                                                <option key={`em-${m}`} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            {/* Step 3: Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Price (VND) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formData.Price}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Allow empty or valid numbers
                                        if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                                            setFormData(prev => ({ ...prev, Price: value }));
                                        }
                                    }}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                    placeholder="e.g., 500000 or 3636363636"
                                    inputMode="numeric"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Total Units <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.TotalUnits}
                                    onChange={(e) => setFormData(prev => ({ ...prev, TotalUnits: parseInt(e.target.value) || 1 }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Number of bookings available for this time slot</p>
                            </div>
                            {editingSlot && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={formData.Status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, Status: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                    >
                                        <option value="open">Open</option>
                                        <option value="closed">Closed</option>
                                        <option value="full">Full</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); setEditingSlot(null); resetForm(); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                                >
                                    {editingSlot ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Create Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Bulk Create Availability
                                </h2>
                                <button
                                    onClick={() => { setShowBulkModal(false); resetBulkForm(); }}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <span className="material-symbols-outlined text-gray-500">close</span>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleBulkCreate} className="p-6 space-y-4">
                            {/* Step 1: Date Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Start Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={bulkForm.StartDate}
                                        onChange={(e) => setBulkForm(prev => ({ ...prev, StartDate: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        End Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={bulkForm.EndDate}
                                        onChange={(e) => setBulkForm(prev => ({ ...prev, EndDate: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                        required
                                    />
                                </div>
                            </div>
                            {/* Step 2: Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Start Time
                                    </label>
                                    <div className="flex gap-2 items-center">
                                        <select
                                            value={parseTime(bulkForm.StartTime).hour}
                                            onChange={(e) => setBulkForm(prev => ({
                                                ...prev,
                                                StartTime: combineTime(e.target.value, parseTime(prev.StartTime).minute)
                                            }))}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                        >
                                            {hourOptions.map(h => (
                                                <option key={`bsh-${h}`} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <span className="text-gray-500 font-bold">:</span>
                                        <select
                                            value={parseTime(bulkForm.StartTime).minute}
                                            onChange={(e) => setBulkForm(prev => ({
                                                ...prev,
                                                StartTime: combineTime(parseTime(prev.StartTime).hour, e.target.value)
                                            }))}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                        >
                                            {minuteOptions.map(m => (
                                                <option key={`bsm-${m}`} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        End Time
                                    </label>
                                    <div className="flex gap-2 items-center">
                                        <select
                                            value={parseTime(bulkForm.EndTime).hour}
                                            onChange={(e) => setBulkForm(prev => ({
                                                ...prev,
                                                EndTime: combineTime(e.target.value, parseTime(prev.EndTime).minute)
                                            }))}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                        >
                                            {hourOptions.map(h => (
                                                <option key={`beh-${h}`} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <span className="text-gray-500 font-bold">:</span>
                                        <select
                                            value={parseTime(bulkForm.EndTime).minute}
                                            onChange={(e) => setBulkForm(prev => ({
                                                ...prev,
                                                EndTime: combineTime(parseTime(prev.EndTime).hour, e.target.value)
                                            }))}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                        >
                                            {minuteOptions.map(m => (
                                                <option key={`bem-${m}`} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            {/* Step 3: Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Price (VND) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={bulkForm.Price}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Allow empty or valid numbers
                                        if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                                            setBulkForm(prev => ({ ...prev, Price: value }));
                                        }
                                    }}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                    placeholder="e.g., 500000 or 3636363636"
                                    inputMode="numeric"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Total Units per Day <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={bulkForm.TotalUnits}
                                    onChange={(e) => setBulkForm(prev => ({ ...prev, TotalUnits: parseInt(e.target.value) || 1 }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="excludeWeekends"
                                    checked={bulkForm.ExcludeWeekends}
                                    onChange={(e) => setBulkForm(prev => ({ ...prev, ExcludeWeekends: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                                />
                                <label htmlFor="excludeWeekends" className="text-sm text-gray-700 dark:text-gray-300">
                                    Exclude weekends (Saturday & Sunday)
                                </label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowBulkModal(false); resetBulkForm(); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                                >
                                    Create Slots
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, slot: null })}
                onConfirm={confirmDelete}
                title="Delete Availability"
                message={deleteModal.slot 
                    ? `Are you sure you want to delete the availability slot for ${formatDate(deleteModal.slot.AvailabilityDate)}? This action cannot be undone.`
                    : 'Are you sure you want to delete this availability slot?'
                }
                confirmText="Delete"
                cancelText="Cancel"
                isDanger={true}
                icon="trash"
            />
        </>
    );
};

export default ServiceAvailabilityPage;

