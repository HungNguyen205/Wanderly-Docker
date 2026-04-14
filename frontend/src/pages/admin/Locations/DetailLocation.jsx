import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/Layout/AdminLayout';

export default function DetailLocation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/locations/${id}`);
        if (!res.ok) throw new Error(`Failed to load location: ${res.status}`);

        const response = await res.json();
        console.log('Location detail response:', response);

        // Handle different response formats
        // Format: { success: true, data: { LocationId, Name, ... } }
        let locationData = null;
        if (response.data && response.data.LocationId) {
          locationData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          locationData = response.data;
        } else if (response.location) {
          locationData = response.location;
        } else if (response.LocationId || response.locationId) {
          locationData = response;
        } else {
          locationData = response;
        }

        setLocation({
          id: locationData.LocationId || locationData.locationId || locationData.id || locationData._id,
          name: locationData.Name || locationData.name || '',
          city: locationData.City || locationData.city || '',
          country: locationData.Country || locationData.country || '',
          address: locationData.Address || locationData.address || '',
          latitude: locationData.Latitude || locationData.latitude || '',
          longitude: locationData.Longitude || locationData.longitude || '',
          description: locationData.Description || locationData.description || '',
          image: locationData.ImageUrl || locationData.imageUrl || locationData.Image || locationData.image || 'https://via.placeholder.com/400',
          status: locationData.Status || locationData.status || 'Active',
          createdAt: locationData.CreatedAt || locationData.createdAt || '',
          updatedAt: locationData.UpdatedAt || locationData.updatedAt || '',
        });

        setLoading(false);
      } catch (e) {
        setLoading(false);
        console.error('Error loading location:', e);
      }
    }

    load();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout title="Location Details">
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

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin block mb-2">autorenew</span>
              <p className="text-gray-500">Loading location details...</p>
            </div>
          ) : location ? (
              <>
                {/* Image Section */}
                {location.image && (
                  <div className="mb-6 rounded-2xl overflow-hidden shadow-sm border border-gray-200 h-96">
                    <img 
                      src={location.image} 
                      alt={location.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Main Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">{location.name}</h1>
                        <p className="text-gray-500 text-sm mt-1">{location.city}, {location.country}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        location.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {location.status}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="p-6 space-y-6">
                    {/* Address */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Address</label>
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="material-symbols-outlined text-[#7FFFD4] mt-1">location_on</span>
                        <p className="text-gray-700">{location.address}</p>
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Latitude</label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                          <span className="material-symbols-outlined text-[#7FFFD4]">global</span>
                          <p className="text-gray-700 font-mono text-sm">{location.latitude}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Longitude</label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                          <span className="material-symbols-outlined text-[#7FFFD4]">global</span>
                          <p className="text-gray-700 font-mono text-sm">{location.longitude}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {location.description && (
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                        <p className="text-gray-700 p-3 bg-gray-50 rounded-xl whitespace-pre-wrap">{location.description}</p>
                      </div>
                    )}

                    {/* Meta Information */}
                    <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Created At</p>
                        <p className="text-gray-900 font-medium">{formatDate(location.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Updated At</p>
                        <p className="text-gray-900 font-medium">{formatDate(location.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => navigate('/admin/locations')}
                    className="flex-1 px-6 py-2.5 border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-colors text-center"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/locations/edit/${id}`)}
                    className="flex-1 px-6 py-2.5 bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B] text-white font-bold rounded-xl hover:shadow-lg transition-all text-center flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                    Edit Location
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">location_off</span>
                <p className="text-gray-500">Location not found</p>
              </div>
            )}
          </div>
        </div>
    </AdminLayout>
  );
}
