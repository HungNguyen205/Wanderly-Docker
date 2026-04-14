import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';
import { toast } from 'react-toastify';

// Goong.io Map Configuration
// Load from environment variables for security
const GOONG_MAP_KEY = import.meta.env.VITE_GOONG_MAP_KEY || '';
const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY || '';
const GOONG_REVERSE_GEOCODE_ENDPOINT = import.meta.env.VITE_GOONG_REVERSE_GEOCODE_ENDPOINT || 'https://rsapi.goong.io/Geocode';

// Validate that API keys are loaded
if (!GOONG_MAP_KEY || !GOONG_API_KEY) {
    console.warn('⚠️ Goong.io API keys are missing. Please check your .env file.');
}

const CreateService = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [features, setFeatures] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // Form Data
    const [formData, setFormData] = useState({
        // Basic Info
        Name: '',
        CategoryID: '',
        Description: '',

        // Location & Map
        LocationId: '',
        Address: '',
        Latitude: 16.0544, // Default: Da Nang
        Longitude: 108.2021,

        // Features
        FeatureIds: [],
    });

    const [mapPosition, setMapPosition] = useState([16.0544, 108.2021]);
    const [mapZoom, setMapZoom] = useState(15);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [locationSearchQuery, setLocationSearchQuery] = useState('');
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [filteredLocations, setFilteredLocations] = useState([]);

    // Refs for Goong map
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const geocoderRef = useRef(null);
    const scriptsLoadedRef = useRef({ goongjs: false, geocoder: false });

    // Load Goong Maps and Geocoder scripts dynamically
    useEffect(() => {
        // Load CSS for goong-js
        const existingCSS = document.querySelector('link[href*="goong-js.css"]');
        if (!existingCSS) {
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css';
            document.head.appendChild(cssLink);
        }

        // Load goong-js script
        const existingGoongScript = document.querySelector('script[src*="goong-js.js"]');
        if (!existingGoongScript && !scriptsLoadedRef.current.goongjs) {
            const goongScript = document.createElement('script');
            goongScript.src = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js';
            goongScript.async = true;
            goongScript.defer = true;
            goongScript.onload = () => {
                scriptsLoadedRef.current.goongjs = true;
                console.log('Goong Maps script loaded');
            };
            goongScript.onerror = () => {
                console.error('Failed to load Goong Maps script');
                toast.error('Failed to load map library. Please check your internet connection.');
            };
            document.head.appendChild(goongScript);
        } else if (existingGoongScript) {
            scriptsLoadedRef.current.goongjs = true;
        }

        // Load CSS for goong-geocoder
        const existingGeocoderCSS = document.querySelector('link[href*="goong-geocoder.css"]');
        if (!existingGeocoderCSS) {
            const geocoderCSS = document.createElement('link');
            geocoderCSS.rel = 'stylesheet';
            geocoderCSS.href = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-geocoder/dist/goong-geocoder.css';
            document.head.appendChild(geocoderCSS);
        }

        // Load goong-geocoder script
        const existingGeocoderScript = document.querySelector('script[src*="goong-geocoder"]');
        if (!existingGeocoderScript && !scriptsLoadedRef.current.geocoder) {
            const geocoderScript = document.createElement('script');
            geocoderScript.src = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-geocoder/dist/goong-geocoder.min.js';
            geocoderScript.async = true;
            geocoderScript.defer = true;
            geocoderScript.onload = () => {
                scriptsLoadedRef.current.geocoder = true;
                console.log('Goong Geocoder script loaded');
            };
            geocoderScript.onerror = () => {
                console.error('Failed to load Goong Geocoder script');
                toast.error('Failed to load geocoder library.');
            };
            document.head.appendChild(geocoderScript);
        } else if (existingGeocoderScript) {
            scriptsLoadedRef.current.geocoder = true;
        }
    }, []);

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    // Filter locations based on search query
    useEffect(() => {
        if (!locationSearchQuery.trim()) {
            setFilteredLocations(locations);
            return;
        }

        const query = locationSearchQuery.toLowerCase().trim();
        const filtered = locations.filter(loc => {
            const name = (loc.Name || loc.name || '').toLowerCase();
            const city = (loc.City || loc.city || '').toLowerCase();
            return name.includes(query) || city.includes(query);
        });

        setFilteredLocations(filtered);
    }, [locationSearchQuery, locations]);

    // Initialize filtered locations when locations load
    useEffect(() => {
        if (locations.length > 0 && filteredLocations.length === 0) {
            setFilteredLocations(locations);
        }
    }, [locations]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showLocationDropdown) {
                const dropdown = event.target.closest('[class*="z-\\[100\\]"]');
                if (!dropdown) {
                    setShowLocationDropdown(false);
                    setLocationSearchQuery('');
                }
            }
        };
        if (showLocationDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showLocationDropdown]);

    // Reverse geocoding: Get address from coordinates
    const handleReverseGeocode = useCallback(async (lat, lng) => {
        try {
            const params = new URLSearchParams({
                latlng: `${lat},${lng}`,
                api_key: GOONG_API_KEY,
            });

            const response = await fetch(`${GOONG_REVERSE_GEOCODE_ENDPOINT}?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error_message) {
                throw new Error(data.error_message || 'Goong.io API error');
            }

            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                const displayAddress = result.formatted_address || '';

                if (displayAddress) {
                    // Update formData with the address
                    setFormData(prev => ({
                        ...prev,
                        Address: displayAddress,
                    }));
                    toast.success('Address retrieved from map location');
                }
            } else {
                toast.info('Could not find address for this location');
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            toast.error('Failed to retrieve address. Please enter manually.');
        }
    }, []);

    // Initialize Goong Map (only once when step 2 is reached)
    useEffect(() => {
        if (currentStep !== 2 || !mapRef.current || mapInstanceRef.current) {
            if (currentStep !== 2) setMapInitialized(false);
            return;
        }

        // helper: check for goongjs and GoongGeocoder globals
        const waitForGoong = (timeoutMs = 15000, interval = 150) =>
            new Promise((resolve, reject) => {
                const start = Date.now();
                (function tick() {
                    // Check for goongjs and GoongGeocoder
                    const goongjs = window.goongjs;
                    const GoongGeocoder = window.GoongGeocoder;

                    // Check if both are available
                    if (goongjs && typeof goongjs.Map === 'function' && GoongGeocoder) {
                        console.log('Goong Maps API (goongjs) and Geocoder found');
                        return resolve({ goongjs, GoongGeocoder });
                    }

                    // Log progress for debugging
                    const elapsed = Date.now() - start;
                    if (elapsed % 2000 < interval) {
                        console.log(`Waiting for Goong Maps API... (${Math.round(elapsed / 1000)}s)`);
                        console.log('window.goongjs:', typeof window.goongjs);
                        console.log('window.GoongGeocoder:', typeof window.GoongGeocoder);
                    }

                    if (Date.now() - start > timeoutMs) {
                        console.error('Goong Maps API not found after timeout');
                        console.error('Available globals:', Object.keys(window).filter(k => k.toLowerCase().includes('goong')));
                        return reject(new Error('Goong JS not available after timeout'));
                    }
                    setTimeout(tick, interval);
                })();
            });

        let cancelled = false;
        let createdMap = null;
        let createdMarker = null;

        const init = async () => {
            try {
                const { goongjs, GoongGeocoder } = await waitForGoong(15000, 150);
                if (cancelled) return;

                // Set access token (required for goongjs) - use MAP_KEY
                goongjs.accessToken = GOONG_MAP_KEY;

                // IMPORTANT: Goong expects center as [lng, lat]
                // your mapPosition state was [lat, lng] — convert to [lng, lat]
                const [lat, lng] = mapPosition;
                const center = [lng, lat];

                // Create map using goongjs.Map (as per official docs)
                createdMap = new goongjs.Map({
                    container: mapRef.current,               // element
                    style: 'https://tiles.goong.io/assets/goong_map_web.json', // stylesheet location
                    center,                                  // starting position [lng, lat]
                    zoom: mapZoom || 15                      // starting zoom
                });

                mapInstanceRef.current = createdMap;
                setMapInitialized(true);

                // Create Geocoder control
                const geocoder = new GoongGeocoder({
                    accessToken: GOONG_API_KEY, // Use API_KEY for geocoder
                    goongjs: goongjs,
                    marker: false, // We'll use our own marker
                    placeholder: 'Nhập địa chỉ...'
                });

                // Add geocoder to map
                createdMap.addControl(geocoder, 'top-left');
                geocoderRef.current = geocoder;

                // Create marker
                createdMarker = new goongjs.Marker({
                    color: 'red',
                    draggable: true
                })
                    .setLngLat(center)
                    .addTo(createdMap);

                markerRef.current = createdMarker;

                // Handle geocoder result
                geocoder.on('result', (e) => {
                    const coord = e.result.geometry.coordinates; // [lng, lat]
                    const [lngResult, latResult] = coord;

                    // Update state (keep as [lat, lng])
                    const newPos = [latResult, lngResult];
                    setMapPosition(newPos);

                    // Update marker position
                    createdMarker.setLngLat(coord);

                    // Update form data
                    const address = e.result.properties?.formatted_address || e.result.place_name || '';
                    setFormData(prev => ({
                        ...prev,
                        Address: address,
                        Latitude: latResult,
                        Longitude: lngResult,
                    }));

                    // Fly to location
                    createdMap.flyTo({ center: coord, zoom: 16 });

                    toast.success('Địa chỉ đã được cập nhật');
                });

                // marker dragend -> update position
                createdMarker.on('dragend', (e) => {
                    const lngLat = e.target.getLngLat();
                    const newPos = [lngLat.lat, lngLat.lng]; // keep component state as [lat, lng]
                    setMapPosition(newPos);
                    handleReverseGeocode(lngLat.lat, lngLat.lng);
                });

                // map click => update marker & reverse geocode
                createdMap.on('click', (e) => {
                    const lngLat = e.lngLat;
                    if (!lngLat) return;

                    const newPos = [lngLat.lat, lngLat.lng]; // keep component state as [lat, lng]
                    setMapPosition(newPos);

                    if (createdMarker) {
                        createdMarker.setLngLat([lngLat.lng, lngLat.lat]);
                    }

                    // trigger reverse geocode
                    handleReverseGeocode(lngLat.lat, lngLat.lng);
                });
            } catch (err) {
                console.error('Error initializing Goong Map:', err);
                toast.error('Failed to initialize map. Please refresh the page or check API key.');
                setMapInitialized(false);
            }
        };

        // give a small delay to ensure DOM ready
        const t = setTimeout(() => init(), 80);

        return () => {
            cancelled = true;
            clearTimeout(t);
            try {
                if (mapInstanceRef.current) {
                    // clear listeners and remove
                    if (mapInstanceRef.current.remove) mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
                }
                markerRef.current = null;
            } catch (cleanupErr) {
                console.error('Error cleaning up map:', cleanupErr);
            }
        };
    }, [currentStep, handleReverseGeocode, mapPosition, mapZoom]);

    // Update map position when formData changes
    useEffect(() => {
        if (currentStep !== 2) return;
        setMapPosition([formData.Latitude, formData.Longitude]);
    }, [formData.Latitude, formData.Longitude, currentStep]);

    // Update map and marker when mapPosition changes (from search) - but avoid infinite loop
    useEffect(() => {
        if (currentStep !== 2 || !mapInstanceRef.current || !markerRef.current) return;

        const [lat, lng] = mapPosition;
        const center = [lng, lat]; // Goong uses [lng, lat] format

        try {
            // Update map center smoothly
            if (typeof mapInstanceRef.current.setCenter === 'function') {
                mapInstanceRef.current.setCenter(center);
            } else if (typeof mapInstanceRef.current.flyTo === 'function') {
                mapInstanceRef.current.flyTo({ center, zoom: mapZoom });
            }

            if (typeof mapInstanceRef.current.setZoom === 'function') {
                mapInstanceRef.current.setZoom(mapZoom);
            }

            // Update marker position
            if (markerRef.current && typeof markerRef.current.setLngLat === 'function') {
                markerRef.current.setLngLat(center);
            } else if (markerRef.current && typeof markerRef.current.setPosition === 'function') {
                markerRef.current.setPosition({ lat, lng });
            }
        } catch (error) {
            console.error('Error updating map position:', error);
        }
    }, [mapPosition, mapZoom, currentStep]);

    // Update formData when map position changes (from user interaction)
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            Latitude: mapPosition[0],
            Longitude: mapPosition[1],
        }));
    }, [mapPosition]);

    const loadInitialData = async () => {
        try {
            setLoadingData(true);
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const [categoriesRes, locationsRes, featuresRes] = await Promise.all([
                fetch('/api/categories', { headers }).catch(() => null),
                fetch('/api/locations?page=1&limit=100', { headers }).catch(() => null),
                fetch('/api/features', { headers }).catch(() => null),
            ]);

            if (categoriesRes?.ok) {
                const categoriesData = await categoriesRes.json();
                // API returns: { success: true, data: [...], message: "..." }
                const categoriesList = categoriesData.success && categoriesData.data
                    ? categoriesData.data
                    : (Array.isArray(categoriesData) ? categoriesData : (categoriesData.data || []));
                setCategories(categoriesList);
            }

            if (locationsRes?.ok) {
                const locationsData = await locationsRes.json();
                const locationsList = Array.isArray(locationsData.data?.locations || locationsData.data)
                    ? (locationsData.data?.locations || locationsData.data)
                    : (Array.isArray(locationsData) ? locationsData : []);
                setLocations(locationsList);
            }

            if (featuresRes?.ok) {
                const featuresData = await featuresRes.json();
                const featuresList = Array.isArray(featuresData)
                    ? featuresData
                    : (featuresData.data || []);
                setFeatures(featuresList);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load form data');
        } finally {
            setLoadingData(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

    };


    const handleFeatureToggle = (featureId) => {
        setFormData(prev => {
            const featureIds = prev.FeatureIds || [];
            if (featureIds.includes(featureId)) {
                return {
                    ...prev,
                    FeatureIds: featureIds.filter(id => id !== featureId),
                };
            } else {
                return {
                    ...prev,
                    FeatureIds: [...featureIds, featureId],
                };
            }
        });
    };


    // Note: Autocomplete functions removed - now using GoongGeocoder component

    const validateStep = (step) => {
        switch (step) {
            case 1:
                if (!formData.Name.trim()) {
                    toast.error('Please enter service name');
                    return false;
                }
                if (!formData.CategoryID) {
                    toast.error('Please select a category');
                    return false;
                }
                if (!formData.Description.trim()) {
                    toast.error('Please enter description');
                    return false;
                }
                return true;
            case 2:
                if (!formData.LocationId) {
                    toast.error('Please select a location');
                    return false;
                }
                if (!formData.Address.trim()) {
                    toast.error('Please enter address');
                    return false;
                }
                if (!formData.Latitude || !formData.Longitude) {
                    toast.error('Please select location on map');
                    return false;
                }
                return true;
            case 3:
                // Features are optional, no validation needed
                return true;
            default:
                return true;
        }
    };

    const handleNext = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Only submit if we're on the last step (step 3)
        if (currentStep !== 3) {
            // If not on last step, just go to next step and return early
            handleNext(e);
            return;
        }

        if (!validateStep(currentStep)) {
            return;
        }

        try {
            setLoading(true);

            // Prepare payload
            const payload = {
                Name: formData.Name,
                Description: formData.Description,
                CategoryID: parseInt(formData.CategoryID),
                LocationId: parseInt(formData.LocationId),
                Address: formData.Address,
                Latitude: formData.Latitude,
                Longitude: formData.Longitude,
                Status: 'active',
                FeatureIds: formData.FeatureIds.map(id => parseInt(id)),
            };

            console.log('Submitting service:', payload);

            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch('/api/services', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Service created successfully!');
                // Get the newly created service ID and redirect to availability management
                const newServiceId = data.data?.ServiceId || data.data?.serviceId || data.serviceId;
                setTimeout(() => {
                    if (newServiceId) {
                        navigate(`/provider/services/${newServiceId}/availability`);
                    } else {
                        navigate('/provider');
                    }
                }, 1500);
            } else {
                toast.error(data.message || 'Failed to create service');
            }
        } catch (error) {
            console.error('Error creating service:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = categories.find(c =>
        (c.CategoryID || c.CategoryId || c.categoryId || c.id) == formData.CategoryID
    );
    const categoryName = (selectedCategory?.ServiceTypeName || selectedCategory?.Name || selectedCategory?.name || '').toLowerCase();

    if (loadingData) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 px-4 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading form data...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-2xl">add_business</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Create New Service</h1>
                                <p className="text-gray-600 dark:text-gray-400">Fill in the information below to add your service</p>
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex items-center justify-between mt-6">
                            {[1, 2, 3].map((step) => (
                                <React.Fragment key={step}>
                                    <div className="flex items-center">
                                        <div
                                            className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep === step
                                                ? 'bg-rose-500 text-white scale-110'
                                                : currentStep > step
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                }`}
                                        >
                                            {currentStep > step ? (
                                                <span className="material-symbols-outlined text-sm">check</span>
                                            ) : (
                                                step
                                            )}
                                        </div>
                                        <span className={`ml-2 text-sm font-medium hidden sm:block ${currentStep === step
                                            ? 'text-rose-500 dark:text-rose-400'
                                            : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {step === 1 && 'Basic Info'}
                                            {step === 2 && 'Location'}
                                            {step === 3 && 'Features'}
                                        </span>
                                    </div>
                                    {step < 3 && (
                                        <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                            }`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Only submit if we're on the last step
                            if (currentStep === 3) {
                                handleSubmit(e);
                            } else {
                                // Otherwise, just go to next step
                                handleNext(e);
                            }
                        }}
                        onKeyDown={(e) => {
                            // Prevent Enter key from submitting form if not on last step
                            if (e.key === 'Enter' && currentStep !== 3) {
                                e.preventDefault();
                                handleNext(e);
                            }
                        }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700"
                    >
                        {/* Step 1: Basic Info */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Basic Information</h2>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Service Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="Name"
                                        value={formData.Name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. Da Nang City Tour"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="CategoryID"
                                        value={formData.CategoryID}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((cat) => (
                                            <option
                                                key={cat.CategoryID || cat.CategoryId || cat.categoryId || cat.id}
                                                value={cat.CategoryID || cat.CategoryId || cat.categoryId || cat.id}
                                            >
                                                {cat.ServiceTypeName || cat.Name || cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="Description"
                                        value={formData.Description}
                                        onChange={handleInputChange}
                                        required
                                        rows={6}
                                        placeholder="Describe your service in detail..."
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Location & Map */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Location & Map</h2>

                                <div className="relative z-[100]">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        City/Region <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div
                                            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all cursor-pointer flex items-center justify-between"
                                        >
                                            <span className={formData.LocationId ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                                                {formData.LocationId
                                                    ? (() => {
                                                        const selected = locations.find(loc =>
                                                            (loc.LocationId || loc.locationId || loc.id) == formData.LocationId
                                                        );
                                                        return selected
                                                            ? `${selected.Name || selected.name}${selected.City || selected.city ? ` - ${selected.City || selected.city}` : ''}`
                                                            : 'Select a location';
                                                    })()
                                                    : 'Select a location'}
                                            </span>
                                            <span className="material-symbols-outlined text-gray-400">
                                                {showLocationDropdown ? 'expand_less' : 'expand_more'}
                                            </span>
                                        </div>

                                        {/* Dropdown with Search */}
                                        {showLocationDropdown && (
                                            <div className="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-80 overflow-hidden flex flex-col">
                                                {/* Search Input */}
                                                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                                    <input
                                                        type="text"
                                                        value={locationSearchQuery}
                                                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        placeholder="Search location..."
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-sm"
                                                        autoFocus
                                                    />
                                                </div>

                                                {/* Options List */}
                                                <div className="overflow-y-auto max-h-60">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, LocationId: '' }));
                                                            setShowLocationDropdown(false);
                                                            setLocationSearchQuery('');
                                                        }}
                                                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${!formData.LocationId ? 'bg-rose-50 dark:bg-rose-900/20' : ''}`}
                                                    >
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">Select a location</span>
                                                    </button>
                                                    {(filteredLocations.length > 0 ? filteredLocations : locations).map((loc) => {
                                                        const locId = loc.LocationId || loc.locationId || loc.id;
                                                        const locName = loc.Name || loc.name;
                                                        const locCity = loc.City || loc.city;
                                                        const isSelected = formData.LocationId == locId;
                                                        return (
                                                            <button
                                                                key={locId}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData(prev => ({ ...prev, LocationId: locId }));
                                                                    setShowLocationDropdown(false);
                                                                    setLocationSearchQuery('');
                                                                }}
                                                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${isSelected ? 'bg-rose-50 dark:bg-rose-900/20' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-gray-400 text-sm">
                                                                        location_on
                                                                    </span>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            {locName}
                                                                        </p>
                                                                        {locCity && (
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                {locCity}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {isSelected && (
                                                                        <span className="material-symbols-outlined text-rose-500 text-sm ml-auto">
                                                                            check
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                    {filteredLocations.length === 0 && locationSearchQuery && (
                                                        <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                                            No locations found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {!formData.LocationId && (
                                        <p className="text-xs text-red-500 mt-1">Please select a location</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Detailed Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="Address"
                                        value={formData.Address}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. 123 Tran Phu Street, Hai Chau District"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                {/* Note: GoongGeocoder search box is automatically added to the map */}
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        💡 <strong>Tip:</strong> Use the search box on the top-left of the map to find addresses. The map will automatically navigate to the selected location.
                                    </p>
                                </div>

                                {/* Map */}
                                <div className="relative z-0">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Select Location on Map <span className="text-red-500">*</span>
                                    </label>
                                    <div className="h-96 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 relative z-0 bg-gray-100 dark:bg-gray-700">
                                        {!mapInitialized && (
                                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                                <div className="text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-2"></div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        Click on map or drag the marker to set exact location. Coordinates: {formData.Latitude.toFixed(6)}, {formData.Longitude.toFixed(6)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Features */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Features</h2>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Select Features (Optional)
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {features.map((feature) => {
                                            const featureId = feature.FeatureId || feature.featureId || feature.id;
                                            const featureName = feature.Name || feature.name;
                                            return (
                                                <label key={featureId} className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.FeatureIds || []).includes(featureId)}
                                                        onChange={() => handleFeatureToggle(featureId)}
                                                        className="w-4 h-4 text-rose-500 rounded focus:ring-rose-500"
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{featureName}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {features.length === 0 && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No features available</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={currentStep === 1}
                                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                                Previous
                            </button>

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-bold hover:from-rose-600 hover:to-pink-600 transition-all flex items-center gap-2"
                                >
                                    Next
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin material-symbols-outlined">progress_activity</span>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">check_circle</span>
                                            Create Service
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CreateService;

