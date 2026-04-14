import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/Layout/AdminLayout';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLocations: 0,
    totalCategories: 0,
    totalFeatures: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Load stats from multiple endpoints
      const [locationsRes, categoriesRes, featuresRes] = await Promise.all([
        fetch('/api/locations?page=1&limit=1', { headers }).catch(() => null),
        fetch('/api/categories', { headers }).catch(() => null),
        fetch('/api/features', { headers }).catch(() => null),
      ]);

      let totalLocations = 0;
      let totalCategories = 0;
      let totalFeatures = 0;

      if (locationsRes?.ok) {
        const locationsData = await locationsRes.json();
        totalLocations = locationsData.data?.totalCount || locationsData.totalCount || 0;
      }

      if (categoriesRes?.ok) {
        const categoriesData = await categoriesRes.json();
        totalCategories = Array.isArray(categoriesData) ? categoriesData.length : (categoriesData.data?.length || 0);
      }

      if (featuresRes?.ok) {
        const featuresData = await featuresRes.json();
        totalFeatures = Array.isArray(featuresData) ? featuresData.length : (featuresData.data?.length || 0);
      }

      setStats({
        totalLocations,
        totalCategories,
        totalFeatures,
        totalUsers: 0, // Placeholder - implement when users API is available
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Locations',
      value: stats.totalLocations,
      icon: 'location_on',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      link: '/admin/locations',
    },
    {
      title: 'Total Categories',
      value: stats.totalCategories,
      icon: 'category',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      link: '/admin/categories',
    },
    {
      title: 'Total Features',
      value: stats.totalFeatures,
      icon: 'star',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      link: '/admin/features',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: 'group',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      link: '/admin/users',
    },
  ];

  const quickActions = [
    { label: 'Add Location', icon: 'add_location', path: '/admin/locations/create', color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'Add Category', icon: 'add_circle', path: '/admin/categories/create', color: 'bg-purple-500 hover:bg-purple-600' },
    { label: 'Add Feature', icon: 'add', path: '/admin/features/create', color: 'bg-amber-500 hover:bg-amber-600' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your travel platform from here</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statCards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.link)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor} dark:opacity-80`}>
                  <span className={`material-symbols-outlined ${card.iconColor} dark:text-gray-300 text-2xl`}>
                    {card.icon}
                  </span>
                </div>
                <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${card.color} opacity-10 dark:opacity-20`}></div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</h3>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{card.value.toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`${action.color} text-white px-6 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-sm hover:shadow-md`}
              >
                <span className="material-symbols-outlined">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity / Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7FFFD4]">info</span>
              System Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Platform</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">Wanderly Travel Planner</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Version</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">1.0.0</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Management Links */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF6B6B]">settings</span>
              Management
            </h2>
            <div className="space-y-2">
              {[
                { label: 'Locations Management', path: '/admin/locations', icon: 'location_on' },
                { label: 'Categories Management', path: '/admin/categories', icon: 'category' },
                { label: 'Features Management', path: '/admin/features', icon: 'star' },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 group-hover:text-[#7FFFD4] transition-colors">
                      {item.icon}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 group-hover:text-[#FF6B6B] transition-colors">
                    arrow_forward
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

