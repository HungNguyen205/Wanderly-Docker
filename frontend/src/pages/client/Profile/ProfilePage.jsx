import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';
import { getDefaultAvatar } from '@/utils/avatar';

const ProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [followers, setFollowers] = useState([]);
    const [followingList, setFollowingList] = useState([]);
    const [loadingFollowers, setLoadingFollowers] = useState(false);
    const [loadingFollowing, setLoadingFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('posts'); // posts | followers | following

    useEffect(() => {
        // Get current logged in user
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setCurrentUser(userData);
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        }

        // Load profile user data
        loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Get current user from localStorage
            const savedUser = localStorage.getItem('user');
            let currentUserData = null;
            if (savedUser) {
                try {
                    currentUserData = JSON.parse(savedUser);
                } catch (e) {
                    console.error('Error parsing user:', e);
                }
            }

            // If no userId in params, show current user's profile
            if (!userId) {
                if (currentUserData) {
                    setProfileUser(currentUserData);
                    setIsOwnProfile(true);
                    fetchCountsAndPosts(currentUserData.UserId || currentUserData.userId, headers, true);
                } else {
                    navigate('/login');
                }
                setLoading(false);
                return;
            }

            // Fetch profile from API for specific user
            const res = await fetch(`/api/users/${userId}`, {
                headers,
            });

            if (res.ok) {
                const data = await res.json();
                const userData = data.user || data.data || data;
                setProfileUser(userData);
                
                // Check if this is current user's profile
                if (currentUserData) {
                    const own = (
                        userData.UserId === currentUserData.UserId ||
                        userData.userId === currentUserData.userId ||
                        userData.Email === currentUserData.Email
                    );
                    setIsOwnProfile(own);
                }

                // Fetch follow status if viewing others
                if (token && currentUserData && userData.UserId !== currentUserData.UserId) {
                    fetchFollowStatus(userData.UserId || userData.userId, headers);
                }

                // Fetch counts and posts
                fetchCountsAndPosts(userData.UserId || userData.userId, headers, false);
            } else {
                // If profile not found and it's own profile, use localStorage data
                if (currentUserData && (userId === currentUserData.UserId?.toString() || userId === currentUserData.userId?.toString())) {
                    setProfileUser(currentUserData);
                    setIsOwnProfile(true);
                    fetchCountsAndPosts(currentUserData.UserId || currentUserData.userId, headers, true);
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowStatus = async (targetUserId, headers) => {
        try {
            const res = await fetch(`/api/users/${targetUserId}/follow-status`, { headers });
            if (res.ok) {
                const data = await res.json();
                const flag = data?.data?.isFollowing ?? data?.isFollowing;
                if (data.success && typeof flag !== 'undefined') {
                    setIsFollowing(!!flag);
                }
            }
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    const fetchCountsAndPosts = async (targetUserId, headers, isSelf) => {
        try {
            setLoadingPosts(true);
            setLoadingFollowers(true);
            setLoadingFollowing(true);
            // Followers count
            const [followersRes, followingRes, postsRes] = await Promise.all([
                fetch(`/api/users/${targetUserId}/followers?page=1&limit=50`, { headers }).catch(() => null),
                fetch(`/api/users/${targetUserId}/following?page=1&limit=50`, { headers }).catch(() => null),
                fetch(`/api/posts/user/${targetUserId}`, { headers }).catch(() => null),
            ]);

            let followers = 0;
            let followersList = [];
            if (followersRes?.ok) {
                const data = await followersRes.json();
                followers = data?.data?.pagination?.total ?? data?.data?.followers?.length ?? data?.pagination?.total ?? 0;
                followersList = data?.data?.followers || data?.followers || [];
            }

            let following = 0;
            let followingItems = [];
            if (followingRes?.ok) {
                const data = await followingRes.json();
                following = data?.data?.pagination?.total ?? data?.data?.following?.length ?? data?.pagination?.total ?? 0;
                followingItems = data?.data?.following || data?.following || [];
            }

            let postsList = [];
            if (postsRes?.ok) {
                const data = await postsRes.json();
                postsList = data?.data?.posts || data?.posts || data?.data || [];
            }

            setStats({
                posts: postsList.length,
                followers,
                following,
            });
            setFollowers(followersList);
            setFollowingList(followingItems);
            setPosts(postsList);
        } catch (error) {
            console.error('Error fetching counts/posts:', error);
        } finally {
            setLoadingPosts(false);
            setLoadingFollowers(false);
            setLoadingFollowing(false);
        }
    };

    const handleToggleFollow = async () => {
        if (!profileUser || isOwnProfile) return;
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }
        if (loadingFollow) return;
        setLoadingFollow(true);
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
        const targetId = profileUser.UserId || profileUser.userId;
        const currently = isFollowing;
        setIsFollowing(!currently);
        try {
            const res = await fetch(`/api/users/${targetId}/follow`, {
                method: currently ? 'DELETE' : 'POST',
                headers,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                console.error('Follow/unfollow error', data);
                setIsFollowing(currently);
            } else {
                setStats((prev) => ({
                    ...prev,
                    followers: Math.max(0, prev.followers + (currently ? -1 : 1)),
                }));
            }
        } catch (error) {
            console.error('Follow/unfollow error', error);
            setIsFollowing(currently);
        } finally {
            setLoadingFollow(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-pink-100 pt-24 pb-12 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Loading profile...</p>
                    </div>
                </div>
            </>
        );
    }

    if (!profileUser) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-pink-100 pt-24 pb-12 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
                        <p className="text-gray-600 mb-8">The profile you're looking for doesn't exist.</p>
                        <button
                            onClick={() => navigate('/home')}
                            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold shadow-lg hover:from-rose-600 hover:to-pink-600 transition duration-300"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-bg-light pt-20 pb-12">
                <div className="max-w-screen-xl mx-auto px-4 lg:px-8">
                    {/* Cover + Header */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="h-48 md:h-64 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80')" }}>
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>

                        <div className="px-6 md:px-10 pb-8 relative">
                            <div className="flex flex-col md:flex-row justify-between items-end -mt-12 md:-mt-16 mb-6 gap-4">
                                <div className="relative">
                                    <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                                        <img
                                            src={profileUser.ProfilePictureUrl || getDefaultAvatar(profileUser.FullName || profileUser.Email || 'User')}
                                            alt={profileUser.FullName || 'User'}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-2 border-white rounded-full" title="Online"></div>
                                </div>

                                <div className="flex gap-3 mb-2">
                                    {!isOwnProfile && (
                                        <button
                                            onClick={handleToggleFollow}
                                            disabled={loadingFollow}
                                            className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-rose-500 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition transform hover:-translate-y-0.5 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">person_add</span>
                                            {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                                        </button>
                                    )}
                                    <button className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">chat_bubble</span> Nhắn tin
                                    </button>
                                    {isOwnProfile && (
                                        <button
                                            onClick={() => navigate('/settings?tab=account')}
                                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span> Chỉnh sửa
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="max-w-2xl">
                                <h1 className="text-3xl font-black text-gray-900 mb-1">{profileUser.FullName || 'Người dùng'}</h1>
                                <p className="text-gray-500 font-medium mb-2">@{profileUser.Email?.split('@')[0] || 'user'}</p>
                                {profileUser.Bio && (
                                    <p className="text-gray-600 leading-relaxed mb-6">{profileUser.Bio}</p>
                                )}

                                <div className="flex gap-8 border-t border-gray-100 pt-6">
                                    <div className="text-center md:text-left">
                                        <span className="block text-xl font-black text-gray-900">{stats.posts}</span>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Bài viết</span>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <span className="block text-xl font-black text-gray-900">{stats.followers}</span>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Người theo dõi</span>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <span className="block text-xl font-black text-gray-900">{stats.following}</span>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Đang theo dõi</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs placeholder */}
                    <div className="flex items-center gap-1 mb-6 overflow-x-auto no-scrollbar border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`px-6 py-3 border-b-2 ${activeTab === 'posts' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-800'} font-bold text-sm flex items-center gap-2 whitespace-nowrap`}
                        >
                            <span className="material-symbols-outlined text-lg">grid_view</span> Tất cả
                        </button>
                        <button
                            onClick={() => setActiveTab('followers')}
                            className={`px-6 py-3 border-b-2 ${activeTab === 'followers' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-800'} font-bold text-sm flex items-center gap-2 whitespace-nowrap`}
                        >
                            <span className="material-symbols-outlined text-lg">group</span> Người theo dõi
                        </button>
                        <button
                            onClick={() => setActiveTab('following')}
                            className={`px-6 py-3 border-b-2 ${activeTab === 'following' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-800'} font-bold text-sm flex items-center gap-2 whitespace-nowrap`}
                        >
                            <span className="material-symbols-outlined text-lg">person_search</span> Đang theo dõi
                        </button>
                        <button className="px-6 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-800 font-bold text-sm flex items-center gap-2 whitespace-nowrap transition">
                            <span className="material-symbols-outlined text-lg">map</span> Hành trình
                        </button>
                    </div>

                    {/* Followers / Following Lists / Posts by tab */}
                    {activeTab === 'followers' && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Người theo dõi</h3>
                                    <p className="text-sm text-gray-500">Ai đang theo dõi bạn</p>
                                </div>
                                <span className="text-sm font-semibold text-gray-500">{stats.followers}</span>
                            </div>
                            {loadingFollowers ? (
                                <p className="text-sm text-gray-500">Đang tải...</p>
                            ) : followers.length === 0 ? (
                                <p className="text-sm text-gray-500">Chưa có người theo dõi</p>
                            ) : (
                                <div className="space-y-3">
                                    {followers.map((f) => (
                                        <div key={f.UserId || f.userId || f.FollowerId} className="flex items-center gap-3">
                                            <img
                                                src={f.ProfilePictureUrl || getDefaultAvatar(f.FullName || f.Email || 'User')}
                                                className="h-10 w-10 rounded-full object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{f.FullName || f.fullName || 'User'}</p>
                                                <p className="text-xs text-gray-500 truncate">@{f.Email?.split('@')[0] || f.email?.split('@')[0] || 'user'}</p>
                                            </div>
                                            <button
                                                className="text-sm font-semibold text-rose-500 hover:text-rose-600"
                                                onClick={() => navigate(`/profile/${f.UserId || f.userId || f.FollowerId}`)}
                                            >
                                                Xem
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'following' && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Đang theo dõi</h3>
                                    <p className="text-sm text-gray-500">Bạn đang theo dõi ai</p>
                                </div>
                                <span className="text-sm font-semibold text-gray-500">{stats.following}</span>
                            </div>
                            {loadingFollowing ? (
                                <p className="text-sm text-gray-500">Đang tải...</p>
                            ) : followingList.length === 0 ? (
                                <p className="text-sm text-gray-500">Chưa theo dõi ai</p>
                            ) : (
                                <div className="space-y-3">
                                    {followingList.map((f) => (
                                        <div key={f.UserId || f.userId || f.FollowingId} className="flex items-center gap-3">
                                            <img
                                                src={f.ProfilePictureUrl || getDefaultAvatar(f.FullName || f.Email || 'User')}
                                                className="h-10 w-10 rounded-full object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{f.FullName || f.fullName || 'User'}</p>
                                                <p className="text-xs text-gray-500 truncate">@{f.Email?.split('@')[0] || f.email?.split('@')[0] || 'user'}</p>
                                            </div>
                                            <button
                                                className="text-sm font-semibold text-rose-500 hover:text-rose-600"
                                                onClick={() => navigate(`/profile/${f.UserId || f.userId || f.FollowingId}`)}
                                            >
                                                Xem
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loadingPosts && (
                                <div className="col-span-3 text-center text-gray-500 py-6">Đang tải bài viết...</div>
                            )}
                            {!loadingPosts && posts.length === 0 && (
                                <div className="col-span-3 text-center text-gray-500 py-6">Chưa có bài viết</div>
                            )}
                            {!loadingPosts && posts.map((post) => {
                                const postId = post.PostId || post.postId || post.id;
                                return (
                                    <div key={postId} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 cursor-pointer">
                                        {post.ImageUrl && (
                                            <div className="relative h-56 overflow-hidden">
                                                <img src={post.ImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        )}
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-rose-500 transition">{post.Title || 'Bài viết'}</h3>
                                            {post.Content && (
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.Content}</p>
                                            )}
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>{new Date(post.PublishedAt || post.CreatedAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                                                <span className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-base">favorite</span>
                                                    {post.LikeCount || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProfilePage;

