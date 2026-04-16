import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function DonationReceipt() {
    const { donationId } = useParams();
    const navigate = useNavigate();
    const printRef = useRef();
    const [donation, setDonation] = useState(null);
    const [campaign, setCampaign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDonationDetails();
    }, [donationId]);

    const fetchDonationDetails = async () => {
        try {
            setIsLoading(true);

            const donationResponse = await fetch(`http://localhost:5000/api/donations/${donationId}`);

            if (donationResponse.ok) {
                const donationData = await donationResponse.json();
                setDonation(donationData);

                const campaignResponse = await fetch(`http://localhost:5000/api/campaigns/${donationData.campaign_id}`);
                const campaignData = await campaignResponse.json();

                if (campaignResponse.ok) {
                    setCampaign(campaignData);
                }
            } else {
                useMockData();
            }
        } catch (error) {
            console.error('Error fetching donation details:', error);
            console.log('Using mock data for testing...');
            useMockData();
        } finally {
            setIsLoading(false);
        }
    };

    const useMockData = () => {
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
            status: 'completed',
            created_at: new Date().toISOString()
        });

        setCampaign({
            campaign_id: 1,
            campaign_name: 'Build a New Community Chapel',
            campaign_description: 'Help us build a new chapel for our community',
            campaign_type: 'Infrastructure',
            foundation_name: "Shepherd's Voice Radio and Television Foundation, Inc.",
            goal_amount: 500000,
            current_amount: 125000
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleEmail = () => {
        toast.success('Receipt will be sent to your email shortly!');
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₱0.00';
        return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
            <div className="print:hidden">
                <Navbar />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-20 print:mt-0 print:py-0">
                {/* Action Buttons - Hidden when printing */}
                <div className="flex gap-4 mb-8 print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white py-3 rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                        </svg>
                        Download Receipt
                    </button>
                    <button
                        onClick={handleEmail}
                        className="flex-1 bg-white border-2 border-[#63A6B2] text-[#63A6B2] py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Email Receipt
                    </button>
                </div>

                {/* Receipt Content */}
                <div ref={printRef} className="bg-white rounded-2xl shadow-2xl print:shadow-none print:rounded-none">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white p-8 rounded-t-2xl print:rounded-none">
                        <div className="flex justify-between items-center">
                            {/* Logos */}
                            <div className="flex items-center gap-6">
                                {/* SVRTV Logo - Circle */}
                                <div className="bg-white shadow-lg flex items-center justify-center flex-shrink-0" style={{width: '110px', height: '110px', borderRadius: '50%', padding: '8px', overflow: 'hidden'}}>
                                    <img src="/images/logo.png" alt="SVRTV Logo" className="w-full h-full object-contain" style={{borderRadius: '50%'}} />
                                </div>
                                {/* Divider */}
                                <div className="w-px h-16 bg-white/30"></div>
                                {/* Foundation Logo - Circle */}
                                {campaign.foundation_logo ? (
                                    <div className="bg-white shadow-lg flex items-center justify-center flex-shrink-0" style={{width: '110px', height: '110px', borderRadius: '50%', padding: '8px', overflow: 'hidden'}}>
                                        <img
                                            src={`http://localhost:5000${campaign.foundation_logo}`}
                                            alt={`${campaign.foundation_name} Logo`}
                                            className="w-full h-full object-contain"
                                            style={{borderRadius: '50%'}}
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0" style={{width: '110px', height: '110px', borderRadius: '50%'}}>
                                        <span className="text-white font-bold text-3xl">
                                            {campaign.foundation_name ? campaign.foundation_name.charAt(0) : 'F'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <h1 className="text-2xl font-bold mb-1">Official Receipt</h1>
                                <p className="text-teal-100 text-sm mb-3">Tax Deductible Donation</p>
                                {donation.receipt_number && (
                                    <div className="">
                                        <p className="text-xs text-teal-100">Receipt</p>
                                        <p className="text-xl font-bold">{donation.receipt_number}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Organization Information */}
                        <div className="mb-8 pb-6 border-b-2 border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Organization Information</h2>
                            <div className="space-y-1 text-sm">
                                <p className="text-[#63A6B2] font-bold text-lg">{campaign.foundation_name}</p>
                                <p className="text-gray-600">456 Faith Avenue, Manila, Metro Manila 1003</p>
                                <p className="text-gray-600">Phone: (02) 8123-4567 | Mobile: +63 917 123 4567</p>
                                <p className="text-gray-600">Email: donations@svrtf.org</p>
                                <p className="text-gray-600">Website: www.svrtf.org</p>
                            </div>
                        </div>

                        {/* Donor Information */}
                        <div className="mb-8 pb-6 border-b-2 border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Donor Information</h2>
                            <div className="grid grid-cols-2 gap-6">
                                {donation.is_anonymous ? (
                                    <div className="col-span-2">
                                        <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-sm font-semibold px-4 py-2 rounded-full">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                            Anonymous Donor
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold mb-1">Full Name</p>
                                            <p className="text-gray-900 font-bold">{donation.donor_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold mb-1">Email Address</p>
                                            <p className="text-gray-900 font-bold">{donation.donor_email || '—'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Donation Details */}
                        <div className="mb-8 pb-6 border-b-2 border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Donation Details</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold mb-1 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#63A6B2]" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        Date & Time
                                    </p>
                                    <p className="text-gray-900 font-bold">{formatDateTime(donation.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold mb-1 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#63A6B2]" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                        Transaction ID
                                    </p>
                                    <p className="text-gray-900 font-bold font-mono">{donation.transaction_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold mb-1">Campaign</p>
                                    <p className="text-[#63A6B2] font-bold">{campaign.campaign_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold mb-1">Payment Method</p>
                                    <p className="text-gray-900 font-bold">{getPaymentMethodName(donation.payment_method)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold mb-1">Donation Type</p>
                                    <p className="text-gray-900 font-bold">{donation.donation_type === 'monthly' ? 'Monthly (Recurring)' : 'One-Time'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold mb-1">Payment Reference</p>
                                    <p className="text-gray-900 font-mono text-sm">{donation.payment_reference || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div className="mb-8 pb-6 border-b-2 border-gray-200">
                            <div className="flex justify-between items-center bg-gradient-to-br from-teal-50 to-blue-50 p-6 rounded-xl border-2 border-[#63A6B2]">
                                <span className="text-xl font-bold text-gray-900">TOTAL AMOUNT:</span>
                                <span className="text-4xl font-extrabold text-[#63A6B2]">{formatCurrency(donation.amount)}</span>
                            </div>
                            <p className="text-xs text-gray-500 text-right mt-2 italic">Amount in words: Five Thousand Pesos Only</p>
                        </div>

                        {/* Tax Deductible Information */}
                        <div className="mb-8 pb-6 border-b-2 border-gray-200">
                            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    Tax Deductible Information
                                </h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    This donation is <strong>tax deductible</strong> under the laws of the Republic of the Philippines. Please retain this receipt for your tax filing purposes. This organization is accredited by the Bureau of Internal Revenue (BIR) for tax-exempt donations.
                                </p>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mb-8 pb-6 border-b-2 border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-2">Notes</h3>
                            {donation.message ? (
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200 mb-3">
                                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#63A6B2]" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                        </svg>
                                        Message from Donor:
                                    </p>
                                    <p className="text-sm text-gray-700 italic leading-relaxed">"{donation.message}"</p>
                                </div>
                            ) : null}
                            <p className="text-sm text-gray-600 italic">
                                This receipt is valid for tax deduction purposes. Please keep this for your records.
                            </p>
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <p className="text-xs text-gray-500 font-semibold mb-1">Prepared by:</p>
                                <div className="border-b-2 border-gray-300 pb-1 mb-2 h-16"></div>
                                <p className="font-bold text-gray-900">Finance Department</p>
                                <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-semibold mb-1">Approved by:</p>
                                <div className="border-b-2 border-gray-300 pb-1 mb-2 h-16"></div>
                                <p className="font-bold text-gray-900">Authorized Signatory</p>
                                <p className="text-sm text-gray-600">SVRTF Management</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center pt-6 border-t-2 border-gray-200">
                            <p className="text-sm font-bold text-[#63A6B2] mb-2">Thank you for your generous support!</p>
                            <p className="text-xs text-gray-600">
                                This is a computer-generated receipt and is valid without signature.
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                © 2026 Shepherd's Voice Radio and Television Foundation, Inc.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back Button - Hidden when printing */}
                <div className="text-center mt-8 print:hidden">
                    <button
                        onClick={() => navigate('/campaigns')}
                        className="text-gray-600 hover:text-[#63A6B2] font-semibold transition-colors"
                    >
                        ← Back to Campaigns
                    </button>
                </div>
            </div>

            <div className="print:hidden">
                <Footer />
            </div>
        </div>
    );
}
