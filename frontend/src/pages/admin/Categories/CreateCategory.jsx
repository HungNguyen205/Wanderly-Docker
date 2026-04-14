import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '@/components/admin/Layout/AdminLayout';

export default function CreateCategory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceTypeName: '',
    description: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Convert to PascalCase for API: { ServiceTypeName, Description }
      const payload = {
        ServiceTypeName: formData.serviceTypeName,
        Description: formData.description || '',
      };

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = responseData.message || responseData.error || `Failed to create category: ${res.status}`;
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Success - show toast and navigate back
      const successMessage = responseData.message || 'Category created successfully!';
      toast.success(successMessage);
      
      setTimeout(() => {
        navigate('/admin/categories');
      }, 1000);
    } catch (err) {
      const errorMessage = err.message || "Failed to create category";
      toast.error(errorMessage);
      console.error('Error creating category:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Create New Category">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl">
          {/* Back Button */}
          <button 
            onClick={() => navigate('/admin/categories')}
            className="flex items-center gap-2 text-[#7FFFD4] hover:text-[#5CD6B3] font-semibold mb-6 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Categories
          </button>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add New Category</h2>
              <p className="text-gray-500 text-sm mt-1">Fill in the details to create a new category</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Category Name *</label>
                <input 
                  type="text"
                  name="serviceTypeName"
                  value={formData.serviceTypeName}
                  onChange={handleInputChange}
                  placeholder="e.g., Food & Dining"
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
                  placeholder="Describe this category..."
                  rows="5"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => navigate('/admin/categories')}
                  className="flex-1 px-6 py-2.5 border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-colors text-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Category'}
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

