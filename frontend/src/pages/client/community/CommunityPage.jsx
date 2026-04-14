import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';
import { toast } from 'react-toastify';
import SidebarNav from '@/components/client/community/SidebarNav';
import CreatePostBox from '@/components/client/community/CreatePostBox';
import DraftList from '@/components/client/community/DraftList';
import PostCard from '@/components/client/community/PostCard';
import CreatePostModal from '@/components/client/community/CreatePostModal';
import ConfirmationModal from '@/components/client/common/ConfirmationModal';
import TrendingTags from '@/components/client/community/TrendingTags';

const CommunityPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createPostOpen, setCreatePostOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [feedFilter, setFeedFilter] = useState('latest'); // latest, trending, following
    const [activeNav, setActiveNav] = useState('feed'); // feed, drafts

    // Delete Confirmation Modal State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    // Create post form
    const [postForm, setPostForm] = useState({
        title: '',
        content: '',
        imageUrl: '',
        tagIds: []
    });
    const [postImageFile, setPostImageFile] = useState(null);
    const [postImagePreview, setPostImagePreview] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const [postsRes, tagsRes] = await Promise.all([
                fetch('/api/posts', { headers }).catch(() => null),
                fetch('/api/tags', { headers }).catch(() => null),
            ]);

            if (postsRes?.ok) {
                const response = await postsRes.json();
                let postsList = [];

                if (response.success && response.data && response.data.posts) {
                    postsList = Array.isArray(response.data.posts) ? response.data.posts : [];
                } else if (response.data && Array.isArray(response.data)) {
                    postsList = response.data;
                } else if (Array.isArray(response)) {
                    postsList = response;
                }

                // Convert IsLiked từ số (0/1) sang boolean
                postsList = postsList.map(post => ({
                    ...post,
                    IsLiked: post.IsLiked === 1 || post.IsLiked === true || post.isLiked === true
                }));

                setPosts(postsList);
            }

            if (tagsRes?.ok) {
                const tagsData = await tagsRes.json();
                let tagsList = [];
                if (tagsData.success && tagsData.data) {
                    tagsList = Array.isArray(tagsData.data) ? tagsData.data : (tagsData.data.tags || []);
                } else if (Array.isArray(tagsData)) {
                    tagsList = tagsData;
                } else if (tagsData.data && Array.isArray(tagsData.data)) {
                    tagsList = tagsData.data;
                }
                setTags(tagsList);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load community data');
        } finally {
            setLoading(false);
        }
    };

    // Load drafts của user
    const loadDrafts = async () => {
        if (!user) return;

        try {
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch('/api/posts/drafts', { headers });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data && data.data.posts) {
                    setDrafts(data.data.posts);
                }
            }
        } catch (error) {
            console.error('Error loading drafts:', error);
        }
    };

    // Publish draft
    const handlePublishDraft = async (postId) => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(`/api/posts/${postId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ Status: 'published' }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('Post published successfully!');
                // Remove from drafts and reload posts
                setDrafts(prev => prev.filter(d => (d.PostId || d.postId) !== postId));
                loadData();
            } else {
                toast.error(data.message || 'Cannot publish post');
            }
        } catch (error) {
            console.error('Error publishing draft:', error);
            toast.error('An error occurred');
        }
    };

    // Confirm Delete Helper
    const confirmDelete = async (postId, type) => {
        setDeleteModal({ isOpen: false, title: '', message: '', onConfirm: null });

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                toast.error('Please login to delete posts');
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const res = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE',
                headers,
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (type === 'draft') {
                    setDrafts(prev => prev.filter(d => (d.PostId || d.postId) !== postId));
                    toast.success('Draft deleted successfully');
                } else {
                    setPosts(prevPosts => prevPosts.filter(post =>
                        (post.PostId || post.postId || post.id) !== postId
                    ));
                    toast.success('Post deleted successfully');
                }
            } else {
                toast.error(data.message || 'Failed to delete. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('An error occurred while deleting. Please try again.');
        }
    };

    // Delete draft
    const handleDeleteDraft = (postId) => {
        setDeleteModal({
            isOpen: true,
            title: 'Delete draft?',
            message: 'This draft will be permanently deleted and cannot be recovered. Are you sure you want to continue?',
            onConfirm: () => confirmDelete(postId, 'draft')
        });
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.info('Please login to create a post');
            navigate('/login');
            return;
        }

        try {
            let imageUrl = postForm.imageUrl;

            if (postImageFile) {
                try {
                    // Upload via backend API for better security and consistency
                    const token = localStorage.getItem('accessToken');
                    const uploadData = new FormData();
                    uploadData.append("file", postImageFile);

                    const uploadRes = await fetch(
                        `/api/cloudinary/upload?folder=posts`,
                        {
                            method: "POST",
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            body: uploadData
                        }
                    );

                    if (!uploadRes.ok) {
                        const errorData = await uploadRes.json().catch(() => ({}));
                        toast.error(errorData.message || "Failed to upload image. Please try again.");
                        return;
                    }

                    const uploadResult = await uploadRes.json();
                    if (uploadResult.success && uploadResult.data?.url) {
                        imageUrl = uploadResult.data.url;
                        // Toast for successful upload (optional, can remove if too verbose)
                        // toast.success('Image uploaded successfully');
                    } else {
                        toast.error("Failed to get image URL from upload response");
                        return;
                    }
                } catch (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    toast.error(uploadError.message || "Failed to upload image. Please try again.");
                    return;
                }
            }

            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const payload = {
                Title: postForm.title,
                Content: postForm.content,
                ImageUrl: imageUrl || null,
                TagIds: selectedTags,
                Status: 'published', // Publish immediately
            };

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            const responseData = await res.json();

            if (res.ok && responseData.success) {
                toast.success(responseData.message || 'Post created successfully!');
                setCreatePostOpen(false);
                setPostForm({ title: '', content: '', imageUrl: '', tagIds: [] });
                setPostImageFile(null);
                setPostImagePreview(null);
                setSelectedTags([]);
                loadData();
            } else {
                toast.error(responseData.message || 'Failed to create post. Please try again.');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error(error.message || 'An error occurred while creating post. Please try again.');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPostImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setPostImagePreview(previewUrl);
        }
    };

    const toggleTag = (tagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const handleLike = async (postId) => {
        if (!user) {
            toast.info('Please login to like posts');
            return;
        }

        // 🔄 Optimistic update: only update on client, no rollback
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if ((post.PostId || post.postId || post.id) === postId) {
                    const currentIsLiked = post.IsLiked === true || post.IsLiked === 1;
                    return {
                        ...post,
                        IsLiked: !currentIsLiked,
                        LikeCount: (post.LikeCount || 0) + (currentIsLiked ? -1 : 1),
                    };
                }
                return post;
            })
        );

        // Send request to server (fire-and-forget), don't modify state based on response
        try {
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(`/api/posts/${postId}/likes`, {
                method: 'POST',
                headers,
            });

            // Log error if needed but DO NOT rollback UI
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                console.error('Error from like API:', data);
            }
        } catch (error) {
            console.error('Error liking post:', error);
            // Don't change UI, just show light error
            toast.error('An error occurred while liking post (only affects server sync).');
        }
    };

    const handleDeletePost = (postId) => {
        if (!user) {
            toast.info('Please login to delete posts');
            return;
        }

        setDeleteModal({
            isOpen: true,
            title: 'Delete post?',
            message: 'This post will be permanently deleted and cannot be recovered. Are you sure you want to continue?',
            onConfirm: () => confirmDelete(postId, 'post')
        });
    };

    const filteredPosts = posts.filter(post => {
        if (feedFilter === 'following' && user) {
            // Filter by following users (simplified - would need following API)
            return true;
        }
        return true;
    });

    // Sort posts based on filter
    const sortedPosts = [...filteredPosts].sort((a, b) => {
        if (feedFilter === 'trending') {
            return (b.LikeCount || 0) - (a.LikeCount || 0);
        }
        // Latest
        const dateA = new Date(a.PublishedAt || a.CreatedAt || 0);
        const dateB = new Date(b.PublishedAt || b.CreatedAt || 0);
        return dateB - dateA;
    });


    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading community...</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 pt-20 md:pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-6 lg:gap-8">
                        {/* LEFT SIDEBAR */}
                        <SidebarNav
                            user={user}
                            activeNav={activeNav}
                            draftCount={drafts.length}
                            onChangeNav={(nav) => setActiveNav(nav)}
                            onShowDrafts={() => {
                                setActiveNav('drafts');
                                loadDrafts();
                            }}
                            onCreatePost={() => user ? setCreatePostOpen(true) : navigate('/login')}
                        />

                        {/* MAIN FEED */}
                        <main className="flex flex-col gap-5 min-w-0">
                            <CreatePostBox
                                user={user}
                                onOpenCreate={() => user ? setCreatePostOpen(true) : navigate('/login')}
                                onNavigateItineraries={() => navigate('/itineraries')}
                            />


                            {/* Feed Filter */}
                            <div className="flex gap-4 border-b border-gray-200 pb-2">
                                <button
                                    onClick={() => setFeedFilter('latest')}
                                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${feedFilter === 'latest'
                                        ? 'text-rose-600 border-rose-600'
                                        : 'text-gray-500 border-transparent hover:text-gray-700'
                                        }`}
                                >
                                    Latest
                                </button>
                                <button
                                    onClick={() => setFeedFilter('trending')}
                                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${feedFilter === 'trending'
                                        ? 'text-rose-600 border-rose-600'
                                        : 'text-gray-500 border-transparent hover:text-gray-700'
                                        }`}
                                >
                                    Trending
                                </button>
                                <button
                                    onClick={() => setFeedFilter('following')}
                                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${feedFilter === 'following'
                                        ? 'text-rose-600 border-rose-600'
                                        : 'text-gray-500 border-transparent hover:text-gray-700'
                                        }`}
                                >
                                    Following
                                </button>
                            </div>

                            {/* Posts Feed or Drafts */}
                            {activeNav === 'drafts' ? (
                                <DraftList
                                    drafts={drafts}
                                    onPublishDraft={handlePublishDraft}
                                    onDeleteDraft={handleDeleteDraft}
                                    onBack={() => setActiveNav('feed')}
                                />
                            ) : (
                                // Normal Posts Feed
                                <div className="space-y-5">
                                    {sortedPosts.length === 0 ? (
                                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                            <p className="text-gray-500 text-lg">No posts yet</p>
                                        </div>
                                    ) : (
                                        sortedPosts.map(post => (
                                            <PostCard
                                                key={post.PostId || post.postId || post.id}
                                                post={post}
                                                user={user}
                                                onLike={handleLike}
                                                onDelete={handleDeletePost}
                                            />
                                        ))
                                    )}
                                </div>
                            )}
                        </main>

                        {/* RIGHT SIDEBAR */}
                        <TrendingTags
                            tags={tags}
                            onSelectTag={() => setFeedFilter('trending')}
                        />
                    </div>
                </div>
            </div>

            {/* Create Post Modal */}
            {createPostOpen && (
                <CreatePostModal
                    user={user}
                    postForm={postForm}
                    setPostForm={setPostForm}
                    postImagePreview={postImagePreview}
                    selectedTags={selectedTags}
                    tags={tags}
                    onImageChange={handleImageChange}
                    onToggleTag={toggleTag}
                    onSubmit={handleCreatePost}
                    onClose={() => {
                        setCreatePostOpen(false);
                        setPostForm({ title: '', content: '', imageUrl: '', tagIds: [] });
                        setPostImageFile(null);
                        setPostImagePreview(null);
                        setSelectedTags([]);
                    }}
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={deleteModal.onConfirm}
                title={deleteModal.title}
                message={deleteModal.message}
                confirmText="Delete"
                cancelText="Cancel"
                isDanger={true}
            />

        </>
    );
};

export default CommunityPage;
