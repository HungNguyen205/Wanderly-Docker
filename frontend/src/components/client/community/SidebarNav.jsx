import React from 'react';
import { FaBookmark, FaCompass, FaEdit, FaPlus, FaRss } from 'react-icons/fa';
import { getDefaultAvatar } from '@/utils/avatar';

const SidebarNav = ({ user, activeNav, draftCount, onChangeNav, onShowDrafts, onCreatePost }) => {
    const displayName = user?.FullName || 'Guest User';
    const username = user?.Email?.split('@')[0] || 'guest';

    return (
        <aside className="hidden lg:flex flex-col gap-5 sticky top-24 h-fit">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 text-center">
                    <img
                        src={user?.ProfilePictureUrl || getDefaultAvatar(user?.FullName || user?.Email || 'User')}
                        alt={displayName}
                        className="w-20 h-20 rounded-full border-4 border-rose-500 mx-auto mb-3 object-cover"
                    />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {displayName}
                    </h3>
                    <p className="text-sm text-gray-500">
                        @{username}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    <li>
                        <button
                            onClick={() => onChangeNav('feed')}
                            className={`w-full flex items-center gap-4 px-6 py-4 text-left font-semibold transition-colors ${activeNav === 'feed'
                                ? 'bg-rose-50 text-rose-600 border-l-4 border-rose-500'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <FaRss className="w-5 h-5" />
                            <span>Feed</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => onChangeNav('explore')}
                            className={`w-full flex items-center gap-4 px-6 py-4 text-left font-semibold transition-colors ${activeNav === 'explore'
                                ? 'bg-rose-50 text-rose-600 border-l-4 border-rose-500'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <FaCompass className="w-5 h-5" />
                            <span>Explore</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => onChangeNav('saved')}
                            className={`w-full flex items-center gap-4 px-6 py-4 text-left font-semibold transition-colors ${activeNav === 'saved'
                                ? 'bg-rose-50 text-rose-600 border-l-4 border-rose-500'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <FaBookmark className="w-5 h-5" />
                            <span>Saved</span>
                        </button>
                    </li>
                    {user && (
                        <li>
                            <button
                                onClick={onShowDrafts}
                                className={`w-full flex items-center gap-4 px-6 py-4 text-left font-semibold transition-colors ${activeNav === 'drafts'
                                    ? 'bg-rose-50 text-rose-600 border-l-4 border-rose-500'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <FaEdit className="w-5 h-5" />
                                <span>Drafts</span>
                                {draftCount > 0 && (
                                    <span className="ml-auto bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {draftCount}
                                    </span>
                                )}
                            </button>
                        </li>
                    )}
                </ul>
            </div>

            <button
                onClick={onCreatePost}
                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold py-4 px-6 rounded-full shadow-lg hover:from-rose-600 hover:to-pink-600 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
                <FaPlus />
                <span>Create Post</span>
            </button>
        </aside>
    );
};

export default SidebarNav;

