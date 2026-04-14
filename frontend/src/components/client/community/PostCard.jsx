import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    FaBookmark,
    FaComment,
    FaEllipsisH,
    FaHeart,
    FaMapMarkerAlt,
    FaShare,
    FaTrash
} from 'react-icons/fa';
import { getDefaultAvatar } from '@/utils/avatar';
import ConfirmationModal from '@/components/client/common/ConfirmationModal';

const PostCard = ({ post, user, onLike, onDelete }) => {
    const isLiked = post.IsLiked === true || post.IsLiked === 1 || post.isLiked === true || post.isLiked === 1;
    const likeCount = post.LikeCount || post.likeCount || 0;

    // Comment state giữ local vì phức tạp và ít ảnh hưởng global list
    const [commentCount, setCommentCount] = useState(post.CommentCount || post.commentCount || 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [replyTarget, setReplyTarget] = useState(null); // { id, name }
    const [showMenu, setShowMenu] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingContent, setEditingContent] = useState('');

    // Delete comment modal state
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, commentId: null });
    const authorName = post.AuthorName || post.authorName || 'Anonymous User';
    const authorAvatar = post.AuthorAvatar || post.authorAvatar;
    const publishedAt = post.PublishedAt || post.publishedAt || post.CreatedAt || post.createdAt;
    const postId = post.PostId || post.postId || post.id;
    const postUserId = post.UserId || post.userId;

    const currentUserId = user?.UserId || user?.userId || user?.id;
    const isOwner = user && currentUserId && (currentUserId === postUserId || Number(currentUserId) === Number(postUserId));

    useEffect(() => {
        setCommentCount(post.CommentCount || post.commentCount || 0);
    }, [post.CommentCount, post.commentCount]);


    const handleLikeClick = async () => {
        await onLike(postId);
    };

    const handleDeleteClick = () => {
        setShowMenu(false);
        onDelete(postId);
    };

    const loadComments = async () => {
        if (loadingComments) return;

        try {
            setLoadingComments(true);
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(`/api/comments/posts/${postId}/comments?page=1&limit=50`, { headers });
            const data = await res.json();

            if (res.ok && data.success) {
                setComments(data.data.comments || []);
                // Update comment count from server to sync after cascade delete
                if (data.data.pagination?.total !== undefined) {
                    setCommentCount(data.data.pagination.total);
                }
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleToggleComments = () => {
        if (!showComments && comments.length === 0) {
            loadComments();
        }
        setShowComments(!showComments);
    };

    const handleCreateComment = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.info('Please login to comment');
            return;
        }

        if (!newComment.trim()) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(`/api/comments/posts/${postId}/comments`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    Content: newComment.trim(),
                    ParentCommentId: replyTarget?.id || null
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setNewComment('');
                setReplyTarget(null);
                setCommentCount(prev => prev + 1);
                loadComments();
                toast.success('Comment posted');
            } else {
                toast.error(data.message || 'An error occurred');
            }
        } catch (error) {
            console.error('Error creating comment:', error);
            toast.error('An error occurred while posting comment');
        }
    };


    const deleteCommentApi = async (commentId) => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE', headers });
            const data = await res.json();
            if (res.ok && data.success) {
                // Remove the deleted comment locally first for immediate feedback
                setComments(prev => prev.filter(c => (c.CommentId || c.commentId) !== commentId));
                setCommentCount(prev => Math.max(0, prev - 1));
                toast.success('Comment deleted');

                // Reload all comments to sync with database (cascaded deletions from trigger)
                setTimeout(() => {
                    loadComments();
                }, 500); // Small delay to ensure DB trigger finished
            } else {
                toast.error(data.message || 'Cannot delete comment');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('An error occurred while deleting comment');
        }
    };

    const handleDeleteComment = (commentId) => {
        if (!user) {
            toast.info('Please login to delete comment');
            return;
        }
        setDeleteModal({ isOpen: true, commentId });
    };

    const handleStartEdit = (comment) => {
        setEditingCommentId(comment.CommentId || comment.commentId);
        setEditingContent(comment.Content || comment.content || '');
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditingContent('');
    };

    const handleUpdateComment = async () => {
        if (!editingCommentId) return;
        if (!editingContent.trim()) {
            toast.info('Content cannot be empty');
            return;
        }
        try {
            const token = localStorage.getItem('accessToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/comments/${editingCommentId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ Content: editingContent.trim() })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Comment updated');
                setEditingCommentId(null);
                setEditingContent('');
                // refresh comments to show updated content
                loadComments();
            } else {
                toast.error(data.message || 'Cannot update comment');
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            toast.error('An error occurred while updating comment');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Recently';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hr ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    return (
        <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            {/* Post Header */}
            <div className="flex items-center gap-4 p-5">
                <img
                    src={authorAvatar || getDefaultAvatar(authorName)}
                    alt={authorName}
                    className="w-11 h-11 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                    <a href={`/profile/${post.UserId || post.userId}`} className="font-bold text-gray-900 hover:text-rose-600 transition-colors block truncate">
                        {authorName}
                    </a>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{formatDate(publishedAt)}</span>
                    </div>
                </div>

                {/* Menu dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                    >
                        <FaEllipsisH />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            />

                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[150px]">
                                {isOwner && (
                                    <button
                                        onClick={handleDeleteClick}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-left"
                                    >
                                        <FaTrash className="text-sm" />
                                        <span>Delete post</span>
                                    </button>
                                )}
                                {!isOwner && (
                                    <button
                                        onClick={() => setShowMenu(false)}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <FaBookmark className="text-sm" />
                                        <span>Save post</span>
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Post Content */}
            <div className="px-5 pb-5">
                {post.Title && (
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{post.Title}</h3>
                )}
                {post.Content && (
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.Content}</p>
                )}

                {post.ImageUrl && (
                    <div className="rounded-lg overflow-hidden mb-3 cursor-pointer group relative">
                        <img
                            src={post.ImageUrl}
                            alt="Post"
                            className="w-full h-auto max-h-96 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                )}

                {post.ItineraryId && (
                    <a
                        href={`/itineraries/${post.ItineraryId}`}
                        className="flex items-center gap-4 p-4 border border-cyan-200 rounded-lg bg-gradient-to-r from-cyan-50 to-white hover:shadow-md transition-all"
                    >
                        <FaMapMarkerAlt className="text-3xl text-rose-500" />
                        <div>
                            <h4 className="font-bold text-rose-600">Itinerary: {post.ItineraryName || 'Travel Itinerary'}</h4>
                            <p className="text-sm text-gray-600">View itinerary details</p>
                        </div>
                    </a>
                )}
            </div>

            {/* Post Stats */}
            <div className="flex justify-between items-center px-5 py-3 text-sm text-gray-600 border-t border-gray-100">
                <span className="flex items-center gap-1">
                    <FaHeart className={isLiked ? 'text-red-600 fill-red-600' : 'text-red-500'} />
                    {likeCount} likes
                </span>
                <button
                    type="button"
                    onClick={handleToggleComments}
                    className="flex items-center gap-1 text-gray-600 hover:text-rose-600 transition-colors"
                >
                    {commentCount} comments
                </button>
            </div>

            {/* Post Actions */}
            <div className="flex justify-around border-t border-gray-100">
                <button
                    onClick={handleLikeClick}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold transition-colors rounded-lg ${isLiked
                        ? 'text-red-600 bg-red-50'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <FaHeart className={isLiked ? 'fill-current text-red-600' : 'text-gray-600'} />
                    {isLiked ? 'Liked' : 'Like'}
                </button>
                <button
                    onClick={handleToggleComments}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 font-semibold hover:bg-gray-50 transition-colors rounded-lg"
                >
                    <FaComment />
                    Comment
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 font-semibold hover:bg-gray-50 transition-colors rounded-lg">
                    <FaShare />
                    Share
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="px-5 py-4 border-t border-gray-100 space-y-3">
                    {loadingComments ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
                        </div>
                    ) : (
                        <>
                            {comments.length > 0 ? (
                                <>
                                    {comments.slice(0, 5).map(comment => {
                                        const level = comment.Level || comment.level || 0;
                                        const indent = Math.min(level, 4) * 16; // cap indent
                                        const commentId = comment.CommentId || comment.commentId;
                                        const commentUserId = comment.UserId || comment.userId || comment.AuthorId;
                                        const isCommentOwner = currentUserId && commentUserId && Number(currentUserId) === Number(commentUserId);
                                        return (
                                            <div
                                                key={commentId}
                                                className="flex gap-3"
                                                style={{ marginLeft: `${indent}px` }}
                                            >
                                                {level > 0 && (
                                                    <div className="w-4 flex justify-center">
                                                        <div className="h-full border-l border-gray-200" />
                                                    </div>
                                                )}
                                                <img
                                                    src={comment.AuthorAvatar || comment.authorAvatar || getDefaultAvatar(comment.AuthorName || 'User')}
                                                    alt={comment.AuthorName || 'User'}
                                                    className="w-9 h-9 rounded-full object-cover"
                                                />
                                                <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <strong className="text-sm">{comment.AuthorName || comment.authorName}</strong>
                                                        {level > 0 && (
                                                            <span className="text-xs text-gray-500">• Reply</span>
                                                        )}
                                                    </div>

                                                    {editingCommentId === commentId ? (
                                                        <div className="space-y-2">
                                                            <textarea
                                                                value={editingContent}
                                                                onChange={(e) => setEditingContent(e.target.value)}
                                                                rows={3}
                                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                            />
                                                            <div className="flex gap-2 justify-end text-sm">
                                                                <button
                                                                    type="button"
                                                                    onClick={handleCancelEdit}
                                                                    className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleUpdateComment}
                                                                    className="px-3 py-1 rounded-lg bg-rose-500 text-white hover:bg-rose-600"
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.Content || comment.content}</p>
                                                    )}

                                                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                                        <span>{formatDate(comment.CreatedAt || comment.createdAt)}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setReplyTarget({
                                                                    id: commentId,
                                                                    name: comment.AuthorName || comment.authorName || 'User'
                                                                });
                                                            }}
                                                            className="font-semibold text-gray-600 hover:text-rose-600 transition-colors"
                                                        >
                                                            Reply
                                                        </button>
                                                        {isCommentOwner && editingCommentId !== commentId && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartEdit(comment)}
                                                                    className="font-semibold text-gray-600 hover:text-rose-600 transition-colors"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteComment(commentId)}
                                                                    className="font-semibold text-red-600 hover:text-red-700 transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {commentCount > 5 && (
                                        <button
                                            onClick={loadComments}
                                            className="text-sm font-semibold text-gray-600 hover:text-rose-600 transition-colors"
                                        >
                                            View all {commentCount} comments...
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                            )}

                            {user && (
                                <form onSubmit={handleCreateComment} className="flex flex-col gap-3 pt-3 border-t border-gray-100">
                                    {replyTarget && (
                                        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
                                            <span>Replying to {replyTarget.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setReplyTarget(null)}
                                                className="text-gray-500 hover:text-rose-600 font-semibold transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-3 items-center">
                                        <img
                                            src={user.ProfilePictureUrl || getDefaultAvatar(user.FullName || 'User')}
                                            alt="You"
                                            className="w-9 h-9 rounded-full object-cover"
                                        />
                                        <input
                                            type="text"
                                            placeholder={replyTarget ? `Reply to ${replyTarget.name}...` : "Write a comment..."}
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newComment.trim()}
                                            className="px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-semibold hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Delete Comment Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, commentId: null })}
                onConfirm={() => {
                    if (deleteModal.commentId) {
                        deleteCommentApi(deleteModal.commentId);
                    }
                }}
                title="Delete comment?"
                message="This comment and all its replies will be permanently deleted. Are you sure you want to continue?"
                confirmText="Delete"
                cancelText="Cancel"
                isDanger={true}
            />
        </article>
    );
};

export default PostCard;

