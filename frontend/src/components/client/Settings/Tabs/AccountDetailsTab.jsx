import React, { useState } from "react";
import { Mail, Phone, User, Camera, Save, XCircle, Edit2, Info } from "lucide-react";
import ProfileInputField from "../UI/ProfileInputField";
import ProfileTextAreaField from "../UI/ProfileTextAreaField";
import { getDefaultAvatar } from "@/utils/avatar";

const AccountDetailsTab = ({
    formData,
    isEditing,
    isLoading,
    handleInputChange,
    handleSave,
    setIsEditing,
    setFormData,
    user,
    PRIMARY_COLOR_CLASSES,
}) => {
    const buttonSecondary =
        "px-6 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-300 shadow-md flex items-center gap-2";
    const buttonPrimary = `px-6 py-3 rounded-xl font-semibold text-white ${PRIMARY_COLOR_CLASSES} shadow-lg flex items-center justify-center gap-2 disabled:opacity-50`;

    const [previewImage, setPreviewImage] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPreviewImage(previewUrl);
            setFormData((prev) => ({ ...prev, ProfilePictureUrl: file }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    Basic Information
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Update your personal information and profile picture
                </p>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center space-y-4 mb-8">
                <div className="relative">
                    <img
                        src={
                            previewImage ||
                            (typeof formData.ProfilePictureUrl === 'string' && formData.ProfilePictureUrl
                                ? formData.ProfilePictureUrl
                                : getDefaultAvatar(formData.FullName || formData.Email || "User"))
                        }
                        alt="Avatar preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500 dark:border-indigo-400 shadow-xl"
                    />
                    {isEditing && (
                        <label className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition border-2 border-gray-200 dark:border-gray-700">
                            <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </label>
                    )}
                </div>
            </div>

            {/* Input fields */}
            <div className="space-y-5">
                <ProfileInputField
                    label="Full Name"
                    name="FullName"
                    value={formData.FullName}
                    icon={User}
                    disabled={!isEditing}
                    onChange={handleInputChange}
                />
                <ProfileInputField
                    label="Email"
                    name="Email"
                    value={formData.Email}
                    icon={Mail}
                    disabled={!isEditing}
                    onChange={handleInputChange}
                />
                <ProfileInputField
                    label="Phone Number"
                    name="PhoneNumber"
                    value={formData.PhoneNumber}
                    icon={Phone}
                    disabled={!isEditing}
                    onChange={handleInputChange}
                />
                <ProfileTextAreaField
                    label="Bio / About Me"
                    name="Bio"
                    value={formData.Bio}
                    icon={Info}
                    disabled={!isEditing}
                    onChange={handleInputChange}
                />
            </div>

            {/* Action buttons */}
            <div className="pt-8 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
                {isEditing ? (
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setFormData(user);
                                setPreviewImage(null);
                            }}
                            className={buttonSecondary}
                        >
                            <XCircle className="inline mr-2 w-4 h-4" /> Cancel
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSave(e);
                            }}
                            disabled={isLoading}
                            className={buttonPrimary}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 w-4 h-4" /> Save Changes
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition duration-300 flex items-center gap-2"
                    >
                        <Edit2 className="w-4 h-4" /> Edit Account
                    </button>
                )}
            </div>
        </div>
    );
};

export default AccountDetailsTab;