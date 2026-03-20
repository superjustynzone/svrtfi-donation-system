import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

export default function Stories() {
    const navigate = useNavigate();
    const [stories, setStories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAllStories();
    }, []);

    const fetchAllStories = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/stories/published');
            if (response.ok) {
                const data = await response.json();
                const publishedStories = data.filter(s => s.is_published);
                // Sort by latest published_at (fallback to created_at)
                publishedStories.sort((a, b) => {
                    const dateA = new Date(a.published_at || a.created_at);
                    const dateB = new Date(b.published_at || b.created_at);
                    return dateB - dateA;
                });
                setStories(publishedStories);
            }
        } catch (error) {
            console.error('Error fetching stories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = stories.filter(s =>
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stripHtml(s.content).toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.author?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
            <Navbar />

            {/* Hero */}
            <div className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-4xl font-bold text-white mb-3">Stories</h1>
                    <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
                        Real stories of hope, resilience, and transformation from the people we serve.
                    </p>

                    {/* Hero search bar */}
                    <div className="max-w-xl mx-auto relative">
                        <input
                            type="text"
                            placeholder='Search by title, content, or author…'
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full px-5 py-3.5 pl-12 rounded-xl shadow-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                        <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>


            {/* Stories Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {isLoading ? (
                    <div className="flex justify-center py-24">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#63A6B2]"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <p className="text-gray-400 text-lg font-medium">No stories found</p>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="mt-3 text-[#63A6B2] text-sm font-semibold hover:underline">
                                Clear search
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filtered.map(story => {
                                const wordCount = stripHtml(story.content).split(/\s+/).filter(Boolean).length;
                                const readMins = Math.max(1, Math.round(wordCount / 200));
                                const excerpt = stripHtml(story.content);
                                return (
                                    <div
                                        key={story.story_id}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col p-4"
                                        onClick={() => navigate(`/stories/${story.story_id}`)}
                                    >
                                        <div className="flex gap-4 items-start mb-4">
                                            {/* Square Image */}
                                            <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100">
                                                <img
                                                    src={story.images && story.images.length > 0
                                                        ? `http://localhost:5000${story.images[0].image_file}`
                                                        : 'https://via.placeholder.com/200/63A6B2/FFFFFF?text=Story'}
                                                    alt={story.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="flex flex-col flex-1 min-w-0">
                                                {/* Title */}
                                                <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 leading-snug mb-1.5 group-hover:text-[#63A6B2] transition-colors">
                                                    {story.title}
                                                </h3>

                                                {/* Excerpt */}
                                                <p className="text-xs sm:text-sm text-gray-500 line-clamp-3 leading-relaxed">
                                                    {excerpt.substring(0, 120)}{excerpt.length > 120 ? '…' : ''}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100 mt-auto">
                                            {/* Author avatar */}
                                            <div className="w-6 h-6 rounded-full bg-[#63A6B2] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                                {story.author ? story.author.charAt(0).toUpperCase() : 'S'}
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium truncate">
                                                {story.author || 'Anonymous'}
                                            </span>
                                            <span className="text-gray-200">·</span>
                                            {/* Read time */}
                                            <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {readMins} min read
                                            </span>
                                            <span className="text-gray-200 hidden sm:inline">·</span>
                                            {/* Date */}
                                            <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">
                                                {new Date(story.published_at || story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>

                )}
            </div>

            <Footer />
        </div>
    );
}
