import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CampaignDonation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [campaign, setCampaign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
    const [siteSettings, setSiteSettings] = useState({ terms: '', privacy: '' });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/admin/site-settings');
                const data = await res.json();
                if (res.ok) {
                    setSiteSettings({
                        terms: data.terms_and_conditions || '<p>Terms and conditions content not available.</p>',
                        privacy: data.privacy_policy || '<p>Privacy policy content not available.</p>'
                    });
                }
            } catch (err) {
                console.error('Failed to fetch site settings:', err);
            }
        };
        fetchSettings();
    }, []);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [isPrivacyScrolledToBottom, setIsPrivacyScrolledToBottom] = useState(false);
    const [isTermsScrolledToBottom, setIsTermsScrolledToBottom] = useState(false);

    // Detect logged-in user
    const loggedInUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
    const isLoggedIn = !!(loggedInUser && loggedInUser.user_id);

    // Form data state
    const [donationData, setDonationData] = useState({
        donationType: 'one-time',
        amount: '',
        fullName: '',
        address: '',
        email: '',
        phone: '',
        isAnonymous: false,
        paymentMethod: '',
        message: '',
    });

    useEffect(() => {
        fetchCampaignDetails();
        loadUserData();
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

    const loadUserData = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setDonationData(prev => ({
                ...prev,
                fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                email: user.email || '',
                phone: user.contact_number || user.phone || '',
            }));
        }
    };

    const handleInputChange = (field, value) => {
        setDonationData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleQuickAmount = (amount) => {
        setDonationData(prev => ({
            ...prev,
            amount: amount.toString()
        }));
    };

    const validateStep1 = () => {
        if (!donationData.amount || parseFloat(donationData.amount) <= 0) {
            toast.error('Please enter a valid donation amount');
            return false;
        }

        // Guest-specific validation
        if (!isLoggedIn) {
            if (!donationData.isAnonymous) {
                // Non-anonymous guest: require Full Name
                if (!donationData.fullName.trim()) {
                    toast.error('Please enter your full name');
                    return false;
                }
            }
            // Always require email for guests
            if (!donationData.email.trim()) {
                toast.error('Please enter your email address for receipt purposes');
                return false;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donationData.email)) {
                toast.error('Please enter a valid email address');
                return false;
            }
        }

        // Logged-in + anonymous: only require email
        if (isLoggedIn && donationData.isAnonymous) {
            if (!donationData.email.trim()) {
                toast.error('Please enter your email address for receipt purposes');
                return false;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donationData.email)) {
                toast.error('Please enter a valid email address');
                return false;
            }
        }

        if (!agreedToPrivacy) {
            toast.error('Please agree to the Data Privacy Policy and Terms & Conditions to proceed');
            return false;
        }

        return true;
    };

    const validateStep2 = () => {
        if (!donationData.paymentMethod) {
            toast.error('Please select a payment method');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (currentStep === 1 && !validateStep1()) return;
        if (currentStep === 2 && !validateStep2()) return;
        setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));

            const donationPayload = {
                campaign_id: parseInt(id),
                user_id: user?.user_id || null,
                amount: parseFloat(donationData.amount),
                donation_type: donationData.donationType,
                payment_method: donationData.paymentMethod,
                is_anonymous: donationData.isAnonymous,
                donor_name: donationData.isAnonymous ? 'Anonymous' : donationData.fullName,
                donor_email: donationData.email,
                donor_phone: donationData.phone,
                donor_address: donationData.address || null,
                message: donationData.message || null,
                status: 'pending',
            };

            const response = await fetch('http://localhost:5000/api/donations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(donationPayload),
            });

            const result = await response.json();

            if (response.ok) {
                setShowConfirmModal(false);
                toast.success('Donation initiated! Redirecting to payment gateway...');
                setTimeout(() => {
                    navigate(`/payment/${result.donation_id}`);
                }, 1500);
            } else {
                toast.error(result.message || 'Failed to submit donation');
            }
        } catch (error) {
            console.error('Error submitting donation:', error);
            toast.error('An error occurred while submitting your donation');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrivacyScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 30) {
            setIsPrivacyScrolledToBottom(true);
        }
    };

    const handleTermsScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 30) {
            setIsTermsScrolledToBottom(true);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₱0';
        return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

    if (!campaign) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
            <Navbar />

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white py-16 px-8 mt-20">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                        </svg>
                        <h1 className="text-4xl font-bold">Make a Donation</h1>
                    </div>
                    <p className="text-xl text-blue-100">Supporting: <span className="font-semibold">{campaign.campaign_name}</span></p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Progress Indicator */}
                <div className="mb-10">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3].map((step) => (
                            <React.Fragment key={step}>
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${currentStep >= step
                                        ? 'bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white shadow-lg scale-110'
                                        : 'bg-gray-300 text-gray-600'
                                        }`}>
                                        {step}
                                    </div>
                                    <span className={`text-sm mt-2 font-semibold ${currentStep >= step ? 'text-[#63A6B2]' : 'text-gray-500'
                                        }`}>
                                        {step === 1 ? 'Information' : step === 2 ? 'Payment' : 'Confirm'}
                                    </span>
                                </div>
                                {step < 3 && (
                                    <div className={`h-1 flex-1 mx-4 rounded transition-all ${currentStep > step ? 'bg-gradient-to-r from-[#63A6B2] to-[#4a8a95]' : 'bg-gray-300'
                                        }`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                    {/* Step 1: Donor Information */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Donor Information</h2>

                            {/* Donation Type */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Donation Frequency</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('donationType', 'one-time')}
                                        className={`p-5 rounded-xl border-2 transition-all ${donationData.donationType === 'one-time'
                                            ? 'border-[#63A6B2] bg-gradient-to-br from-teal-50 to-blue-50 shadow-lg scale-105'
                                            : 'border-gray-300 hover:border-[#63A6B2] hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-3">
                                            <svg className="w-6 h-6 text-[#63A6B2]" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                            </svg>
                                            <span className="font-bold text-lg">One-Time</span>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('donationType', 'monthly')}
                                        className={`p-5 rounded-xl border-2 transition-all ${donationData.donationType === 'monthly'
                                            ? 'border-[#63A6B2] bg-gradient-to-br from-teal-50 to-blue-50 shadow-lg scale-105'
                                            : 'border-gray-300 hover:border-[#63A6B2] hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-3">
                                            <svg className="w-6 h-6 text-[#63A6B2]" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-bold text-lg">Monthly</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Donation Amount */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Donation Amount (₱)</label>
                                <input
                                    type="number"
                                    value={donationData.amount}
                                    onChange={(e) => handleInputChange('amount', e.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#63A6B2] focus:border-[#63A6B2] outline-none text-xl font-bold transition-all"
                                    min="1"
                                    step="0.01"
                                />
                                <div className="grid grid-cols-4 gap-3 mt-4">
                                    {[100, 500, 1000, 5000].map(amount => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => handleQuickAmount(amount)}
                                            className="py-3 px-4 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-[#63A6B2] hover:to-[#4a8a95] hover:text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                                        >
                                            ₱{amount}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Anonymous Checkbox — visible for everyone */}
                            <div className="flex items-center gap-3 p-5 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                                <input
                                    type="checkbox"
                                    id="anonymous"
                                    checked={donationData.isAnonymous}
                                    onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                                    className="w-5 h-5 text-[#63A6B2] rounded focus:ring-[#63A6B2] cursor-pointer"
                                />
                                <label htmlFor="anonymous" className="text-sm font-semibold text-gray-700 cursor-pointer flex-1">
                                    Make this donation anonymous (your name will not be shown publicly)
                                </label>
                            </div>

                            {/* Guest: Your Information section */}
                            {!isLoggedIn && (
                                <div className="pt-6 border-t-2 border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Your Information</h3>
                                    <div className="space-y-4">

                                        {/* Full Name — hidden when anonymous */}
                                        {!donationData.isAnonymous && (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                                                <input
                                                    type="text"
                                                    value={donationData.fullName}
                                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                                    placeholder="Juan Dela Cruz"
                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#63A6B2] focus:border-[#63A6B2] outline-none transition-all"
                                                />
                                            </div>
                                        )}

                                        {/* Address — hidden when anonymous */}
                                        {!donationData.isAnonymous && (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                                                <input
                                                    type="text"
                                                    value={donationData.address}
                                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                                    placeholder="123 Rizal St., Brgy. Poblacion, City"
                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#63A6B2] focus:border-[#63A6B2] outline-none transition-all"
                                                />
                                            </div>
                                        )}

                                        {/* Contact Number — hidden when anonymous */}
                                        {!donationData.isAnonymous && (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Contact Number</label>
                                                <input
                                                    type="tel"
                                                    value={donationData.phone}
                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                    placeholder="09123456789"
                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#63A6B2] focus:border-[#63A6B2] outline-none transition-all"
                                                />
                                            </div>
                                        )}

                                        {/* Email Address — always visible for guests */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                                            <input
                                                type="email"
                                                value={donationData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                placeholder="your.email@example.com"
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#63A6B2] focus:border-[#63A6B2] outline-none transition-all"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Your receipt will be sent to this email.</p>
                                        </div>

                                        {/* Message — always visible for guests */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Message (Optional)</label>
                                            <textarea
                                                value={donationData.message}
                                                onChange={(e) => handleInputChange('message', e.target.value)}
                                                placeholder="Share why you're supporting this campaign or leave a message of encouragement..."
                                                rows={4}
                                                maxLength={500}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#63A6B2] focus:border-[#63A6B2] outline-none transition-all resize-none"
                                            />
                                            <p className="text-xs text-gray-500 mt-1 text-right">{donationData.message.length}/500 characters</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Logged-in user info banner */}
                            {isLoggedIn && (
                                <div className="flex items-center gap-4 p-5 bg-teal-50 border-2 border-[#63A6B2] rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-[#63A6B2] flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{loggedInUser?.first_name} {loggedInUser?.last_name}</p>
                                        <p className="text-xs text-gray-500">{loggedInUser?.email} · Donating as yourself</p>
                                    </div>
                                </div>
                            )}

                            {/* Logged-in + anonymous: show email & message fields */}
                            {isLoggedIn && donationData.isAnonymous && (
                                <div className="pt-6 border-t-2 border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Your Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                                            <input
                                                type="email"
                                                value={donationData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                placeholder="your.email@example.com"
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#63A6B2] focus:border-[#63A6B2] outline-none transition-all"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Your receipt will be sent to this email.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Message (Optional)</label>
                                            <textarea
                                                value={donationData.message}
                                                onChange={(e) => handleInputChange('message', e.target.value)}
                                                placeholder="Share why you're supporting this campaign or leave a message of encouragement..."
                                                rows={4}
                                                maxLength={500}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#63A6B2] focus:border-[#63A6B2] outline-none transition-all resize-none"
                                            />
                                            <p className="text-xs text-gray-500 mt-1 text-right">{donationData.message.length}/500 characters</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Logged-in + NOT anonymous: just the message field */}
                            {isLoggedIn && !donationData.isAnonymous && (
                                <div className="pt-6 border-t-2 border-gray-200">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Message (Optional)</label>
                                    <textarea
                                        value={donationData.message}
                                        onChange={(e) => handleInputChange('message', e.target.value)}
                                        placeholder="Share why you're supporting this campaign or leave a message of encouragement..."
                                        rows={4}
                                        maxLength={500}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#63A6B2] focus:border-[#63A6B2] outline-none transition-all resize-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1 text-right">{donationData.message.length}/500 characters</p>
                                </div>
                            )}

                            {/* Data Privacy Checkbox */}
                            <div className={`flex items-start gap-3 p-5 rounded-xl border-2 transition-all ${
                                agreedToPrivacy
                                    ? 'bg-teal-50 border-[#63A6B2]'
                                    : 'bg-gray-50 border-gray-200'
                                }`}>
                                <input
                                    type="checkbox"
                                    id="privacy"
                                    checked={agreedToPrivacy}
                                    disabled={!isPrivacyScrolledToBottom || !isTermsScrolledToBottom}
                                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                                    className={`w-5 h-5 mt-0.5 text-[#63A6B2] rounded focus:ring-[#63A6B2] flex-shrink-0 ${
                                        isPrivacyScrolledToBottom && isTermsScrolledToBottom
                                            ? 'cursor-pointer'
                                            : 'cursor-not-allowed opacity-50'
                                    }`}
                                />
                                <label htmlFor="privacy" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                                    I agree to the{' '}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}
                                        className="font-bold text-[#63A6B2] hover:underline focus:outline-none"
                                    >Data Privacy Policy</button>
                                    {' '}and{' '}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                                        className="font-bold text-[#63A6B2] hover:underline focus:outline-none"
                                    >Terms and Conditions</button>
                                    {' '}of SVRTV Donation. My personal information will be used solely for donation processing and official receipting.
                                </label>
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!agreedToPrivacy}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all mt-2 ${
                                    agreedToPrivacy
                                        ? 'bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white hover:shadow-2xl transform hover:scale-105 cursor-pointer'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Continue to Payment →
                            </button>
                        </div>
                    )}

                    {/* Step 2: Payment Details */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Payment Details</h2>

                            {/* Donation Summary */}
                            <div className="bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-[#63A6B2] shadow-lg">
                                <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#63A6B2]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                    </svg>
                                    Donation Summary
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-semibold">Campaign:</span>
                                        <span className="font-bold text-gray-900">{campaign.campaign_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-semibold">Amount:</span>
                                        <span className="font-extrabold text-[#63A6B2] text-2xl">{formatCurrency(donationData.amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-semibold">Frequency:</span>
                                        <span className="font-bold text-gray-900">
                                            {donationData.donationType === 'monthly' ? '🔄 Monthly (Recurring)' : '✨ One-Time'}
                                        </span>
                                    </div>
                                </div>
                                {donationData.donationType === 'monthly' && (
                                    <div className="mt-4 p-4 bg-orange-100 border-2 border-orange-400 rounded-xl">
                                        <p className="text-sm text-orange-900 font-semibold">
                                            ⚠️ <strong>Recurring Donation:</strong> You will be charged {formatCurrency(donationData.amount)} every month until you cancel.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Payment Method Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Select Payment Method</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { id: 'gcash', name: 'GCash', icon: '💳', color: 'from-blue-500 to-blue-600' },
                                        { id: 'paymaya', name: 'PayMaya', icon: '💰', color: 'from-green-500 to-green-600' },
                                        { id: 'bank', name: 'Bank Transfer', icon: '🏦', color: 'from-purple-500 to-purple-600' },
                                        { id: 'card', name: 'Credit/Debit Card', icon: '💳', color: 'from-pink-500 to-pink-600' }
                                    ].map(method => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => handleInputChange('paymentMethod', method.id)}
                                            className={`p-5 rounded-xl border-2 transition-all ${donationData.paymentMethod === method.id
                                                ? 'border-[#63A6B2] bg-gradient-to-br from-teal-50 to-blue-50 shadow-xl scale-105'
                                                : 'border-gray-300 hover:border-[#63A6B2] hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-3xl">{method.icon}</span>
                                                <span className="font-bold text-gray-900 text-lg">{method.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Instructions */}
                            {donationData.paymentMethod && (
                                <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Payment Instructions
                                    </h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        After clicking "Continue to Review", you will be able to confirm your donation.
                                        Payment details and instructions will be provided after confirmation.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
                                >
                                    Continue to Review →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Review & Confirm</h2>

                            {/* Review Summary */}
                            <div className="space-y-4">
                                {/* Campaign Info */}
                                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Campaign Details</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 font-semibold">Campaign:</span>
                                            <span className="font-bold text-gray-900">{campaign.campaign_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 font-semibold">Organization:</span>
                                            <span className="font-bold text-gray-900">{campaign.foundation_name}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Donation Info */}
                                <div className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border-2 border-[#63A6B2] shadow-lg">
                                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Donation Information</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 font-semibold">Amount:</span>
                                            <span className="font-extrabold text-[#63A6B2] text-3xl">{formatCurrency(donationData.amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 font-semibold">Frequency:</span>
                                            <span className="font-bold text-gray-900">
                                                {donationData.donationType === 'monthly' ? 'Monthly (Recurring)' : 'One-Time'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 font-semibold">Payment Method:</span>
                                            <span className="font-bold text-gray-900">{getPaymentMethodName(donationData.paymentMethod)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Donor Info */}
                                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Donor Information</h3>
                                    {donationData.isAnonymous ? (
                                        <p className="text-gray-600 italic font-semibold">🕶️ This donation will be made anonymously</p>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 font-semibold">Name:</span>
                                                <span className="font-bold text-gray-900">{donationData.fullName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 font-semibold">Email:</span>
                                                <span className="font-bold text-gray-900">{donationData.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 font-semibold">Phone:</span>
                                                <span className="font-bold text-gray-900">{donationData.phone}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Donor Message */}
                                {donationData.message && (
                                    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 mt-4">
                                        <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                                            <svg className="w-5 h-5 text-[#63A6B2]" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                            </svg>
                                            Your Message
                                        </h3>
                                        <p className="text-gray-700 italic leading-relaxed">"{donationData.message}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Important Notice */}
                            <div className="p-5 bg-yellow-50 border-2 border-yellow-400 rounded-xl">
                                <div className="flex gap-3">
                                    <svg className="w-7 h-7 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-bold text-yellow-900 mb-1">⚠️ Please Review Carefully</p>
                                        <p className="text-sm text-yellow-800">
                                            Once you complete this donation, the transaction cannot be undone. Please ensure all information is correct.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handleBack}
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all disabled:opacity-50"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={() => setShowConfirmModal(true)}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Complete Donation
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Back to Campaign Link */}
                <div className="text-center mt-8">
                    <button
                        onClick={() => navigate(`/campaigns/${id}`)}
                        className="text-gray-600 hover:text-[#63A6B2] font-semibold transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Campaign
                    </button>
                </div>
            </div>

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform animate-scale-in">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Donation</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Are you sure you want to complete this donation? Once confirmed, this action cannot be undone.
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-4 rounded-xl mb-6 border-2 border-[#63A6B2]">
                            <p className="text-center font-bold text-gray-900">
                                You're donating <span className="text-[#63A6B2] text-2xl">{formatCurrency(donationData.amount)}</span>
                            </p>
                            <p className="text-center text-sm text-gray-600 mt-1">
                                {donationData.donationType === 'monthly' ? 'Monthly (Recurring)' : 'One-Time Donation'}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={isSubmitting}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white py-3 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    'Yes, Confirm'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Privacy Policy Modal */}
            {showPrivacyModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col" style={{maxHeight: '85vh'}}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Data Privacy Policy</h3>
                            </div>
                            <button onClick={() => setShowPrivacyModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        {/* Scrollable Content */}
                        <div
                            onScroll={handlePrivacyScroll}
                            className="overflow-y-auto overflow-x-hidden overscroll-contain p-6 text-sm text-gray-700 leading-relaxed"
                            style={{flex: '1 1 auto', minHeight: 0, wordBreak: 'break-word'}}
                        >
                            <div className="prose prose-sm w-full max-w-full break-words prose-p:text-gray-700 prose-ul:my-1 prose-headings:text-gray-900 prose-a:text-[#63A6B2] overflow-x-hidden" dangerouslySetInnerHTML={{ __html: siteSettings.privacy }} />
                        </div>
                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200 flex-shrink-0">
                            {!isPrivacyScrolledToBottom && (
                                <p className="text-xs text-center text-gray-500 mb-3 font-semibold animate-pulse">
                                    Please scroll to the bottom to accept the Privacy Policy
                                </p>
                            )}
                            <button
                                onClick={() => { setShowPrivacyModal(false); setAgreedToPrivacy(true); }}
                                disabled={!isPrivacyScrolledToBottom}
                                className={`w-full py-3 text-white rounded-xl font-bold hover:shadow-lg transition-all ${isPrivacyScrolledToBottom
                                    ? 'bg-gradient-to-r from-[#63A6B2] to-[#4a8a95]'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Terms and Conditions Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col" style={{maxHeight: '85vh'}}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Terms &amp; Conditions for Donation</h3>
                            </div>
                            <button onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        {/* Scrollable Content */}
                        <div
                            onScroll={handleTermsScroll}
                            className="overflow-y-auto overflow-x-hidden overscroll-contain p-6 text-sm text-gray-700 leading-relaxed"
                            style={{flex: '1 1 auto', minHeight: 0, wordBreak: 'break-word'}}
                        >
                            <div className="prose prose-sm w-full max-w-full break-words prose-p:text-gray-700 prose-ul:my-1 prose-headings:text-gray-900 prose-a:text-[#63A6B2] overflow-x-hidden" dangerouslySetInnerHTML={{ __html: siteSettings.terms }} />
                        </div>
                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200 flex-shrink-0">
                            {!isTermsScrolledToBottom && (
                                <p className="text-xs text-center text-gray-500 mb-3 font-semibold animate-pulse">
                                    Please scroll to the bottom to accept the Terms of Service
                                </p>
                            )}
                            <button
                                onClick={() => setShowTermsModal(false)}
                                disabled={!isTermsScrolledToBottom}
                                className={`w-full py-3 text-white rounded-xl font-bold hover:shadow-lg transition-all ${isTermsScrolledToBottom
                                    ? 'bg-gradient-to-r from-[#63A6B2] to-[#4a8a95]'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
