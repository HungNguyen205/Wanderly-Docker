import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

const DraftList = ({ drafts, onPublishDraft, onDeleteDraft, onBack }) => {
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Your Drafts</h2>
                <button
                    onClick={onBack}
                    className="text-rose-600 hover:text-rose-700 font-semibold"
                >
                    ← Back to feed
                </button>
            </div>

            {drafts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <FaEdit className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">You don't have any drafts</p>
                    <p className="text-gray-400 text-sm mt-2">Unpublished posts will appear here</p>
                </div>
            ) : (
                drafts.map(draft => (
                    <div
                        key={draft.PostId || draft.postId}
                        className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-yellow-400"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded mb-2">
                                    Draft
                                </span>
                                <h3 className="font-bold text-lg text-gray-900">
                                    {draft.Title || 'Untitled'}
                                </h3>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onPublishDraft(draft.PostId || draft.postId)}
                                    className="px-4 py-2 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors text-sm"
                                >
                                    Publish
                                </button>
                                <button
                                    onClick={() => onDeleteDraft(draft.PostId || draft.postId)}
                                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>

                        {draft.Content && (
                            <p className="text-gray-600 mb-3 line-clamp-3">{draft.Content}</p>
                        )}

                        {draft.ImageUrl && (
                            <img
                                src={draft.ImageUrl}
                                alt="Draft"
                                className="w-full h-48 object-cover rounded-lg mb-3"
                            />
                        )}

                        <p className="text-xs text-gray-400">
                            Created: {new Date(draft.CreatedAt).toLocaleString('en-US')}
                        </p>
                    </div>
                ))
            )}
        </div>
    );
};

export default DraftList;

