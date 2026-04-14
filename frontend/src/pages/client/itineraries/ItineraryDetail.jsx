import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getItineraryCoverImage } from "@/utils/images";
import polyline from "@mapbox/polyline";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ConfirmationModal from "@/components/client/common/ConfirmationModal";

// Goong Maps Configuration
const GOONG_MAP_KEY = import.meta.env.VITE_GOONG_MAP_KEY || '';
const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY || '';
const GOONG_DIRECTIONS_ENDPOINT = 'https://rsapi.goong.io/Direction';
const GOONG_TRIP_ENDPOINT = 'https://rsapi.goong.io/trip';

export default function ItineraryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [itinerary, setItinerary] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('place');
    const [user, setUser] = useState(null);

    // Form state for adding item
    const [locations, setLocations] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [loadingServices, setLoadingServices] = useState(false);
    const [itemForm, setItemForm] = useState({
        activityDescription: '',
        locationId: null,
        serviceId: null,
        itemDate: '',
        startTime: '',
        endTime: '',
        itemOrder: 1
    });
    const [isSubmittingItem, setIsSubmittingItem] = useState(false);
    const [locationSearchQuery, setLocationSearchQuery] = useState('');
    const [serviceSearchQuery, setServiceSearchQuery] = useState('');

    // Edit states
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [isEditingDates, setIsEditingDates] = useState(false);
    const [editedStartDate, setEditedStartDate] = useState('');
    const [editedEndDate, setEditedEndDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [coverImageFile, setCoverImageFile] = useState(null);

    // Map refs and state
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const routeLayerRef = useRef(null);
    const isDrawingRouteRef = useRef(false); // Prevent multiple simultaneous route drawings
    const [mapInitialized, setMapInitialized] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [itemCoordinates, setItemCoordinates] = useState([]);
    const [loadingCoordinates, setLoadingCoordinates] = useState(false);

    // Item order state for drag-and-drop (itemId -> order)
    const [itemOrder, setItemOrder] = useState({});

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        itemId: null,
        onConfirm: null
    });

    // Date filter scroll refs and state
    const dateScrollRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        // Delay các API calls để map load trước (tránh block)
        setTimeout(() => {
            loadItinerary();
            getCurrentLocation();
        }, 100);

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                setMapInitialized(false);
            }
        };
    }, [id]);

    // Load Goong Maps scripts
    useEffect(() => {
        // Check if scripts already loaded
        if (window.goongjs && window.goongjs.Map) {
            return;
        }

        // Load Goong Maps CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css';
        document.head.appendChild(link);

        // Load Goong Maps JS
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js';
        script.async = true;
        script.onload = () => {
            console.log('Goong Maps script loaded');
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup if needed
        };
    }, []);

    // Get current location
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    // Silently fallback to default location
                    // Common reasons: user denied permission, location unavailable
                    setCurrentLocation({ lat: 16.0544, lng: 108.2021 });
                }
            );
        } else {
            // Default to Da Nang if geolocation not supported
            setCurrentLocation({ lat: 16.0544, lng: 108.2021 });
        }
    };

    // Fetch coordinates for items (optimized: parallel fetching)
    const fetchItemCoordinates = async () => {
        if (!items || items.length === 0) {
            setItemCoordinates([]);
            setLoadingCoordinates(false);
            return;
        }

        setLoadingCoordinates(true);

        // Fetch all coordinates in parallel instead of sequentially
        const coordinatePromises = items.map(async (item) => {
            try {
                if (item.LocationId) {
                    const response = await fetch(`/api/locations/${item.LocationId}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data) {
                            const location = data.data;
                            if (location.Latitude && location.Longitude) {
                                return {
                                    itemId: item.ItineraryItemId,
                                    name: item.ActivityDescription || location.Name,
                                    lat: parseFloat(location.Latitude),
                                    lng: parseFloat(location.Longitude),
                                    type: 'location',
                                    itemDate: item.ItemDate // Keep itemDate for filtering
                                };
                            }
                        }
                    }
                } else if (item.ServiceId) {
                    const response = await fetch(`/api/services/${item.ServiceId}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data) {
                            const service = data.data;
                            if (service.Latitude && service.Longitude) {
                                return {
                                    itemId: item.ItineraryItemId,
                                    name: item.ActivityDescription || service.Name,
                                    lat: parseFloat(service.Latitude),
                                    lng: parseFloat(service.Longitude),
                                    type: 'service',
                                    itemDate: item.ItemDate // Keep itemDate for filtering
                                };
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Error fetching coordinates for item ${item.ItineraryItemId}:`, error);
            }
            return null; // Return null for failed fetches
        });

        try {
            // Wait for all promises to resolve
            const results = await Promise.all(coordinatePromises);
            // Filter out null values (failed fetches)
            const coordinates = results.filter(coord => coord !== null);

            console.log(`📍 Fetched coordinates: ${coordinates.length} out of ${items.length} items`);
            console.log('📍 Coordinates details:', coordinates.map(coord => ({
                itemId: coord.itemId,
                name: coord.name,
                lat: coord.lat,
                lng: coord.lng,
                type: coord.type,
                itemDate: coord.itemDate
            })));

            setItemCoordinates(coordinates);
        } catch (error) {
            console.error('Error fetching coordinates:', error);
            setItemCoordinates([]);
        } finally {
            setLoadingCoordinates(false);
        }
    };

    const loadItinerary = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            if (!token) {
                toast.error("Please login to view itinerary");
                navigate("/login");
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch(`/api/itineraries/${id}`, {
                headers
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setItinerary(data.data.itinerary);
                // Items được lấy từ API response
                const itemsFromApi = data.data.items || [];
                setItems(itemsFromApi);

                // Initialize itemOrder from ItemOrder in database
                const initialOrder = {};
                itemsFromApi.forEach((item, index) => {
                    initialOrder[item.ItineraryItemId] = item.ItemOrder !== null && item.ItemOrder !== undefined ? item.ItemOrder : index;
                });
                setItemOrder(initialOrder);

                // Set selected date to first date with items, or first item date
                if (itemsFromApi && itemsFromApi.length > 0) {
                    const firstItemDate = itemsFromApi[0].ItemDate;
                    setSelectedDate(firstItemDate);
                }

                // Fetch coordinates for items will be triggered by useEffect
            } else {
                toast.error(data.message || "Failed to load itinerary");
                navigate("/itineraries");
            }
        } catch (error) {
            console.error('Error loading itinerary:', error);
            toast.error("Failed to load itinerary");
            navigate("/itineraries");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format time from TIME type (HH:mm:ss or HH:mm:ss.mmm)
    const formatTime = (timeString) => {
        if (!timeString) return "";

        // If it's already a formatted time string (HH:mm or HH:mm:ss)
        if (typeof timeString === 'string') {
            // Handle TIME format from SQL Server: "09:00:00.000" or "09:00:00"
            const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?/);
            if (timeMatch) {
                const hours = parseInt(timeMatch[1], 10);
                const minutes = parseInt(timeMatch[2], 10);
                // Format as HH:mm
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }

            // If it's an ISO date string, extract time part
            if (timeString.includes('T')) {
                const timePart = timeString.split('T')[1]?.split('.')[0] || '';
                const [hours, minutes] = timePart.split(':');
                if (hours && minutes) {
                    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                }
            }
        }

        // If it's a Date object (shouldn't happen but handle it)
        if (timeString instanceof Date) {
            return timeString.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }

        return timeString;
    };

    const formatDateRange = (startDate, endDate) => {
        if (!startDate) return "Date pending";
        const start = formatDate(startDate);
        if (!endDate) return start;
        const end = formatDate(endDate);
        return `${start} - ${end}`;
    };

    const getDaysCount = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 0;
    };

    // Normalize date to YYYY-MM-DD format for comparison
    const normalizeDate = (dateString) => {
        if (!dateString) return null;

        // If already in YYYY-MM-DD format
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
            return dateString.split('T')[0]; // Remove time part if exists
        }

        // Try to parse as Date and convert to YYYY-MM-DD
        try {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (e) {
            console.error('Error normalizing date:', dateString, e);
        }

        return dateString;
    };

    const getUniqueDates = () => {
        const dates = items
            .map(item => normalizeDate(item.ItemDate))
            .filter(Boolean);
        return [...new Set(dates)].sort();
    };

    // Get all dates from StartDate to EndDate, or unique dates if no date range
    const getAllDates = () => {
        if (!itinerary) {
            return [];
        }

        // If no StartDate/EndDate, return unique dates from items
        if (!itinerary.StartDate || !itinerary.EndDate) {
            return getUniqueDates();
        }

        // Generate all dates from StartDate to EndDate
        const dates = [];
        const start = new Date(itinerary.StartDate);
        const end = new Date(itinerary.EndDate);

        // Ensure start is before end
        if (start > end) {
            return getUniqueDates();
        }

        const currentDate = new Date(start);
        while (currentDate <= end) {
            dates.push(new Date(currentDate).toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    };

    const getItemsByDate = (date) => {
        const normalizedDate = normalizeDate(date);
        return items.filter(item => {
            const itemDate = normalizeDate(item.ItemDate);
            return itemDate === normalizedDate;
        });
    };

    const handleSave = async () => {
        // TODO: Implement save functionality
        toast.success("Itinerary saved");
    };

    // Handle name editing
    const handleNameClick = () => {
        if (!isEditingName) {
            setEditedName(itinerary.Name);
            setIsEditingName(true);
        }
    };

    const handleNameBlur = async () => {
        if (editedName.trim() && editedName !== itinerary.Name) {
            await updateItineraryName(editedName);
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        } else if (e.key === 'Escape') {
            setEditedName(itinerary.Name);
            setIsEditingName(false);
        }
    };

    // Handle date editing
    const handleDateClick = () => {
        if (!isEditingDates) {
            setEditedStartDate(itinerary.StartDate ? new Date(itinerary.StartDate).toISOString().split('T')[0] : '');
            setEditedEndDate(itinerary.EndDate ? new Date(itinerary.EndDate).toISOString().split('T')[0] : '');
            setIsEditingDates(true);
        }
    };

    const handleDateBlur = async () => {
        const startDateChanged = editedStartDate !== (itinerary.StartDate ? new Date(itinerary.StartDate).toISOString().split('T')[0] : '');
        const endDateChanged = editedEndDate !== (itinerary.EndDate ? new Date(itinerary.EndDate).toISOString().split('T')[0] : '');

        if (startDateChanged || endDateChanged) {
            await updateItineraryDates(editedStartDate, editedEndDate);
        }
        setIsEditingDates(false);
    };

    // Extract public_id from Cloudinary URL
    const extractCloudinaryPublicId = (url) => {
        if (!url || !url.includes('cloudinary.com')) return null;
        try {
            // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
            const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
            return match ? match[1] : null;
        } catch (error) {
            console.error('Error extracting public_id:', error);
            return null;
        }
    };

    // Delete image from Cloudinary via backend API
    const deleteCloudinaryImage = async (imageUrl) => {
        if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;

        try {
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch('/api/cloudinary/delete', {
                method: 'DELETE',
                headers,
                body: JSON.stringify({ imageUrl })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log('Image deleted from Cloudinary:', imageUrl);
            } else {
                console.warn('Failed to delete image from Cloudinary:', data.message);
            }
        } catch (error) {
            console.error('Error deleting image from Cloudinary:', error);
        }
    };

    // Handle cover image upload
    const handleCoverImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size must be less than 10MB');
            return;
        }

        setCoverImageFile(file);
        setIsUploadingImage(true);

        try {
            // Delete old image from Cloudinary if exists
            if (itinerary.CoverImageUrl) {
                await deleteCloudinaryImage(itinerary.CoverImageUrl);
            }

            // Upload new image to Cloudinary via backend API (signed upload with Travel_Planner preset)
            const token = localStorage.getItem('accessToken');
            const uploadData = new FormData();
            uploadData.append("file", file);

            const uploadRes = await fetch('/api/cloudinary/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: uploadData
            });

            if (!uploadRes.ok) {
                const errorData = await uploadRes.json().catch(() => ({}));
                console.error('Cloudinary upload error:', errorData);
                throw new Error(errorData.message || "Failed to upload image to Cloudinary");
            }

            const uploadResult = await uploadRes.json();
            const imageUrl = uploadResult.data.url;

            // Update itinerary with new image URL
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch(`/api/itineraries/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    name: itinerary.Name,
                    description: itinerary.Description || '',
                    startDate: itinerary.StartDate || null,
                    endDate: itinerary.EndDate || null,
                    coverImageUrl: imageUrl,
                    isPublic: itinerary.IsPublic || false
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setItinerary(prev => ({ ...prev, CoverImageUrl: imageUrl }));
                toast.success("Cover image updated successfully");
            } else {
                toast.error(data.message || "Failed to update cover image");
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setIsUploadingImage(false);
            setCoverImageFile(null);
            // Reset file input
            e.target.value = '';
        }
    };

    // Update itinerary name
    const updateItineraryName = async (newName) => {
        if (!newName.trim()) {
            toast.error("Name cannot be empty");
            setEditedName(itinerary.Name);
            return;
        }

        try {
            setIsSaving(true);
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch(`/api/itineraries/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    name: newName.trim(),
                    description: itinerary.Description || '',
                    startDate: itinerary.StartDate || null,
                    endDate: itinerary.EndDate || null,
                    coverImageUrl: itinerary.CoverImageUrl || null,
                    isPublic: itinerary.IsPublic || false
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setItinerary(prev => ({ ...prev, Name: newName.trim() }));
                toast.success("Itinerary name updated");
            } else {
                toast.error(data.message || "Failed to update name");
                setEditedName(itinerary.Name);
            }
        } catch (error) {
            console.error('Error updating name:', error);
            toast.error("Failed to update name");
            setEditedName(itinerary.Name);
        } finally {
            setIsSaving(false);
        }
    };

    // Validate that date range includes all item dates
    const validateDateRange = (startDate, endDate) => {
        if (!items || items.length === 0) {
            return { valid: true, message: null };
        }

        if (!startDate || !endDate) {
            return { valid: true, message: null }; // Allow empty dates if no items
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Get all unique item dates
        const itemDates = items
            .map(item => normalizeDate(item.ItemDate))
            .filter(Boolean)
            .filter((date, index, self) => self.indexOf(date) === index); // Get unique dates

        // Check if all item dates are within the range
        const outOfRangeDates = itemDates.filter(itemDate => {
            const itemDateObj = new Date(itemDate);
            return itemDateObj < start || itemDateObj > end;
        });

        if (outOfRangeDates.length > 0) {
            const formattedDates = outOfRangeDates
                .map(date => formatDate(date))
                .join(', ');

            return {
                valid: false,
                message: `Some activities are outside the date range: ${formattedDates}. Please adjust the dates to include all activities.`
            };
        }

        return { valid: true, message: null };
    };

    // Update itinerary dates
    const updateItineraryDates = async (startDate, endDate) => {
        // Validate start date is before end date
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            toast.error("Start date must be before end date");
            setEditedStartDate(itinerary.StartDate ? new Date(itinerary.StartDate).toISOString().split('T')[0] : '');
            setEditedEndDate(itinerary.EndDate ? new Date(itinerary.EndDate).toISOString().split('T')[0] : '');
            return;
        }

        // Validate that date range includes all item dates
        const validation = validateDateRange(startDate, endDate);
        if (!validation.valid) {
            toast.error(validation.message);
            setEditedStartDate(itinerary.StartDate ? new Date(itinerary.StartDate).toISOString().split('T')[0] : '');
            setEditedEndDate(itinerary.EndDate ? new Date(itinerary.EndDate).toISOString().split('T')[0] : '');
            return;
        }

        try {
            setIsSaving(true);
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch(`/api/itineraries/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    name: itinerary.Name,
                    description: itinerary.Description || '',
                    startDate: startDate || null,
                    endDate: endDate || null,
                    coverImageUrl: itinerary.CoverImageUrl || null,
                    isPublic: itinerary.IsPublic || false
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const updatedItinerary = {
                    ...itinerary,
                    StartDate: startDate || null,
                    EndDate: endDate || null
                };
                setItinerary(updatedItinerary);

                // Update selected date if it's no longer in range
                if (selectedDate) {
                    // Calculate new dates based on updated itinerary
                    let newAllDates = [];
                    if (startDate && endDate) {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        if (start <= end) {
                            const currentDate = new Date(start);
                            while (currentDate <= end) {
                                newAllDates.push(new Date(currentDate).toISOString().split('T')[0]);
                                currentDate.setDate(currentDate.getDate() + 1);
                            }
                        }
                    } else {
                        newAllDates = getUniqueDates();
                    }

                    if (newAllDates.length > 0 && !newAllDates.includes(selectedDate)) {
                        setSelectedDate(newAllDates[0] || null);
                    }
                }

                toast.success("Itinerary dates updated");
            } else {
                toast.error(data.message || "Failed to update dates");
                setEditedStartDate(itinerary.StartDate ? new Date(itinerary.StartDate).toISOString().split('T')[0] : '');
                setEditedEndDate(itinerary.EndDate ? new Date(itinerary.EndDate).toISOString().split('T')[0] : '');
            }
        } catch (error) {
            console.error('Error updating dates:', error);
            toast.error("Failed to update dates");
            setEditedStartDate(itinerary.StartDate ? new Date(itinerary.StartDate).toISOString().split('T')[0] : '');
            setEditedEndDate(itinerary.EndDate ? new Date(itinerary.EndDate).toISOString().split('T')[0] : '');
        } finally {
            setIsSaving(false);
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
        // Reset form with current selected date or first available date
        const defaultDate = selectedDate
            ? (typeof selectedDate === 'string' ? selectedDate.split('T')[0] : new Date(selectedDate).toISOString().split('T')[0])
            : (itinerary?.StartDate ? new Date(itinerary.StartDate).toISOString().split('T')[0] : '');

        setItemForm({
            activityDescription: '',
            locationId: null,
            serviceId: null,
            itemDate: defaultDate,
            startTime: '',
            endTime: '',
            itemOrder: items.length + 1
        });
        setLocationSearchQuery('');
        setServiceSearchQuery('');
        loadLocations();
        loadServices();
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setActiveTab('place');
    };

    // Load locations
    const loadLocations = async () => {
        try {
            setLoadingLocations(true);
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/locations?page=1&limit=100', { headers });
            if (response.ok) {
                const data = await response.json();
                const locationsList = data.success && data.data?.locations
                    ? data.data.locations
                    : (Array.isArray(data.data) ? data.data : []);
                setLocations(locationsList);
            }
        } catch (error) {
            console.error('Error loading locations:', error);
        } finally {
            setLoadingLocations(false);
        }
    };

    // Load services
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

            const response = await fetch('/api/services?page=1&limit=100', { headers });
            if (response.ok) {
                const data = await response.json();
                const servicesList = data.success && data.data?.services
                    ? data.data.services
                    : (Array.isArray(data.data) ? data.data : []);
                setServices(servicesList);
            }
        } catch (error) {
            console.error('Error loading services:', error);
        } finally {
            setLoadingServices(false);
        }
    };

    // Handle form submit
    const handleAddItem = async () => {
        // Validation
        if (!itemForm.activityDescription.trim()) {
            toast.error("Activity description is required");
            return;
        }

        if (!itemForm.itemDate) {
            toast.error("Date is required");
            return;
        }

        if (!itemForm.locationId && !itemForm.serviceId) {
            toast.error("Please select either a Location or Service");
            return;
        }

        if (itemForm.locationId && itemForm.serviceId) {
            toast.error("Please select either Location OR Service, not both");
            return;
        }

        try {
            setIsSubmittingItem(true);
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const payload = {
                itineraryId: parseInt(id),
                locationId: itemForm.locationId || null,
                serviceId: itemForm.serviceId || null,
                itemDate: itemForm.itemDate,
                startTime: itemForm.startTime || null,
                endTime: itemForm.endTime || null,
                activityDescription: itemForm.activityDescription.trim(),
                itemOrder: itemForm.itemOrder || items.length + 1
            };

            const response = await fetch('/api/itinerary-items', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Item added successfully");
                closeModal();
                // Reload itinerary to get updated items
                await loadItinerary();
            } else {
                toast.error(data.message || "Failed to add item");
            }
        } catch (error) {
            console.error('Error adding item:', error);
            toast.error("Failed to add item");
        } finally {
            setIsSubmittingItem(false);
        }
    };

    // Handle delete item
    const confirmDeleteItem = async (itemId) => {
        setDeleteModal({ isOpen: false, itemId: null, onConfirm: null });

        try {
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch(`/api/itinerary-items/${itemId}`, {
                method: 'DELETE',
                headers
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Item deleted successfully");
                // Reload itinerary to get updated items
                await loadItinerary();
            } else {
                toast.error(data.message || "Failed to delete item");
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error("Failed to delete item");
        }
    };

    const handleDeleteItem = (itemId) => {
        setDeleteModal({
            isOpen: true,
            itemId,
            onConfirm: () => confirmDeleteItem(itemId)
        });
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
    };

    // Check scroll position and show/hide arrows
    const checkScrollButtons = () => {
        if (!dateScrollRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = dateScrollRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    };

    // Scroll handlers
    const scrollLeft = () => {
        if (dateScrollRef.current) {
            dateScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (dateScrollRef.current) {
            dateScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    // Drag to scroll handlers
    const handleMouseDown = (e) => {
        // Don't start drag if clicking on a button
        if (e.target.closest('button')) return;

        if (!dateScrollRef.current) return;
        setIsDragging(true);
        setDragStart({
            x: e.pageX - dateScrollRef.current.offsetLeft,
            scrollLeft: dateScrollRef.current.scrollLeft
        });
        dateScrollRef.current.style.cursor = 'grabbing';
        dateScrollRef.current.style.userSelect = 'none';
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !dateScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - dateScrollRef.current.offsetLeft;
        const walk = (x - dragStart.x) * 2; // Scroll speed multiplier
        dateScrollRef.current.scrollLeft = dragStart.scrollLeft - walk;
    };

    const handleMouseUp = () => {
        if (!dateScrollRef.current) return;
        setIsDragging(false);
        dateScrollRef.current.style.cursor = 'grab';
        dateScrollRef.current.style.userSelect = '';
    };

    const handleMouseLeave = () => {
        if (!dateScrollRef.current) return;
        setIsDragging(false);
        dateScrollRef.current.style.cursor = 'grab';
        dateScrollRef.current.style.userSelect = '';
    };

    // Check scroll on mount and when dates change
    useEffect(() => {
        checkScrollButtons();
        const scrollContainer = dateScrollRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', checkScrollButtons);
            return () => {
                scrollContainer.removeEventListener('scroll', checkScrollButtons);
            };
        }
    }, [items, itinerary]);

    // Fetch coordinates when items change
    useEffect(() => {
        if (items && items.length > 0) {
            fetchItemCoordinates();
        } else {
            setItemCoordinates([]);
        }
    }, [items]);

    // Initialize Goong Map
    useEffect(() => {
        if (loading || mapInstanceRef.current || !GOONG_MAP_KEY) {
            return;
        }

        // Wait for Goong Maps to load
        const waitForGoong = (timeoutMs = 15000, interval = 100) =>
            new Promise((resolve, reject) => {
                const start = Date.now();
                (function tick() {
                    if (window.goongjs && typeof window.goongjs.Map === 'function') {
                        return resolve(window.goongjs);
                    }
                    if (Date.now() - start > timeoutMs) {
                        return reject(new Error('Goong JS not available after timeout'));
                    }
                    setTimeout(tick, interval);
                })();
            });

        let timeoutId = null;
        let attempts = 0;
        const maxAttempts = 50;

        const checkAndInit = async () => {
            attempts++;

            if (!mapRef.current) {
                if (attempts < maxAttempts) {
                    timeoutId = setTimeout(checkAndInit, 100);
                } else {
                    console.error('Map ref not available after 5 seconds');
                    setMapInitialized(true);
                }
                return;
            }

            try {
                const goongjs = await waitForGoong();
                if (!mapRef.current || mapInstanceRef.current) return;

                console.log('Initializing Goong Map...', mapRef.current);

                // Set access token
                goongjs.accessToken = GOONG_MAP_KEY;

                // Goong expects center as [lng, lat]
                const center = [108.2021, 16.0544]; // Đà Nẵng [lng, lat]
                const zoom = 13;

                // Create map
                const createdMap = new goongjs.Map({
                    container: mapRef.current,
                    style: 'https://tiles.goong.io/assets/goong_map_web.json',
                    center,
                    zoom
                });

                mapInstanceRef.current = createdMap;

                createdMap.on('load', () => {
                    console.log('✅ Goong Map initialized');
                    setMapInitialized(true);
                });
            } catch (error) {
                console.error('Error initializing Goong Map:', error);
                setMapInitialized(true);
            }
        };

        checkAndInit();

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [loading]);

    // Update map markers and draw route when selectedDate or itemCoordinates change
    useEffect(() => {
        if (!mapInitialized || !mapInstanceRef.current) return;

        updateMapMarkers();
        drawRoute();
    }, [selectedDate, itemCoordinates, mapInitialized, items, currentLocation]);

    // Update map markers (only show items in selected date)
    const updateMapMarkers = () => {
        if (!mapInstanceRef.current) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        const map = mapInstanceRef.current;

        // Filter items by selected date (optimized: use itemDate stored in coord)
        const itemsToShow = selectedDate
            ? itemCoordinates.filter(coord => {
                if (!coord.itemDate) {
                    // Fallback: find item if itemDate not stored
                    const item = items.find(i => i.ItineraryItemId === coord.itemId);
                    if (!item) return false;
                    const normalizedItemDate = normalizeDate(item.ItemDate);
                    const normalizedSelectedDate = normalizeDate(selectedDate);
                    return normalizedItemDate === normalizedSelectedDate;
                }
                const normalizedItemDate = normalizeDate(coord.itemDate);
                const normalizedSelectedDate = normalizeDate(selectedDate);
                return normalizedItemDate === normalizedSelectedDate;
            })
            : itemCoordinates;

        // Sort items by StartTime for better visualization
        const sortedItems = itemsToShow.sort((a, b) => {
            const itemA = items.find(i => i.ItineraryItemId === a.itemId);
            const itemB = items.find(i => i.ItineraryItemId === b.itemId);

            if (!itemA || !itemB) return 0;

            // Compare StartTime if available
            if (itemA.StartTime && itemB.StartTime) {
                const timeA = itemA.StartTime.toString().match(/^(\d{1,2}):(\d{2})/);
                const timeB = itemB.StartTime.toString().match(/^(\d{1,2}):(\d{2})/);

                if (timeA && timeB) {
                    const hoursA = parseInt(timeA[1], 10);
                    const minutesA = parseInt(timeA[2], 10);
                    const hoursB = parseInt(timeB[1], 10);
                    const minutesB = parseInt(timeB[2], 10);

                    const totalMinutesA = hoursA * 60 + minutesA;
                    const totalMinutesB = hoursB * 60 + minutesB;

                    return totalMinutesA - totalMinutesB;
                }
            }

            return 0;
        });

        // Add markers for each item in the selected date using Goong Maps
        const goongjs = window.goongjs;
        if (!goongjs) return;

        const bounds = new goongjs.LngLatBounds();

        // Add current location marker if available
        if (currentLocation) {
            const currentMarker = new goongjs.Marker({
                color: '#3B82F6'
            })
                .setLngLat([currentLocation.lng, currentLocation.lat])
                .setPopup(new goongjs.Popup().setText('Vị trí hiện tại'))
                .addTo(map);

            markersRef.current.push(currentMarker);
            bounds.extend([currentLocation.lng, currentLocation.lat]);
        }

        sortedItems.forEach((coord, index) => {
            const item = items.find(i => i.ItineraryItemId === coord.itemId);
            const timeText = item?.StartTime ? formatTime(item.StartTime) : '';
            const popupText = timeText ? `${timeText} - ${coord.name}` : coord.name;

            // Create marker with color based on type
            const markerColor = coord.type === 'service' ? '#9333EA' : '#EC4899';
            const marker = new goongjs.Marker({
                color: markerColor
            })
                .setLngLat([coord.lng, coord.lat])
                .setPopup(new goongjs.Popup().setText(popupText))
                .addTo(map);

            markersRef.current.push(marker);
            bounds.extend([coord.lng, coord.lat]);
        });

        // Fit bounds to show all markers in the selected date
        if (sortedItems.length > 0 || currentLocation) {
            map.fitBounds(bounds, {
                padding: { top: 50, bottom: 50, left: 50, right: 50 },
                maxZoom: 15
            });
        }
    };

    // Draw route between items in the selected date (ordered by StartTime) - Using Goong Directions API
    // Draw route by chaining multiple Directions API calls
    const drawRouteWithChainedCalls = async (hasCurrentLocation, currentLocation, waypointCoords) => {
        if (!mapInstanceRef.current) {
            console.warn('Map instance not ready for chained calls');
            return;
        }

        console.log('🔗 Chaining Directions API calls for route through all waypoints...');

        // Build list of all points in order
        const allPoints = [];
        if (hasCurrentLocation) {
            allPoints.push(`${currentLocation.lat},${currentLocation.lng}`);
        }
        allPoints.push(...waypointCoords);

        if (allPoints.length < 2) {
            console.warn('Need at least 2 points for chained route');
            return;
        }

        // Fetch routes for each segment: point1 → point2, point2 → point3, etc.
        const routePromises = [];
        for (let i = 0; i < allPoints.length - 1; i++) {
            const origin = allPoints[i];
            const destination = allPoints[i + 1];

            const segmentParams = new URLSearchParams({
                vehicle: 'car',
                api_key: GOONG_API_KEY,
                origin: origin,
                destination: destination
            });

            console.log(`  📍 Fetching route segment ${i + 1}/${allPoints.length - 1}: ${origin} → ${destination}`);

            routePromises.push(
                fetch(`${GOONG_DIRECTIONS_ENDPOINT}?${segmentParams.toString()}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.routes && data.routes.length > 0) {
                            return data.routes[0].overview_polyline?.points;
                        }
                        return null;
                    })
                    .catch(error => {
                        console.error(`Error fetching route segment ${i + 1}:`, error);
                        return null;
                    })
            );
        }

        try {
            const geometries = await Promise.all(routePromises);
            const validGeometries = geometries.filter(g => g !== null);

            if (validGeometries.length === 0) {
                console.warn('No valid route segments found');
                return;
            }

            console.log(`✅ Got ${validGeometries.length} route segments, combining...`);

            // Combine all geometries into one continuous route
            // Decode each polyline and combine coordinates
            const allCoordinates = [];

            validGeometries.forEach((geometry, index) => {
                try {
                    const decoded = polyline.decode(geometry);
                    // Skip first point of each segment (except first) to avoid duplicates
                    if (index === 0) {
                        allCoordinates.push(...decoded);
                    } else {
                        allCoordinates.push(...decoded.slice(1)); // Skip first point
                    }
                } catch (error) {
                    console.error(`Error decoding segment ${index + 1}:`, error);
                }
            });

            if (allCoordinates.length === 0) {
                console.warn('No coordinates to draw');
                return;
            }

            // Create GeoJSON LineString from combined coordinates
            // polyline.decode returns [lat, lng], GeoJSON needs [lng, lat]
            const geoJsonCoordinates = allCoordinates.map(coord => [coord[1], coord[0]]);

            const combinedGeoJson = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: geoJsonCoordinates
                }
            };

            console.log(`✅ Combined route has ${allCoordinates.length} points`);

            // Draw combined route on map
            const map = mapInstanceRef.current;
            if (!map.getSource('route')) {
                map.addSource('route', {
                    type: 'geojson',
                    data: combinedGeoJson
                });
            } else {
                map.getSource('route').setData(combinedGeoJson);
            }

            if (!map.getLayer('route')) {
                // Find first symbol layer to insert route before it
                const layers = map.getStyle().layers;
                let firstSymbolId = null;
                for (let i = 0; i < layers.length; i++) {
                    if (layers[i].type === 'symbol') {
                        firstSymbolId = layers[i].id;
                        break;
                    }
                }

                map.addLayer(
                    {
                        id: 'route',
                        type: 'line',
                        source: 'route',
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#FF6B6B',
                            'line-width': 6
                        }
                    },
                    firstSymbolId
                );
            }

            console.log('✅ Chained route drawn successfully');
        } catch (error) {
            console.error('Error chaining route segments:', error);
        }
    };

    const drawRoute = async () => {
        if (!mapInstanceRef.current || itemCoordinates.length === 0) {
            // Remove existing route if map or coordinates not available
            removeAllRoutes();
            return;
        }

        // Prevent multiple simultaneous route drawings
        if (isDrawingRouteRef.current) {
            console.log('Route drawing already in progress, skipping...');
            return;
        }

        isDrawingRouteRef.current = true;

        // ALWAYS remove ALL existing routes first when starting to draw new route
        removeAllRoutes();

        // Filter items by selected date (optimized: use itemDate stored in coord)
        console.log('🔍 Filtering items for date:', selectedDate);
        console.log('📊 Total itemCoordinates:', itemCoordinates.length);
        console.log('📊 Total items:', items.length);

        const itemsToShow = selectedDate
            ? itemCoordinates.filter(coord => {
                if (!coord.itemDate) {
                    // Fallback: find item if itemDate not stored
                    const item = items.find(i => i.ItineraryItemId === coord.itemId);
                    if (!item) return false;
                    const normalizedItemDate = normalizeDate(item.ItemDate);
                    const normalizedSelectedDate = normalizeDate(selectedDate);
                    return normalizedItemDate === normalizedSelectedDate;
                }
                const normalizedItemDate = normalizeDate(coord.itemDate);
                const normalizedSelectedDate = normalizeDate(selectedDate);
                return normalizedItemDate === normalizedSelectedDate;
            })
            : itemCoordinates;

        console.log('✅ Items to show after filtering:', itemsToShow.length);
        console.log('📍 Items details:', itemsToShow.map(coord => ({
            itemId: coord.itemId,
            name: coord.name,
            lat: coord.lat,
            lng: coord.lng,
            itemDate: coord.itemDate
        })));

        // Need at least 1 point (current location + 1 item) or 2 items to draw a route
        const hasCurrentLocation = currentLocation && currentLocation.lat && currentLocation.lng;
        const totalPoints = (hasCurrentLocation ? 1 : 0) + itemsToShow.length;

        console.log('📍 Total points for route:', totalPoints, '(current location:', hasCurrentLocation, '+ items:', itemsToShow.length, ')');

        if (totalPoints < 2) {
            // Remove existing route if less than 2 points
            removeAllRoutes();
            isDrawingRouteRef.current = false;
            return;
        }

        try {
            // Check if map is ready
            if (!mapInstanceRef.current) {
                console.warn('Map instance not ready');
                return;
            }

            // Routes are already removed at the start of drawRoute()

            // Sort items by user-defined order (from drag-and-drop) instead of StartTime
            const sortedItems = [...itemsToShow].sort((a, b) => {
                // Get order from itemOrder state (user-defined order)
                const orderA = itemOrder[a.itemId] !== undefined ? itemOrder[a.itemId] : a.itemId;
                const orderB = itemOrder[b.itemId] !== undefined ? itemOrder[b.itemId] : b.itemId;

                // If both have order, sort by order
                if (itemOrder[a.itemId] !== undefined && itemOrder[b.itemId] !== undefined) {
                    return itemOrder[a.itemId] - itemOrder[b.itemId];
                }

                // If only one has order, prioritize it
                if (itemOrder[a.itemId] !== undefined) return -1;
                if (itemOrder[b.itemId] !== undefined) return 1;

                // If neither has order, fallback to ItemOrder from database or itemId
                const itemA = items.find(i => i.ItineraryItemId === a.itemId);
                const itemB = items.find(i => i.ItineraryItemId === b.itemId);

                if (itemA && itemB) {
                    // Use ItemOrder if available, otherwise use itemId as fallback
                    const orderA = itemA.ItemOrder || a.itemId;
                    const orderB = itemB.ItemOrder || b.itemId;
                    return orderA - orderB;
                }

                return 0;
            });

            console.log('📍 Sorted items by user order:', sortedItems.map(coord => ({
                itemId: coord.itemId,
                name: coord.name,
                order: itemOrder[coord.itemId]
            })));

            // Build waypoints for Directions API
            // Directions API: origin → waypoint1 → waypoint2 → destination (one continuous route)
            const waypointCoords = [];

            console.log('Items to show:', itemsToShow.length);
            console.log('Sorted items:', sortedItems.length);
            console.log('Sorted items details:', sortedItems.map(coord => ({
                itemId: coord.itemId,
                name: coord.name,
                lat: coord.lat,
                lng: coord.lng
            })));

            // Add sorted items as waypoints (in user-defined order from drag-and-drop)
            console.log(`🔄 Processing ${sortedItems.length} sorted items for route...`);
            sortedItems.forEach((coord, index) => {
                if (coord.lat && coord.lng) {
                    waypointCoords.push(`${coord.lat},${coord.lng}`);
                    console.log(`  ✅ Added item ${index + 1}/${sortedItems.length}: ${coord.name} (${coord.lat}, ${coord.lng})`);
                } else {
                    console.warn(`  ⚠️ Item ${index + 1} missing coordinates:`, coord);
                }
            });

            console.log(`📊 Total waypoints collected: ${waypointCoords.length} out of ${sortedItems.length} items`);

            console.log('Building Directions API request:', {
                hasCurrentLocation,
                itemsToShowCount: itemsToShow.length,
                sortedItemsCount: sortedItems.length,
                waypointCount: waypointCoords.length,
                waypoints: waypointCoords
            });

            // Need at least 2 points for route
            if (waypointCoords.length < 2 && !hasCurrentLocation) {
                console.warn('Need at least 2 points for route');
                isDrawingRouteRef.current = false;
                return;
            }

            // Build list of all points in order (current location + items)
            const allWaypoints = [];

            if (hasCurrentLocation) {
                // Add current location as first waypoint
                allWaypoints.push(`${currentLocation.lat},${currentLocation.lng}`);
            }

            // Add all items in user-defined order
            allWaypoints.push(...waypointCoords);

            if (allWaypoints.length < 2) {
                console.warn('Need at least 2 waypoints for route');
                isDrawingRouteRef.current = false;
                return;
            }

            console.log('Building route with chained Directions API calls:', {
                hasCurrentLocation,
                totalWaypoints: allWaypoints.length,
                waypoints: allWaypoints,
                preserveOrder: true
            });

            // Use chained Directions API calls to draw route through all waypoints
            await drawRouteWithChainedCalls(hasCurrentLocation, currentLocation, waypointCoords);
            isDrawingRouteRef.current = false;
            return;
        } catch (error) {
            console.error('Error drawing route:', error);
        } finally {
            // Reset flag after route drawing is complete
            isDrawingRouteRef.current = false;
        }
    };

    // Helper function to remove all existing routes
    const removeAllRoutes = () => {
        if (!mapInstanceRef.current) return;

        try {
            const routeLayerIds = ['route', 'route-going', 'route-returning'];

            // Remove route layers
            routeLayerIds.forEach(layerId => {
                try {
                    if (mapInstanceRef.current.getLayer(layerId)) {
                        mapInstanceRef.current.removeLayer(layerId);
                    }
                } catch (e) {
                    // Layer doesn't exist, ignore
                }
            });

            // Remove any other route-related layers from style
            try {
                const style = mapInstanceRef.current.getStyle();
                if (style && style.layers) {
                    style.layers.forEach(layer => {
                        if (layer.id && (layer.id.includes('route') || layer.id.includes('trip')) && !routeLayerIds.includes(layer.id)) {
                            try {
                                if (mapInstanceRef.current.getLayer(layer.id)) {
                                    mapInstanceRef.current.removeLayer(layer.id);
                                }
                            } catch (e) {
                                // Layer doesn't exist, ignore
                            }
                        }
                    });
                }
            } catch (e) {
                // Style not available, ignore
            }

            // Remove all route-related sources
            const routeSourceIds = ['route', 'route-going', 'route-returning', 'route-optimized', 'trip-route'];
            routeSourceIds.forEach(sourceId => {
                try {
                    if (mapInstanceRef.current.getSource(sourceId)) {
                        mapInstanceRef.current.removeSource(sourceId);
                    }
                } catch (e) {
                    // Source doesn't exist, ignore
                }
            });

            routeLayerRef.current = null;
            console.log('✅ Cleared all existing routes');
        } catch (error) {
            console.warn('Error removing existing routes:', error);
        }
    };

    // Helper function to draw route on map (one-way route: origin → waypoint1 → waypoint2)
    const drawRouteOnMap = (geometry) => {
        console.log('drawRouteOnMap called with geometry:', geometry ? 'present' : 'missing');

        if (!mapInstanceRef.current || !geometry) {
            console.warn('Cannot draw route - map or geometry missing', {
                mapReady: !!mapInstanceRef.current,
                hasGeometry: !!geometry
            });
            return;
        }

        // Check if map style is loaded
        try {
            const style = mapInstanceRef.current.getStyle();
            if (!style || !style.layers || style.layers.length === 0) {
                console.warn('Map style not loaded yet, cannot draw route');
                return;
            }
        } catch (error) {
            console.warn('Error checking map style:', error);
            return;
        }

        try {
            // Remove ALL existing route layers and sources before drawing new one
            removeAllRoutes();

            // Convert polyline to GeoJSON
            // Check if toGeoJSON method exists (from CDN version), otherwise use decode
            let geoJSON;
            if (typeof polyline.toGeoJSON === 'function') {
                console.log('Using polyline.toGeoJSON()');
                // Use toGeoJSON if available (from CDN version)
                geoJSON = polyline.toGeoJSON(geometry);
            } else {
                console.log('Using polyline.decode() fallback');
                // Fallback: decode and convert manually
                const decoded = polyline.decode(geometry);
                console.log('Decoded coordinates count:', decoded.length);
                // polyline.decode returns [lat, lng], GeoJSON needs [lng, lat]
                const coordinates = decoded.map(coord => [coord[1], coord[0]]);
                geoJSON = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates
                    }
                };
            }

            console.log('GeoJSON created:', {
                type: geoJSON.type,
                coordinatesCount: geoJSON.geometry?.coordinates?.length || 0
            });

            // Add route source
            mapInstanceRef.current.addSource('route', {
                type: 'geojson',
                data: geoJSON
            });
            console.log('Route source added');

            // Find the first symbol layer to insert route layer before it
            // This ensures route doesn't cover map labels
            const layers = mapInstanceRef.current.getStyle().layers;
            let firstSymbolId = null;
            for (let i = 0; i < layers.length; i++) {
                if (layers[i].type === 'symbol') {
                    firstSymbolId = layers[i].id;
                    break;
                }
            }
            console.log('First symbol layer ID:', firstSymbolId);

            // Add route layer (one-way route: origin → waypoint1 → waypoint2)
            mapInstanceRef.current.addLayer(
                {
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#FF6B6B',
                        'line-width': 6,
                        'line-opacity': 0.8
                    }
                },
                firstSymbolId // Insert before first symbol layer
            );

            routeLayerRef.current = true;
            console.log('✅ Route drawn successfully on map');
        } catch (error) {
            console.error('❌ Error drawing route on map:', error);
            console.error('Error details:', error.stack);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f8f8] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B6B]"></div>
            </div>
        );
    }

    if (!itinerary) {
        return null;
    }

    const uniqueDates = getUniqueDates();
    const allDates = getAllDates();
    const filteredItemsRaw = selectedDate ? getItemsByDate(selectedDate) : items;

    // Sort filtered items by user-defined order (from drag-and-drop)
    const filteredItems = [...filteredItemsRaw].sort((a, b) => {
        // Get order from itemOrder state (user-defined order)
        const orderA = itemOrder[a.ItineraryItemId] !== undefined ? itemOrder[a.ItineraryItemId] : (a.ItemOrder || a.ItineraryItemId);
        const orderB = itemOrder[b.ItineraryItemId] !== undefined ? itemOrder[b.ItineraryItemId] : (b.ItemOrder || b.ItineraryItemId);

        // If both have custom order, sort by it
        if (itemOrder[a.ItineraryItemId] !== undefined && itemOrder[b.ItineraryItemId] !== undefined) {
            return itemOrder[a.ItineraryItemId] - itemOrder[b.ItineraryItemId];
        }

        // If only one has custom order, prioritize it
        if (itemOrder[a.ItineraryItemId] !== undefined) return -1;
        if (itemOrder[b.ItineraryItemId] !== undefined) return 1;

        // Fallback to ItemOrder from database
        return (a.ItemOrder || a.ItineraryItemId) - (b.ItemOrder || b.ItineraryItemId);
    });

    const daysCount = getDaysCount(itinerary.StartDate, itinerary.EndDate);

    // Handle drag end - update item order and redraw route
    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination } = result;

        // Only reorder if position changed
        if (source.index === destination.index) return;

        // Create new order map
        const newOrder = { ...itemOrder };
        const reorderedItems = Array.from(filteredItems);
        const [removed] = reorderedItems.splice(source.index, 1);
        reorderedItems.splice(destination.index, 0, removed);

        // Update order for all items in the selected date
        reorderedItems.forEach((item, index) => {
            newOrder[item.ItineraryItemId] = index;
        });

        setItemOrder(newOrder);

        // Trigger route redraw after a short delay to ensure state is updated
        setTimeout(() => {
            if (mapInstanceRef.current) {
                drawRoute();
            }
        }, 100);

        console.log('🔄 Items reordered:', reorderedItems.map(item => ({
            itemId: item.ItineraryItemId,
            name: item.ActivityDescription,
            newOrder: newOrder[item.ItineraryItemId]
        })));
    };

    return (
        <div className="min-h-screen bg-[#f5f8f8]">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/itineraries" className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-3xl text-transparent bg-clip-text bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B]">travel_explore</span>
                            <h2 className="text-xl font-extrabold tracking-tight">Wanderly</h2>
                        </Link>
                        <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>
                        <h1 className="text-lg font-bold truncate hidden sm:block">{itinerary.Name}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold transition">
                            <span className="material-symbols-outlined text-lg">group_add</span> Invite
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B] text-white rounded-lg text-sm font-bold hover:opacity-90 transition shadow-md"
                        >
                            <span className="material-symbols-outlined text-lg">save</span> Save
                        </button>
                        {user && (
                            <div className="h-9 w-9 rounded-full bg-gray-200 bg-cover bg-center border-2 border-white shadow-sm"
                                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64')` }}>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 py-6">
                {/* Breadcrumb & Title Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-[#5e8d8d] mb-1">
                            <Link to="/itineraries" className="hover:text-[#FF6B6B]">My Trips</Link>
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                            <span>{itinerary.Name || "Untitled"}</span>
                        </div>

                        <div className="flex items-center gap-3 group">
                            {isEditingName ? (
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    onBlur={handleNameBlur}
                                    onKeyDown={handleNameKeyDown}
                                    className="text-4xl lg:text-5xl font-black tracking-tighter mb-2 bg-transparent border-b-2 border-[#FF6B6B] focus:outline-none focus:border-[#7FFFD4] min-w-[200px]"
                                    autoFocus
                                    disabled={isSaving}
                                />
                            ) : (
                                <h1
                                    onClick={handleNameClick}
                                    className="text-4xl lg:text-5xl font-black tracking-tighter mb-2 cursor-pointer hover:text-[#FF6B6B] transition-colors"
                                    title="Click to edit name"
                                >
                                    {itinerary.Name}
                                </h1>
                            )}

                            <label className="cursor-pointer relative -top-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleCoverImageChange}
                                    disabled={isUploadingImage}
                                />
                                <div
                                    className={`h-10 w-10 bg-white border border-gray-200 hover:border-[#FF6B6B] hover:text-[#FF6B6B] rounded-full flex items-center justify-center shadow-sm transition text-gray-400 ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    title={isUploadingImage ? "Uploading..." : "Tải ảnh đại diện cho hành trình"}
                                >
                                    {isUploadingImage ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF6B6B]"></div>
                                    ) : (
                                        <span className="material-symbols-outlined text-xl">add_a_photo</span>
                                    )}
                                </div>
                            </label>
                        </div>
                        <div className="flex items-center gap-4 text-[#5e8d8d]">
                            {isEditingDates ? (
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">calendar_month</span>
                                    <input
                                        type="date"
                                        value={editedStartDate}
                                        onChange={(e) => setEditedStartDate(e.target.value)}
                                        onBlur={handleDateBlur}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#FF6B6B]"
                                        disabled={isSaving}
                                    />
                                    <span>to</span>
                                    <input
                                        type="date"
                                        value={editedEndDate}
                                        onChange={(e) => setEditedEndDate(e.target.value)}
                                        onBlur={handleDateBlur}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#FF6B6B]"
                                        disabled={isSaving}
                                    />
                                </div>
                            ) : (
                                <span
                                    className="flex items-center gap-1 cursor-pointer hover:text-[#FF6B6B] transition-colors"
                                    onClick={handleDateClick}
                                    title="Click to edit dates"
                                >
                                    <span className="material-symbols-outlined text-lg">calendar_month</span>
                                    {formatDateRange(itinerary.StartDate, itinerary.EndDate)}
                                </span>
                            )}
                            {itinerary.LocationId && (
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-lg">location_on</span>
                                    Location
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 text-center min-w-[80px]">
                            <div className="text-xs text-gray-500 uppercase font-bold">Budget</div>
                            <div className="font-bold text-[#FF6B6B]">$0</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 text-center min-w-[80px]">
                            <div className="text-xs text-gray-500 uppercase font-bold">Days</div>
                            <div className="font-bold text-[#5CD6B3]">{daysCount || 0} Days</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
                    {/* Left Column - Timeline */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Date Filter */}
                        {allDates.length > 0 && (
                            <div className="sticky top-20 z-30 bg-[#f5f8f8] pt-2 pb-4 relative">
                                {/* Left Arrow */}
                                {showLeftArrow && (
                                    <button
                                        onClick={scrollLeft}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 z-40 h-10 w-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-[#FF6B6B] transition-all group"
                                        aria-label="Scroll left"
                                    >
                                        <span className="material-symbols-outlined text-gray-600 group-hover:text-[#FF6B6B] transition-colors">
                                            chevron_left
                                        </span>
                                    </button>
                                )}

                                {/* Right Arrow */}
                                {showRightArrow && (
                                    <button
                                        onClick={scrollRight}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 z-40 h-10 w-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-[#FF6B6B] transition-all group"
                                        aria-label="Scroll right"
                                    >
                                        <span className="material-symbols-outlined text-gray-600 group-hover:text-[#FF6B6B] transition-colors">
                                            chevron_right
                                        </span>
                                    </button>
                                )}

                                <div
                                    ref={dateScrollRef}
                                    className="flex gap-3 overflow-x-auto no-scrollbar pb-1 cursor-grab active:cursor-grabbing scroll-smooth"
                                    style={{
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none',
                                        paddingLeft: showLeftArrow ? '48px' : '0',
                                        paddingRight: showRightArrow ? '48px' : '0'
                                    }}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {allDates.map((date, index) => {
                                        const hasItems = uniqueDates.includes(date);
                                        const isSelected = selectedDate === date;

                                        return (
                                            <button
                                                key={date}
                                                onClick={() => setSelectedDate(date)}
                                                className={`flex-shrink-0 px-5 py-2 bg-white rounded-full text-sm font-bold transition relative ${isSelected
                                                    ? 'border-2 border-[#7FFFD4]/50 text-gray-900 shadow-sm'
                                                    : 'border border-gray-200 text-gray-500 hover:border-[#FF6B6B] hover:text-[#FF6B6B]'
                                                    } ${!hasItems ? 'opacity-60' : ''}`}
                                                title={hasItems ? `${formatDate(date)} - Has activities` : `${formatDate(date)} - No activities`}
                                            >
                                                {formatDate(date)}
                                                {hasItems && (
                                                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-[#FF6B6B] rounded-full"></span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Timeline Items */}
                        <div className="space-y-6 relative">
                            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200"></div>

                            <button
                                onClick={openModal}
                                className="relative z-10 w-full border-2 border-dashed border-gray-300 rounded-xl p-3 flex items-center justify-center gap-2 text-gray-500 hover:border-[#7FFFD4] hover:text-[#7FFFD4] hover:bg-[#7FFFD4]/5 transition font-bold"
                            >
                                <span className="material-symbols-outlined">add_circle</span> Add Activity or Service
                            </button>

                            {filteredItems.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No activities for this date. Click above to add one.</p>
                                </div>
                            ) : (
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="timeline-items">
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                                                {filteredItems.map((item, index) => {
                                                    const getItemIcon = () => {
                                                        if (item.ServiceId) return 'concierge';
                                                        if (item.LocationId) return 'location_on';
                                                        return 'event';
                                                    };

                                                    const getItemColor = () => {
                                                        if (item.ServiceId) return { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-l-purple-500' };
                                                        if (item.LocationId) return { bg: 'bg-pink-100', text: 'text-pink-600', border: '' };
                                                        return { bg: 'bg-blue-100', text: 'text-blue-600', border: '' };
                                                    };

                                                    const colors = getItemColor();

                                                    return (
                                                        <Draggable key={item.ItineraryItemId} draggableId={String(item.ItineraryItemId)} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    className={`relative pl-12 group ${snapshot.isDragging ? 'opacity-50' : ''}`}
                                                                >
                                                                    <div className={`absolute left-0 top-0 h-10 w-10 rounded-full ${colors.bg} border-4 border-[#f5f8f8] flex items-center justify-center z-10 ${colors.text}`}>
                                                                        <span className="material-symbols-outlined text-xl">{getItemIcon()}</span>
                                                                    </div>
                                                                    <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition ${colors.border ? `border-l-4 ${colors.border}` : ''} ${snapshot.isDragging ? 'shadow-lg' : ''}`}>
                                                                        <div className="flex justify-between items-start">
                                                                            <div className="flex items-start gap-3 flex-1">
                                                                                {/* Drag handle */}
                                                                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1">
                                                                                    <span className="material-symbols-outlined text-2xl">drag_indicator</span>
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.text.replace('text-', '#') }}>
                                                                                        {item.ServiceId ? 'Service' : item.LocationId ? 'Attraction' : 'Activity'}
                                                                                    </span>
                                                                                    <h3 className="font-bold text-lg">{item.ActivityDescription || 'Untitled Activity'}</h3>
                                                                                    {item.ItemDate && (
                                                                                        <p className="text-sm text-gray-500">
                                                                                            {item.StartTime && item.EndTime ? (
                                                                                                <>
                                                                                                    {formatDate(item.ItemDate)} • {formatTime(item.StartTime)} - {formatTime(item.EndTime)}
                                                                                                </>
                                                                                            ) : (
                                                                                                formatDate(item.ItemDate)
                                                                                            )}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteItem(item.ItineraryItemId);
                                                                                }}
                                                                                className="text-gray-300 hover:text-[#FF6B6B] transition-colors"
                                                                                title="Delete item"
                                                                            >
                                                                                <span className="material-symbols-outlined">delete</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Map & Info Cards */}
                    <div className="lg:col-span-7 lg:sticky lg:top-24 h-auto lg:h-[calc(100vh-8rem)] flex flex-col gap-4">
                        {/* Map */}
                        <div className="w-full flex-grow bg-gray-200 rounded-2xl overflow-hidden shadow-inner relative min-h-[400px]">
                            <div
                                ref={mapRef}
                                className="w-full h-full"
                                style={{ minHeight: '400px' }}
                            >
                                {!mapInitialized && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B6B] mx-auto mb-4"></div>
                                            <p className="text-gray-600 font-semibold">Loading map...</p>
                                        </div>
                                    </div>
                                )}
                                {mapInitialized && loadingCoordinates && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B] mx-auto mb-2"></div>
                                            <p className="text-gray-600 text-sm">Loading locations...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-auto shrink-0">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Weather</p>
                                    <p className="text-xl font-bold text-gray-900">--°C</p>
                                    <p className="text-xs text-gray-400">--</p>
                                </div>
                                <span className="material-symbols-outlined text-4xl text-yellow-400">sunny</span>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs text-gray-500 font-bold uppercase">Checklist</p>
                                    <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-bold">0/0</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400">No items</p>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs text-gray-500 font-bold uppercase">Notes</p>
                                    <button className="text-gray-400 hover:text-[#7FFFD4]">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 italic">
                                    {itinerary.Description || "No notes yet..."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Item Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl transform transition-transform duration-300 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold">Add to Itinerary</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-900">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex p-2 gap-2 bg-gray-50 mx-6 mt-4 rounded-lg">
                            <button
                                onClick={() => switchTab('place')}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'place'
                                    ? 'bg-white text-[#FF6B6B] shadow-sm'
                                    : 'text-gray-500 hover:bg-white/50'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-lg">location_on</span> Place
                                </span>
                            </button>
                            <button
                                onClick={() => switchTab('service')}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'service'
                                    ? 'bg-white text-[#FF6B6B] shadow-sm'
                                    : 'text-gray-500 hover:bg-white/50'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-lg">concierge</span> Service
                                </span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Activity Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Activity Description <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={itemForm.activityDescription}
                                    onChange={(e) => setItemForm(prev => ({ ...prev, activityDescription: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-[#7FFFD4] focus:border-[#7FFFD4]"
                                    placeholder="E.g., Visit Eiffel Tower, Lunch at restaurant..."
                                    required
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={itemForm.itemDate}
                                    onChange={(e) => setItemForm(prev => ({ ...prev, itemDate: e.target.value }))}
                                    min={itinerary?.StartDate ? new Date(itinerary.StartDate).toISOString().split('T')[0] : ''}
                                    max={itinerary?.EndDate ? new Date(itinerary.EndDate).toISOString().split('T')[0] : ''}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-[#7FFFD4] focus:border-[#7FFFD4]"
                                    required
                                />
                            </div>

                            {/* Time Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={itemForm.startTime}
                                        onChange={(e) => setItemForm(prev => ({ ...prev, startTime: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-[#7FFFD4] focus:border-[#7FFFD4]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={itemForm.endTime}
                                        onChange={(e) => setItemForm(prev => ({ ...prev, endTime: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-[#7FFFD4] focus:border-[#7FFFD4]"
                                    />
                                </div>
                            </div>

                            {/* Location or Service Selection */}
                            {activeTab === 'place' ? (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                        Select Location
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
                                        <input
                                            type="text"
                                            value={locationSearchQuery}
                                            onChange={(e) => setLocationSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-[#7FFFD4] focus:border-[#7FFFD4]"
                                            placeholder="Search location..."
                                        />
                                    </div>
                                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                        {loadingLocations ? (
                                            <div className="p-4 text-center text-gray-500">Loading...</div>
                                        ) : (
                                            (locationSearchQuery
                                                ? locations.filter(loc =>
                                                    (loc.Name || loc.name || '').toLowerCase().includes(locationSearchQuery.toLowerCase())
                                                )
                                                : locations
                                            ).map((loc) => {
                                                const locId = loc.LocationId || loc.locationId || loc.id;
                                                const locName = loc.Name || loc.name;
                                                const isSelected = itemForm.locationId === locId;
                                                return (
                                                    <button
                                                        key={locId}
                                                        type="button"
                                                        onClick={() => {
                                                            setItemForm(prev => ({ ...prev, locationId: locId, serviceId: null }));
                                                            setLocationSearchQuery(locName);
                                                        }}
                                                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0 ${isSelected ? 'bg-pink-50 border-l-4 border-l-pink-500' : ''
                                                            }`}
                                                    >
                                                        <div className="font-semibold">{locName}</div>
                                                        {(loc.City || loc.city) && (
                                                            <div className="text-xs text-gray-500">{loc.City || loc.city}</div>
                                                        )}
                                                    </button>
                                                );
                                            })
                                        )}
                                        {locations.length === 0 && !loadingLocations && (
                                            <div className="p-4 text-center text-gray-500 text-sm">No locations found</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                        Select Service
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
                                        <input
                                            type="text"
                                            value={serviceSearchQuery}
                                            onChange={(e) => setServiceSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-[#7FFFD4] focus:border-[#7FFFD4]"
                                            placeholder="Search service..."
                                        />
                                    </div>
                                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                        {loadingServices ? (
                                            <div className="p-4 text-center text-gray-500">Loading...</div>
                                        ) : (
                                            (serviceSearchQuery
                                                ? services.filter(svc => {
                                                    const query = serviceSearchQuery.toLowerCase();
                                                    const name = (svc.Name || svc.name || '').toLowerCase();
                                                    const locationName = (svc.LocationName || svc.locationName || '').toLowerCase();
                                                    const city = (svc.City || svc.city || '').toLowerCase();
                                                    const address = (svc.Address || svc.address || '').toLowerCase();

                                                    return name.includes(query) ||
                                                        locationName.includes(query) ||
                                                        city.includes(query) ||
                                                        address.includes(query);
                                                })
                                                : services
                                            ).map((svc) => {
                                                const svcId = svc.ServiceId || svc.serviceId || svc.id;
                                                const svcName = svc.Name || svc.name;
                                                const isSelected = itemForm.serviceId === svcId;
                                                return (
                                                    <button
                                                        key={svcId}
                                                        type="button"
                                                        onClick={() => {
                                                            setItemForm(prev => ({ ...prev, serviceId: svcId, locationId: null }));
                                                            setServiceSearchQuery(svcName);
                                                        }}
                                                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0 ${isSelected ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
                                                            }`}
                                                    >
                                                        <div className="font-semibold">{svcName}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {(svc.LocationName || svc.locationName) && (
                                                                <span>{svc.LocationName || svc.locationName}</span>
                                                            )}
                                                            {(svc.City || svc.city) && (
                                                                <span>{(svc.LocationName || svc.locationName) ? ', ' : ''}{svc.City || svc.city}</span>
                                                            )}
                                                            {!(svc.LocationName || svc.locationName || svc.City || svc.city) && (svc.Address || svc.address) && (
                                                                <span>{svc.Address || svc.address}</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                        {services.length === 0 && !loadingServices && (
                                            <div className="p-4 text-center text-gray-500 text-sm">No services found</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddItem}
                                disabled={isSubmittingItem}
                                className={`px-6 py-2 bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B] text-white rounded-lg text-sm font-bold shadow hover:opacity-90 transform hover:-translate-y-0.5 transition ${isSubmittingItem ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isSubmittingItem ? 'Adding...' : 'Add to Itinerary'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, itemId: null, onConfirm: null })}
                onConfirm={deleteModal.onConfirm}
                title="Delete item?"
                message="This item will be permanently deleted from your itinerary. Are you sure you want to continue?"
                confirmText="Delete"
                cancelText="Cancel"
                isDanger={true}
            />

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
            `}</style>
        </div>
    );
}

