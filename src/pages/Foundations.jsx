import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Foundations() {
    const navigate = useNavigate();
    const [foundations, setFoundations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFocusArea, setSelectedFocusArea] = useState('All');
    const [isLoading, setIsLoading] = useState(true);

    const focusAreas = ['All', 'Broadcasting', 'Education', 'Healthcare', 'Community Development', 'Elderly Care', 'Environment', 'Poverty Alleviation'];

    useEffect(() => {
        fetchFoundations();
    }, []);

    const fetchFoundations = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/foundations/all');

            if (response.ok) {
                const data = await response.json();
                // Transform data to ensure focus_areas is an array for filtering
                const transformedData = data.map(f => ({
                    ...f,
                    focus_areas_list: f.focus_areas
                        ? f.focus_areas.split(',').map(item => item.trim())
                        : []
                }));
                setFoundations(transformedData);
            } else {
                console.error('Failed to fetch foundations');
            }
        } catch (error) {
            console.error('Error fetching foundations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredFoundations = foundations.filter(foundation => {
        const matchesSearch =
            foundation.foundation_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            foundation.about_foundation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            foundation.mission?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFocusArea =
            selectedFocusArea === 'All' ||
            foundation.focus_areas_list.some(area =>
                area.toLowerCase().includes(selectedFocusArea.toLowerCase())
            );

        return matchesSearch && matchesFocusArea;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#63A6B2]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
            <Navbar />

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] border-gray-200 mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-white mb-3">Partner Foundations</h1>
                        <p className="text-lg text-white max-w-2xl mx-auto">
                            Discover organizations making meaningful impact across the Philippines
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar - Filters on the left */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            {/* Search */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Search</h3>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search foundations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-[#63A6B2] outline-none text-sm"
                                    />
                                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Focus Area Filter */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Focus Areas</h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto lg:max-h-none">
                                    {focusAreas.map(area => (
                                        <button
                                            key={area}
                                            onClick={() => setSelectedFocusArea(area)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedFocusArea === area
                                                ? 'bg-[#63A6B2] text-white'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            {area}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Results Count */}
                            <div className="hidden lg:block bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-lg shadow-sm p-4 text-white">
                                <div className="text-3xl font-bold">{filteredFoundations.length}</div>
                                <div className="text-sm text-white/90">
                                    {filteredFoundations.length === 1 ? 'Foundation' : 'Foundations'} Found
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Foundation Cards */}
                    <div className="flex-1">
                        {filteredFoundations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredFoundations.map(foundation => (
                                    <div
                                        key={foundation.foundation_id}
                                        onClick={() => navigate(`/foundations/${foundation.foundation_id}`)}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full"
                                    >
                                        {/* Image Section */}
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={foundation.image_cover ? `http://localhost:5000${foundation.image_cover}` : 'https://via.placeholder.com/800x400/63A6B2/FFFFFF?text=Helping+Hands'}
                                                alt={foundation.foundation_name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent"></div>

                                            {/* Logo Avatar - Absolute positioned overlapping image and content */}
                                            <div className="absolute bottom-0 left-5 translate-y-1/2">
                                                <div className="w-16 h-16 rounded-xl border-4 border-white shadow-md bg-white overflow-hidden">
                                                    {foundation.image_logo ? (
                                                        <img
                                                            src={`http://localhost:5000${foundation.image_logo}`}
                                                            alt="Logo"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs">
                                                            LOGO
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="flex-1 p-5 pt-10 flex flex-col">
                                            <div className="mb-3">
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#63A6B2] transition-colors line-clamp-1">
                                                    {foundation.foundation_name}
                                                </h3>
                                                {foundation.established && (
                                                    <p className="text-xs text-gray-500 font-medium mt-1">
                                                        Est. {foundation.established}
                                                    </p>
                                                )}
                                            </div>

                                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                                {foundation.about_foundation || "No description available."}
                                            </p>

                                            {/* Focus Areas Tags */}
                                            <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                                                {foundation.focus_areas_list.slice(0, 3).map((area, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2.5 py-1 bg-teal-50 text-[#63A6B2] rounded-full text-xs font-semibold"
                                                    >
                                                        {area}
                                                    </span>
                                                ))}
                                                {foundation.focus_areas_list.length > 3 && (
                                                    <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">
                                                        +{foundation.focus_areas_list.length - 3}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Contact/Location Info */}
                                            <div className="border-t border-gray-100 pt-4 mt-2 flex items-center justify-between text-xs text-gray-500">
                                                <div className="flex items-center gap-1.5 truncte max-w-[70%]">
                                                    <svg className="w-4 h-4 text-[#63A6B2] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="truncate">{foundation.foundation_address || 'Philippines'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[#63A6B2] font-semibold group-hover:translate-x-1 transition-transform">
                                                    View Details
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No foundations found</h3>
                                <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedFocusArea('All');
                                    }}
                                    className="bg-[#63A6B2] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#5a959f] transition-all"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
