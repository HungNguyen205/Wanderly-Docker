import React from 'react';

export default function DeleteModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 transform scale-100 transition-transform duration-300">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Delete Location?</h3>
            <p className="text-sm text-gray-500 mt-1">This action will mark the location as deleted (Soft Delete). It can be restored later.</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition">Cancel</button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-[#FF6B6B] text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg shadow-[#FF6B6B]/20 transition">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
