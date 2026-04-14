import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "@/components/client/Layout/Header";
import Footer from "@/components/client/Layout/Footer";
import { getItineraryCoverImage } from "@/utils/images";

export default function ItinerariesList() {
    const [itineraries, setItineraries] = useState([]);
    const [filteredItineraries, setFilteredItineraries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const navigate = useNavigate();

    useEffect(() => {
        loadItineraries();
    }, []);

    useEffect(() => {
        filterItineraries();
    }, [activeFilter, itineraries]);

    const loadItineraries = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');

            if (!token) {
                toast.error("Please login to view your itineraries");
                navigate("/login");
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch('/api/itineraries/user/all', {
                headers
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setItineraries(data.data.itineraries || []);
            } else {
                toast.error(data.message || "Failed to load itineraries");
                setItineraries([]);
            }
        } catch (error) {
            console.error('Error loading itineraries:', error);
            toast.error("Failed to load itineraries");
            setItineraries([]);
        } finally {
            setLoading(false);
        }
    };

    const filterItineraries = () => {
        if (activeFilter === "all") {
            setFilteredItineraries(itineraries);
        } else {
            setFilteredItineraries(
                itineraries.filter(item => {
                    const status = item.Status?.toLowerCase() || 'draft';
                    switch (activeFilter) {
                        case "upcoming":
                            return status === 'published' || status === 'active';
                        case "completed":
                            return status === 'completed';
                        case "drafts":
                            return status === 'draft';
                        default:
                            return true;
                    }
                })
            );
        }
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase() || 'draft';
        switch (statusLower) {
            case 'published':
            case 'active':
                return {
                    text: 'UPCOMING',
                    bg: 'bg-[#FF6B6B]',
                    icon: 'flight_takeoff'
                };
            case 'completed':
                return {
                    text: 'COMPLETED',
                    bg: 'bg-emerald-500',
                    icon: 'flag'
                };
            case 'draft':
            default:
                return {
                    text: 'DRAFT',
                    bg: 'bg-gray-600',
                    icon: 'edit_note'
                };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Date pending";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getDaysUntil = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return null;
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "1 day left";
        if (diffDays < 7) return `${diffDays} days left`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks left`;
        return `${Math.ceil(diffDays / 30)} months left`;
    };

    const handleViewDetails = (itineraryId) => {
        navigate(`/itineraries/${itineraryId}`);
    };

    const handleCreateNew = async () => {
        try {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                toast.error("Please login to create an itinerary");
                navigate("/login");
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch('/api/itineraries/simple', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: "Hành trình trống"
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const itineraryId = data.data.itineraryId;
                toast.success("Itinerary created successfully");
                navigate(`/itineraries/${itineraryId}`);
            } else {
                toast.error(data.message || "Failed to create itinerary");
            }
        } catch (error) {
            console.error('Error creating itinerary:', error);
            toast.error("Failed to create itinerary");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 pb-32">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">My Trips</h1>
                        <p className="text-gray-500 font-medium">Ready for your next adventure?</p>
                    </div>

                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                        <button
                            onClick={() => setActiveFilter("all")}
                            className={`px-5 py-2.5 rounded-lg font-bold text-sm shadow whitespace-nowrap transition ${activeFilter === "all"
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            All Trips
                        </button>
                        <button
                            onClick={() => setActiveFilter("upcoming")}
                            className={`px-5 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition flex items-center gap-2 ${activeFilter === "upcoming"
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-[#FF6B6B]"></span> Upcoming
                        </button>
                        <button
                            onClick={() => setActiveFilter("completed")}
                            className={`px-5 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition flex items-center gap-2 ${activeFilter === "completed"
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed
                        </button>
                        <button
                            onClick={() => setActiveFilter("drafts")}
                            className={`px-5 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition flex items-center gap-2 ${activeFilter === "drafts"
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span> Drafts
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B6B]"></div>
                    </div>
                ) : filteredItineraries.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-4xl font-extrabold mb-6">No itineraries found</p>
                        <button
                            onClick={handleCreateNew}
                            className="btn-create-first px-8 py-4 rounded-full text-base font-bold shadow-lg inline-flex items-center gap-3"
                        >
                            <span className="material-symbols-outlined text-xl">add</span>
                            Create Your First Trip
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredItineraries.map((itinerary) => {
                            const statusBadge = getStatusBadge(itinerary.Status);
                            const daysUntil = getDaysUntil(itinerary.StartDate);
                            const isDraft = (itinerary.Status?.toLowerCase() || 'draft') === 'draft';
                            const isCompleted = (itinerary.Status?.toLowerCase() || 'draft') === 'completed';

                            return (
                                <article
                                    key={itinerary.ItineraryId}
                                    onClick={() => handleViewDetails(itinerary.ItineraryId)}
                                    className={`group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border cursor-pointer ${isDraft ? 'border-gray-200' : 'border-gray-100'
                                        }`}
                                >
                                    <div className={`relative h-60 overflow-hidden ${isDraft ? 'opacity-80 group-hover:opacity-100 transition-opacity' : ''}`}>
                                        <img
                                            src={getItineraryCoverImage(itinerary.CoverImageUrl)}
                                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${isDraft ? 'grayscale group-hover:grayscale-0 transition-all duration-500' : ''
                                                }`}
                                            alt={itinerary.Name}
                                            onError={(e) => {
                                                e.target.src = getItineraryCoverImage(null);
                                            }}
                                        />

                                        <div className="absolute top-4 right-4">
                                            <span className={`px-3 py-1.5 rounded-full ${statusBadge.bg} text-white text-xs font-bold shadow-md flex items-center gap-1`}>
                                                <span className="material-symbols-outlined text-sm">{statusBadge.icon}</span> {statusBadge.text}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`text-xl font-extrabold group-hover:text-[#FF6B6B] transition ${isDraft ? 'text-gray-600 group-hover:text-gray-900' : 'text-gray-900'
                                                }`}>
                                                {itinerary.Name || "Untitled Trip"}
                                            </h3>
                                        </div>

                                        {isDraft ? (
                                            <div className="flex items-center gap-2 text-sm text-orange-500 font-medium mb-6">
                                                <span className="material-symbols-outlined">warning</span>
                                                <span>Date & Cost pending</span>
                                            </div>
                                        ) : isCompleted ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                                                <span className="material-symbols-outlined">event_available</span>
                                                <span>Traveled: {formatDate(itinerary.EndDate || itinerary.StartDate)}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium mb-6">
                                                <span className="material-symbols-outlined text-[#FF6B6B]">calendar_clock</span>
                                                <span>{formatDate(itinerary.StartDate)}</span>
                                                {daysUntil && (
                                                    <span className="text-xs text-[#FF6B6B] font-bold bg-red-50 px-2 py-0.5 rounded-full">
                                                        {daysUntil}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="h-px bg-gray-100 mb-4"></div>

                                        <div className="flex justify-between items-center">
                                            {isDraft ? (
                                                <>
                                                    <span className="text-xs text-gray-400">
                                                        {itinerary.UpdatedAt
                                                            ? `Edited: ${formatDate(itinerary.UpdatedAt)}`
                                                            : `Created: ${formatDate(itinerary.CreatedAt)}`
                                                        }
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewDetails(itinerary.ItineraryId);
                                                        }}
                                                        className="px-4 py-2 rounded-full border border-[#FF6B6B] text-[#FF6B6B] bg-white hover:bg-[#FF6B6B] hover:text-white text-sm font-bold transition flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">edit</span> Resume
                                                    </button>
                                                </>
                                            ) : isCompleted ? (
                                                <>
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                        Completed
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewDetails(itinerary.ItineraryId);
                                                        }}
                                                        className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-[#FF6B6B] hover:text-[#FF6B6B] text-sm font-bold transition flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">photo_library</span> Photos
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex -space-x-2">
                                                        <img className="h-8 w-8 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/150?u=1" alt="Avatar 1" />
                                                        <img className="h-8 w-8 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/150?u=2" alt="Avatar 2" />
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewDetails(itinerary.ItineraryId);
                                                        }}
                                                        className="btn-details px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1"
                                                    >
                                                        Details <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>

            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={handleCreateNew}
                    className="fab-button"
                >
                    <span className="material-symbols-outlined">add</span>
                </button>
            </div>

            <Footer />

            <style>{`
                .btn-primary {
                    background: linear-gradient(90deg, #FF6B6B 0%, #ff8e8e 100%);
                    color: white;
                    transition: all 0.3s ease;
                    border: none;
                    padding: 0;
                }
                .btn-primary:hover {
                    box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
                    transform: translateY(-1px);
                }
                .btn-details {
                    background: linear-gradient(90deg, #FF6B6B 0%, #ff8e8e 100%);
                    color: white;
                    transition: all 0.2s ease;
                }
                .btn-details:hover {
                    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.25);
                    transform: translateY(-1px);
                }
                .btn-create-first {
                    background: linear-gradient(90deg, #FF6B6B 0%, #ff8e8e 100%);
                    color: white;
                    transition: all 0.3s ease;
                    border: none;
                }
                .btn-create-first:hover {
                    box-shadow: 0 10px 25px rgba(255, 107, 107, 0.4);
                    transform: translateY(-2px);
                }
                .fab-button {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: linear-gradient(90deg, #FF6B6B 0%, #ff8e8e 100%);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                    transition: all 0.3s ease;
                }
                .fab-button:hover {
                    box-shadow: 0 12px 32px rgba(255, 107, 107, 0.4);
                    transform: scale(1.1);
                }
                .fab-button .material-symbols-outlined {
                    font-size: 32px;
                    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    transition: transform 0.3s ease;
                }
                .fab-button:hover .material-symbols-outlined {
                    transform: rotate(90deg);
                }
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
            `}</style>
        </div>
    );
}

