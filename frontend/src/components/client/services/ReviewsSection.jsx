import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Edit2, Trash2, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { getDefaultAvatar } from '@/utils/avatar';
import ConfirmationModal from '@/components/client/common/ConfirmationModal';

const ReviewsSection = ({ serviceId, currentUserId }) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [hasBooked, setHasBooked] = useState(false);
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        reviewId: null,
        onConfirm: null
    });

    // Debug: Log currentUserId when it changes
    useEffect(() => {
        console.log('ReviewsSection - currentUserId:', currentUserId, 'Type:', typeof currentUserId);
    }, [currentUserId]);

    // Form state
    const [formData, setFormData] = useState({
        rating: 5,
        title: '',
        comment: ''
    });

    // Load reviews and stats
    useEffect(() => {
        if (serviceId) {
            loadReviews();
            loadStats();
            if (currentUserId) {
                checkUserReview();
                checkUserBooking();
            }
        }
    }, [serviceId, page, currentUserId]);

    const loadReviews = async () => {
        try {
            const response = await fetch(`/api/reviews/service/${serviceId}?page=${page}&limit=10`);
            const data = await response.json();

            if (data.success) {
                setReviews(data.data.reviews);
                setTotalPages(data.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await fetch(`/api/reviews/service/${serviceId}/stats`);
            const data = await response.json();

            if (data.success) {
                setStats(data.data.stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const checkUserReview = async () => {
        if (!currentUserId) return;

        try {
            const response = await fetch(`/api/reviews/user/${currentUserId}?page=1&limit=100`);
            const data = await response.json();

            if (data.success) {
                const userReview = data.data.reviews.find(r => r.ServiceId === parseInt(serviceId));
                if (userReview) {
                    setHasReviewed(true);
                    setEditingReview(userReview);
                }
            }
        } catch (error) {
            console.error('Error checking user review:', error);
        }
    };

    const checkUserBooking = async () => {
        if (!currentUserId) return;

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/bookings/my?page=1&limit=100', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                // Check if user has any confirmed or completed bookings for this service
                const hasBooking = data.data.bookings.some(booking => {
                    if (booking.Status !== 'confirmed' && booking.Status !== 'completed') {
                        return false;
                    }
                    // We need to check booking items, but we don't have serviceId in booking list
                    // So we'll check when user tries to submit review
                    return true;
                });
                // For now, we'll check on submit. Set hasBooked based on a more detailed check
                // We'll rely on backend validation
            }
        } catch (error) {
            console.error('Error checking user booking:', error);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!currentUserId) {
            toast.error('Please login to submit a review');
            return;
        }

        console.log('Current User ID:', currentUserId); // Debug log

        if (!formData.rating) {
            toast.error('Please select a rating');
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem('accessToken');

            const url = editingReview
                ? `/api/reviews/${editingReview.ReviewId}`
                : '/api/reviews';

            const method = editingReview ? 'PUT' : 'POST';

            const body = editingReview
                ? { rating: formData.rating, title: formData.title, comment: formData.comment }
                : { serviceId: parseInt(serviceId), rating: formData.rating, title: formData.title, comment: formData.comment };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.message && data.message.includes('must book')) {
                    toast.error('You must book and use this service before you can review it.');
                } else {
                    toast.error(data.message || 'Failed to submit review');
                }
                return;
            }

            toast.success(editingReview ? 'Review updated successfully' : 'Review submitted successfully');
            setShowReviewForm(false);
            setFormData({ rating: 5, title: '', comment: '' });
            setEditingReview(null);
            setHasReviewed(true);
            loadReviews();
            loadStats();
            checkUserReview();
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDeleteReview = async (reviewId) => {
        setDeleteModal({ isOpen: false, reviewId: null, onConfirm: null });

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Failed to delete review');
                return;
            }

            toast.success('Review deleted successfully');
            setHasReviewed(false);
            setEditingReview(null);
            loadReviews();
            loadStats();
            checkUserReview();
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error('Failed to delete review');
        }
    };

    const handleDeleteReview = (reviewId) => {
        setDeleteModal({
            isOpen: true,
            reviewId,
            onConfirm: () => confirmDeleteReview(reviewId)
        });
    };

    const handleEditClick = (review) => {
        setEditingReview(review);
        setFormData({
            rating: review.Rating,
            title: review.Title || '',
            comment: review.Comment || ''
        });
        setShowReviewForm(true);
    };

    const renderStars = (rating, interactive = false, onRatingChange = null) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => interactive && onRatingChange && onRatingChange(star)}
                        className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                        disabled={!interactive}
                    >
                        <Star
                            className={`w-5 h-5 ${star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                                }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="space-y-4">
                        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-indigo-500" />
                    Reviews
                    {stats && (
                        <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                            ({stats.TotalReviews || 0})
                        </span>
                    )}
                </h2>
                {!hasReviewed && !showReviewForm && (
                    <button
                        onClick={() => {
                            if (!currentUserId) {
                                toast.info('Please login to write a review');
                                return;
                            }
                            setShowReviewForm(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Write a Review
                    </button>
                )}
            </div>

            {/* Stats Summary */}
            {stats && stats.TotalReviews > 0 && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                            {renderStars(Math.round(stats.AverageRating || 0))}
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {(stats.AverageRating || 0).toFixed(1)}
                            </span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400">
                            Based on {stats.TotalReviews} {stats.TotalReviews === 1 ? 'review' : 'reviews'}
                        </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = stats[`Rating${rating}`] || 0;
                            const percentage = stats.TotalReviews > 0 ? (count / stats.TotalReviews) * 100 : 0;
                            return (
                                <div key={rating} className="flex items-center gap-2">
                                    <span className="text-gray-600 dark:text-gray-400 w-4">{rating}</span>
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-gray-500 dark:text-gray-400 w-8 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        {editingReview ? 'Edit Your Review' : 'Write a Review'}
                    </h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Rating *
                            </label>
                            {renderStars(formData.rating, true, (rating) => setFormData({ ...formData, rating }))}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Give your review a title (optional)"
                                maxLength={200}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Comment
                            </label>
                            <textarea
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                placeholder="Share your experience (optional)"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowReviewForm(false);
                                    setFormData({ rating: 5, title: '', comment: '' });
                                    setEditingReview(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        No reviews yet. Be the first to review this service!
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <div key={review.ReviewId} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {review.UserAvatar ? (
                                        <img
                                            src={review.UserAvatar}
                                            alt={review.UserName}
                                            className="w-full h-full rounded-full object-cover"
                                            onError={(e) => {
                                                e.target.src = getDefaultAvatar(review.UserName);
                                            }}
                                        />
                                    ) : (
                                        <User className="w-6 h-6" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {review.UserName}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(review.CreatedAt)}
                                            </p>
                                        </div>
                                        {currentUserId && review.UserId === currentUserId && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditClick(review)}
                                                    className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                    title="Edit review"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReview(review.ReviewId)}
                                                    className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                    title="Delete review"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-2">
                                        {renderStars(review.Rating)}
                                    </div>
                                    {review.Title && (
                                        <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                                            {review.Title}
                                        </h5>
                                    )}
                                    {review.Comment && (
                                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                                            {review.Comment}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                    <button
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, reviewId: null, onConfirm: null })}
                onConfirm={deleteModal.onConfirm}
                title="Delete review?"
                message="This review will be permanently deleted and cannot be recovered. Are you sure you want to continue?"
                confirmText="Delete"
                cancelText="Cancel"
                isDanger={true}
            />
        </div>
    );
};

export default ReviewsSection;

