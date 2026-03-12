import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function DonationNotification() {
    const location = useLocation();
    const [donations, setDonations] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    // 1. Check if we're on an admin page
    const isAdminRoute = location.pathname.startsWith('/admin_');

    // 2. Fetch recent donations on mount
    useEffect(() => {
        if (isAdminRoute) return;

        const fetchDonations = async () => {
            try {
                const res = await fetch('/api/donations/recent');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setDonations(data);
                    }
                }
            } catch (error) {
                console.error('Error fetching recent donations for notification:', error);
            }
        };

        fetchDonations();
        
        // Refresh the list every 2 minutes
        const refreshInterval = setInterval(fetchDonations, 120000);
        return () => clearInterval(refreshInterval);
    }, [isAdminRoute]);

    // 3. Cycle through donations
    useEffect(() => {
        if (donations.length === 0 || isAdminRoute) {
            setIsVisible(false);
            return;
        }

        // Show the current donation
        setIsVisible(true);

        // Hide it after 4.5 seconds
        const hideTimer = setTimeout(() => {
            setIsVisible(false);
        }, 4500);

        // Move to the next one after 5.5 seconds (giving 1 sec for hide animation/pause)
        // Stop automatically if we've shown all donations
        const nextTimer = setTimeout(() => {
            if (currentIndex < donations.length - 1) {
                setCurrentIndex(prev => prev + 1);
            }
        }, 5500);

        return () => {
            clearTimeout(hideTimer);
            clearTimeout(nextTimer);
        };
    }, [donations, currentIndex, isAdminRoute]);

    if (isAdminRoute || donations.length === 0) return null;

    const currentDonation = donations[currentIndex];
    
    // Format name
    const donorName = (currentDonation.first_name || currentDonation.last_name) 
        ? `${currentDonation.first_name || ''} ${currentDonation.last_name || ''}`.trim() 
        : 'Someone';

    return (
        <div 
            className={`fixed bottom-6 left-6 z-50 transition-all duration-500 transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
            }`}
        >
            <div className="bg-white px-4 py-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 pr-10 hover:shadow-2xl transition-shadow cursor-default group max-w-sm overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">
                        <span className="font-bold text-gray-900">{donorName}</span> just donated
                    </p>
                    <p className="text-xs text-[#63A6B2] font-semibold truncate mt-0.5">
                        to {currentDonation.campaign_name || 'a campaign'}
                    </p>
                </div>
            </div>
        </div>
    );
}
