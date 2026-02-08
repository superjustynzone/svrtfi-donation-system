import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function CampaignDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [donationAmount, setDonationAmount] = useState('');
    const [showDonateModal, setShowDonateModal] = useState(false);

    useEffect(() => {
        fetchCampaignDetails();
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
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            toast.error('Please log in to donate');
            navigate('/login');
            return;
        }
        setShowDonateModal(true);
    };

    const handleDonateSubmit = () => {
        // This would integrate with your donation system
        toast.success('Donation feature coming soon!');
        setShowDonateModal(false);
        setDonationAmount('');
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
    const hasMedia = campaign.media && campaign.media.length > 0;

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
                                    <div className="relative h-96 bg-gray-200">
                                        <img
                                            src={`http://localhost:5000${campaign.media[selectedImage].file_url}`}
                                            alt={campaign.campaign_name}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Image Counter */}
                                        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                                            {selectedImage + 1} / {campaign.media.length}
                                        </div>
                                    </div>

                                    {/* Thumbnail Gallery */}
                                    {campaign.media.length > 1 && (
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
                                        <div className="w-10 h-10 bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">
                                                {campaign.foundation_name.charAt(0).toUpperCase()}
                                            </span>
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
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {campaign.campaign_description || 'No description available.'}
                                </p>
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
                                    <p className="text-gray-700 leading-relaxed">
                                        {campaign.foundation_desc}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Donation Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 sticky top-24">
                            {/* Days Remaining */}
                            {daysRemaining !== null && (
                                <div className="mb-6">
                                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-xl text-center">
                                        <p className="text-3xl font-bold">{daysRemaining}</p>
                                        <p className="text-sm font-semibold">Days Remaining</p>
                                    </div>
                                </div>
                            )}

                            {/* Funding Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between items-baseline mb-3">
                                    <p className="text-3xl font-bold text-[#63A6B2]">
                                        {formatCurrency(campaign.current_amount || 0)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        of {formatCurrency(campaign.goal_amount)}
                                    </p>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-2">
                                    <div
                                        className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] h-full rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600 text-right font-semibold">
                                    {progress.toFixed(1)}% funded
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-gray-200">
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(campaign.goal_amount - (campaign.current_amount || 0))}
                                    </p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">
                                        Still Needed
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {campaign.donor_count || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">
                                        Donors
                                    </p>
                                </div>
                            </div>

                            {/* Donate Button */}
                            <button
                                onClick={handleDonate}
                                className="w-full bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                Donate Now
                            </button>

                            {/* Share Section */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-sm font-semibold text-gray-700 mb-3">Share this campaign</p>
                                <div className="flex gap-3">
                                    <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                                        Facebook
                                    </button>
                                    <button className="flex-1 bg-sky-500 text-white py-2 rounded-lg hover:bg-sky-600 transition-colors text-sm font-semibold">
                                        Twitter
                                    </button>
                                    <button className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold">
                                        Copy Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Donate Modal */}
            {showDonateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Make a Donation</h3>
                        <p className="text-gray-600 mb-6">
                            Support <span className="font-semibold text-[#63A6B2]">{campaign.campaign_name}</span>
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Donation Amount (₱)
                            </label>
                            <input
                                type="number"
                                value={donationAmount}
                                onChange={(e) => setDonationAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none"
                                min="1"
                                step="0.01"
                            />
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-4 gap-2 mb-6">
                            {[100, 500, 1000, 5000].map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setDonationAmount(amount.toString())}
                                    className="py-2 px-3 bg-gray-100 hover:bg-[#63A6B2] hover:text-white rounded-lg text-sm font-semibold transition-colors"
                                >
                                    ₱{amount}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDonateModal(false);
                                    setDonationAmount('');
                                }}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDonateSubmit}
                                disabled={!donationAmount || parseFloat(donationAmount) <= 0}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Donate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
