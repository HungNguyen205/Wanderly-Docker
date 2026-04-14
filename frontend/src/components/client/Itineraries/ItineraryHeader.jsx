import React from 'react';

export default function ItineraryHeader({ tripName, onTripNameChange, onSave }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={tripName}
          onChange={(e) => onTripNameChange(e.target.value)}
          className="text-2xl font-bold border-none outline-none bg-transparent"
          placeholder="Trip Name"
        />
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </header>
  );
}

