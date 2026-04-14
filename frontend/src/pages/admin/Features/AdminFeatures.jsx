import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '@/components/admin/Layout/AdminLayout';
import FeaturesTable from '@/components/admin/Features/FeaturesTable';
import DeleteModal from '@/components/admin/Features/DeleteModal';

export default function AdminFeatures() {
  const navigate = useNavigate();
  const [features, setFeatures] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const res = await fetch('/api/features');
        if (!res.ok) throw new Error(`API features failed: ${res.status}`);

        const response = await res.json();
        console.log('Features API Response:', response);

        // Handle response format: { success: true, data: [...], message: "..." }
        let list = [];
        if (response.data && Array.isArray(response.data)) {
          list = response.data;
        } else if (Array.isArray(response)) {
          list = response;
        } else if (response.features && Array.isArray(response.features)) {
          list = response.features;
        } else {
          console.error('Unexpected response format:', response);
          throw new Error('Invalid API response format');
        }

        // Map API fields to component fields
        const mappedList = list.map((item) => ({
          id: item.FeatureId || item.featureId || item.id,
          name: item.Name || item.name || '',
          description: item.Description || item.description || '',
          isDeleted: item.IsDeleted || item.isDeleted || false,
        }));

        setFeatures(mappedList);
        setLoading(false);
      } catch (e) {
        setLoading(false);
        toast.error(e.message || "Failed to load features");
        console.error('Error loading features:', e);
      }
    }

    load();
  }, []);

  // Filter features by search term
  const filteredFeatures = features.filter((feature) => {
    const matchesSearch = 
      feature.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setDeleteModalOpen(true);
  };

  const handleEdit = (id) => {
    navigate(`/admin/features/edit/${id}`);
  };

  const handleViewDetail = (id) => {
    navigate(`/admin/features/detail/${id}`);
  };

  const confirmDelete = async () => {
    if (selectedId) {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/features/${selectedId}`, {
          method: 'DELETE',
          headers,
        });

        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errorMessage = responseData.message || responseData.error || `Delete failed: ${res.status}`;
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        // Success - show toast
        const successMessage = responseData.message || 'Feature deleted successfully!';
        toast.success(successMessage);

        // Remove from list
        setFeatures(prev => prev.filter(feat => feat.id !== selectedId));
        closeDeleteModal();
      } catch (err) {
        const errorMessage = err.message || "Failed to delete feature";
        toast.error(errorMessage);
        console.error('Error deleting feature:', err);
      }
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setTimeout(() => setSelectedId(null), 300);
  };

  return (
    <AdminLayout title="Features Management">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Toolbar: Filter & Add */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 md:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
            <input 
              type="text" 
              placeholder="Search by name, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all shadow-sm disabled:opacity-50" 
            />
          </div>

          {/* Add Button */}
          <button 
            onClick={() => navigate('/admin/features/create')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#7FFFD4]/20 hover:shadow-xl hover:scale-105 transition-all duration-300 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add New Feature
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin block mb-2">autorenew</span>
              <p className="text-gray-500">Loading features...</p>
            </div>
          ) : filteredFeatures.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">star</span>
              <p className="text-gray-500">
                {features.length === 0 ? 'No features found' : 'No results match your search'}
              </p>
            </div>
          ) : (
            <FeaturesTable 
              features={filteredFeatures} 
              onDelete={handleDeleteClick} 
              onEdit={handleEdit}
              onViewDetail={handleViewDetail}
            />
          )}
        </div>
      </div>

      <DeleteModal 
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />

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

