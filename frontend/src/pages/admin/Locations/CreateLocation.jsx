import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '@/components/admin/Layout/AdminLayout';

export default function CreateLocation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    country: '',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
    image: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setFormData(prev => ({ ...prev, image: e.target.files?.[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      // Upload image to Cloudinary if a file is selected
      let imageUrl = '';
      if (formData.image instanceof File) {
        try {
          const uploadData = new FormData();
          uploadData.append("file", formData.image);

          const uploadHeaders = {};
          if (token) {
            uploadHeaders.Authorization = `Bearer ${token}`;
          }

          const uploadRes = await fetch(
            "/api/cloudinary/upload?folder=locations",
            { method: "POST", headers: uploadHeaders, body: uploadData }
          );

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json().catch(() => ({}));
            const message = errorData.message || "Failed to upload image";
            toast.error(message);
            throw new Error(message);
          }

          const uploadResult = await uploadRes.json();
          imageUrl = uploadResult.data?.url || uploadResult.url || uploadResult.secure_url;
          if (!imageUrl) {
            console.error("Upload result missing URL:", uploadResult);
            throw new Error("No image URL returned from upload");
          }
          console.log("Image uploaded successfully:", imageUrl);
        } catch (uploadErr) {
          console.error("Error uploading image:", uploadErr);
          throw new Error("Failed to upload image. Please try again.");
        }
      }

      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Convert to PascalCase for API: { Name, City, Country, Address, Latitude, Longitude, Description, ImageUrl }
      const payload = {
        Name: formData.name,
        City: formData.city,
        Country: formData.country,
        Address: formData.address,
        Latitude: parseFloat(formData.latitude),
        Longitude: parseFloat(formData.longitude),
        Description: formData.description || '',
        ImageUrl: imageUrl || '',
      };

      const res = await fetch('/api/locations', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = responseData.message || responseData.error || `Failed to create location: ${res.status}`;
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Success - show toast and navigate back
      const successMessage = responseData.message || 'Location created successfully!';
      toast.success(successMessage);

      // Navigate after a short delay to show the toast
      setTimeout(() => {
        navigate('/admin/locations');
      }, 1000);
    } catch (err) {
      const errorMessage = err.message || "Failed to create location";
      toast.error(errorMessage);
      console.error('Error creating location:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Create New Location">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => navigate('/admin/locations')}
            className="flex items-center gap-2 text-[#7FFFD4] hover:text-[#5CD6B3] font-semibold mb-6 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Locations
          </button>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add New Location</h2>
              <p className="text-gray-500 text-sm mt-1">Fill in the details to create a new location</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Location Image</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#7FFFD4] transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    accept="image/*"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <span className="material-symbols-outlined text-4xl text-gray-400 block mb-2">image</span>
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                  </label>
                </div>
                {formData.image && (
                  <div className="mt-4">
                    <p className="text-sm text-green-600 mb-2">✓ {formData.image.name}</p>
                    {formData.image instanceof File && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(formData.image)}
                          alt="Preview"
                          className="max-w-xs h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Location Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Musée du Louvre"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Country *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all"
                  >
                    <option value="">Select a country</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Japan">Japan</option>
                    <option value="France">France</option>
                    <option value="Thailand">Thailand</option>
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Paris"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Latitude */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Latitude *</label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 21.0285 (Việt Nam: 8.5 - 23.37)"
                    step="0.0001"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Longitude */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Longitude *</label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="e.g., 105.8542 (Việt Nam: 102.17 - 109.5)"
                    step="0.0001"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g., Rue de Rivoli, 75001 Paris, France"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe this location..."
                  rows="5"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate('/admin/locations')}
                  className="flex-1 px-6 py-2.5 border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </AdminLayout>
  );
}
