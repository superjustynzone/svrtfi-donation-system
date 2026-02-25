import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar({ userData = null }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(userData);

    useEffect(() => {
        if (userData) {
            setUser(userData);
        } else {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser({
                        ...parsedUser,
                        firstName: parsedUser.firstName || parsedUser.first_name || "",
                        lastName: parsedUser.lastName || parsedUser.last_name || "",
                        profileImage: parsedUser.profileImage || parsedUser.profile_image || null
                    });
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        }
    }, [userData]);

    const isActive = (path) => location.pathname === path;
    const isLoggedIn = !!(user && (user.user_id || user.email));

    const getInitials = () => {
        if (user?.firstName && user?.lastName) return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
        if (user?.first_name && user?.last_name) return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
        return 'U';
    };

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About SVRTV' },
        { href: '/campaigns', label: 'Campaigns' },
        { href: '/foundations', label: 'Foundations' },
        { href: '/contact', label: 'Contact Us' },
    ];

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

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map(link => (
                            <a
                                key={link.href}
                                href={link.href}
                                className={`font-medium transition relative py-2 ${isActive(link.href) ? 'text-[#63A6B2]' : 'text-gray-700 hover:text-[#63A6B2]'}`}
                            >
                                {link.label}
                                {isActive(link.href) && <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#63A6B2] rounded-full"></span>}
                            </a>
                        ))}

                        {/* Donate — always goes to /campaigns */}
                        <button
                            onClick={() => navigate('/campaigns')}
                            className="bg-[#63A6B2] hover:bg-[#5a959f] text-white px-6 py-2.5 rounded-full font-medium transition shadow-md hover:shadow-lg"
                        >
                            Donate
                        </button>

                        {isLoggedIn ? (
                            /* Logged-in: profile avatar */
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-11 h-11 border-2 border-[#63A6B2] hover:border-[#5a959f] rounded-full flex items-center justify-center transition shadow-sm hover:shadow-md text-[#63A6B2] font-bold text-sm hover:scale-105 transform duration-200 overflow-hidden"
                                title="My Profile"
                            >
                                {user?.profileImage || user?.profile_image ? (
                                    <img src={user.profileImage || user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{getInitials()}</span>
                                )}
                            </button>
                        ) : (
                            /* Guest: Log In + Sign Up */
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-gray-700 hover:text-[#63A6B2] font-medium transition"
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="border-2 border-[#63A6B2] text-[#63A6B2] hover:bg-[#63A6B2] hover:text-white px-5 py-2 rounded-full font-medium transition"
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
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
                        {navLinks.map(link => (
                            <a
                                key={link.href}
                                href={link.href}
                                className={`block font-medium transition py-2 px-3 rounded-lg ${isActive(link.href) ? 'text-[#63A6B2] bg-teal-50 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                {link.label}
                            </a>
                        ))}

                        {isLoggedIn ? (
                            <a
                                href="/profile"
                                className={`flex items-center gap-3 font-medium transition py-2 px-3 rounded-lg ${isActive('/profile') ? 'text-[#63A6B2] bg-teal-50 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                <div className="w-8 h-8 border-2 border-[#63A6B2] rounded-full flex items-center justify-center text-[#63A6B2] text-xs font-bold overflow-hidden">
                                    {user?.profileImage ? (
                                        <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{getInitials()}</span>
                                    )}
                                </div>
                                <span>My Profile</span>
                            </a>
                        ) : (
                            <div className="flex gap-2 pt-1">
                                <a href="/login" className="flex-1 text-center font-medium py-2 px-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                                    Log In
                                </a>
                                <a href="/signup" className="flex-1 text-center font-medium py-2 px-3 rounded-lg bg-[#63A6B2] text-white hover:bg-[#5a959f]">
                                    Sign Up
                                </a>
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/campaigns')}
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
