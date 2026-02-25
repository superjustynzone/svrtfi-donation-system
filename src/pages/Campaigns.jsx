import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ─── Synonym / keyword map for campaigns ────────────────────────────────────
const SYNONYM_MAP = {
    // Elderly
    'senior citizen': 'elderly',
    'senior citizens': 'elderly',
    'seniors': 'elderly',
    'lolo': 'elderly',
    'lola': 'elderly',
    'lolos': 'elderly',
    'lolas': 'elderly',
    'old age': 'elderly',
    'aging': 'elderly',
    // Children / Youth
    'kids': 'children',
    'child': 'children',
    'youth': 'children',
    'bata': 'children',
    'kabataan': 'children',
    'orphan': 'children',
    'abused': 'children',
    'shelter': 'children',
    // Healthcare
    'sick': 'healthcare',
    'hospital': 'healthcare',
    'doctor': 'healthcare',
    'medical': 'healthcare',
    'medicine': 'healthcare',
    'clinic': 'healthcare',
    'cancer': 'healthcare',
    'tumor': 'healthcare',
    'disease': 'healthcare',
    'health': 'healthcare',
    // Education
    'school': 'education',
    'scholarship': 'education',
    'student': 'education',
    'scholar': 'education',
    'tuition': 'education',
    'learning': 'education',
    // Poverty / Relief
    'poor': 'poverty',
    'mahirap': 'poverty',
    'relief': 'poverty',
    'relief goods': 'poverty',
    'food': 'poverty',
    'hunger': 'poverty',
    'livelihood': 'poverty',
    // Environment
    'tree': 'environment',
    'nature': 'environment',
    'kalikasan': 'environment',
    'climate': 'environment',
    'green': 'environment',
    // Broadcasting
    'radio': 'broadcasting',
    'tv': 'broadcasting',
    'media': 'broadcasting',
    'broadcast': 'broadcasting',
    'television': 'broadcasting',
    // Spiritual / Prison
    'prayer': 'spiritual',
    'faith': 'spiritual',
    'prison': 'spiritual',
    'inmates': 'spiritual',
    'counseling': 'spiritual',
    'mental health': 'spiritual',
    // Street children
    'street children': 'street',
    'streetchildren': 'street',
    'homeless': 'street',
    'feeding': 'street',
    // Maternity / Pro-life
    'pregnant': 'maternity',
    'unborn': 'maternity',
    'baby': 'maternity',
    'abortion': 'maternity',
    'mother': 'maternity',
};

function resolveQuery(query) {
    const lower = query.toLowerCase().trim();
    return SYNONYM_MAP[lower] || lower;
}

function campaignMatchesSearch(campaign, raw) {
    if (!raw.trim()) return true;
    const resolved = resolveQuery(raw);
    const raw_lower = raw.toLowerCase().trim();
    const searchIn = [
        campaign.campaign_name,
        campaign.campaign_description,
        campaign.campaign_type,
        campaign.foundation_name,
    ].filter(Boolean).map(s => s.toLowerCase()).join(' ');

    return searchIn.includes(resolved) || searchIn.includes(raw_lower);
}

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const navigate = useNavigate();

    const searchHints = ['cancer', 'senior citizen', 'children', 'school', 'feeding', 'prison', 'pregnant'];

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/campaigns/published');
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setCampaigns(data);
            } else {
                setCampaigns([]);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            toast.error('Failed to load campaigns');
            setCampaigns([]);
        } finally {
            setIsLoading(false);
        }
    };

    const uniqueTypes = useMemo(() => {
        const set = new Set(campaigns.map(c => c.campaign_type).filter(Boolean));
        return ['All', ...Array.from(set).sort()];
    }, [campaigns]);

    const filteredCampaigns = useMemo(() => {
        return campaigns.filter(c => {
            const matchesSearch = campaignMatchesSearch(c, searchTerm);
            const matchesType = filterType === 'All' || c.campaign_type === filterType;
            return matchesSearch && matchesType;
        });
    }, [campaigns, searchTerm, filterType]);

    const resolvedTerm = searchTerm.trim() && SYNONYM_MAP[searchTerm.toLowerCase().trim()]
        ? SYNONYM_MAP[searchTerm.toLowerCase().trim()]
        : null;

    const clearAll = () => {
        setSearchTerm('');
        setFilterType('All');
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₱0';
        return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const calculateProgress = (current, goal) => {
        if (!goal || goal === 0) return 0;
        return Math.min((current / goal) * 100, 100);
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getDaysRemaining = (endDate) => {
        if (!endDate) return null;
        const diff = new Date(endDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
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
                    <h1 className="text-4xl font-bold text-white mb-3">Make a Difference Today</h1>
                    <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
                        Support active campaigns and help create positive change across the Philippines.
                    </p>

                    {/* Hero search bar */}
                    <div className="max-w-xl mx-auto relative">
                        <input
                            type="text"
                            placeholder='Search by cause, keyword e.g. "cancer", "senior citizen"'
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full px-5 py-3.5 pl-12 rounded-xl shadow-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/60"
                        />
                        <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Synonym hint */}
                    {resolvedTerm && (
                        <p className="text-white/80 text-sm mt-2">
                            🔍 Searching for campaigns related to <span className="font-bold text-white">"{resolvedTerm}"</span>
                        </p>
                    )}

                    {/* Quick hint pills */}
                    {!searchTerm && (
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <span className="text-white/70 text-xs mt-1">Try:</span>
                            {searchHints.map(hint => (
                                <button
                                    key={hint}
                                    onClick={() => setSearchTerm(hint)}
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

                            {/* Count */}
                            <div className="bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-xl shadow-sm p-4 text-white">
                                <div className="text-3xl font-bold">{filteredCampaigns.length}</div>
                                <div className="text-sm text-white/90">
                                    {filteredCampaigns.length === 1 ? 'Campaign' : 'Campaigns'} Found
                                </div>
                                {(searchTerm || filterType !== 'All') && (
                                    <button onClick={clearAll} className="mt-2 text-xs text-white/80 hover:text-white underline">
                                        Clear all filters
                                    </button>
                                )}
                            </div>

                            {/* Filter by type */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Filter by Type</h3>
                                <div className="space-y-1.5">
                                    {uniqueTypes.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFilterType(type)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filterType === type
                                                ? 'bg-[#63A6B2] text-white shadow-sm'
                                                : 'text-gray-700 hover:bg-teal-50 hover:text-[#63A6B2]'
                                                }`}
                                        >
                                            {filterType === type && (
                                                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Active filter pills */}
                        {(searchTerm || filterType !== 'All') && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {searchTerm && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#63A6B2]/10 text-[#4a8a95] border border-[#63A6B2]/30 rounded-full text-sm font-medium">
                                        🔍 "{searchTerm}"
                                        <button onClick={() => setSearchTerm('')} className="hover:text-red-500">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                )}
                                {filterType !== 'All' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#4a8a95] border border-teal-200 rounded-full text-sm font-medium">
                                        🏷 {filterType}
                                        <button onClick={() => setFilterType('All')} className="hover:text-red-500">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}

                        {filteredCampaigns.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No campaigns found</h3>
                                <p className="text-gray-600 mb-2">No results for <span className="font-semibold text-gray-700">"{searchTerm}"</span></p>
                                {resolvedTerm && (
                                    <p className="text-sm text-[#63A6B2] mb-4">We looked for campaigns related to <strong>{resolvedTerm}</strong></p>
                                )}
                                <button
                                    onClick={clearAll}
                                    className="bg-[#63A6B2] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#5a959f] transition-all"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredCampaigns.map((campaign) => {
                                    const progress = calculateProgress(campaign.current_amount, campaign.goal_amount);
                                    const daysRemaining = getDaysRemaining(campaign.end_date);

                                    return (
                                        <div
                                            key={campaign.campaign_id}
                                            onClick={() => navigate(`/campaigns/${campaign.campaign_id}`)}
                                            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100 flex flex-col"
                                        >
                                            {/* Image */}
                                            <div className="relative h-52 bg-gradient-to-br from-gray-200 to-gray-300">
                                                <div className="absolute inset-0 overflow-hidden rounded-t-2xl">
                                                    {campaign.file_url ? (
                                                        <img
                                                            src={`http://localhost:5000${campaign.file_url}`}
                                                            alt={campaign.campaign_name}
                                                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Days remaining */}
                                                <div className="absolute top-3 left-3">
                                                    {daysRemaining !== null ? (
                                                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                            {daysRemaining} days left
                                                        </span>
                                                    ) : (
                                                        <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                            Ongoing
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Type badge */}
                                                {campaign.campaign_type && (
                                                    <div className="absolute top-3 right-3">
                                                        <span className="bg-white/95 backdrop-blur-sm text-[#63A6B2] px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                            {campaign.campaign_type}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Featured badge */}
                                                {campaign.is_featured && (
                                                    <div className="absolute bottom-3 left-3">
                                                        <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                                            ⭐ Featured
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="p-5 flex flex-col flex-1">
                                                {/* Foundation link */}
                                                {campaign.foundation_name && (
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-7 h-7 bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {campaign.foundation_logo ? (
                                                                <img src={`http://localhost:5000${campaign.foundation_logo}`} alt="" className="w-full h-full object-contain" />
                                                            ) : (
                                                                <span className="text-white text-xs font-bold">
                                                                    {campaign.foundation_name.charAt(0).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/foundations/${campaign.foundation_id}`); }}
                                                            className="text-xs font-medium text-[#63A6B2] hover:underline truncate"
                                                        >
                                                            {campaign.foundation_name}
                                                        </button>
                                                    </div>
                                                )}

                                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                                                    {campaign.campaign_name}
                                                </h3>

                                                {campaign.campaign_description && (
                                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                        {campaign.campaign_description}
                                                    </p>
                                                )}

                                                {/* Progress */}
                                                <div className="mb-4 mt-auto">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-xs font-semibold text-gray-500">Progress</span>
                                                        <span className="text-xs font-bold text-[#63A6B2]">{progress.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Amounts */}
                                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Raised</p>
                                                        <p className="text-base font-bold text-[#63A6B2]">{formatCurrency(campaign.current_amount || 0)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Goal</p>
                                                        <p className="text-base font-bold text-gray-900">{formatCurrency(campaign.goal_amount)}</p>
                                                    </div>
                                                </div>

                                                <button className="w-full mt-4 bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-sm">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
