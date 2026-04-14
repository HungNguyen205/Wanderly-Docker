import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '@/components/admin/Layout/AdminLayout';
import LocationsTable from '@/components/admin/Locations/LocationsTable';
import DeleteModal from '@/components/admin/Locations/DeleteModal';

export default function AdminLocations() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All Countries');
  const [cities, setCities] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const resultsPerPage = 10;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        
        // Build query params according to API: ?page=1&limit=10&keyword=...&city=...
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: resultsPerPage.toString(),
        });
        
        if (searchTerm) {
          params.append('keyword', searchTerm);
        }
        
        if (selectedCountry && selectedCountry !== 'All Countries') {
          params.append('city', selectedCountry);
        }

        const res = await fetch(`/api/locations?${params.toString()}`);
        if (!res.ok) throw new Error(`API locations failed: ${res.status}`);

        const response = await res.json();
        console.log('API Response:', response);

        // Handle different response formats
        let list = [];
        let total = 0;
        
        // Format: { success: true, data: { locations: [...], totalCount: ... } }
        if (response.data && response.data.locations && Array.isArray(response.data.locations)) {
          list = response.data.locations;
          total = response.data.totalCount || response.data.locations.length;
        }
        // Format: { locations: [...] }
        else if (response.locations && Array.isArray(response.locations)) {
          list = response.locations;
          total = response.totalCount || response.total || response.locations.length;
        }
        // Format: { data: [...] }
        else if (response.data && Array.isArray(response.data)) {
          list = response.data;
          total = response.totalCount || response.total || response.data.length;
        }
        // Format: Array directly
        else if (Array.isArray(response)) {
          list = response;
          total = response.length;
        }
        // Format: { results: [...] }
        else if (response.results && Array.isArray(response.results)) {
          list = response.results;
          total = response.totalCount || response.total || response.results.length;
        }
        else {
          console.error('Unexpected response format:', response);
          throw new Error('Invalid API response format');
        }

        // Map API fields to component fields
        const mappedList = list.map((item) => ({
          id: item.LocationId || item.locationId || item.id,
          name: item.Name || item.name || '',
          city: item.City || item.city || '',
          country: item.Country || item.country || '',
          address: item.Address || item.address || '',
          latitude: item.Latitude || item.latitude || '',
          longitude: item.Longitude || item.longitude || '',
          coords: `${item.Latitude || item.latitude || 0}, ${item.Longitude || item.longitude || 0}`,
          image: (item.ImageUrl && item.ImageUrl.trim() !== '') 
            ? item.ImageUrl 
            : (item.imageUrl && item.imageUrl.trim() !== '') 
              ? item.imageUrl 
              : (item.Image && item.Image.trim() !== '') 
                ? item.Image 
                : (item.image && item.image.trim() !== '') 
                  ? item.image 
                  : 'https://via.placeholder.com/100',
          description: item.Description || item.description || '',
          status: item.Status || item.status || 'Active',
          isDeleted: item.IsDeleted || item.isDeleted || false,
        }));

        setLocations(mappedList);
        setTotalResults(total);

        // Extract unique cities from locations
        const citiesList = Array.from(
          new Set(
            mappedList
              .map((l) => l.city)
              .filter(Boolean)
          )
        ).sort();

        setCities(citiesList);
        setLoading(false);
      } catch (e) {
        setLoading(false);
        toast.error(e.message || "Failed to load locations");
        console.error('Error loading locations:', e);
      }
    }

    load();
  }, [currentPage, searchTerm, selectedCountry]);

  // No need for client-side filtering since API handles it
  const paginatedLocations = locations;

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setDeleteModalOpen(true);
  };

  const handleEdit = (id) => {
    navigate(`/admin/locations/edit/${id}`);
  };

  const handleViewDetail = (id) => {
    navigate(`/admin/locations/detail/${id}`);
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

        const res = await fetch(`/api/locations/${selectedId}`, {
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
        const successMessage = responseData.message || 'Location deleted successfully!';
        toast.success(successMessage);

        // Reload locations after delete
        setLocations(prev => prev.filter(loc => loc.id !== selectedId));
        setTotalResults(prev => prev - 1);
        closeDeleteModal();
      } catch (err) {
        const errorMessage = err.message || "Failed to delete location";
        toast.error(errorMessage);
        console.error('Error deleting location:', err);
      }
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setTimeout(() => setSelectedId(null), 300);
  };
  
  return (
    <AdminLayout title="Locations Management">
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          {/* Toolbar: Filter & Add */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            {/* Search & Filter */}
            <div className="flex flex-1 w-full md:w-auto gap-3">
              <div className="relative flex-1 md:max-w-xs">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg">search</span>
                <input 
                  type="text" 
                  placeholder="Search by name, city..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm dark:text-gray-100 focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all shadow-sm disabled:opacity-50" 
                />
              </div>
              <select 
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={loading}
                className="py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#7FFFD4] focus:border-transparent outline-none transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <option value="All Countries">All Countries</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Button */}
            <button 
              onClick={() => navigate('/admin/locations/create')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#7FFFD4]/20 hover:shadow-xl hover:scale-105 transition-all duration-300 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-lg">add_location_alt</span>
              Add New Location
            </button>
          </div>

          {/* Data Table / List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 animate-spin block mb-2">autorenew</span>
                <p className="text-gray-500 dark:text-gray-400">Loading locations...</p>
              </div>
            ) : paginatedLocations.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 block mb-2">location_off</span>
                <p className="text-gray-500 dark:text-gray-400">
                  {locations.length === 0 ? 'No locations found' : 'No results match your search'}
                </p>
              </div>
            ) : (
              <>
                <LocationsTable 
                  locations={paginatedLocations} 
                  onDelete={handleDeleteClick} 
                  onEdit={handleEdit}
                  onViewDetail={handleViewDetail}
                />
                
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-bold text-gray-900 dark:text-gray-100">{locations.length > 0 ? (currentPage - 1) * resultsPerPage + 1 : 0}</span> to{' '}
                    <span className="font-bold text-gray-900 dark:text-gray-100">{Math.min(currentPage * resultsPerPage, totalResults)}</span> of{' '}
                    <span className="font-bold text-gray-900 dark:text-gray-100">{totalResults}</span> results
                  </p>
                  <div className="flex gap-2">
                    <button 
                      disabled={currentPage === 1 || loading}
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    
                    {[...Array(Math.min(5, Math.ceil(totalResults / resultsPerPage)))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        disabled={loading}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#7FFFD4] text-gray-900 font-bold shadow-sm'
                            : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                    })}
                    
                    <button 
                      disabled={currentPage >= Math.ceil(totalResults / resultsPerPage) || loading}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>
              </>
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