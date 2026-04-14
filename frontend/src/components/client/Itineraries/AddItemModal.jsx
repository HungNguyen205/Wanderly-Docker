import React from 'react';

export default function AddItemModal({
  isOpen,
  modalTab,
  onTabChange,
  onClose,
  onAddItem,
  formData,
  onFormChange,
  searchResults,
  showDropdown,
  onSelectLocation,
  onNameChange,
  items,
  selectedDate,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Add New Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => onTabChange('place')}
            className={`px-6 py-3 font-semibold ${
              modalTab === 'place'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-600'
            }`}
          >
            Place
          </button>
          <button
            onClick={() => onTabChange('service')}
            className={`px-6 py-3 font-semibold ${
              modalTab === 'service'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-600'
            }`}
          >
            Service
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onAddItem(); }} className="p-6 space-y-4">
          {/* Name Input with Search */}
          <div className="relative">
            <label className="block text-sm font-semibold mb-2">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onNameChange}
              placeholder="Search or enter location name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            {showDropdown && searchResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.LocationId || result.id}
                    type="button"
                    onClick={() => onSelectLocation(result)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    {result.Name || result.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              name="desc"
              value={formData.desc}
              onChange={(e) => onFormChange('desc', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
              rows="3"
            />
          </div>

          {/* Time and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={(e) => onFormChange('time', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={(e) => onFormChange('duration', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                min="0"
              />
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-semibold mb-2">Cost ($)</label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={(e) => onFormChange('cost', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              min="0"
              step="0.01"
            />
          </div>

          {/* Service Type (if service tab) */}
          {modalTab === 'service' && (
            <div>
              <label className="block text-sm font-semibold mb-2">Service Type</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={(e) => onFormChange('serviceType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Restaurant Reservation">Restaurant Reservation</option>
                <option value="Hotel Booking">Hotel Booking</option>
                <option value="Flight Booking">Flight Booking</option>
                <option value="Activity Booking">Activity Booking</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

