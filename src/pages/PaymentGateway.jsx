import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function PaymentGateway() {
    const { donationId } = useParams();
    const navigate = useNavigate();

    const [donation, setDonation] = useState(null);
    const [campaign, setCampaign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Timer state
    const [timeLeft, setTimeLeft] = useState(60); // 60 seconds timeout

    useEffect(() => {
        fetchDonationDetails();
    }, [donationId]);

    // Countdown Timer logic
    useEffect(() => {
        if (!donation || donation.status !== 'pending' || isProcessing) return;

        if (timeLeft <= 0) {
            handleTimeout();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, donation, isProcessing]);


    const fetchDonationDetails = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:5000/api/donations/${donationId}`);
            
            if (response.ok) {
                const data = await response.json();
                setDonation(data);

                // If already completed or cancelled, redirect away
                if (data.status === 'completed') {
                    navigate(`/donations/${donationId}/confirmation`);
                    return;
                }
                if (data.status === 'cancelled') {
                    toast.error('This donation has already been cancelled.');
                    navigate(`/campaigns/${data.campaign_id}`);
                    return;
                }

                // Fetch campaign for display name
                const campResponse = await fetch(`http://localhost:5000/api/campaigns/${data.campaign_id}`);
                if (campResponse.ok) {
                    const campData = await campResponse.json();
                    setCampaign(campData);
                }
            } else {
                toast.error('Donation transaction not found');
                navigate('/campaigns');
            }
        } catch (error) {
            console.error('Error fetching donation:', error);
            toast.error('Failed to load transaction details.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccess = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch(`http://localhost:5000/api/donations/${donationId}/complete`, {
                method: 'PATCH',
            });

            if (response.ok) {
                toast.success('Payment successful!');
                setTimeout(() => {
                    navigate(`/donations/${donationId}/confirmation`);
                }, 1500);
            } else {
                const result = await response.json();
                toast.error(result.message || 'Failed to complete payment.');
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Error completing payment:', error);
            toast.error('Network error. Failed to complete payment.');
            setIsProcessing(false);
        }
    };

    const handleCancel = async (isTimeout = false) => {
        setIsProcessing(true);
        try {
            const response = await fetch(`http://localhost:5000/api/donations/${donationId}/cancel`, {
                method: 'PATCH',
            });

            if (response.ok) {
                if (isTimeout) {
                    toast.error('Payment session expired. Transaction cancelled.');
                } else {
                    toast.info('Payment was cancelled.');
                }
                
                setTimeout(() => {
                    navigate(campaign ? `/campaigns/${campaign.campaign_id}` : '/campaigns');
                }, 2000);
            } else {
                const result = await response.json();
                toast.error(result.message || 'Failed to cancel payment.');
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Error cancelling payment:', error);
            toast.error('Network error. Failed to cancel payment.');
            setIsProcessing(false);
        }
    };

    const handleTimeout = () => {
        handleCancel(true);
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₱0.00';
        return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getPaymentProviderConfig = (method) => {
        const configs = {
            'gcash': { name: 'GCash', color: 'bg-blue-600', text: 'text-blue-600', bgLight: 'bg-blue-50', border: 'border-blue-200' },
            'paymaya': { name: 'Maya', color: 'bg-green-600', text: 'text-green-600', bgLight: 'bg-green-50', border: 'border-green-200' },
            'bank': { name: 'Bank Transfer', color: 'bg-purple-600', text: 'text-purple-600', bgLight: 'bg-purple-50', border: 'border-purple-200' },
            'card': { name: 'Credit/Debit Card', color: 'bg-gray-800', text: 'text-gray-800', bgLight: 'bg-gray-50', border: 'border-gray-200' }
        };
        return configs[method] || configs['card'];
    };

    if (isLoading || !donation) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900"></div>
            </div>
        );
    }

    const provider = getPaymentProviderConfig(donation.payment_method);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            
            {/* Header / Logo Simulation */}
            <div className="mb-8 text-center">
                <h1 className={`text-3xl font-extrabold ${provider.text} tracking-tight`}>
                    {provider.name} <span className="text-gray-900 font-light">Secure Pay</span>
                </h1>
                <p className="text-gray-500 mt-2 text-sm">Testing Environment (Simulator)</p>
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Amount Header */}
                <div className={`${provider.bgLight} ${provider.border} border-b p-6 text-center`}>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Total Amount Due</p>
                    <p className={`text-4xl font-black ${provider.text}`}>
                        {formatCurrency(donation.amount)}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 font-medium">Ref: {donation.payment_reference || `DON-${donation.donation_id}`}</p>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                        <span className="text-gray-500">Merchant</span>
                        <span className="font-semibold text-gray-900 text-right">SVRTV Foundation</span>
                    </div>
                    {campaign && (
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                            <span className="text-gray-500">Item</span>
                            <span className="font-semibold text-gray-900 text-right truncate max-w-[200px]">{campaign.campaign_name}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                        <span className="text-gray-500">Status</span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase tracking-wide">
                            Awaiting Payment
                        </span>
                    </div>

                    {/* Timer */}
                    <div className="py-4 text-center">
                        <p className="text-sm text-gray-500 mb-2">Complete your payment within</p>
                        <div className="text-3xl font-mono font-bold text-gray-800 flex items-center justify-center gap-2">
                            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>

                {/* Developer / Simulator Controls */}
                <div className="bg-gray-50 p-6 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">Simulator Controls</p>
                    
                    <div className="space-y-3">
                        <button
                            onClick={handleSuccess}
                            disabled={isProcessing || timeLeft <= 0}
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-all ${isProcessing 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : `${provider.color} hover:opacity-90 hover:shadow-lg transform hover:-translate-y-0.5`
                            }`}
                        >
                            {isProcessing ? 'Processing...' : 'Authorize Payment (Success)'}
                        </button>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleCancel(false)}
                                disabled={isProcessing}
                                className="w-full py-3 rounded-xl font-bold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTimeout}
                                disabled={isProcessing}
                                className="w-full py-3 rounded-xl font-bold text-orange-700 bg-orange-50 border-2 border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-all disabled:opacity-50"
                            >
                                Force Timeout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <p className="text-gray-400 text-xs mt-8 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Secure 256-bit Encrypted Connection (Sandbox)
            </p>
        </div>
    );
}
