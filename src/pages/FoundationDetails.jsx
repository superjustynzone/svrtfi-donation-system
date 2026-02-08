import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function FoundationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [foundation, setFoundation] = useState(null);
    const [otherFoundations, setOtherFoundations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchFoundationDetails();
        fetchOtherFoundations();
    }, [id]);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50">
            <Navbar />

            {/* Hero Section with Cover Image */}
            <div className="relative mt-20">
                <div
                    className="h-64 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${foundation.cover_image_url})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>

                    {/* Foundation Name Overlay */}
                    <div className="absolute bottom-8 left-8">
                        <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-gray-700 mb-3 inline-block">
                            Active Care
                        </span>
                        <h1 className="text-4xl font-bold text-white mb-2">{foundation.foundation_name}</h1>
                        <p className="text-xl text-white/90 italic">{foundation.tagline}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                <p className="text-3xl font-bold text-[#63A6B2] mb-1">{foundation.beneficiaries}</p>
                                <p className="text-sm text-gray-600">Beneficiaries</p>
                            </div>
                            <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                                <p className="text-3xl font-bold text-pink-600 mb-1">{foundation.founded_year}</p>
                                <p className="text-sm text-gray-600">Established</p>
                            </div>
                            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                                <p className="text-3xl font-bold text-yellow-600 mb-1">{(foundation.focus_areas || []).length}</p>
                                <p className="text-sm text-gray-600">Focus Areas</p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <p className="text-lg font-bold text-green-600">{foundation.status}</p>
                                </div>
                                <p className="text-sm text-gray-600">Status</p>
                            </div>
                        </div>

                        {/* About Section */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Foundation</h2>
                            <p className="text-gray-700 leading-relaxed">{foundation.description}</p>
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
                                <p className="text-gray-700 leading-relaxed text-sm">{foundation.mission}</p>
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
                                <p className="text-gray-700 leading-relaxed text-sm">{foundation.vision}</p>
                            </div>
                        </div>

                        {/* Focus Areas */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Focus Areas</h3>
                            <div className="space-y-3">
                                {(foundation.focus_areas || []).map((area, index) => (
                                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="w-2 h-2 bg-[#63A6B2] rounded-full"></div>
                                        <span className="text-gray-800 font-medium">{area}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Location</p>
                                        <p className="text-sm text-gray-600">{foundation.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-green-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Phone</p>
                                        <a href={`tel:${foundation.phone}`} className="text-sm text-[#63A6B2] hover:underline">{foundation.phone}</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-purple-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Email</p>
                                        <a href={`mailto:${foundation.email}`} className="text-sm text-[#63A6B2] hover:underline">{foundation.email}</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-orange-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Website</p>
                                        <a href={`https://${foundation.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#63A6B2] hover:underline">
                                            {foundation.website}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Foundation Logo Card */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                            <div className="h-72 w-full bg-gradient-to-br from-[#63A6B2] to-[#4a8a95]">
                                <img
                                    src={foundation.logo_url || foundation.foundation_logo}
                                    alt={`${foundation.foundation_name} logo`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Donate Button */}
                        <button
                            onClick={() => toast.info('Donation feature coming soon!')}
                            className="w-full bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all"
                        >
                            Donate Now
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
                                                src={other.cover_image_url}
                                                alt={other.foundation_name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <h4 className="text-white font-bold text-sm line-clamp-1">{other.foundation_name}</h4>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{other.tagline}</p>
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
            </div>

            <Footer />
        </div>
    );
}
