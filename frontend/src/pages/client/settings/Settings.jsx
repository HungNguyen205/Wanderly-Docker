import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/client/Layout/Header";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
    User, Lock, Shield, Bell, Settings as SettingsIcon, LogOut, Menu, X,
    Mail, Phone, Camera, Save, Edit2, XCircle
} from "lucide-react";

import AccountDetailsTab from "@/components/client/Settings/Tabs/AccountDetailsTab";
import SecurityTab from "@/components/client/Settings/Tabs/SecurityTab";
import PrivacyTab from "@/components/client/Settings/Tabs/PrivacyTab";
import NotificationsTab from "@/components/client/Settings/Tabs/NotificationsTab";
import GeneralSettingsTab from "@/components/client/Settings/Tabs/GeneralSettingsTab";
import { getDefaultAvatar } from "@/utils/avatar";

const Settings = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }, [token, navigate]);

    if (!token) return null;

    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("account");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();

        try {
            setIsSaving(true);
            let newAvatarUrl = formData.ProfilePictureUrl;

            if (formData.ProfilePictureUrl instanceof File) {
                const uploadData = new FormData();
                uploadData.append("file", formData.ProfilePictureUrl);

                const uploadRes = await fetch(
                    "/api/cloudinary/upload?folder=avatars",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        body: uploadData,
                    }
                );

                if (!uploadRes.ok) {
                    const errorData = await uploadRes.json().catch(() => ({}));
                    toast.error(errorData.message || "Failed to upload image");
                    throw new Error(errorData.message || "Failed to upload image");
                }

                const uploadResult = await uploadRes.json();
                console.log("Upload result:", uploadResult); // Debug log
                
                // API returns { success: true, data: { url, public_id }, message }
                newAvatarUrl = uploadResult.data?.url || uploadResult.url || uploadResult.secure_url || uploadResult.data?.secure_url;
                
                if (!newAvatarUrl) {
                    console.error("Upload result structure:", uploadResult);
                    toast.error("No image URL returned from upload. Please try again.");
                    throw new Error("No image URL returned from upload");
                }
            }

            const res = await axios.put("/api/users/profile", {
                ...formData,
                ProfilePictureUrl: newAvatarUrl,
            });

            const { success, message } = res.data;

            if (success) {
                setUser((prev) => ({
                    ...prev,
                    ...formData,
                    ProfilePictureUrl: newAvatarUrl,
                }));
                setIsEditing(false);
                toast.success(message || "Profile updated successfully!");
            } else {
                toast.warning(message || "Failed to update profile. Please try again!");
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            if (err.response?.status === 401) {
                toast.error(
                    err.response.data?.message ||
                    "Session expired. Please log in again!"
                );
                handleLogout();
            } else {
                toast.error(
                    err.message || err.response?.data?.message || "System error while updating profile!"
                );
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        delete axios.defaults.headers.common["Authorization"];
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login", { replace: true });
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setIsLoading(true);
                const res = await fetch("/api/users/profile", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!res.ok) {
                    if ([401, 403].includes(res.status)) {
                        handleLogout();
                        return;
                    }
                    throw new Error("Failed to fetch user data");
                }

                const json = await res.json();
                const userData = json.user || json.data || json;
                setUser(userData);
                setFormData(userData);
            } catch (err) {
                console.error("Error fetching user data:", err);
                toast.error("Failed to load user data!");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserProfile();
    }, [token]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        const validTabs = [
            "account",
            "security",
            "privacy",
            "notifications",
            "general",
        ];
        setActiveTab(validTabs.includes(tab) ? tab : "account");
    }, [location.search]);

    const PRIMARY_COLOR_CLASSES =
        "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30";

    const TAB_LIST = [
        { key: "account", label: "Account Details", Icon: User },
        { key: "security", label: "Security", Icon: Lock },
        { key: "privacy", label: "Privacy", Icon: Shield },
        { key: "notifications", label: "Notifications", Icon: Bell },
        { key: "general", label: "General Settings", Icon: SettingsIcon },
    ];

    const renderTabContent = () => {
        const props = {
            user,
            formData,
            isEditing,
            isLoading: isSaving,
            handleInputChange,
            handleSave,
            setIsEditing,
            setFormData,
            PRIMARY_COLOR_CLASSES,
            cardStyle: "",
        };
        switch (activeTab) {
            case "account":
                return <AccountDetailsTab {...props} />;
            case "security":
                return <SecurityTab {...props} />;
            case "privacy":
                return <PrivacyTab {...props} />;
            case "notifications":
                return <NotificationsTab {...props} />;
            case "general":
                return <GeneralSettingsTab {...props} />;
            default:
                return <AccountDetailsTab {...props} />;
        }
    };

    if (isLoading || !user) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-24">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
                        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                            Loading profile data...
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />

            <div className="pt-20 md:pt-24 pb-8 md:pb-16 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    {/* Mobile Header */}
                    <div className="lg:hidden mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                Settings
                            </h1>
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                                aria-label="Toggle menu"
                            >
                                {sidebarOpen ? (
                                    <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                                ) : (
                                    <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Desktop Header */}
                    <h1 className="hidden lg:block text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-8 md:mb-12 text-center">
                        Settings & Profile
                    </h1>

                    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8">
                        {/* SIDEBAR - Mobile: Overlay, Desktop: Sticky */}
                        <div
                            className={`
                                ${sidebarOpen ? 'fixed inset-0 z-40 lg:relative lg:z-auto' : 'hidden lg:block'}
                                ${sidebarOpen ? 'bg-black/50 dark:bg-black/70 lg:bg-transparent' : ''}
                            `}
                            onClick={() => sidebarOpen && setSidebarOpen(false)}
                        >
                            <div
                                className={`
                                    w-full max-w-xs lg:max-w-none lg:w-80
                                    h-full lg:h-auto
                                    bg-white dark:bg-gray-800
                                    rounded-2xl lg:rounded-3xl
                                    p-4 md:p-6 lg:p-8
                                    shadow-2xl lg:shadow-xl
                                    transition-all duration-300
                                    border border-gray-200 dark:border-gray-700
                                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                                    lg:sticky lg:top-24
                                    overflow-y-auto lg:overflow-visible
                                `}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Mobile Close Button */}
                                <div className="flex items-center justify-between mb-6 lg:hidden">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Menu</h2>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        aria-label="Close menu"
                                    >
                                        <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                    </button>
                                </div>

                                {/* User Profile */}
                                <div className="text-center mb-6 lg:mb-8">
                                    <div className="relative inline-block">
                                        <img
                                            src={
                                                user.ProfilePictureUrl ||
                                                getDefaultAvatar(user.FullName || user.Email || "User")
                                            }
                                            alt="User Avatar"
                                            className="w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full mx-auto object-cover border-4 border-indigo-500 dark:border-indigo-400 shadow-xl"
                                        />
                                    </div>
                                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-3 md:mt-4">
                                        {user.FullName || "User Name"}
                                    </h2>
                                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate px-2">
                                        {user.Email || "No email provided"}
                                    </p>
                                </div>

                                {/* Navigation */}
                                <nav className="space-y-2">
                                    {TAB_LIST.map(({ key, label, Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                setActiveTab(key);
                                                setSidebarOpen(false);
                                            }}
                                            className={`
                                                w-full text-left flex items-center px-4 py-3 
                                                rounded-xl
                                                font-semibold text-sm md:text-base
                                                transition-all duration-300
                                                ${activeTab === key
                                                    ? `text-white ${PRIMARY_COLOR_CLASSES} shadow-lg`
                                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                }
                                            `}
                                        >
                                            <Icon className="mr-3 w-5 h-5 flex-shrink-0" />
                                            <span className="truncate">{label}</span>
                                        </button>
                                    ))}

                                    <button
                                        className="w-full text-left flex items-center px-4 py-3 rounded-xl font-medium text-sm md:text-base text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="mr-3 w-5 h-5 flex-shrink-0" />
                                        Log Out
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* TAB CONTENT */}
                        <div className="flex-1 min-w-0">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 shadow-xl transition duration-500 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-6 md:mb-8">
                                    <div className="flex items-center gap-3">
                                        {TAB_LIST.find((t) => t.key === activeTab)?.Icon && (
                                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                                {React.createElement(TAB_LIST.find((t) => t.key === activeTab)?.Icon, {
                                                    className: "w-6 h-6 text-indigo-600 dark:text-indigo-400"
                                                })}
                                            </div>
                                        )}
                                        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                                            {TAB_LIST.find((t) => t.key === activeTab)?.label}
                                        </h3>
                                    </div>
                                </div>
                                <div className="overflow-x-hidden">
                                    {renderTabContent()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                draggable
                theme="colored"
            />
        </>
    );
};

export default Settings;
