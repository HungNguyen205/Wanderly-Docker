import React from 'react';

export default function Header({ title, sidebarOpen, setSidebarOpen, isDark, toggleTheme }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (toggleTheme) {
              toggleTheme();
            }
          }}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200 active:scale-95"
          aria-label="Toggle theme"
          type="button"
        >
          <span className="material-symbols-outlined text-xl">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>
    </header>
  );
}
