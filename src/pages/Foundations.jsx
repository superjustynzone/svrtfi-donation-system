import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ─── Synonym / keyword map ────────────────────────────────────────────────────
// Maps natural-language words a user might type → canonical focus-area keywords
// that are matched against a foundation's focus_areas, mission, about text, etc.
const SYNONYM_MAP = {
    // Elderly / Senior
    'senior citizen': 'elderly',
    'senior citizens': 'elderly',
    'seniors': 'elderly',
    'lolo': 'elderly',
    'lola': 'elderly',
    'old age': 'elderly',
    'aging': 'elderly',
    'aged': 'elderly',
    'geriatric': 'elderly',
    'lolas': 'elderly',
    'lolos': 'elderly',
    // Children / Youth
    'kids': 'children',
    'child': 'children',
    'youth': 'children',
    'bata': 'children',
    'kabataan': 'children',
    'minor': 'children',
    'orphan': 'children',
    'orphans': 'children',
    // Healthcare / Medical
    'sick': 'healthcare',
    'hospital': 'healthcare',
    'doctor': 'healthcare',
    'medical': 'healthcare',
    'medicine': 'healthcare',
    'clinic': 'healthcare',
    'patient': 'healthcare',
    'health': 'healthcare',
    'nursing': 'healthcare',
    // Education / Scholarship
    'school': 'education',
    'scholarship': 'education',
    'student': 'education',
    'learning': 'education',
    'scholar': 'education',
    'academic': 'education',
    'tuition': 'education',
    'teacher': 'education',
    // Poverty / Community
    'poor': 'poverty',
    'mahirap': 'poverty',
    'livelihood': 'poverty',
    'relief': 'poverty',
    'relief goods': 'poverty',
    'food': 'poverty',
    'hunger': 'poverty',
    'panahi': 'poverty',
    // Environment
    'tree': 'environment',
    'trees': 'environment',
    'nature': 'environment',
    'kalikasan': 'environment',
    'green': 'environment',
    'climate': 'environment',
    'forest': 'environment',
    // Broadcasting / Media
    'radio': 'broadcasting',
    'tv': 'broadcasting',
    'television': 'broadcasting',
    'media': 'broadcasting',
    'broadcast': 'broadcasting',
    'news': 'broadcasting',
    // Community
    'barangay': 'community',
    'community': 'community',
    'neighborhood': 'community',
    'housing': 'community',
    'shelter': 'community',
    'home': 'community',
};

// Normalize a query: apply synonym map, return the resolved term
function resolveQuery(query) {
    const lower = query.toLowerCase().trim();
    return SYNONYM_MAP[lower] || lower;
}

// Check if a foundation matches the search query (name, about, mission, focus areas, synonyms)
function foundationMatchesSearch(foundation, raw) {
    if (!raw.trim()) return true;
    const resolved = resolveQuery(raw);
    const searchIn = [
        foundation.foundation_name,
        foundation.about_foundation,
        foundation.mission,
        foundation.vision,
        foundation.focus_areas,
        foundation.foundation_address,
    ]
        .filter(Boolean)
        .map(s => s.toLowerCase())
        .join(' ');

    return searchIn.includes(resolved) || searchIn.includes(raw.toLowerCase().trim());
}

export default function Foundations() {
    const navigate = useNavigate();
    const [foundations, setFoundations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFocusArea, setSelectedFocusArea] = useState('All');
    const [isLoading, setIsLoading] = useState(true);

    // Hint suggestions shown below the search bar
    const searchHints = ['senior citizen', 'children', 'healthcare', 'education', 'poor', 'environment', 'radio'];

    useEffect(() => {
        fetchFoundations();
    }, []);

    const fetchFoundations = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/foundations/all');
            if (response.ok) {
                const data = await response.json();
                const transformed = data.map(f => ({
                    ...f,
                    focus_areas_list: f.focus_areas
                        ? f.focus_areas.split(',').map(item => item.trim()).filter(Boolean)
                        : [],
                }));
                setFoundations(transformed);
            }
        } catch (error) {
            console.error('Error fetching foundations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Build dynamic focus area list from real data
    const dynamicFocusAreas = useMemo(() => {
        const set = new Set();
        foundations.forEach(f => f.focus_areas_list.forEach(a => set.add(a)));
        return ['All', ...Array.from(set).sort()];
    }, [foundations]);

    const filteredFoundations = useMemo(() => {
        return foundations.filter(f => {
            const matchesSearch = foundationMatchesSearch(f, searchQuery);
            const matchesFocusArea =
                selectedFocusArea === 'All' ||
                f.focus_areas_list.some(a =>
                    a.toLowerCase().includes(selectedFocusArea.toLowerCase())
                );
            return matchesSearch && matchesFocusArea;
        });
    }, [foundations, searchQuery, selectedFocusArea]);

    // Show resolved synonym in subtle hint when a synonym is detected
    const resolvedTerm = searchQuery.trim() && SYNONYM_MAP[searchQuery.toLowerCase().trim()]
        ? SYNONYM_MAP[searchQuery.toLowerCase().trim()]
        : null;

    const clearAll = () => {
        setSearchQuery('');
        setSelectedFocusArea('All');
    };

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

            {/* Hero */}
            <div className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-4xl font-bold text-white mb-3">Partner Foundations</h1>
                    <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
                        Discover organizations making meaningful impact across the Philippines
                    </p>
                    {/* Hero search bar */}
                    <div className="max-w-xl mx-auto relative">
                        <input
                            type="text"
                            placeholder='Search by name, cause, or keyword e.g. "senior citizen"'
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full px-5 py-3.5 pl-12 rounded-xl shadow-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                        <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Smart synonym hint */}
                    {resolvedTerm && (
                        <p className="text-white/80 text-sm mt-2">
                            🔍 Searching for foundations related to <span className="font-bold text-white">"{resolvedTerm}"</span>
                        </p>
                    )}

                    {/* Quick search hints */}
                    {!searchQuery && (
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <span className="text-white/70 text-xs mt-1">Try:</span>
                            {searchHints.map(hint => (
                                <button
                                    key={hint}
                                    onClick={() => setSearchQuery(hint)}
                                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full transition-all backdrop-blur-sm"
                                >
                                    {hint}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar */}
                    <div className="w-full lg:w-56 flex-shrink-0">
                        <div className="sticky top-24 space-y-4">

                            {/* Results count */}
                            <div className="bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-xl shadow-sm p-4 text-white">
                                <div className="text-3xl font-bold">{filteredFoundations.length}</div>
                                <div className="text-sm text-white/90">
                                    {filteredFoundations.length === 1 ? 'Foundation' : 'Foundations'} Found
                                </div>
                                {(searchQuery || selectedFocusArea !== 'All') && (
                                    <button
                                        onClick={clearAll}
                                        className="mt-2 text-xs text-white/80 hover:text-white underline"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>

                            {/* Focus Area Filter */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Filter by Cause</h3>
                                <div className="space-y-1.5">
                                    {dynamicFocusAreas.map(area => (
                                        <button
                                            key={area}
                                            onClick={() => setSelectedFocusArea(area)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedFocusArea === area
                                                ? 'bg-[#63A6B2] text-white shadow-sm'
                                                : 'text-gray-700 hover:bg-teal-50 hover:text-[#63A6B2]'
                                                }`}
                                        >
                                            {selectedFocusArea === area && (
                                                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {area}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Foundation Cards */}
                    <div className="flex-1">
                        {/* Active filter pills */}
                        {(searchQuery || selectedFocusArea !== 'All') && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {searchQuery && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#63A6B2]/10 text-[#4a8a95] border border-[#63A6B2]/30 rounded-full text-sm font-medium">
                                        🔍 "{searchQuery}"
                                        <button onClick={() => setSearchQuery('')} className="hover:text-red-500">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                )}
                                {selectedFocusArea !== 'All' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#4a8a95] border border-teal-200 rounded-full text-sm font-medium">
                                        🏷 {selectedFocusArea}
                                        <button onClick={() => setSelectedFocusArea('All')} className="hover:text-red-500">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}

                        {filteredFoundations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredFoundations.map(foundation => (
                                    <div
                                        key={foundation.foundation_id}
                                        onClick={() => navigate(`/foundations/${foundation.foundation_id}`)}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full"
                                    >
                                        {/* Cover Image — outer div has NO overflow-hidden so the logo can extend below */}
                                        <div className="relative h-48">
                                            {/* Image clipped in its own inner container */}
                                            <div className="absolute inset-0 overflow-hidden rounded-t-xl">
                                                <img
                                                    src={foundation.image_cover ? `http://localhost:5000${foundation.image_cover}` : 'https://via.placeholder.com/800x400/63A6B2/FFFFFF?text=Foundation'}
                                                    alt={foundation.foundation_name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                                            </div>
                                            {/* Logo — free to overflow the image area */}
                                            <div className="absolute bottom-0 left-5 translate-y-1/2 z-10">
                                                <div className="w-16 h-16 rounded-xl border-4 border-white shadow-md bg-white overflow-hidden">
                                                    {foundation.image_logo ? (
                                                        <img src={`http://localhost:5000${foundation.image_logo}`} alt="Logo" className="w-full h-full object-contain p-1" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs">LOGO</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-5 pt-10 flex flex-col">
                                            <div className="mb-3">
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#63A6B2] transition-colors line-clamp-1">
                                                    {foundation.foundation_name}
                                                </h3>
                                                {foundation.established && (
                                                    <p className="text-xs text-gray-500 font-medium mt-1">Est. {foundation.established}</p>
                                                )}
                                            </div>

                                            <div className="text-gray-600 text-sm mb-4 line-clamp-3 ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: foundation.about_foundation || 'No description available.' }} />

                                            {/* Focus Area Tags */}
                                            <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                                                {foundation.focus_areas_list.slice(0, 3).map((area, i) => (
                                                    <span
                                                        key={i}
                                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${selectedFocusArea !== 'All' && area.toLowerCase().includes(selectedFocusArea.toLowerCase())
                                                            ? 'bg-[#63A6B2] text-white'
                                                            : 'bg-teal-50 text-[#63A6B2]'
                                                            }`}
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

                                            {/* Footer */}
                                            <div className="border-t border-gray-100 pt-4 mt-2 flex items-center justify-between text-xs text-gray-500">
                                                <div className="flex items-center gap-1.5 truncate max-w-[70%]">
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
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No foundations found</h3>
                                <p className="text-gray-500 mb-2">No results for <span className="font-semibold text-gray-700">"{searchQuery}"</span></p>
                                {resolvedTerm && (
                                    <p className="text-sm text-[#63A6B2] mb-4">We looked for foundations related to <strong>{resolvedTerm}</strong></p>
                                )}
                                <button
                                    onClick={clearAll}
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
