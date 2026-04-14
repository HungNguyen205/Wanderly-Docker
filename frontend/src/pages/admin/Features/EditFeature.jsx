import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '@/components/admin/Layout/AdminLayout';

export default function EditFeature() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    async function load() {
      try {
        if (!id || id === 'undefined') {
          throw new Error('Invalid feature ID');
        }

        setLoading(true);
        const res = await fetch(`/api/features/${id}`);
        if (!res.ok) throw new Error(`Failed to load feature: ${res.status}`);

        const response = await res.json();
        console.log('Feature data response:', response);

        // Handle different response formats
        let feature = null;
        if (response.data && response.data.FeatureId) {
          feature = response.data;
        } else if (response.data && typeof response.data === 'object') {
          feature = response.data;
        } else if (response.feature) {
          feature = response.feature;
        } else if (response.FeatureId || response.featureId) {
          feature = response;
        } else {
          feature = response;
        }

        setFormData({
          name: feature.Name || feature.name || '',
          description: feature.Description || feature.description || '',
        });

        setLoading(false);
      } catch (e) {
        setLoading(false);
        toast.error(e.message || "Failed to load feature");
        console.error('Error loading feature:', e);
      }
    }

    load();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      if (!formData.name) {
        throw new Error('Please fill in all required fields');
      }

      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Convert to PascalCase for API: { Name, Description }
      const payload = {
        Name: formData.name,
        Description: formData.description || '',
      };

      const res = await fetch(`/api/features/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = responseData.message || responseData.error || `Failed to update feature: ${res.status}`;
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Success - show toast
      const successMessage = responseData.message || 'Feature updated successfully!';
      toast.success(successMessage);
      setSuccessMsg(successMessage);
      
      setTimeout(() => {
        navigate('/admin/features');
      }, 1500);
    } catch (err) {
      const errorMessage = err.message || "Failed to update feature";
      toast.error(errorMessage);
      console.error('Error updating feature:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Feature">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin block mb-2">autorenew</span>
            <p className="text-gray-500">Loading feature...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout title="Edit Feature">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl">
          <button 
            onClick={() => navigate('/admin/features')}
            className="flex items-center gap-2 text-[#7FFFD4] hover:text-[#5CD6B3] font-semibold mb-6 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Features
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Edit Feature</h2>
              <p className="text-gray-500 text-sm mt-1">Update the feature details</p>
            </div>

            {successMsg && (
              <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Feature Name *</label>
                <input 
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Free WiFi"
                  required
                  disabled={saving}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe this feature..."
                  rows="5"
                  disabled={saving}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all resize-none disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/admin/features')}
                  className="flex-1 px-6 py-2.5 border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
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

