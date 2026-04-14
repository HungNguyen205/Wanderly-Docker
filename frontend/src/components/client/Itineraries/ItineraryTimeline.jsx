import React from 'react';

export default function ItineraryTimeline({
  items,
  openMenuId,
  onMenuToggle,
  onDeleteItem,
  onAddClick,
  startDate,
  endDate,
  selectedDate,
  onSelectedDateChange,
}) {
  return (
    <div className="lg:col-span-8 bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Timeline</h2>
        <button
          onClick={onAddClick}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          + Add Item
        </button>
      </div>
      <div className="space-y-4">
        {items && items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.ItineraryItemId}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{item.Title || item.ActivityDescription}</h3>
                  <p className="text-sm text-gray-600">
                    {item.StartTime} - {item.EndTime}
                  </p>
                  {item.Cost > 0 && (
                    <p className="text-sm text-green-600">${item.Cost}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onMenuToggle(item.ItineraryItemId)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    ⋮
                  </button>
                  {openMenuId === item.ItineraryItemId && (
                    <div className="absolute bg-white border rounded-lg shadow-lg p-2">
                      <button
                        onClick={() => onDeleteItem(item.ItineraryItemId)}
                        className="block w-full text-left px-3 py-1 hover:bg-red-50 text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No items yet. Click "Add Item" to get started.</p>
        )}
      </div>
    </div>
  );
}

