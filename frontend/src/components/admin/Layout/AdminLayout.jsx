import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Initialize theme state
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminTheme');
      if (saved) {
        return saved === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  const [isDark, setIsDark] = useState(getInitialTheme);

  // Apply theme on mount and when isDark changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('adminTheme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('adminTheme', 'light');
    }
  }, [isDark]);

  // Apply theme immediately on mount
  useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem('adminTheme');
    if (saved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <div className={`bg-white dark:bg-gray-900 font-['Manrope'] text-gray-800 dark:text-gray-100 min-h-screen flex overflow-hidden transition-colors duration-200`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isDark={isDark} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header title={title} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isDark={isDark} toggleTheme={toggleTheme} />
        {children}
      </main>
    </div>
  );
}

