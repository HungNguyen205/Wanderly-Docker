import React from 'react';

export default function TitleSection({
  tripName,
  onTripNameChange,
  totalBudget,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">{tripName || 'Untitled Trip'}</h1>
        <div className="text-lg font-semibold text-gray-700">
          Budget: ${totalBudget || 0}
        </div>
      </div>
      <div className="flex gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

