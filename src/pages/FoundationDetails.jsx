import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import 'react-quill-new/dist/quill.snow.css';

// Helper to strip HTML tags for plain-text truncation
const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

export default function FoundationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [foundation, setFoundation] = useState(null);
    const [otherFoundations, setOtherFoundations] = useState([]);
    const [featuredCampaign, setFeaturedCampaign] = useState(null);
    const [stories, setStories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCover, setSelectedCover] = useState(0);


    useEffect(() => {
        fetchFoundationDetails();
        fetchOtherFoundations();
        fetchFeaturedCampaign();
        fetchStories();
        setSelectedCover(0); // Reset to first image on foundation change
    }, [id]);

    const fetchStories = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/stories/foundation/${id}`);
            if (response.ok) {
                const data = await response.json();
                setStories(data.filter(story => story.is_published));
            }
        } catch (error) {
            console.error('Error fetching stories:', error);
            setStories([]);
        }
    };

    // Auto-scroll hero banner
    useEffect(() => {
        const mediaCount = foundation?.media?.length || 0;
        if (mediaCount <= 1 || isLoading) return;

        const interval = setInterval(() => {
            setSelectedCover(prev => (prev + 1) % mediaCount);
        }, 5000); // Change image every 5 seconds

        return () => clearInterval(interval);
    }, [foundation, isLoading]);

    const fetchFoundationDetails = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:5000/api/foundations/${id}`);

            if (response.ok) {
                const data = await response.json();
                setFoundation(data);
            } else {
                useMockFoundationData();
            }
        } catch (error) {
            console.error('Error fetching foundation details:', error);
            useMockFoundationData();
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOtherFoundations = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/foundations/all');

            if (response.ok) {
                const data = await response.json();
                // Filter out current foundation and limit to 3
                const filtered = data.filter(f => f.foundation_id !== parseInt(id)).slice(0, 3);
                setOtherFoundations(filtered);
            } else {
                useMockOtherFoundations();
            }
        } catch (error) {
            console.error('Error fetching other foundations:', error);
            useMockOtherFoundations();
        }
    };

    const fetchFeaturedCampaign = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/campaigns/published');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    // Find a featured published campaign linked to this foundation
                    const featured = data.find(c => c.foundation_id === parseInt(id) && c.is_featured);
                    setFeaturedCampaign(featured || null);
                } else {
                    setFeaturedCampaign(null);
                }
            }
        } catch (error) {
            console.error('Error fetching featured campaign:', error);
            setFeaturedCampaign(null);
        }
    };

    const useMockFoundationData = () => {
        setFoundation({
            foundation_id: id,
            foundation_name: "Anawim Lay Missions Foundation",
            tagline: "Caring for the Abandoned Elderly",
            description: "Anawim provides shelter, medical care and love to abandoned and homeless elderly persons. We believe every senior deserves dignity and compassion in their final years. Since 1992, Anawim Lay Missions Foundation has been making a significant impact in Quezon City, Metro Manila. Through dedicated programs and compassionate service, they continue to transform lives and strengthen communities.",
            mission: "To provide a loving home and dignified care for abandoned and homeless elderly persons, ensuring they live their remaining years with compassion, respect, and proper medical attention.",
            vision: "A society where every elderly person is valued, cared for, and lives with dignity regardless of their circumstances or family situation.",
            cover_image_url: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=1200",
            logo_url: "https://via.placeholder.com/100/63A6B2/FFFFFF?text=ALMF",
            address: "Quezon City, Metro Manila",
            phone: "(02) 8123-4567",
            email: "info@anawim.org.ph",
            website: "www.anawim.org.ph",
            focus_areas: ["Elderly Care", "Medical Support", "Hospice Care"],
            founded_year: 1992,
            beneficiaries: "150+ elderly",
            status: "Active"
        });
    };

    const useMockOtherFoundations = () => {
        setOtherFoundations([
            {
                foundation_id: 2,
                foundation_name: "Tahanan ng Pagmamahal Foundation",
                tagline: "Empowering Children Through Education",
                cover_image_url: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600",
                logo_url: "https://via.placeholder.com/80/4a8a95/FFFFFF?text=TPF"
            },
            {
                foundation_id: 3,
                foundation_name: "Alagaang Kalusugan Medical Mission",
                tagline: "Healthcare for the Underserved",
                cover_image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600",
                logo_url: "https://via.placeholder.com/80/5b9aa0/FFFFFF?text=AKMM"
            },
            {
                foundation_id: 4,
                foundation_name: "Bahay Kalinga Community Center",
                tagline: "Building Stronger Communities",
                cover_image_url: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600",
                logo_url: "https://via.placeholder.com/80/6bb6bd/FFFFFF?text=BKCC"
            }
        ]);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#63A6B2]"></div>
            </div>
        );
    }

    if (!foundation) {
        return null;
    }

    const hasMedia = foundation.media && foundation.media.length > 0;
    const currentCoverUrl = hasMedia
        ? `http://localhost:5000${foundation.media[selectedCover].file_url}`
        : foundation.image_cover
            ? `http://localhost:5000${foundation.image_cover}`
            : 'https://via.placeholder.com/1200x400/63A6B2/FFFFFF?text=Foundation';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
            <Navbar />

            {/* Hero Section with Cover Image */}
            <div className="relative mt-20">
                <div
                    className="h-96 md:h-[400px] bg-cover bg-center relative group transition-all duration-500"
                    style={{ backgroundImage: `url(${currentCoverUrl})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>

                    {/* Image Controls */}
                    {hasMedia && foundation.media.length > 1 && (
                        <>
                            {/* Image Counter */}
                            <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-bold border border-white/20 z-10">
                                {selectedCover + 1} / {foundation.media.length}
                            </div>
                        </>
                    )}

                    {/* Foundation Name Overlay */}
                    <div className="absolute bottom-10 left-8 md:left-12">
                        <div className="flex items-center gap-6">
                            {/* Logo inside Hero */}
                            {foundation.image_logo && (
                                <div className="hidden md:block h-24 w-24 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl bg-white flex-shrink-0">
                                    <img
                                        src={`http://localhost:5000${foundation.image_logo}`}
                                        alt={`${foundation.foundation_name} Logo`}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}
                            <div>
                                <span className="bg-[#63A6B2] px-4 py-2 rounded-full text-xs font-bold text-white mb-4 inline-block uppercase tracking-wider shadow-lg">
                                    Foundation
                                </span>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-md">{foundation.foundation_name}</h1>
                                <p className="text-xl text-white/90 italic drop-shadow-sm max-w-2xl">{foundation.mission ? stripHtml(foundation.mission).substring(0, 150) + (stripHtml(foundation.mission).length > 150 ? '...' : '') : ''}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thumbnail Indicators (Optional, for better UX) */}
                {hasMedia && foundation.media.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                        {foundation.media.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedCover(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${selectedCover === idx ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Featured Campaign Card (Left Column) */}
                        {featuredCampaign ? (
                            <div
                                onClick={() => navigate(`/campaigns/${featuredCampaign.campaign_id}`)}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 cursor-pointer group"
                            >
                                {/* Header */}
                                {/* Header Removed */}
                                {/* Banner Image */}
                                <div className="relative h-44 overflow-hidden">
                                    <img
                                        src={featuredCampaign.file_url ? `http://localhost:5000${featuredCampaign.file_url}` : 'https://via.placeholder.com/800x300/63A6B2/FFFFFF?text=Campaign'}
                                        alt={featuredCampaign.campaign_name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-4 left-6 right-6">
                                        <h4 className="text-white font-bold text-lg line-clamp-1 drop-shadow">{featuredCampaign.campaign_name}</h4>
                                    </div>
                                </div>
                                {/* Campaign Info */}
                                <div className="p-6">
                                    <div 
                                        className="prose prose-sm max-w-none text-gray-600 mb-4 line-clamp-2 ql-editor" 
                                        style={{ padding: 0 }} 
                                        dangerouslySetInnerHTML={{ __html: featuredCampaign.campaign_description || 'Support this campaign and make a difference.' }} 
                                    />
                                    {featuredCampaign.goal_amount && (
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span className="font-medium">₱{Number(featuredCampaign.current_amount || 0).toLocaleString()} raised</span>
                                                <span>Goal: ₱{Number(featuredCampaign.goal_amount).toLocaleString()}</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, ((featuredCampaign.current_amount || 0) / featuredCampaign.goal_amount) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-4 flex items-center gap-1 text-[#63A6B2] text-sm font-semibold">
                                        <span>View Campaign</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* About Section */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Foundation</h2>
                            <div 
                                className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed ql-editor" 
                                style={{ padding: 0 }} 
                                dangerouslySetInnerHTML={{ __html: foundation.about_foundation || foundation.description || '' }} 
                            />
                        </div>

                        {/* Mission & Vision */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Mission */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-blue-600">Mission</h3>
                                </div>
                                <div 
                                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-sm ql-editor" 
                                    style={{ padding: 0 }} 
                                    dangerouslySetInnerHTML={{ __html: foundation.mission || '' }} 
                                />
                            </div>

                            {/* Vision */}
                            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-pink-500">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-pink-600">Vision</h3>
                                </div>
                                <div 
                                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-sm ql-editor" 
                                    style={{ padding: 0 }} 
                                    dangerouslySetInnerHTML={{ __html: foundation.vision || '' }} 
                                />
                            </div>
                        </div>

                        {/* Focus Areas */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Focus Areas</h3>
                            <div className="space-y-3">
                                {(foundation.focus_areas ? (Array.isArray(foundation.focus_areas) ? foundation.focus_areas : foundation.focus_areas.split(',')) : []).map((area, index) => (
                                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="w-2 h-2 bg-[#63A6B2] rounded-full"></div>
                                        <span className="text-gray-800 font-medium">{area.trim()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>
                            <div className="flex flex-col gap-5">
                                {foundation.foundation_address && (
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-blue-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Location</p>
                                            <p className="text-sm text-gray-600">{foundation.foundation_address}</p>
                                        </div>
                                    </div>
                                )}
                                {foundation.foundation_email && (
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-purple-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Email</p>
                                            <a href={`mailto:${foundation.foundation_email}`} className="text-sm text-[#63A6B2] hover:underline">{foundation.foundation_email}</a>
                                        </div>
                                    </div>
                                )}
                                {foundation.foundation_contact && (
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-green-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Phone</p>
                                            <a href={`tel:${foundation.foundation_contact}`} className="text-sm text-[#63A6B2] hover:underline">{foundation.foundation_contact}</a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Foundation Logo Card */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                            <div className="h-72 w-full bg-white flex items-center justify-center p-4">
                                <img
                                    src={foundation.image_logo ? `http://localhost:5000${foundation.image_logo}` : 'https://via.placeholder.com/300/63A6B2/FFFFFF?text=Logo'}
                                    alt={`${foundation.foundation_name} logo`}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>



                        {/* Bank Details Card */}
                        <div className="rounded-2xl shadow-lg overflow-hidden border border-[#63A6B2]/20">
                            {/* Header - matches teal theme */}
                            <div className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] px-5 py-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-white font-bold text-sm tracking-wide">BANK DETAILS</span>
                            </div>
                            {/* Bank Name Section */}
                            <div className="bg-[#63A6B2]/10 px-5 py-4 border-b border-[#63A6B2]/20">
                                <p className="text-xs font-bold text-[#4a8a95] uppercase tracking-wider mb-1">Bank Name</p>
                                <p className="text-sm font-semibold text-gray-800 leading-snug">
                                    {foundation.bank_name || foundation.foundation_name}
                                </p>
                            </div>
                            {/* Bank Details Section */}
                            <div className="bg-white px-5 py-4">
                                <p className="text-xs font-bold text-[#4a8a95] uppercase tracking-wider mb-3">Bank Details</p>
                                <div className="space-y-2">
                                    {/* Current Account */}
                                    <div className="flex items-center justify-between group">
                                        <p className="text-sm text-gray-700 font-medium">
                                            {foundation.bank_ca_label || 'Banco De Oro C/A'}{' '}
                                            <span className="font-bold text-gray-900"># {foundation.bank_ca_number || '3970019804'}</span>
                                        </p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(foundation.bank_ca_number || '3970019804');
                                                toast.success('Account number copied!');
                                            }}
                                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#63A6B2] hover:text-[#4a8a95]"
                                            title="Copy"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                    {/* Savings Account */}
                                    <div className="flex items-center justify-between group">
                                        <p className="text-sm text-gray-700 font-medium">
                                            {foundation.bank_sa_label || 'Banco De Oro S/A'}{' '}
                                            <span className="font-bold text-gray-900"># {foundation.bank_sa_number || '160506123'}</span>
                                        </p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(foundation.bank_sa_number || '160506123');
                                                toast.success('Account number copied!');
                                            }}
                                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#63A6B2] hover:text-[#4a8a95]"
                                            title="Copy"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Donate Button text and action based on featuredCampaign */}
                        <button
                            onClick={() => featuredCampaign ? navigate(`/campaigns/${featuredCampaign.campaign_id}`) : navigate('/campaigns')}
                            className="w-full bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all"
                        >
                            {featuredCampaign ? 'Donate Now' : 'Go To Campaigns'}
                        </button>

                        {/* Explore Other Foundations */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Explore Other Foundations</h3>
                            <div className="space-y-4">
                                {otherFoundations.map(other => (
                                    <div
                                        key={other.foundation_id}
                                        onClick={() => navigate(`/foundations/${other.foundation_id}`)}
                                        className="cursor-pointer group"
                                    >
                                        <div className="relative h-32 rounded-xl overflow-hidden mb-3">
                                            <img
                                                src={other.image_cover ? `http://localhost:5000${other.image_cover}` : 'https://via.placeholder.com/600x400/63A6B2/FFFFFF?text=Foundation'}
                                                alt={other.foundation_name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <h4 className="text-white font-bold text-sm line-clamp-1">{other.foundation_name}</h4>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{other.mission ? stripHtml(other.mission).substring(0, 50) + '...' : (other.about_foundation ? stripHtml(other.about_foundation).substring(0, 50) + '...' : 'No description')}</p>
                                        <button className="text-[#63A6B2] text-sm font-semibold hover:underline flex items-center gap-1">
                                            Learn More
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => navigate('/foundations')}
                                className="w-full mt-6 border-2 border-[#63A6B2] text-[#63A6B2] py-3 rounded-xl font-semibold hover:bg-[#63A6B2] hover:text-white transition-all"
                            >
                                View All Foundations
                            </button>
                        </div>
                    </div>
                </div>

                {/* Foundation Stories Section */}
                {stories.length > 0 && (
                    <div className="mt-16">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-extrabold text-gray-900">Stories</h2>
                            <div className="h-1 flex-1 bg-gradient-to-r from-[#63A6B2]/20 to-transparent ml-6 rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {stories.map(story => (
                                <div 
                                    key={story.story_id} 
                                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow group cursor-pointer"
                                onClick={() => navigate(`/stories/${story.story_id}`)}
                                >
                                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                                        <img 
                                            src={story.images && story.images.length > 0 ? `http://localhost:5000${story.images[0].image_file}` : 'https://via.placeholder.com/600x400/63A6B2/FFFFFF?text=Story'} 
                                            alt={story.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />

                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="bg-[#63A6B2] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                Read Full Story
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-[#63A6B2] transition-[color]">{story.title}</h3>
                                        <div 
                                            className="prose prose-sm text-gray-600 line-clamp-3 mb-6 ql-editor" 
                                            style={{ padding: 0 }} 
                                            dangerouslySetInnerHTML={{ __html: story.content }} 
                                        />
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                            {story.author ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-500">Author</span>
                                                    <span className="text-sm font-semibold text-gray-900">{story.author}</span>
                                                </div>
                                            ) : (
                                                <div></div>
                                            )}
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-gray-500">Date</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {new Date(story.published_at || story.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>


            <Footer />
        </div>
    );
}
