import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function Sidebar({ sidebarOpen, setSidebarOpen, isDark }) {
  const location = useLocation();
  const [adminUser, setAdminUser] = useState(null);
  
  useEffect(() => {
    // Get admin user info from localStorage
    const savedAdminUser = localStorage.getItem('adminUser');
    const savedUser = localStorage.getItem('user');
    
    if (savedAdminUser) {
      try {
        setAdminUser(JSON.parse(savedAdminUser));
      } catch (e) {
        console.error('Error parsing adminUser:', e);
      }
    } else if (savedUser) {
      try {
        setAdminUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);
  
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/locations', label: 'Locations', icon: 'location_on' },
    { path: '/admin/categories', label: 'Categories', icon: 'category' },
    { path: '/admin/features', label: 'Features', icon: 'star' },
    { path: '/admin/backup', label: 'Backup & Restore', icon: 'backup' },
  ];

  return (
    <aside className={`md:flex w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${sidebarOpen ? 'flex absolute z-20 h-full' : 'hidden'} md:relative transition-colors duration-200`}>
      <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-200 dark:border-gray-700">
        <span className="material-symbols-outlined text-3xl text-transparent bg-clip-text bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B]">travel_explore</span>
        <h2 className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B]">Wanderly Admin</h2>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                active
                  ? 'font-bold bg-[#7FFFD4]/10 dark:bg-[#7FFFD4]/20 text-gray-900 dark:text-gray-100'
                  : 'font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className={`material-symbols-outlined ${active ? 'text-[#5CD6B3] dark:text-[#7FFFD4]' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <img 
            className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600" 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminUser?.FullName || 'Admin')}&background=7FFFD4&color=fff&bold=true`} 
            alt={adminUser?.FullName || 'Admin'} 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {adminUser?.FullName || 'Admin User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {adminUser?.Email || adminUser?.Role || 'Super Admin'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
