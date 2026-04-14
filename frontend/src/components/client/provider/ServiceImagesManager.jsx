import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
    Image, Upload, X, Star, GripVertical, Trash2, Plus,
    Loader2, ImagePlus, Check, AlertCircle
} from 'lucide-react';
import ConfirmationModal from '@/components/client/common/ConfirmationModal';

const ServiceImagesManager = ({ serviceId, onImagesChange }) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, imageId: null, imageUrl: '' });
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const fileInputRef = useRef(null);

    // Load images on mount
    useEffect(() => {
        if (serviceId) {
            loadImages();
        }
    }, [serviceId]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('accessToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const loadImages = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/service-images/service/${serviceId}`);
            const data = await response.json();

            if (data.success) {
                setImages(data.data || []);
                onImagesChange?.(data.data || []);
            }
        } catch (error) {
            console.error('Error loading images:', error);
            toast.error('Failed to load images');
        } finally {
            setLoading(false);
        }
    };

    // Upload single file to Cloudinary
    const uploadToCloudinary = async (file) => {
        const token = localStorage.getItem('accessToken');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/cloudinary/upload?folder=services', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload to Cloudinary');
        }

        const data = await response.json();
        return data.data.url;
    };

    // Delete image from Cloudinary
    const deleteFromCloudinary = async (imageUrl) => {
        if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;

        try {
            const token = localStorage.getItem('accessToken');
            await fetch('/api/cloudinary/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ imageUrl })
            });
        } catch (error) {
            console.error('Error deleting from Cloudinary:', error);
        }
    };

    // Handle file selection
    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate files
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image`);
                return false;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit (same as Cloudinary config)
                toast.error(`${file.name} is too large (max 10MB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setUploading(true);
        setUploadProgress({ current: 0, total: validFiles.length });

        try {
            // Upload each file to Cloudinary
            const uploadedImages = [];
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                setUploadProgress({ current: i + 1, total: validFiles.length });
                try {
                    const url = await uploadToCloudinary(file);
                    uploadedImages.push({
                        url: url,
                        caption: file.name.replace(/\.[^/.]+$/, '') // Remove extension for caption
                    });
                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error);
                    toast.error(`Failed to upload ${file.name}`);
                }
            }

            if (uploadedImages.length === 0) {
                toast.error('No images were uploaded');
                return;
            }

            // Add images to database via API
            const response = await fetch(`/api/service-images/service/${serviceId}/bulk`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ images: uploadedImages })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
                loadImages();
            } else {
                toast.error(data.message || 'Failed to save images');
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Failed to upload images');
        } finally {
            setUploading(false);
            setUploadProgress({ current: 0, total: 0 });
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Add image by URL
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newImageCaption, setNewImageCaption] = useState('');

    const handleAddByUrl = async () => {
        if (!newImageUrl.trim()) {
            toast.error('Please enter an image URL');
            return;
        }

        try {
            setUploading(true);
            const response = await fetch(`/api/service-images/service/${serviceId}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    imageUrl: newImageUrl.trim(),
                    caption: newImageCaption.trim() || null
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Image added successfully');
                setNewImageUrl('');
                setNewImageCaption('');
                setShowUrlInput(false);
                loadImages();
            } else {
                toast.error(data.message || 'Failed to add image');
            }
        } catch (error) {
            console.error('Error adding image:', error);
            toast.error('Failed to add image');
        } finally {
            setUploading(false);
        }
    };

    // Set as primary image
    const handleSetPrimary = async (imageId) => {
        try {
            const response = await fetch(`/api/service-images/${imageId}/primary`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Primary image updated');
                loadImages();
            } else {
                toast.error(data.message || 'Failed to set primary image');
            }
        } catch (error) {
            console.error('Error setting primary:', error);
            toast.error('Failed to set primary image');
        }
    };

    // Delete image
    const handleDelete = (image) => {
        setDeleteModal({
            open: true,
            imageId: image.ImageId,
            imageUrl: image.ImageUrl
        });
    };

    const confirmDelete = async () => {
        try {
            // Delete from database
            const response = await fetch(`/api/service-images/${deleteModal.imageId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                // Also delete from Cloudinary
                await deleteFromCloudinary(deleteModal.imageUrl);
                toast.success('Image deleted successfully');
                loadImages();
            } else {
                toast.error(data.message || 'Failed to delete image');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.error('Failed to delete image');
        } finally {
            setDeleteModal({ open: false, imageId: null, imageUrl: '' });
        }
    };

    // Drag and drop reordering
    const handleDragStart = (index) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedImage);

        setImages(newImages);
        setDraggedIndex(index);
    };

    const handleDragEnd = async () => {
        if (draggedIndex === null) return;

        // Save new order to server
        const imageOrders = images.map((img, index) => ({
            imageId: img.ImageId,
            order: index
        }));

        try {
            const response = await fetch(`/api/service-images/service/${serviceId}/reorder`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ imageOrders })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Image order saved');
            } else {
                toast.error('Failed to save order');
                loadImages(); // Reload to reset
            }
        } catch (error) {
            console.error('Error saving order:', error);
            loadImages();
        }

        setDraggedIndex(null);
    };

    // Update caption
    const handleUpdateCaption = async (imageId, caption) => {
        try {
            const response = await fetch(`/api/service-images/${imageId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ caption })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Caption updated');
                loadImages();
            }
        } catch (error) {
            console.error('Error updating caption:', error);
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading images...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <Image className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Service Images
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {images.length} image{images.length !== 1 ? 's' : ''} • Drag to reorder
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="flex items-center gap-2 px-4 py-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add URL
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {uploadProgress.total > 1
                                    ? `${uploadProgress.current}/${uploadProgress.total}`
                                    : 'Uploading...'}
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Upload
                            </>
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Add by URL Input */}
            {showUrlInput && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="url"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="Image URL (https://...)"
                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                            type="text"
                            value={newImageCaption}
                            onChange={(e) => setNewImageCaption(e.target.value)}
                            placeholder="Caption (optional)"
                            className="md:w-48 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddByUrl}
                                disabled={uploading || !newImageUrl.trim()}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Add
                            </button>
                            <button
                                onClick={() => {
                                    setShowUrlInput(false);
                                    setNewImageUrl('');
                                    setNewImageCaption('');
                                }}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Images Grid */}
            {images.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <ImagePlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">No images yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        Upload images or add by URL to showcase your service
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div
                            key={image.ImageId}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-move ${index === 0
                                ? 'border-yellow-400 ring-2 ring-yellow-200 dark:ring-yellow-900/50'
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                } ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
                        >
                            {/* Primary Badge */}
                            {index === 0 && (
                                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                                    <Star className="w-3 h-3 fill-current" />
                                    Primary
                                </div>
                            )}

                            {/* Drag Handle */}
                            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="p-1 bg-black/50 rounded">
                                    <GripVertical className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            {/* Image */}
                            <div className="aspect-square bg-gray-100 dark:bg-gray-700">
                                <img
                                    src={image.ImageUrl}
                                    alt={image.Caption || 'Service image'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/300?text=Image+Error';
                                    }}
                                />
                            </div>

                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {index !== 0 && (
                                    <button
                                        onClick={() => handleSetPrimary(image.ImageId)}
                                        className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                                        title="Set as primary"
                                    >
                                        <Star className="w-5 h-5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(image)}
                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    title="Delete image"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Caption */}
                            {image.Caption && (
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                                    <p className="text-white text-xs truncate">{image.Caption}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Info */}
            <div className="mt-4 flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                    The first image will be used as the primary/thumbnail image.
                    Drag images to reorder. Recommended size: 800x600px or larger.
                </p>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, imageId: null, imageUrl: '' })}
                onConfirm={confirmDelete}
                title="Delete Image"
                message="Are you sure you want to delete this image? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isDanger={true}
                icon="trash"
            />
        </div>
    );
};

export default ServiceImagesManager;

