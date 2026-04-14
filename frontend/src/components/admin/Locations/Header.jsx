import React from 'react';

export default function Header({ title, sidebarOpen, setSidebarOpen }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 z-10">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-gray-500" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
          <span className="material-symbols-outlined">light_mode</span>
        </button>
      </div>
    </header>
  );
}
