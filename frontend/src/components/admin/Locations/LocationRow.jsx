import React from 'react';

export default function LocationRow({ location, onDelete }) {
  const isDeleted = location.status === 'Deleted';

  return (
    <tr className={`group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isDeleted ? 'opacity-60' : ''}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div 
            className={`h-12 w-12 rounded-lg bg-gray-200 bg-cover bg-center shrink-0 ${isDeleted ? 'grayscale' : ''}`}
            style={{ backgroundImage: `url('${location.image}')` }}
          />
          <div>
            <div className="font-bold text-gray-900 dark:text-white group-hover:text-accent transition-colors">
              {location.name}
            </div>
            <div className="text-xs text-gray-500">
              {location.city}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]" title={location.address}>
          {location.address}
        </p>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 text-xs text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded w-fit">
          <span className="material-symbols-outlined text-[10px]">my_location</span>
          {location.coordinates}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
          isDeleted
            ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {location.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {isDeleted ? (
            <button 
              className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors" 
              title="Restore"
            >
              <span className="material-symbols-outlined text-lg">restore_from_trash</span>
            </button>
          ) : (
            <>
              <button 
                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" 
                title="Edit"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              <button 
                onClick={() => onDelete(location.id)}
                className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" 
                title="Delete"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
