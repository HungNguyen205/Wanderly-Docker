import React from 'react';
import { FaImage, FaMapMarkerAlt } from 'react-icons/fa';
import { getDefaultAvatar } from '@/utils/avatar';

const CreatePostBox = ({ user, onOpenCreate, onNavigateItineraries }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <img
                    src={user?.ProfilePictureUrl || getDefaultAvatar(user?.FullName || user?.Email || 'User')}
                    alt={user?.FullName || 'User'}
                    className="w-11 h-11 rounded-full object-cover"
                />
                <input
                    type="text"
                    placeholder={user ? `${user.FullName || 'You'}, share your experience...` : "Login to create a post"}
                    onClick={onOpenCreate}
                    readOnly
                    className="flex-1 bg-gray-50 rounded-full px-5 py-3 border-none outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                />
            </div>
            <div className="flex justify-around pt-4">
                <button
                    onClick={onOpenCreate}
                    className="flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
                >
                    <FaImage />
                    <span>Photo/Video</span>
                </button>
                <button
                    onClick={onNavigateItineraries}
                    className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                    <FaMapMarkerAlt />
                    <span>Itinerary</span>
                </button>
            </div>
        </div>
    );
};

export default CreatePostBox;

