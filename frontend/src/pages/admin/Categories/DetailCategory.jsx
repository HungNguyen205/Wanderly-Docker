import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/Layout/AdminLayout';

export default function DetailCategory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/categories/${id}`);
        if (!res.ok) throw new Error(`Failed to load category: ${res.status}`);

        const response = await res.json();
        console.log('Category detail response:', response);

        // Handle different response formats
        let categoryData = null;
        if (response.data && response.data.CategoryID) {
          categoryData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          categoryData = response.data;
        } else if (response.category) {
          categoryData = response.category;
        } else if (response.CategoryID || response.categoryId) {
          categoryData = response;
        } else {
          categoryData = response;
        }

        setCategory({
          id: categoryData.CategoryID || categoryData.categoryId || categoryData.id,
          name: categoryData.ServiceTypeName || categoryData.serviceTypeName || categoryData.name || '',
          description: categoryData.Description || categoryData.description || '',
        });

        setLoading(false);
      } catch (e) {
        setLoading(false);
        console.error('Error loading category:', e);
      }
    }

    load();
  }, [id]);

  return (
    <AdminLayout title="Category Details">
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

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin block mb-2">autorenew</span>
              <p className="text-gray-500">Loading category details...</p>
            </div>
          ) : category ? (
            <>
              {/* Main Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
                </div>

                <div className="p-6 space-y-6">
                  {/* Description */}
                  {category.description && (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                      <p className="text-gray-700 p-3 bg-gray-50 rounded-xl whitespace-pre-wrap">{category.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => navigate('/admin/categories')}
                  className="flex-1 px-6 py-2.5 border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-colors text-center"
                >
                  Back
                </button>
                <button 
                  onClick={() => navigate(`/admin/categories/edit/${id}`)}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B] text-white font-bold rounded-xl hover:shadow-lg transition-all text-center flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Edit Category
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">category</span>
              <p className="text-gray-500">Category not found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

