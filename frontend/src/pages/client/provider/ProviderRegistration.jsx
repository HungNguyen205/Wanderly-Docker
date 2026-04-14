import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';
import { toast } from 'react-toastify';
import { getDefaultAvatar } from '@/utils/avatar';

const ProviderRegistration = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        businessPhone: '',
        contactEmail: '',
        headquartersAddress: '',
        businessLicense: null
    });
    const [licensePreview, setLicensePreview] = useState(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        } else {
            toast.info('Please login to register as a provider');
            navigate('/login');
        }
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            setFormData(prev => ({ ...prev, businessLicense: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setLicensePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check each required field individually
        if (!formData.companyName) {
            toast.error('Please enter your company/brand name');
            return;
        }

        if (!formData.businessPhone) {
            toast.error('Please enter your business phone number');
            return;
        }

        if (!formData.contactEmail) {
            toast.error('Please enter your contact email');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.contactEmail)) {
            toast.error('Please enter a valid email address');
            return;
        }

        // Check if terms are agreed
        if (!agreedToTerms) {
            toast.error('Please confirm that you agree to the Provider Terms');
            return;
        }

        try {
            setLoading(true);

            let licenseUrl = null;
            if (formData.businessLicense) {
                // Upload license to Cloudinary
                const uploadData = new FormData();
                uploadData.append("file", formData.businessLicense);
                uploadData.append("upload_preset", "travel_planner");

                const uploadRes = await fetch(
                    "https://api.cloudinary.com/v1_1/dyvkrlz5i/image/upload",
                    { method: "POST", body: uploadData }
                );
                const uploadResult = await uploadRes.json();
                licenseUrl = uploadResult.secure_url;
            }

            // Save form data to localStorage to pass to contract page
            const providerData = {
                companyName: formData.companyName,
                businessPhone: formData.businessPhone,
                contactEmail: formData.contactEmail,
                headquartersAddress: formData.headquartersAddress,
                businessLicense: licenseUrl,
                repName: user?.FullName || user?.Email?.split('@')[0] || 'User',
                email: user?.Email || ''
            };
            localStorage.setItem('providerRegistrationData', JSON.stringify(providerData));

            // Navigate to contract page
            navigate('/provider/contract');
        } catch (error) {
            console.error('Error processing registration:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
                {/* LEFT COLUMN: Form */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16 xl:p-24 bg-white dark:bg-gray-800">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-3xl text-rose-500">travel_explore</span>
                            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Wanderly</h2>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black mb-3 text-gray-900 dark:text-white">Become a Provider</h1>
                        <p className="text-gray-500 dark:text-gray-400">Upgrade your current account to start offering services.</p>

                        {/* Logged in user info preview */}
                        <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 w-fit">
                            <img
                                src={user.ProfilePictureUrl || getDefaultAvatar(user.FullName || user.Email || 'User')}
                                alt={user.FullName || 'User'}
                                className="h-10 w-10 rounded-full object-cover"
                            />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Logged in as</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{user.Email || 'User'}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Business Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-2 mb-4">Business Details</h3>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Company / Brand Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">storefront</span>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Sunny Hotel & Spa"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Business Phone <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">call</span>
                                    <input
                                        type="tel"
                                        name="businessPhone"
                                        value={formData.businessPhone}
                                        onChange={handleInputChange}
                                        placeholder="+84 909..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Contact Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">email</span>
                                    <input
                                        type="email"
                                        name="contactEmail"
                                        value={formData.contactEmail}
                                        onChange={handleInputChange}
                                        placeholder="contact@company.com"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Headquarters Address</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">pin_drop</span>
                                    <input
                                        type="text"
                                        name="headquartersAddress"
                                        value={formData.headquartersAddress}
                                        onChange={handleInputChange}
                                        placeholder="Full address..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Business License Upload */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business License (Optional)</label>
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                        {licensePreview ? (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <img src={licensePreview} alt="License preview" className="max-h-16 mb-2" />
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Click to change</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="font-bold">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">PDF, PNG, JPG (MAX. 5MB)</p>
                                            </div>
                                        )}
                                        <input
                                            id="dropzone-file"
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-3 pt-2">
                            <div className="flex items-center h-5">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-rose-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                I confirm that I am the authorized representative of this business and agree to the{' '}
                                <a href="#" className="text-rose-500 hover:underline">Provider Terms</a>.
                            </label>
                        </div>

                        {/* Action Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-5 text-white font-bold rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin material-symbols-outlined">progress_activity</span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">verified</span>
                                    Complete Registration
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* RIGHT COLUMN: Benefits / Decor (Desktop Only) */}
                <div className="hidden lg:flex w-1/2 bg-gray-50 dark:bg-black relative overflow-hidden items-center justify-center p-12">
                    {/* Background Blob */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10 max-w-md w-full space-y-8">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Grow with Wanderly</h2>
                            <p className="text-gray-500 dark:text-gray-400">Everything you need to manage your travel business in one place.</p>
                        </div>

                        {/* Benefit Cards */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-transform duration-300">
                            <div className="h-12 w-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center text-pink-500 mb-4">
                                <span className="material-symbols-outlined text-2xl">monetization_on</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Stable Income</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Earn consistent income by providing quality travel services to our global user base.</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-transform duration-300 translate-x-4">
                            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-500 mb-4">
                                <span className="material-symbols-outlined text-2xl">groups</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Reach Customers</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Connect with thousands of potential customers planning their trips on the platform.</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-transform duration-300">
                            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center text-yellow-500 mb-4">
                                <span className="material-symbols-outlined text-2xl">support_agent</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">24/7 Support</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Our support team is always ready to help you optimize your listings and solve issues.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProviderRegistration;


