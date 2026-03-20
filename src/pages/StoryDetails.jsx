import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

export default function StoryDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [story, setStory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        fetchStory();
        setCurrentImageIndex(0);
    }, [id]);

    const fetchStory = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:5000/api/stories/${id}`);
            if (response.ok) {
                const data = await response.json();
                setStory(data);
            } else {
                navigate('/stories');
            }
        } catch (error) {
            console.error('Error fetching story:', error);
            navigate('/stories');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#63A6B2]"></div>
            </div>
        );
    }

    if (!story) return null;

    const images = story.images || [];
    const prevImage = () => setCurrentImageIndex(i => (i - 1 + images.length) % images.length);
    const nextImage = () => setCurrentImageIndex(i => (i + 1) % images.length);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
            <Navbar />

            {/* Hero / Cover Image */}
            <div className="mt-20 relative w-full h-[320px] md:h-[480px] bg-gray-900 overflow-hidden group">
                {images.length > 0 ? (
                    <>
                        <img
                            src={`http://localhost:5000${images[currentImageIndex].image_file}`}
                            alt={story.title}
                            className="w-full h-full object-contain transition-opacity duration-500"
                        />
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                                {/* Dot indicators */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`h-2 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                        <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[#63A6B2] font-semibold text-sm hover:underline mb-8"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Stories
                </button>

                {/* Meta card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-10">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        {/* Title + Subtitle */}
                        <div className="flex-1">
                            <p className="text-xs font-bold text-[#63A6B2] uppercase tracking-widest mb-2">Story</p>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-2">
                                {story.title}
                            </h1>
                            {story.subtitle && (
                                <p className="text-[#63A6B2] font-semibold text-lg">{story.subtitle}</p>
                            )}
                        </div>

                        {/* Date + Author */}
                        <div className="flex flex-col gap-3 text-right shrink-0">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Published</p>
                                <p className="text-gray-800 font-semibold">
                                    {new Date(story.published_at || story.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </p>
                            </div>
                            {story.author && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Author</p>
                                    <p className="text-gray-800 font-semibold">{story.author}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Story Content */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-10">
                    <div
                        className="prose prose-lg max-w-none text-gray-700 leading-relaxed ql-editor"
                        style={{ padding: 0 }}
                        dangerouslySetInnerHTML={{ __html: story.content }}
                    />
                </div>

                {/* Tags */}
                {story.tags && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-10">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tags</p>
                        <div className="flex flex-wrap gap-2">
                            {story.tags.split(',').map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-100"
                                >
                                    #{tag.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Back to stories */}
                <div className="flex justify-center">
                    <button
                        onClick={() => navigate('/stories')}
                        className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white px-10 py-3 rounded-full font-bold text-sm hover:shadow-xl transition-all hover:scale-105"
                    >
                        ← Browse All Stories
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    );
}
