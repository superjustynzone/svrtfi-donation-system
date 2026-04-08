import React, { useState, useEffect, useRef } from 'react';
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
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const SLIDE_DURATION = 5000; // 5 seconds

    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            fetchStory();
            setCurrentImageIndex(0);
        } catch (e) {
            setError(e.message);
        }
    }, [id]);

    if (error) return <div className="p-20 text-red-600 bg-white">Error: {error}</div>;

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

    const images = story?.images || [];

    // Auto-slide effect
    useEffect(() => {
        if (!story || images.length <= 1 || isPaused) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            return;
        }

        const runNextSlide = () => {
            setCurrentImageIndex(prev => (prev + 1) % images.length);
            setProgress(0);
        };

        timerRef.current = setInterval(runNextSlide, SLIDE_DURATION);

        progressIntervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 0;
                return prev + (100 / (SLIDE_DURATION / 100));
            });
        }, 100);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [story, images.length, isPaused]);

    if (error) return <div className="p-20 text-red-600 bg-white shadow-inner">Error: {error}</div>;
    // Removed full-screen isLoading and !story returns to allow Navbar/Layout to show immediately

    const prevImage = () => {
        setCurrentImageIndex(i => (i - 1 + images.length) % images.length);
        setProgress(0);
    };
    const nextImage = () => {
        setCurrentImageIndex(i => (i + 1) % images.length);
        setProgress(0);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
            <Navbar />

            {/* Hero / Cover Image */}
            <div 
                className="mt-20 relative w-full h-[350px] md:h-[550px] bg-gray-900 overflow-hidden group"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {images.length > 0 ? (
                    <>
                        {/* Blurred Background Layer */}
                        <div className="absolute inset-0 scale-110 blur-3xl opacity-40 transition-opacity duration-1000">
                             <img
                                src={`http://localhost:5000${images[currentImageIndex].image_file}`}
                                alt="Blurred Background"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Main Image */}
                        <img
                            src={`http://localhost:5000${images[currentImageIndex].image_file}`}
                            alt={story.title}
                            className="relative z-10 w-full h-full object-contain transition-all duration-700 ease-in-out"
                        />

                        {images.length > 1 && (
                            <>
                                {/* Glassmorphism Navigation Buttons */}
                                <button
                                    onClick={prevImage}
                                    className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-md text-white p-4 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hover:scale-110 active:scale-95 flex items-center justify-center shadow-2xl"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-md text-white p-4 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hover:scale-110 active:scale-95 flex items-center justify-center shadow-2xl"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>

                                {/* Modern Dot indicators */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { setCurrentImageIndex(idx); setProgress(0); }}
                                            className={`h-2 rounded-full shadow-lg transition-all duration-500 ${idx === currentImageIndex ? 'w-10 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full bg-gray-900" />
                )}

                {/* Gradient overlay at bottom for smoother transition to content */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none" />
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
                    {!story ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    ) : (
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
                    )}
                </div>

                {/* Story Content */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-10">
                    {!story ? (
                        <div className="animate-pulse space-y-6">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    ) : (
                        <div
                            className="prose prose-lg max-w-none text-gray-700 leading-relaxed ql-editor"
                            style={{ padding: 0 }}
                            dangerouslySetInnerHTML={{ __html: story.content }}
                        />
                    )}
                </div>

                {/* Tags */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-10">
                    {!story ? (
                        <div className="animate-pulse flex gap-2">
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </div>
                    ) : story.tags && (
                        <>
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
                        </>
                    )}
                </div>

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
