import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Footer from '../components/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Added ChevronLeft and ChevronRight
import 'react-quill-new/dist/quill.snow.css';

export default function CampaignDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [otherCampaigns, setOtherCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        fetchCampaignDetails();
        fetchOtherCampaigns();
    }, [id]);

    const fetchCampaignDetails = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:5000/api/campaigns/${id}`);
            const data = await response.json();

            if (response.ok) {
                setCampaign(data);
            } else {
                toast.error('Campaign not found');
                navigate('/campaigns');
            }
        } catch (error) {
            console.error('Error fetching campaign details:', error);
            toast.error('Failed to load campaign details');
            navigate('/campaigns');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOtherCampaigns = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/campaigns/published');
            const data = await response.json();
            if (Array.isArray(data)) {
                setOtherCampaigns(data.filter(c => String(c.campaign_id) !== String(id)).slice(0, 4));
            }
        } catch (error) {
            console.error('Error fetching other campaigns:', error);
        }
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
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getDaysRemaining = (endDate) => {
        if (!endDate) return null;
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const handleDonate = () => {
        navigate(`/campaigns/${id}/donate`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#63A6B2]"></div>
            </div>
        );
    }

    if (!campaign) {
        return null;
    }

    const progress = calculateProgress(campaign.current_amount, campaign.goal_amount);
    const daysRemaining = getDaysRemaining(campaign.end_date);
    const hasMedia = (campaign.media && campaign.media.length > 0) || campaign.file_url;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
            {/* Back Button */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-8 py-4">
                    <button
                        onClick={() => navigate('/campaigns')}
                        className="flex items-center gap-2 text-gray-600 hover:text-[#63A6B2] transition-colors font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Campaigns
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image Gallery */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                            {hasMedia ? (
                                <>
                                    {/* Main Image */}
                                    <div className="relative h-96 bg-gray-200 group">
                                        <img
                                            src={campaign.media && campaign.media.length > 0
                                                ? `http://localhost:5000${campaign.media[selectedImage].file_url}`
                                                : `http://localhost:5000${campaign.file_url}`}
                                            alt={campaign.campaign_name}
                                            className="w-full h-full object-cover transition-opacity duration-300"
                                        />

                                        {/* Image Controls */}
                                        {campaign.media && campaign.media.length > 1 && (
                                            <>
                                                {/* Left Arrow */}
                                                <button
                                                    onClick={() => setSelectedImage(prev => prev === 0 ? campaign.media.length - 1 : prev - 1)}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ChevronLeft className="w-6 h-6" />
                                                </button>

                                                {/* Right Arrow */}
                                                <button
                                                    onClick={() => setSelectedImage(prev => prev === campaign.media.length - 1 ? 0 : prev + 1)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ChevronRight className="w-6 h-6" />
                                                </button>

                                                {/* Image Counter */}
                                                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                    {selectedImage + 1} / {campaign.media.length}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Thumbnail Gallery */}
                                    {campaign.media && campaign.media.length > 1 && (
                                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                                            <div className="flex gap-3 overflow-x-auto pb-2">
                                                {campaign.media.map((media, index) => (
                                                    <button
                                                        key={media.media_id}
                                                        onClick={() => setSelectedImage(index)}
                                                        className={`flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                                                            ? 'border-[#63A6B2] shadow-lg scale-105'
                                                            : 'border-gray-300 hover:border-[#63A6B2] opacity-70 hover:opacity-100'
                                                            }`}
                                                    >
                                                        <img
                                                            src={`http://localhost:5000${media.file_url}`}
                                                            alt={`Thumbnail ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-96 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                    <svg className="w-32 h-32 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Campaign Details */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                            {/* Header */}
                            <div className="mb-6">
                                {campaign.campaign_type && (
                                    <span className="inline-block bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white px-4 py-1 rounded-full text-sm font-bold mb-4">
                                        {campaign.campaign_type}
                                    </span>
                                )}
                                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                    {campaign.campaign_name}
                                </h1>

                                {/* Foundation Info */}
                                {campaign.foundation_name && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <div className="w-12 h-12 bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-full flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                                            {campaign.foundation_logo ? (
                                                <img
                                                    src={`http://localhost:5000${campaign.foundation_logo}`}
                                                    alt={campaign.foundation_name}
                                                    className="w-full h-full object-contain p-1 bg-white"
                                                />
                                            ) : (
                                                <span className="text-white text-sm font-bold">
                                                    {campaign.foundation_name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Organized by</p>
                                            <p className="font-semibold text-gray-900">{campaign.foundation_name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Campaign</h2>
                                <div className="text-gray-700 leading-relaxed ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: campaign.campaign_description || 'No description available.' }} />
                            </div>

                            {/* Campaign Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                                <div>
                                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-2">Start Date</p>
                                    <p className="text-lg font-bold text-gray-900">{formatDate(campaign.start_date)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-2">End Date</p>
                                    <p className="text-lg font-bold text-gray-900">{formatDate(campaign.end_date)}</p>
                                </div>
                            </div>

                            {/* Foundation Description */}
                            {campaign.foundation_desc && (
                                <div className="mt-8 pt-8 border-t border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">About {campaign.foundation_name}</h3>
                                    <div className="text-gray-700 leading-relaxed ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: campaign.foundation_desc }} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Donation Card + Other Campaigns */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                            {/* Days Remaining */}
                            {daysRemaining !== null && (
                                <div className="mb-6">
                                    <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white px-6 py-5 rounded-2xl text-center shadow-lg">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-sm font-bold uppercase tracking-wider">Time Left</p>
                                        </div>
                                        <p className="text-4xl font-extrabold mb-1">{daysRemaining}</p>
                                        <p className="text-sm font-semibold opacity-90">Days Remaining</p>
                                    </div>
                                </div>
                            )}

                            {/* Funding Progress */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Raised</p>
                                        <p className="text-3xl font-extrabold bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] bg-clip-text text-transparent">
                                            {formatCurrency(campaign.current_amount || 0)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Goal</p>
                                        <p className="text-xl font-bold text-gray-700">
                                            {formatCurrency(campaign.goal_amount)}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative">
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                                        <div
                                            className="bg-gradient-to-r from-[#63A6B2] via-teal-400 to-[#4a8a95] h-full rounded-full transition-all duration-700 shadow-md relative overflow-hidden"
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-gray-500 font-semibold">
                                            {progress.toFixed(0)}% Complete
                                        </p>
                                        {progress >= 100 && (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                                                🎉 Goal Reached!
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-6 pt-4 border-t border-gray-200">
                                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl border border-blue-100">
                                    <div className="flex justify-center mb-2">
                                        <svg className="w-5 h-5 text-[#63A6B2]" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-extrabold text-gray-900 mb-1">
                                        {formatCurrency(campaign.goal_amount - (campaign.current_amount || 0))}
                                    </p>
                                    <p className="text-xs text-gray-600 uppercase tracking-wide font-bold">
                                        Still Needed
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                                    <div className="flex justify-center mb-2">
                                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-extrabold text-gray-900 mb-1">
                                        {campaign.donor_count || 0}
                                    </p>
                                    <p className="text-xs text-gray-600 uppercase tracking-wide font-bold">
                                        Donors
                                    </p>
                                </div>
                            </div>

                            {/* Donate Button */}
                            <button
                                onClick={handleDonate}
                                className="w-full bg-gradient-to-r from-[#63A6B2] via-teal-500 to-[#4a8a95] text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-2 group"
                            >
                                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                Donate Now
                            </button>

                            {/* Share Section */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                    </svg>
                                    <p className="text-sm font-bold text-gray-700">Share Campaign</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <button className="bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-all hover:shadow-md text-xs font-bold flex items-center justify-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                        FB
                                    </button>
                                    <button className="bg-sky-500 text-white py-2.5 rounded-lg hover:bg-sky-600 transition-all hover:shadow-md text-xs font-bold flex items-center justify-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                        </svg>
                                        X
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            toast.success('Link copied to clipboard!');
                                        }}
                                        className="bg-gray-700 text-white py-2.5 rounded-lg hover:bg-gray-800 transition-all hover:shadow-md text-xs font-bold flex items-center justify-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                                            <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                                        </svg>
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Other Campaigns */}
                        {otherCampaigns.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 mt-6">
                                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#63A6B2]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    Other Campaigns
                                </h3>
                                <div className="space-y-3">
                                    {otherCampaigns.map(c => (
                                        <div
                                            key={c.campaign_id}
                                            className="group flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer border border-transparent hover:border-gray-200"
                                            onClick={() => navigate(`/campaigns/${c.campaign_id}`)}
                                        >
                                            {/* Thumbnail */}
                                            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                                                {c.file_url ? (
                                                    <img
                                                        src={`http://localhost:5000${c.file_url}`}
                                                        alt={c.campaign_name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-[#63A6B2]/20 to-[#4a8a95]/20 flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-[#63A6B2]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#63A6B2] transition-colors">{c.campaign_name}</p>
                                                {c.foundation_name && (
                                                    <p className="text-xs text-[#63A6B2] mt-0.5 truncate">{c.foundation_name}</p>
                                                )}
                                                {/* Mini progress bar */}
                                                <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-[#63A6B2] h-full rounded-full"
                                                        style={{ width: `${Math.min((c.current_amount || 0) / c.goal_amount * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={e => { e.stopPropagation(); navigate(`/campaigns/${c.campaign_id}/donate`); }}
                                                    className="mt-2 text-xs font-bold text-white bg-[#63A6B2] hover:bg-[#4a8a95] px-3 py-1 rounded-full transition-colors"
                                                >
                                                    Donate
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        </div> {/* end sticky wrapper */}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
