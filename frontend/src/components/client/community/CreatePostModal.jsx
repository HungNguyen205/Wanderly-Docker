import React from 'react';
import { FaImage, FaTimes } from 'react-icons/fa';

const CreatePostModal = ({
    postForm,
    setPostForm,
    postImagePreview,
    selectedTags,
    tags,
    onImageChange,
    onToggleTag,
    onSubmit,
    onClose
}) => {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Create Post</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <FaTimes className="text-gray-500" />
                        </button>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Title (optional)"
                                value={postForm.title}
                                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                        </div>

                        <div>
                            <textarea
                                placeholder="What's on your mind?"
                                value={postForm.content}
                                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                                required
                                rows={6}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                            />
                        </div>

                        {postImagePreview && (
                            <div className="relative">
                                <img
                                    src={postImagePreview}
                                    alt="Preview"
                                    className="w-full rounded-lg max-h-64 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        onImageChange({ target: { files: [] } });
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        )}

                        <div>
                            <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <FaImage className="text-rose-500" />
                                <span className="text-sm text-gray-700">Add photo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <button
                                        key={tag.TagId || tag.tagId || tag.id}
                                        type="button"
                                        onClick={() => onToggleTag(tag.TagId || tag.tagId || tag.id)}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTags.includes(tag.TagId || tag.tagId || tag.id)
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tag.TagName || tag.tagName || tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-medium hover:from-rose-600 hover:to-pink-600 transition-colors"
                            >
                                Post
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;

