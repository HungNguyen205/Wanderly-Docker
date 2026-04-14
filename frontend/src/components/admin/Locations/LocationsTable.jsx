import React from 'react';

export default function LocationsTable({ locations, onDelete, onEdit, onViewDetail }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
            <th className="px-6 py-4">Location Info</th>
            <th className="px-6 py-4">Address</th>
            <th className="px-6 py-4">Coordinates</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {locations.map((loc) => (
            <tr key={loc.id} className={`group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${loc.isDeleted ? 'opacity-60' : ''}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div 
                    className={`h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 bg-cover bg-center shrink-0 cursor-pointer hover:opacity-80 ${loc.isDeleted ? 'grayscale' : ''}`}
                    onClick={() => onViewDetail(loc.id)}
                    style={{ 
                      backgroundImage: loc.image && loc.image !== 'https://via.placeholder.com/100' 
                        ? `url('${loc.image}')` 
                        : 'none',
                      backgroundColor: loc.image && loc.image !== 'https://via.placeholder.com/100' 
                        ? 'transparent' 
                        : undefined
                    }}
                  >
                    {(!loc.image || loc.image === 'https://via.placeholder.com/100') && (
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-2xl flex items-center justify-center h-full">
                        image
                      </span>
                    )}
                  </div>
                  <div>
                    <button 
                      onClick={() => onViewDetail(loc.id)}
                      className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#FF6B6B] transition-colors text-left hover:underline"
                    >
                      {loc.name}
                    </button>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{loc.city}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px]" title={loc.address}>{loc.address}</p>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-fit">
                  <span className="material-symbols-outlined text-[10px]">my_location</span>
                  {loc.coords}
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  loc.isDeleted 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                }`}>
                  {loc.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {loc.isDeleted ? (
                    <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Restore">
                      <span className="material-symbols-outlined text-lg">restore_from_trash</span>
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          console.log('View detail - ID:', loc.id);
                          onViewDetail(loc.id);
                        }}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" 
                        title="View Details"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button 
                        onClick={() => {
                          console.log('Edit - ID:', loc.id);
                          onEdit(loc.id);
                        }}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#7FFFD4] hover:bg-[#7FFFD4]/10 dark:hover:bg-[#7FFFD4]/20 rounded-lg transition-colors" 
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button 
                        onClick={() => {
                          console.log('Delete - ID:', loc.id);
                          onDelete(loc.id);
                        }}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 dark:hover:bg-[#FF6B6B]/20 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
