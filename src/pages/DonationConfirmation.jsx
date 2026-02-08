import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function DonationConfirmation() {
    const { donationId } = useParams();
    const navigate = useNavigate();
    const [donation, setDonation] = useState(null);
    const [campaign, setCampaign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDonationDetails();
    }, [donationId]);

    const fetchDonationDetails = async () => {
        try {
            setIsLoading(true);

            // Try to fetch from backend
            const donationResponse = await fetch(`http://localhost:5000/api/donations/${donationId}`);

            if (donationResponse.ok) {
                const donationData = await donationResponse.json();
                setDonation(donationData);

                // Fetch campaign details
                const campaignResponse = await fetch(`http://localhost:5000/api/campaigns/${donationData.campaign_id}`);
                const campaignData = await campaignResponse.json();

                if (campaignResponse.ok) {
                    setCampaign(campaignData);
                }
            } else {
                // Use mock data for testing
                useMockData();
            }
        } catch (error) {
            console.error('Error fetching donation details:', error);
            console.log('Using mock data for testing...');
            // Use mock data when backend is not available
            useMockData();
        } finally {
            setIsLoading(false);
        }
    };

    const useMockData = () => {
        // Mock donation data for testing
        setDonation({
            donation_id: donationId,
            campaign_id: 1,
            amount: 5000,
            donation_type: 'one-time',
            payment_method: 'gcash',
            donor_name: 'Juan Dela Cruz',
            donor_email: 'juan.delacruz@email.com',
            donor_phone: '+63 912 345 6789',
            is_anonymous: false,
            message: 'May this donation help bring our community closer to God. Praying for the success of this project!',
            status: 'pending',
            created_at: new Date().toISOString()
        });

        // Mock campaign data for testing
        setCampaign({
            campaign_id: 1,
            campaign_name: 'Build a New Chapel',
            campaign_description: 'Help us build a new chapel for our community',
            campaign_type: 'Infrastructure',
            foundation_name: "Shepherd's Voice Radio and Television Foundation, Inc.",
            goal_amount: 500000,
            current_amount: 125000
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₱0';
        return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getPaymentMethodName = (method) => {
        const methods = {
            'gcash': 'GCash',
            'paymaya': 'PayMaya',
            'bank': 'Bank Transfer',
            'card': 'Credit/Debit Card'
        };
        return methods[method] || method;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#63A6B2]"></div>
            </div>
        );
    }

    if (!donation || !campaign) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50">
            <Navbar />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-20">
                {/* Success Icon & Message */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-2xl mb-6">
                        <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Thank You!</h1>
                    <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
                        Your generosity makes a real difference. You're helping us create positive change in our community.
                    </p>
                </div>

                {/* Transaction Card */}
                <div className="bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-2xl p-6 text-white shadow-2xl mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-teal-100 text-sm font-semibold mb-1">REFERENCE NUMBER</p>
                            <p className="text-2xl font-bold tracking-wide">DON-{donation.donation_id}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-teal-100 text-sm font-semibold mb-1">AMOUNT</p>
                            <p className="text-3xl font-extrabold">{formatCurrency(donation.amount)}</p>
                        </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 inline-block">
                        <p className="text-sm font-semibold">{donation.donation_type === 'monthly' ? '🔄 RECURRING' : '✨ ONE-TIME'}</p>
                    </div>
                </div>

                {/* Your Support Matters */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-[#63A6B2]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                        </svg>
                        Your Support Matters
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Your generous donation of <span className="font-bold text-[#63A6B2]">{formatCurrency(donation.amount)}</span> will help us {campaign.campaign_type === 'Infrastructure' ? 'build essential infrastructure' : campaign.campaign_type === 'Education' ? 'provide educational opportunities' : 'support our mission'} to serve our community better. On behalf of everyone at <span className="font-semibold">{campaign.foundation_name}</span>, we sincerely thank you for your generosity.
                    </p>

                    {/* Campaign Link */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Campaign:</p>
                        <button
                            onClick={() => navigate(`/campaigns/${campaign.campaign_id}`)}
                            className="text-[#63A6B2] font-bold hover:underline text-left"
                        >
                            {campaign.campaign_name}
                        </button>
                    </div>
                </div>

                {/* Donation Details */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 font-semibold mb-1">Date & Time</p>
                            <p className="text-gray-900 font-bold">{formatDateTime(donation.created_at)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-semibold mb-1">Payment Method</p>
                            <p className="text-gray-900 font-bold">{getPaymentMethodName(donation.payment_method)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-semibold mb-1">Transaction ID</p>
                            <p className="text-gray-900 font-mono text-sm">GC-{donation.donation_id}-5F8A98</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-semibold mb-1">Donor Name</p>
                            <p className="text-gray-900 font-bold">{donation.donor_name}</p>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500 font-semibold mb-1">Receipt sent to</p>
                        <p className="text-gray-900 font-bold">{donation.donor_email}</p>
                    </div>
                </div>

                {/* Donor Message */}
                {donation.message && (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-lg border border-blue-200 mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#63A6B2]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                            Message from Donor
                        </h3>
                        <p className="text-gray-700 italic leading-relaxed text-lg">"{donation.message}"</p>
                    </div>
                )}

                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => navigate(`/donations/${donationId}/receipt`)}
                        className="flex-1 bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                        </svg>
                        View Receipt
                    </button>
                    <button
                        onClick={() => navigate('/campaigns')}
                        className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                        View All Campaigns
                    </button>
                </div>

                {/* What Happens Next - Centered Below */}
                <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">What Happens Next?</h2>

                    <div className="space-y-6 max-w-2xl mx-auto">
                        {/* Step 1 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                1
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">Receipt Sent</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    A detailed receipt has been sent to your email for tax purposes.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                2
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">Campaign Updates</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    You'll receive regular updates about how your donation is making an impact.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                3
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-2">Track Your Impact</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    View your donation history and see all the campaigns you've supported.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-8 pt-6 border-t border-gray-200 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-4">
                        <p className="text-sm text-gray-700 text-center leading-relaxed">
                            Questions? Contact us at <a href="mailto:support@svrtf.org" className="text-[#63A6B2] font-bold hover:underline">support@svrtf.org</a> or call <span className="font-semibold">(02) 1234-5678</span>
                        </p>
                        <p className="text-xs text-gray-500 text-center mt-3">
                            © 2026 Shepherd's Voice Radio and Television Foundation, Inc.
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
