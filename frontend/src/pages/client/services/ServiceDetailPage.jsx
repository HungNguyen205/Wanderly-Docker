import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';
import ReviewsSection from '@/components/client/services/ReviewsSection';
import { toast } from 'react-toastify';
import {
    ChevronLeft, ChevronRight, MapPin, Star, Check, Building2, FileText,
    Hotel, Sparkles, MessageCircle, Heart, Minus, Plus,
    Calendar, Clock, Users, X, Maximize2, Image as ImageIcon, Loader2
} from 'lucide-react';

// Goong Map Configuration
const GOONG_MAP_KEY = import.meta.env.VITE_GOONG_MAP_KEY || '';

// Category images mapping
const categoryImages = {
    'accommodation': [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    ],
    'hotel': [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    ],
    'tour': [
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
        'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80',
    ],
    'restaurant': [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    ],
    'default': [
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    ]
};

// Helper to format time from various formats
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

const ServiceDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // States
    const [service, setService] = useState(null);
    const [serviceImages, setServiceImages] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [accommodation, setAccommodation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isBooking, setIsBooking] = useState(false);

    // Map refs
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    // Get current user ID
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                const userId = userData.UserId || userData.userId || userData.id;
                if (userId) {
                    setCurrentUserId(Number(userId)); // Ensure it's a number
                    console.log('Current User ID set:', Number(userId)); // Debug
                }
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        }
    }, []);

    // Load service details
    useEffect(() => {
        const loadService = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/services/${id}`);

                if (!response.ok) {
                    throw new Error('Service not found');
                }

                const data = await response.json();
                setService(data.data);

                // Load service images
                loadServiceImages();

                // Load availability
                loadAvailability();

                // Load accommodation if applicable
                const categoryName = (data.data?.ServiceTypeName || '').toLowerCase();
                if (categoryName.includes('accommodation') || categoryName.includes('hotel') || categoryName.includes('lưu trú')) {
                    loadAccommodation();
                }
            } catch (error) {
                console.error('Error loading service:', error);
                toast.error('Failed to load service');
                navigate('/services');
            } finally {
                setLoading(false);
            }
        };

        if (id) loadService();
    }, [id, navigate]);

    // Load service images
    const loadServiceImages = async () => {
        try {
            const response = await fetch(`/api/service-images/service/${id}`);
            if (response.ok) {
                const data = await response.json();
                setServiceImages(data.data || []);
            }
        } catch (error) {
            console.error('Error loading service images:', error);
        }
    };

    // Load availability
    const loadAvailability = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            const toDate = futureDate.toISOString().split('T')[0];

            const response = await fetch(
                `/api/service-availabilities/service/${id}?fromDate=${today}&toDate=${toDate}&status=open`
            );

            if (response.ok) {
                const data = await response.json();
                setAvailability(data.data?.availability || []);
            }
        } catch (error) {
            console.error('Error loading availability:', error);
        }
    };

    // Load accommodation details
    const loadAccommodation = async () => {
        try {
            const response = await fetch(`/api/service-accommodations/service/${id}`);
            if (response.ok) {
                const data = await response.json();
                setAccommodation(data.data);
            }
        } catch (error) {
            console.error('Error loading accommodation:', error);
        }
    };

    // Initialize map
    useEffect(() => {
        if (!service?.Latitude || !service?.Longitude || mapInstanceRef.current) return;

        const initMap = async () => {
            const waitForGoong = () => new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
                const check = () => {
                    if (window.goongjs) {
                        clearTimeout(timeout);
                        resolve(window.goongjs);
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });

            try {
                if (!document.querySelector('script[src*="goong-js"]')) {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js';
                    document.head.appendChild(script);

                    const css = document.createElement('link');
                    css.rel = 'stylesheet';
                    css.href = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css';
                    document.head.appendChild(css);
                }

                const goongjs = await waitForGoong();
                goongjs.accessToken = GOONG_MAP_KEY;

                if (!mapRef.current) return;

                const map = new goongjs.Map({
                    container: mapRef.current,
                    style: 'https://tiles.goong.io/assets/goong_map_web.json',
                    center: [service.Longitude, service.Latitude],
                    zoom: 15
                });

                new goongjs.Marker({ color: '#6366f1' })
                    .setLngLat([service.Longitude, service.Latitude])
                    .addTo(map);

                mapInstanceRef.current = map;
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [service?.Latitude, service?.Longitude]);

    // Get images - prioritize service images from database, fallback to category placeholders
    const getImages = () => {
        // If we have actual service images, use them
        if (serviceImages && serviceImages.length > 0) {
            return serviceImages.map(img => img.ImageUrl);
        }

        // Fallback to placeholder images based on category
        if (!service) return categoryImages.default;
        const categoryName = (service.ServiceTypeName || '').toLowerCase();
        for (const [key, images] of Object.entries(categoryImages)) {
            if (categoryName.includes(key)) return images;
        }
        return categoryImages.default;
    };

    // Render star rating
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
            />
        ));
    };

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // Format date
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    // Handle booking
    const handleBooking = () => {
        if (!selectedSlot) {
            toast.error('Please select an available date');
            return;
        }

        const user = localStorage.getItem('user');
        if (!user) {
            toast.info('Please login to book this service');
            navigate('/login');
            return;
        }

        setShowBookingModal(true);
    };

    // Confirm booking - Create booking + Add item
    const confirmBooking = async () => {
        if (isBooking) return; // Prevent double-click

        setIsBooking(true);
        try {
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            // Step 1: Create a new booking
            const createResponse = await fetch('/api/bookings', {
                method: 'POST',
                headers,
                body: JSON.stringify({})
            });

            if (!createResponse.ok) {
                const data = await createResponse.json();
                toast.error(data.message || 'Failed to create booking');
                setIsBooking(false);
                return;
            }

            const createData = await createResponse.json();
            const bookingId = createData.data.bookingId;

            // Step 2: Add item to booking
            const addItemResponse = await fetch(`/api/bookings/${bookingId}/items`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    serviceAvailabilityId: selectedSlot.AvailabilityId,
                    quantity: quantity
                })
            });

            if (!addItemResponse.ok) {
                const data = await addItemResponse.json();
                toast.error(data.message || 'Failed to add item to booking');
                setIsBooking(false);
                return;
            }

            toast.success(`Booking created! Code: ${createData.data.bookingCode} 🎉`);
            setShowBookingModal(false);
            loadAvailability();

            // Navigate to booking detail or my bookings page
            navigate(`/bookings/${bookingId}`);
        } catch (error) {
            console.error('Error booking:', error);
            toast.error('Booking failed. Please try again.');
            setIsBooking(false);
        }
    };

    // Get minimum price from availability
    const getMinPrice = () => {
        if (availability.length === 0) return null;
        return Math.min(...availability.map(a => a.Price));
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading service details...</p>
                    </div>
                </div>
            </>
        );
    }

    if (!service) return null;

    const images = getImages();
    const minPrice = getMinPrice();

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Image Gallery */}
                <div className="relative h-[50vh] md:h-[60vh] overflow-hidden group">
                    <img
                        src={images[activeImageIndex]}
                        alt={service.Name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                        onClick={() => setShowLightbox(true)}
                        onError={(e) => {
                            e.target.src = categoryImages.default[0];
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent pointer-events-none"></div>

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-24 left-4 md:left-8 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all group/btn"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover/btn:-translate-x-0.5 transition-transform" />
                    </button>

                    {/* Expand/Lightbox Button */}
                    <button
                        onClick={() => setShowLightbox(true)}
                        className="absolute top-24 right-4 md:right-8 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all"
                    >
                        <Maximize2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={() => setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    {/* Image Counter */}
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                        <span className="flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4" />
                            {activeImageIndex + 1} / {images.length}
                        </span>
                    </div>

                    {/* Image Thumbnails */}
                    {images.length > 1 && (
                        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90%] overflow-x-auto py-2 px-3 bg-black/30 backdrop-blur-sm rounded-xl">
                            {images.slice(0, 6).map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImageIndex(i)}
                                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === i
                                        ? 'border-white scale-110 shadow-lg'
                                        : 'border-transparent opacity-70 hover:opacity-100 hover:border-white/50'
                                        }`}
                                >
                                    <img
                                        src={img}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = categoryImages.default[0];
                                        }}
                                    />
                                </button>
                            ))}
                            {images.length > 6 && (
                                <button
                                    onClick={() => setShowLightbox(true)}
                                    className="flex-shrink-0 w-16 h-12 rounded-lg bg-black/50 text-white text-sm font-bold flex items-center justify-center hover:bg-black/70 transition-colors"
                                >
                                    +{images.length - 6}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Service Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
                        <div className="max-w-6xl mx-auto">
                            <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-full mb-3">
                                {service.ServiceTypeName}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">
                                {service.Name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-white/90">
                                <div className="flex items-center gap-1">
                                    {renderStars(service.AverageRating || 0)}
                                    <span className="ml-1 font-medium">
                                        {(service.AverageRating || 0).toFixed(1)}
                                    </span>
                                </div>
                                <span>•</span>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-5 h-5" />
                                    {service.LocationName}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Details */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Provider Info */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                                        <Building2 className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {service.CompanyName}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400">Service Provider</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-6 h-6 text-indigo-500" />
                                    About This Service
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                    {service.Description || 'No description available.'}
                                </p>
                            </div>

                            {/* Reviews Section */}
                            <ReviewsSection serviceId={id} currentUserId={currentUserId} />

                            {/* Accommodation Details */}
                            {accommodation && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Hotel className="w-6 h-6 text-indigo-500" />
                                        Accommodation Details
                                    </h2>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Type</p>
                                            <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                                {accommodation.AccommodationType}
                                            </p>
                                        </div>
                                        {accommodation.StarRating && (
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rating</p>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(accommodation.StarRating)].map((_, i) => (
                                                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                    ))}
                                                    <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                                        {accommodation.StarRating} Stars
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {accommodation.Amenities && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Amenities</p>
                                            <div className="flex flex-wrap gap-2">
                                                {accommodation.Amenities.split(',').map((amenity, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium"
                                                    >
                                                        {amenity.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Features */}
                            {service.features && service.features.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Sparkles className="w-6 h-6 text-indigo-500" />
                                        Features
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {service.features.map((feature, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl"
                                            >
                                                <Check className="w-5 h-5 text-green-500" />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {feature.FeatureName || feature.Name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Location Map */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <MapPin className="w-6 h-6 text-indigo-500" />
                                    Location
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {service.Address}
                                </p>
                                <div
                                    ref={mapRef}
                                    className="h-64 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700"
                                />
                            </div>
                        </div>

                        {/* Right Column - Booking */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                                    {/* Price */}
                                    <div className="mb-6">
                                        {minPrice ? (
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Starting from</p>
                                                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                                    {formatPrice(minPrice)}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400">Contact for pricing</p>
                                        )}
                                    </div>

                                    {/* Available Dates */}
                                    <div className="mb-6">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Select Date
                                        </label>
                                        {availability.length > 0 ? (
                                            <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
                                                {availability.slice(0, 10).map((slot) => {
                                                    const availableUnits = slot.TotalUnits - slot.BookedUnits;
                                                    const isSelected = selectedSlot?.AvailabilityId === slot.AvailabilityId;

                                                    return (
                                                        <button
                                                            key={slot.AvailabilityId}
                                                            onClick={() => setSelectedSlot(slot)}
                                                            className={`w-full p-3 rounded-xl text-left transition-all ${isSelected
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className={`font-medium ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                                        {formatDate(slot.AvailabilityDate)}
                                                                    </p>
                                                                    <p className={`text-xs flex items-center gap-1 mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                        <Clock className="w-3 h-3" />
                                                                        {formatTime(slot.StartTime)} - {formatTime(slot.EndTime) || 'Flexible'}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`font-bold ${isSelected ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                                        {formatPrice(slot.Price)}
                                                                    </p>
                                                                    <p className={`text-xs flex items-center gap-1 justify-end ${isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                        <Users className="w-3 h-3" />
                                                                        {availableUnits} left
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400 text-sm p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center mt-2">
                                                No availability at the moment
                                            </p>
                                        )}
                                    </div>

                                    {/* Quantity */}
                                    {selectedSlot && (
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Quantity
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="text-xl font-bold text-gray-900 dark:text-white w-12 text-center">
                                                    {quantity}
                                                </span>
                                                <button
                                                    onClick={() => setQuantity(Math.min(selectedSlot.TotalUnits - selectedSlot.BookedUnits, quantity + 1))}
                                                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Total */}
                                    {selectedSlot && (
                                        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600 dark:text-gray-300">Total</span>
                                                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                                    {formatPrice(selectedSlot.Price * quantity)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Book Button */}
                                    <button
                                        onClick={handleBooking}
                                        disabled={!selectedSlot || isBooking}
                                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isBooking ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <span>{selectedSlot ? 'Book Now' : 'Select a Date'}</span>
                                        )}
                                    </button>

                                    {/* Contact */}
                                    <div className="mt-4 flex gap-2">
                                        <button className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                                            <MessageCircle className="w-5 h-5" />
                                            Contact
                                        </button>
                                        <button className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                                            <Heart className="w-5 h-5" />
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Booking Confirmation Modal */}
                {showBookingModal && selectedSlot && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4">
                            <div className="fixed inset-0 bg-black/50" onClick={() => setShowBookingModal(false)} />

                            <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                                <button
                                    onClick={() => setShowBookingModal(false)}
                                    className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>

                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    Confirm Booking
                                </h3>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400">Service</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{service.Name}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                            <Calendar className="w-4 h-4" /> Date
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">{formatDate(selectedSlot.AvailabilityDate)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                            <Clock className="w-4 h-4" /> Time
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatTime(selectedSlot.StartTime)} - {formatTime(selectedSlot.EndTime) || 'Flexible'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                            <Users className="w-4 h-4" /> Quantity
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">{quantity}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-600 dark:text-gray-400">Total</span>
                                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                            {formatPrice(selectedSlot.Price * quantity)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowBookingModal(false)}
                                        disabled={isBooking}
                                        className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmBooking}
                                        disabled={isBooking}
                                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isBooking ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <span>Confirm Booking</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Lightbox */}
                {showLightbox && (
                    <div
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                        onClick={(e) => {
                            // Close when clicking backdrop
                            if (e.target === e.currentTarget) setShowLightbox(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setShowLightbox(false);
                            if (e.key === 'ArrowLeft') setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
                            if (e.key === 'ArrowRight') setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
                        }}
                        tabIndex={0}
                        autoFocus
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowLightbox(false)}
                            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Image Counter & Caption */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
                            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                                {activeImageIndex + 1} / {images.length}
                            </div>
                            {serviceImages[activeImageIndex]?.Caption && (
                                <p className="mt-2 text-white/80 text-sm max-w-md">
                                    {serviceImages[activeImageIndex].Caption}
                                </p>
                            )}
                        </div>

                        {/* Keyboard Hint */}
                        <div className="absolute top-4 left-4 hidden md:flex items-center gap-2 text-white/50 text-xs">
                            <span className="px-2 py-1 bg-white/10 rounded">←</span>
                            <span className="px-2 py-1 bg-white/10 rounded">→</span>
                            <span className="ml-1">to navigate</span>
                            <span className="px-2 py-1 bg-white/10 rounded ml-2">ESC</span>
                            <span>to close</span>
                        </div>

                        {/* Main Image */}
                        <div
                            className="relative w-full h-full flex items-center justify-center p-4 md:p-16 cursor-zoom-out"
                            onClick={() => setShowLightbox(false)}
                        >
                            <img
                                src={images[activeImageIndex]}
                                alt={service?.Name}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default"
                                onClick={(e) => e.stopPropagation()}
                                onError={(e) => {
                                    e.target.src = categoryImages.default[0];
                                }}
                            />
                        </div>

                        {/* Navigation Arrows */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors hover:scale-110"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button
                                    onClick={() => setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors hover:scale-110"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        {/* Thumbnail Strip */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90%] overflow-x-auto py-3 px-4 bg-white/10 backdrop-blur-sm rounded-xl">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImageIndex(i)}
                                    className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === i
                                        ? 'border-white scale-110'
                                        : 'border-transparent opacity-50 hover:opacity-100'
                                        }`}
                                >
                                    <img
                                        src={img}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = categoryImages.default[0];
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ServiceDetailPage;
