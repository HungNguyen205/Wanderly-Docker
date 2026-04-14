import React from 'react';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  return (
    <aside className={`md:flex w-64 flex-col bg-white border-r border-gray-200 ${sidebarOpen ? 'flex absolute z-20 h-full' : 'hidden'} md:relative`}>
      <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-200">
        <span className="material-symbols-outlined text-3xl text-transparent bg-clip-text bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B]">travel_explore</span>
        <h2 className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#7FFFD4] to-[#FF6B6B]">Wanderly Admin</h2>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <a href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
          <span className="material-symbols-outlined">dashboard</span> Dashboard
        </a>
        <a href="/admin/locations" className="flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-lg bg-[#7FFFD4]/10 text-gray-900">
          <span className="material-symbols-outlined text-[#5CD6B3]">location_on</span> Locations
        </a>
        <a href="/admin/services" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
          <span className="material-symbols-outlined">concierge</span> Services
        </a>
        <a href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
          <span className="material-symbols-outlined">group</span> Users
        </a>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <img className="h-8 w-8 rounded-full bg-gray-300" src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" />
          <div>
            <p className="text-sm font-bold text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
