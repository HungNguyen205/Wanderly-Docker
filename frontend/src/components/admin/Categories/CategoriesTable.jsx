import React from 'react';

export default function CategoriesTable({ categories, onDelete, onEdit, onViewDetail }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
            <th className="px-6 py-4">Category Name</th>
            <th className="px-6 py-4">Description</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {categories.map((cat) => (
            <tr key={cat.id} className={`group hover:bg-gray-50 transition-colors ${cat.isDeleted ? 'opacity-60' : ''}`}>
              <td className="px-6 py-4">
                <button 
                  onClick={() => onViewDetail(cat.id)}
                  className="font-bold text-gray-900 group-hover:text-[#FF6B6B] transition-colors text-left hover:underline"
                >
                  {cat.name}
                </button>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600 max-w-md truncate" title={cat.description}>
                  {cat.description || 'No description'}
                </p>
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  cat.isDeleted 
                    ? 'bg-gray-100 text-gray-600' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {cat.isDeleted ? 'Deleted' : 'Active'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {cat.isDeleted ? (
                    <button className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Restore">
                      <span className="material-symbols-outlined text-lg">restore_from_trash</span>
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => onViewDetail(cat.id)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="View Details"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button 
                        onClick={() => onEdit(cat.id)}
                        className="p-2 text-gray-400 hover:text-[#7FFFD4] hover:bg-[#7FFFD4]/10 rounded-lg transition-colors" 
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button 
                        onClick={() => onDelete(cat.id)}
                        className="p-2 text-gray-400 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-lg transition-colors" 
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

