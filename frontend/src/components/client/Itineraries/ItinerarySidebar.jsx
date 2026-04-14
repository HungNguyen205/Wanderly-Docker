import React from 'react';

export default function ItinerarySidebar({ items, notes, onNotesChange, checklist }) {
  return (
    <div className="lg:col-span-4 space-y-6">
      {/* Notes Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none"
          placeholder="Add your trip notes here..."
        />
      </div>

      {/* Checklist Section */}
      {checklist && checklist.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Checklist</h2>
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  readOnly
                  className="w-4 h-4"
                />
                <span className={item.checked ? 'line-through text-gray-500' : ''}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Summary</h2>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Total Items: <span className="font-semibold">{items?.length || 0}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

