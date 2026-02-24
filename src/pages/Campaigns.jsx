import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';


export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            setIsLoading(true);
            // Only fetch published campaigns
            const response = await fetch('http://localhost:5000/api/campaigns/published');
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setCampaigns(data);
            } else {
                console.error('Expected array of campaigns, got:', data);
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

    const filteredCampaigns = campaigns.filter(campaign => {
        const matchesSearch = campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaign.campaign_description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || campaign.campaign_type === filterType;
        return matchesSearch && matchesType;
    });

    const uniqueTypes = [...new Set(campaigns.map(c => c.campaign_type).filter(Boolean))];

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
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
            <Navbar />

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white py-20 px-8 mt-20">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl font-bold mb-4 animate-fade-in">Make a Difference Today</h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        Support our active campaigns and help us create positive change in communities across the Philippines.
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-7xl mx-auto px-8 -mt-8">
                <div className="bg-white rounded-2xl shadow-2xl p-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-6 py-4 pl-14 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#63A6B2] focus:border-[#63A6B2] outline-none text-lg transition-all"
                        />
                        <svg
                            className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Category Filters */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="flex flex-wrap gap-3 justify-center">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${filterType === 'all'
                            ? 'bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                            }`}
                    >
                        All
                    </button>
                    {uniqueTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${filterType === type
                                ? 'bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Campaigns Grid */}
            <div className="max-w-7xl mx-auto px-8 pb-16">
                {/* Results Count */}
                <div className="mb-8 text-center text-gray-600">
                    Showing <span className="font-semibold text-[#63A6B2]">{filteredCampaigns.length}</span> campaign{filteredCampaigns.length !== 1 ? 's' : ''}
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#63A6B2]"></div>
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No campaigns found</h3>
                        <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                    </div>
                ) : (
                    /* Campaigns Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCampaigns.map((campaign) => {
                            const progress = calculateProgress(campaign.current_amount, campaign.goal_amount);
                            const daysRemaining = getDaysRemaining(campaign.end_date);

                            return (
                                <div
                                    key={campaign.campaign_id}
                                    onClick={() => navigate(`/campaigns/${campaign.campaign_id}`)}
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-gray-100"
                                >
                                    {/* Campaign Image */}
                                    <div className="relative h-56 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                                        {campaign.file_url ? (
                                            <img
                                                src={`http://localhost:5000${campaign.file_url}`}
                                                alt={campaign.campaign_name}
                                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Campaign Type Badge */}
                                        {campaign.campaign_type && (
                                            <div className="absolute top-4 right-4">
                                                <span className="bg-white/95 backdrop-blur-sm text-[#63A6B2] px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                    {campaign.campaign_type}
                                                </span>
                                            </div>
                                        )}

                                        {/* Days Remaining / Ongoing Badge */}
                                        <div className="absolute top-4 left-4">
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

                                        {/* Featured Badge */}
                                        {campaign.is_featured && (
                                            <div className="absolute bottom-4 left-4">
                                                <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                                    ⭐ Featured
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Campaign Content */}
                                    <div className="p-6">
                                        {/* Foundation Name */}
                                        {campaign.foundation_name && (
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-full flex items-center justify-center overflow-hidden">
                                                    {campaign.foundation_logo ? (
                                                        <img
                                                            src={`http://localhost:5000${campaign.foundation_logo}`}
                                                            alt={campaign.foundation_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-white text-xs font-bold">
                                                            {campaign.foundation_name.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/foundations/${campaign.foundation_id}`);
                                                    }}
                                                    className="text-sm font-medium text-[#63A6B2] hover:underline transition-all"
                                                >
                                                    {campaign.foundation_name}
                                                </button>
                                            </div>
                                        )}

                                        {/* Campaign Title */}
                                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
                                            {campaign.campaign_name}
                                        </h3>

                                        {/* Campaign Description */}
                                        {campaign.campaign_description && (
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                                                {campaign.campaign_description}
                                            </p>
                                        )}

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-semibold text-gray-700">Progress</span>
                                                <span className="text-sm font-bold text-[#63A6B2]">{progress.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] h-full rounded-full transition-all duration-500 shadow-inner"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Funding Info */}
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Raised</p>
                                                <p className="text-lg font-bold text-[#63A6B2]">{formatCurrency(campaign.current_amount || 0)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Goal</p>
                                                <p className="text-lg font-bold text-gray-900">{formatCurrency(campaign.goal_amount)}</p>
                                            </div>
                                        </div>

                                        {/* View Details Button */}
                                        <button className="w-full mt-6 bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
