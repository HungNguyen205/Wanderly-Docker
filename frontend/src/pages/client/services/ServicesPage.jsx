import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';
import { toast } from 'react-toastify';
import {
    Search, X, MapPin, Star, ChevronRight, ChevronLeft,
    Hotel, Map, Car, UtensilsCrossed, Ticket, Drama, Sparkles,
    SearchX, Building2
} from 'lucide-react';

// Service category icons mapping with Lucide components
const categoryIconsMap = {
    'accommodation': Hotel,
    'hotel': Hotel,
    'lưu trú': Hotel,
    'tour': Map,
    'transportation': Car,
    'vận chuyển': Car,
    'restaurant': UtensilsCrossed,
    'nhà hàng': UtensilsCrossed,
    'activity': Ticket,
    'hoạt động': Ticket,
    'entertainment': Drama,
    'giải trí': Drama,
    'spa': Sparkles,
    'default': Sparkles
};

// Beautiful placeholder images for services
const categoryImages = {
    'accommodation': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    'hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    'lưu trú': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    'tour': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
    'transportation': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
    'vận chuyển': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    'nhà hàng': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    'activity': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
    'hoạt động': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
    'entertainment': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    'giải trí': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    'spa': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80'
};

const ServicesPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // States
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });

    // Filters
    const [searchKeyword, setSearchKeyword] = useState(searchParams.get('keyword') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');

    // Load categories and locations
    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [categoriesRes, locationsRes] = await Promise.all([
                    fetch('/api/categories').catch(() => null),
                    fetch('/api/locations?limit=100').catch(() => null)
                ]);

                if (categoriesRes?.ok) {
                    const data = await categoriesRes.json();
                    setCategories(data.data || []);
                }

                if (locationsRes?.ok) {
                    const data = await locationsRes.json();
                    setLocations(data.data?.locations || data.data || []);
                }
            } catch (error) {
                console.error('Error loading filters:', error);
            }
        };
        loadFilters();
    }, []);

    // Load services
    const loadServices = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '12');

            if (searchKeyword) params.set('keyword', searchKeyword);
            if (selectedCategory) params.set('categoryId', selectedCategory);
            if (selectedLocation) params.set('locationId', selectedLocation);

            const response = await fetch(`/api/services?${params.toString()}`);

            if (response.ok) {
                const data = await response.json();
                setServices(data.data?.services || []);
                setPagination(data.data?.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
            } else {
                toast.error('Failed to load services');
            }
        } catch (error) {
            console.error('Error loading services:', error);
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    }, [searchKeyword, selectedCategory, selectedLocation]);

    useEffect(() => {
        loadServices(1);
    }, [selectedCategory, selectedLocation]);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        loadServices(1);

        // Update URL params
        const params = new URLSearchParams();
        if (searchKeyword) params.set('keyword', searchKeyword);
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedLocation) params.set('location', selectedLocation);
        setSearchParams(params);
    };

    // Clear filters
    const clearFilters = () => {
        setSearchKeyword('');
        setSelectedCategory('');
        setSelectedLocation('');
        setSearchParams({});
        loadServices(1);
    };

    // Get category icon component
    const getCategoryIcon = (categoryName, className = "w-4 h-4") => {
        const name = (categoryName || '').toLowerCase();
        for (const [key, IconComponent] of Object.entries(categoryIconsMap)) {
            if (name.includes(key)) {
                return <IconComponent className={className} />;
            }
        }
        return <Sparkles className={className} />;
    };

    // Get category image (fallback)
    const getCategoryImage = (categoryName) => {
        const name = (categoryName || '').toLowerCase();
        for (const [key, url] of Object.entries(categoryImages)) {
            if (name.includes(key)) return url;
        }
        return categoryImages.default;
    };

    // Get service image - prioritize PrimaryImageUrl from API
    const getServiceImage = (service) => {
        if (service.PrimaryImageUrl) return service.PrimaryImageUrl;
        const categoryName = service.ServiceTypeName || service.CategoryName || '';
        return getCategoryImage(categoryName);
    };

    // Render star rating
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
            />
        ));
    };

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
                        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
                        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="relative pt-28 pb-16 px-4">
                        <div className="max-w-6xl mx-auto text-center">
                            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-4">
                                Discover Amazing Services
                            </h1>
                            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                                Explore top-rated hotels, tours, restaurants and more. Your perfect travel experience awaits!
                            </p>

                            {/* Search Bar */}
                            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
                                <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-2xl shadow-indigo-500/10">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchKeyword}
                                            onChange={(e) => setSearchKeyword(e.target.value)}
                                            placeholder="Search services, destinations..."
                                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                                    >
                                        <Search className="w-5 h-5" />
                                        Search
                                    </button>
                                </div>
                            </form>

                            {/* Quick Category Pills */}
                            <div className="flex flex-wrap justify-center gap-2 mt-8">
                                {categories.slice(0, 6).map((cat) => {
                                    const catId = cat.CategoryID || cat.CategoryId || cat.id;
                                    const catName = cat.ServiceTypeName || cat.Name || cat.name;
                                    const isSelected = selectedCategory == catId;
                                    return (
                                        <button
                                            key={catId}
                                            onClick={() => setSelectedCategory(isSelected ? '' : catId.toString())}
                                            className={`px-5 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 flex items-center gap-2 ${isSelected
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 shadow-md'
                                                }`}
                                        >
                                            {getCategoryIcon(catName, "w-4 h-4")}
                                            {catName}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 pb-16">
                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg">
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">
                                {loading ? 'Loading...' : `${pagination.total} services found`}
                            </span>

                            {/* Location Filter */}
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="pl-9 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 border-0 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                                >
                                    <option value="">All Locations</option>
                                    {locations.map((loc) => {
                                        const locId = loc.LocationId || loc.locationId || loc.id;
                                        const locName = loc.Name || loc.name;
                                        return (
                                            <option key={locId} value={locId}>
                                                {locName}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {(searchKeyword || selectedCategory || selectedLocation) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Services Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg animate-pulse">
                                    <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="p-5 space-y-3">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : services.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                <SearchX className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">No services found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or search terms</p>
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {services.map((service) => {
                                const serviceId = service.ServiceId || service.serviceId || service.id;
                                const serviceName = service.Name || service.name;
                                const serviceDesc = service.Description || service.description || '';
                                const categoryName = service.ServiceTypeName || service.CategoryName || '';
                                const locationName = service.LocationName || '';
                                const companyName = service.CompanyName || '';
                                const rating = service.AverageRating || 0;

                                return (
                                    <div
                                        key={serviceId}
                                        onClick={() => navigate(`/services/${serviceId}`)}
                                        className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
                                    >
                                        {/* Image */}
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={getServiceImage(service)}
                                                alt={serviceName}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => {
                                                    e.target.src = getCategoryImage(categoryName);
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                                            {/* Category Badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className="px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                                    {getCategoryIcon(categoryName, "w-3.5 h-3.5")}
                                                    {categoryName}
                                                </span>
                                            </div>

                                            {/* Rating Badge */}
                                            {rating > 0 && (
                                                <div className="absolute top-3 right-3">
                                                    <span className="px-2.5 py-1 bg-amber-400 rounded-lg text-xs font-bold text-gray-900 flex items-center gap-1">
                                                        <Star className="w-3.5 h-3.5 fill-current" />
                                                        {rating.toFixed(1)}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Location on image */}
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <p className="text-white text-sm font-medium flex items-center gap-1.5 drop-shadow-lg">
                                                    <MapPin className="w-4 h-4" />
                                                    {locationName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {serviceName}
                                            </h3>

                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 min-h-[40px]">
                                                {serviceDesc || 'Discover this amazing service and enjoy your travel experience.'}
                                            </p>

                                            {/* Provider */}
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                                                        <Building2 className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                                                        {companyName || 'Provider'}
                                                    </span>
                                                </div>

                                                <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1 group/btn">
                                                    View
                                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-12">
                            <button
                                onClick={() => loadServices(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md flex items-center gap-1"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>

                            <div className="flex items-center gap-1">
                                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.page >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = pagination.page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => loadServices(pageNum)}
                                            className={`w-10 h-10 rounded-xl font-medium transition-all ${pagination.page === pageNum
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => loadServices(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md flex items-center gap-1"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </>
    );
};

export default ServicesPage;
