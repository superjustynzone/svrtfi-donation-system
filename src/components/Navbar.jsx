import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar({ userData = null }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(userData);

    useEffect(() => {
        // If no userData passed, try to get from localStorage
        if (!userData) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        }
    }, [userData]);

    const isActive = (path) => location.pathname === path;

    const getInitials = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
        }
        if (user?.first_name && user?.last_name) {
            return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
        }
        return 'U';
    };

    return (
        <nav className="bg-white/95 backdrop-blur-md shadow-sm fixed w-full top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/images/logo.png" alt="Shepherd's Voice Logo" className="h-16 w-16 object-contain" />
                        <div>
                            <div className="font-bold text-gray-900 text-base leading-tight">Shepherd's Voice</div>
                            <div className="text-xs text-gray-600">Radio and TV Foundation Inc</div>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-10">
                        <a
                            href="/"
                            className={`font-medium transition relative py-2 ${isActive('/') ? 'text-[#63A6B2]' : 'text-gray-700 hover:text-[#63A6B2]'
                                }`}
                        >
                            Home
                            {isActive('/') && <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#63A6B2] rounded-full"></span>}
                        </a>
                        <a
                            href="/about"
                            className={`font-medium transition relative py-2 ${isActive('/about') ? 'text-[#63A6B2]' : 'text-gray-700 hover:text-[#63A6B2]'
                                }`}
                        >
                            About SVRTV
                            {isActive('/about') && <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#63A6B2] rounded-full"></span>}
                        </a>
                        <a
                            href="/campaigns"
                            className={`font-medium transition relative py-2 ${isActive('/campaigns') ? 'text-[#63A6B2]' : 'text-gray-700 hover:text-[#63A6B2]'
                                }`}
                        >
                            Campaigns
                            {isActive('/campaigns') && <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#63A6B2] rounded-full"></span>}
                        </a>
                        <a
                            href="/foundations"
                            className={`font-medium transition relative py-2 ${isActive('/foundations') ? 'text-[#63A6B2]' : 'text-gray-700 hover:text-[#63A6B2]'
                                }`}
                        >
                            Foundations
                            {isActive('/foundations') && <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#63A6B2] rounded-full"></span>}
                        </a>
                        <a
                            href="/contact"
                            className={`font-medium transition relative py-2 ${isActive('/contact') ? 'text-[#63A6B2]' : 'text-gray-700 hover:text-[#63A6B2]'
                                }`}
                        >
                            Contact Us
                            {isActive('/contact') && <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#63A6B2] rounded-full"></span>}
                        </a>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[#63A6B2] hover:bg-[#5a959f] text-white px-6 py-2.5 rounded-full font-medium transition shadow-md hover:shadow-lg"
                        >
                            Donate
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-11 h-11 bg-[#63A6B2] hover:bg-[#5a959f] rounded-full flex items-center justify-center transition shadow-md hover:shadow-lg text-white font-bold text-sm hover:scale-105 transform duration-200 overflow-hidden"
                            title="Profile"
                        >
                            {user?.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span>{getInitials()}</span>
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t shadow-lg">
                    <div className="px-4 py-4 space-y-3">
                        <a
                            href="/"
                            className={`block font-medium transition py-2 px-3 rounded-lg ${isActive('/') ? 'text-[#63A6B2] bg-teal-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Home
                        </a>
                        <a
                            href="/about"
                            className={`block font-medium transition py-2 px-3 rounded-lg ${isActive('/about') ? 'text-[#63A6B2] bg-teal-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            About SVRTV
                        </a>
                        <a
                            href="/campaigns"
                            className={`block font-medium transition py-2 px-3 rounded-lg ${isActive('/campaigns') ? 'text-[#63A6B2] bg-teal-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Campaigns
                        </a>
                        <a
                            href="/foundations"
                            className={`block font-medium transition py-2 px-3 rounded-lg ${isActive('/foundations') ? 'text-[#63A6B2] bg-teal-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Foundations
                        </a>
                        <a
                            href="/contact"
                            className={`block font-medium transition py-2 px-3 rounded-lg ${isActive('/contact') ? 'text-[#63A6B2] bg-teal-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Contact Us
                        </a>
                        <a
                            href="/profile"
                            className={`flex items-center gap-3 font-medium transition py-2 px-3 rounded-lg ${isActive('/profile') ? 'text-[#63A6B2] bg-teal-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <div className="w-8 h-8 bg-[#63A6B2] rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                                {user?.profileImage ? (
                                    <img
                                        src={user.profileImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span>{getInitials()}</span>
                                )}
                            </div>
                            <span>Profile</span>
                        </a>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-[#63A6B2] hover:bg-[#5a959f] text-white px-6 py-2.5 rounded-full font-medium transition"
                        >
                            Donate
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
