import React from 'react';

const TrendingTags = ({ tags, onSelectTag }) => {
    return (
        <aside className="hidden lg:flex flex-col gap-5 sticky top-24 h-fit">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Trending Topics</h3>
                </div>
                <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 10).map(tag => (
                            <button
                                key={tag.TagId || tag.tagId || tag.id}
                                onClick={onSelectTag}
                                className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-sm font-semibold hover:bg-rose-100 transition-colors"
                            >
                                #{tag.TagName || tag.tagName || tag.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default TrendingTags;

