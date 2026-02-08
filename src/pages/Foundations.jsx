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

    const focusAreas = ['All', 'Broadcasting', 'Education', 'Healthcare', 'Community Development', 'Elderly Care'];

    useEffect(() => {
        fetchFoundations();
    }, []);

    const fetchFoundations = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/foundations/all');

            if (response.ok) {
                const data = await response.json();
                setFoundations(data);
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
            foundation.foundation_desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            foundation.tagline?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFocusArea =
            selectedFocusArea === 'All' ||
            (foundation.focus_areas || []).includes(selectedFocusArea);

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

            {/* Hero Section - Different from Campaigns */}
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
                <div className="flex gap-8">
                    {/* Sidebar - Filters on the left */}
                    <div className="w-64 flex-shrink-0">
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
                                <div className="space-y-2">
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
                            <div className="bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-lg shadow-sm p-4 text-white">
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {filteredFoundations.map(foundation => (
                                    <div
                                        key={foundation.foundation_id}
                                        onClick={() => navigate(`/foundations/${foundation.foundation_id}`)}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group focus:outline-none active:scale-[0.98]"
                                    >
                                        {/* Horizontal Layout - Image on Left */}
                                        <div className="flex h-full">
                                            {/* Image Section */}
                                            <div className="relative w-48 flex-shrink-0">
                                                <img
                                                    src={foundation.cover_image_url || foundation.foundation_logo || 'https://via.placeholder.com/400x300/63A6B2/FFFFFF?text=Foundation'}
                                                    alt={foundation.foundation_name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20"></div>

                                                {/* Logo Badge */}
                                                {foundation.foundation_logo && (
                                                    <div className="absolute top-3 left-3">
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-white">
                                                            <img
                                                                src={foundation.foundation_logo}
                                                                alt={`${foundation.foundation_name} logo`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content Section */}
                                            <div className="flex-1 p-5">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#63A6B2] transition-colors">
                                                    {foundation.foundation_name}
                                                </h3>

                                                {foundation.tagline && (
                                                    <p className="text-sm text-[#63A6B2] italic mb-3">{foundation.tagline}</p>
                                                )}

                                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                    {foundation.foundation_desc || foundation.description}
                                                </p>

                                                {/* Focus Areas - Compact */}
                                                {(foundation.focus_areas || []).length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                                        {(foundation.focus_areas || []).slice(0, 2).map((area, index) => (
                                                            <span
                                                                key={index}
                                                                className="px-2 py-1 bg-teal-50 text-[#63A6B2] rounded text-xs font-medium"
                                                            >
                                                                {area}
                                                            </span>
                                                        ))}
                                                        {(foundation.focus_areas || []).length > 2 && (
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                                                +{(foundation.focus_areas || []).length - 2} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Stats Row */}
                                                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <svg className="w-4 h-4 text-[#63A6B2]" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-gray-600 text-xs">
                                                            {foundation.foundation_address || foundation.address || 'Philippines'}
                                                        </span>
                                                    </div>

                                                    {foundation.founded_year && (
                                                        <div className="flex items-center gap-1.5 text-sm">
                                                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="text-gray-500 text-xs">
                                                                Since {foundation.founded_year}
                                                            </span>
                                                        </div>
                                                    )}
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
