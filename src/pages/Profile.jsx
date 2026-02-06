import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Heart, Menu, X, Users, Edit2, Eye, Download, LogOut, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from "react";

export default function Profile() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedData, setEditedData] = useState({});


    // Philippine Cities and Provinces
    const provinces = [
        'Metro Manila',
        'Abra', 'Agusan del Norte', 'Agusan del Sur', 'Aklan', 'Albay', 'Antique', 'Apayao', 'Aurora',
        'Basilan', 'Bataan', 'Batanes', 'Batangas', 'Benguet', 'Biliran', 'Bohol', 'Bukidnon', 'Bulacan',
        'Cagayan', 'Camarines Norte', 'Camarines Sur', 'Camiguin', 'Capiz', 'Catanduanes', 'Cavite', 'Cebu',
        'Compostela Valley', 'Cotabato', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental',
        'Dinagat Islands', 'Eastern Samar', 'Guimaras', 'Ifugao', 'Ilocos Norte', 'Ilocos Sur', 'Iloilo', 'Isabela',
        'Kalinga', 'La Union', 'Laguna', 'Lanao del Norte', 'Lanao del Sur', 'Leyte', 'Maguindanao', 'Marinduque',
        'Masbate', 'Misamis Occidental', 'Misamis Oriental', 'Mountain Province', 'Negros Occidental', 'Negros Oriental',
        'Northern Samar', 'Nueva Ecija', 'Nueva Vizcaya', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Pampanga',
        'Pangasinan', 'Quezon', 'Quirino', 'Rizal', 'Romblon', 'Samar', 'Sarangani', 'Siquijor', 'Sorsogon',
        'South Cotabato', 'Southern Leyte', 'Sultan Kudarat', 'Sulu', 'Surigao del Norte', 'Surigao del Sur',
        'Tarlac', 'Tawi-Tawi', 'Zambales', 'Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'
    ].sort();


    const citiesByProvince = {
        'Metro Manila': [
            'Caloocan', 'Las Piñas', 'Makati', 'Malabon', 'Mandaluyong', 'Manila', 'Marikina', 'Muntinlupa',
            'Navotas', 'Parañaque', 'Pasay', 'Pasig', 'Quezon City', 'San Juan', 'Taguig', 'Valenzuela', 'Pateros'
        ],
        'Cebu': ['Cebu City', 'Mandaue', 'Lapu-Lapu', 'Talisay', 'Toledo', 'Danao', 'Carcar', 'Naga', 'Bogo'],
        'Cavite': ['Bacoor', 'Cavite City', 'Dasmariñas', 'General Trias', 'Imus', 'Tagaytay', 'Trece Martires'],
        'Laguna': ['Biñan', 'Calamba', 'San Pablo', 'San Pedro', 'Santa Rosa', 'Cabuyao'],
        'Rizal': ['Antipolo', 'Cainta', 'Taytay', 'Binangonan', 'San Mateo', 'Rodriguez', 'Angono', 'Morong'],
        'Bulacan': ['Malolos', 'Meycauayan', 'San Jose del Monte', 'Marilao', 'Bocaue', 'Balagtas'],
        'Pampanga': ['Angeles', 'San Fernando', 'Mabalacat'],
        'Batangas': ['Batangas City', 'Lipa', 'Tanauan', 'Santo Tomas'],
        'Quezon': ['Lucena', 'Tayabas'],
        'Iloilo': ['Iloilo City', 'Passi'],
        'Negros Occidental': ['Bacolod', 'Bago', 'Cadiz', 'Escalante', 'Himamaylan', 'Kabankalan', 'La Carlota', 'Sagay', 'San Carlos', 'Silay', 'Sipalay', 'Talisay', 'Victorias'],
        'Davao del Sur': ['Davao City', 'Digos'],
        'Zamboanga del Sur': ['Pagadian', 'Zamboanga City']
    };


    const isActive = (path) => location.pathname === path;


    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0
        }).format(amount);
    };


    const handleLogout = () => {
        toast.success('Logged out successfully!');
        setTimeout(() => {
            navigate('/login');
        }, 1000);
    };


    const handleEditProfile = () => {
        if (isEditMode) {
            // Cancel edit mode
            setIsEditMode(false);
            setEditedData({});
            toast.info('Edit cancelled');
        } else {
            // Enter edit mode
            setIsEditMode(true);
            setEditedData(userData);
            toast.info('You can now edit your profile');
        }
    };


    const handleSaveProfile = async () => {
        try {
            // Validation
            if (!editedData.firstName || !editedData.lastName) {
                toast.error('First name and last name are required');
                return;
            }


            if (!editedData.email) {
                toast.error('Email is required');
                return;
            }


            if (editedData.phone && editedData.phone.length !== 10) {
                toast.error('Phone number must be exactly 10 digits (excluding +63)');
                return;
            }


            // TODO: Add backend API call here
            // const response = await axios.put('/api/users/profile', editedData);


            // Simulate API call
            toast.success('Profile updated successfully!');
            setIsEditMode(false);


            // TODO: Update userData with editedData after successful API call
            // setUserData(editedData);
        } catch (error) {
            toast.error('Failed to update profile. Please try again.');
        }
    };


    const handleInputChange = (field, value) => {
        let processedValue = value;


        // Name validation - only letters, spaces, hyphens, and apostrophes
        if (field === 'firstName' || field === 'lastName') {
            processedValue = value.replace(/[^a-zA-Z\s\-']/g, '');
        }


        // Phone validation - only numbers, max 10 digits
        if (field === 'phone') {
            processedValue = value.replace(/\D/g, '').slice(0, 10);
        }


        // ZIP Code validation - only numbers, max 4 digits for PH
        if (field === 'zipCode') {
            processedValue = value.replace(/\D/g, '').slice(0, 4);
        }


        // TIN validation - format XXX-XXX-XXX-XXX
        if (field === 'tinNumber') {
            const digits = value.replace(/\D/g, '').slice(0, 12);
            if (digits.length > 0) {
                const parts = [];
                for (let i = 0; i < digits.length; i += 3) {
                    parts.push(digits.slice(i, i + 3));
                }
                processedValue = parts.join('-');
            } else {
                processedValue = '';
            }
        }


        // If province changes, reset city
        if (field === 'province') {
            setEditedData(prev => ({
                ...prev,
                province: processedValue,
                city: '' // Reset city when province changes
            }));
            return;
        }


        setEditedData(prev => ({
            ...prev,
            [field]: processedValue
        }));
    };


    const handleExportAll = () => {
        toast.success('Exporting donation history...');
    };


    const handleViewReceipt = (campaignName) => {
        toast.info(`Viewing receipt for ${campaignName}`);
    };

        const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        memberSince: "",
        totalDonations: 0,
        totalAmount: 0,
        lastDonation: "",
        province: "",
        city: "",
        zipCode: "",
        tinNumber: "",
    });

        useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return;

    fetch(`http://localhost:5000/api/user/profile/${storedUser.user_id}`)
        .then(res => res.json())
        .then(data => {
        setUserData({
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.contact_number || "",
            address: data.address || "",
            memberSince: new Date(data.member_since).toLocaleDateString(),
        });
        })
        .catch(err => console.error("Error fetching profile:", err));
    }, []);

    return (
        <div className="min-h-screen bg-[#f5f5f5]">
            {/* Navigation */}
            <nav className="bg-white/90 backdrop-blur-md shadow-sm fixed w-full top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <img src="/images/logo.png" alt="Shepherd's Voice Logo" className="h-20 w-20 object-contain" />
                            <div>
                                <div className="font-bold text-gray-900 text-sm leading-tight">Shepherd's Voice</div>
                                <div className="text-xs text-gray-600">Radio and TV Foundation Inc</div>
                            </div>
                        </div>


                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="/" className={`font-medium transition relative ${isActive('/') ? 'text-[#63A6B2]' : 'text-gray-700 hover:text-teal-600'}`}>Home{isActive('/') && (<span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#63A6B2]"></span>)}</a>
                            <a href="/about" className={`font-medium transition relative ${isActive('/about') ? 'text-[#63A6B2]' : 'text-gray-700 hover:text-teal-600'}`}>About SVRTV{isActive('/about') && (<span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#63A6B2]"></span>)}</a>
                            <a href="#" className="text-gray-700 hover:text-teal-600 font-medium transition">Campaigns</a>
                            <a href="/contact" className={`font-medium transition relative ${isActive('/contact') ? 'text-[#63A6B2]' : 'text-gray-700 hover:text-teal-600'}`}>Contact Us{isActive('/contact') && (<span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#63A6B2]"></span>)}</a>
                            <button onClick={() => navigate('/login')} className="bg-[#63A6B2] hover:bg-[#5a959f] text-white px-6 py-2 rounded-full font-medium transition shadow-md hover:shadow-lg">Donate</button>
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-10 h-10 bg-[#63A6B2] hover:bg-[#5a959f] rounded-full flex items-center justify-center transition shadow-md hover:shadow-lg text-white font-bold text-sm"
                                title="Profile"
                            >
                                {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                            </button>
                        </div>


                        {/* Mobile Menu Button */}
                        <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>


                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t">
                        <div className="px-4 py-4 space-y-3">
                            <a href="/" className={`block font-medium transition ${isActive('/') ? 'text-[#63A6B2] font-bold' : 'text-gray-700 hover:text-teal-600'}`}>Home</a>
                            <a href="/about" className={`block font-medium transition ${isActive('/about') ? 'text-[#63A6B2] font-bold' : 'text-gray-700 hover:text-teal-600'}`}>About SVRTV</a>
                            <a href="#" className="block text-gray-700 hover:text-teal-600 font-medium">Campaigns</a>
                            <a href="/contact" className={`block font-medium transition ${isActive('/contact') ? 'text-[#63A6B2] font-bold' : 'text-gray-700 hover:text-teal-600'}`}>Contact Us</a>
                            <a href="/profile" className={`block font-medium transition ${isActive('/profile') ? 'text-[#63A6B2] font-bold' : 'text-gray-700 hover:text-teal-600'}`}>Profile</a>
                            <button onClick={() => navigate('/login')} className="w-full bg-[#63A6B2] hover:bg-[#5a959f] text-white px-6 py-2 rounded-full font-medium transition">Donate</button>
                        </div>
                    </div>
                )}
            </nav>


            {/* Main Content */}
            <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Teal Background Section for Profile Header */}
                    <div className="bg-gradient-to-br from-[#63A6B2] to-[#7bb5c0] rounded-3xl p-8 md:p-10 mb-8">
                        {/* Profile Header Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    {/* Avatar */}
                                    <div className="w-24 h-24 bg-[#63A6B2] rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                                        {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                                    </div>


                                    {/* User Info */}
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                                            {userData.firstName} {userData.lastName}
                                        </h1>
                                        <p className="text-gray-600 text-sm mb-2">{userData.email}</p>
                                        <p className="text-gray-500 text-xs flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            Member since {userData.memberSince}
                                        </p>
                                    </div>
                                </div>


                                {/* Logout Button - Always visible */}
                                <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-2.5 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-medium transition">
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>


                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-200">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-gray-600 text-xs mb-1">Total Donations</p>
                                    <p className="text-2xl font-bold text-[#63A6B2]">{userData.totalDonations}</p>
                                </div>
                                <div className="bg-pink-50 rounded-xl p-4">
                                    <p className="text-gray-600 text-xs mb-1">Total Amount</p>
                                    <p className="text-2xl font-bold text-pink-600">{formatCurrency(userData.totalAmount)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-gray-600 text-xs mb-1">Last Donation</p>
                                    <p className="text-sm font-semibold text-gray-900">{userData.lastDonation}</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4">
                                    <p className="text-gray-600 text-xs mb-1 flex items-center gap-1">
                                        <Heart className="w-3 h-3" />
                                        Status
                                    </p>
                                    <p className="text-sm font-semibold text-green-600">Active Donor</p>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Tabs */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="border-b border-gray-200">
                            <div className="flex">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'profile'
                                        ? 'text-[#63A6B2] border-b-2 border-[#63A6B2]'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <User className="w-4 h-4" />
                                    Profile Information
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'history'
                                        ? 'text-[#63A6B2] border-b-2 border-[#63A6B2]'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Heart className="w-4 h-4" />
                                    Donation History
                                </button>
                            </div>
                        </div>


                        {/* Tab Content */}
                        <div className="p-8">
                            {activeTab === 'profile' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                                        {!isEditMode ? (
                                            <button onClick={handleEditProfile} className="flex items-center gap-2 px-6 py-2.5 bg-[#63A6B2] hover:bg-[#5a959f] text-white rounded-lg font-medium transition shadow-md hover:shadow-lg">
                                                <Edit2 className="w-4 h-4" />
                                                Edit Profile
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button onClick={handleSaveProfile} className="px-6 py-2.5 bg-[#63A6B2] hover:bg-[#5a959f] text-white rounded-lg font-medium transition shadow-md hover:shadow-lg">
                                                    Save Changes
                                                </button>
                                                <button onClick={handleEditProfile} className="px-6 py-2.5 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition">
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>


                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={isEditMode ? editedData.firstName : userData.firstName}
                                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                readOnly={!isEditMode}
                                                placeholder="Enter first name"
                                                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 ${isEditMode ? 'bg-white border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2] focus:outline-none' : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            />
                                            {isEditMode && <p className="text-xs text-gray-500 mt-1">Letters, spaces, hyphens, and apostrophes only</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={isEditMode ? editedData.lastName : userData.lastName}
                                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                                readOnly={!isEditMode}
                                                placeholder="Enter last name"
                                                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 ${isEditMode ? 'bg-white border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2] focus:outline-none' : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            />
                                            {isEditMode && <p className="text-xs text-gray-500 mt-1">Letters, spaces, hyphens, and apostrophes only</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                                            <input
                                                type="email"
                                                value={userData.email}
                                                readOnly
                                                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 text-sm font-medium">🇵🇭 +63</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={isEditMode ? editedData.phone : userData.phone}
                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                    readOnly={!isEditMode}
                                                    placeholder="9123456789"
                                                    maxLength="10"
                                                    className={`w-full pl-20 pr-4 py-2.5 border rounded-lg text-gray-900 ${isEditMode ? 'bg-white border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2] focus:outline-none' : 'bg-gray-50 border-gray-200'
                                                        }`}
                                                />
                                            </div>
                                            {isEditMode && <p className="text-xs text-gray-500 mt-1">10 digits (e.g., 9123456789)</p>}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                            <input
                                                type="text"
                                                value={isEditMode ? editedData.address : userData.address}
                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                readOnly={!isEditMode}
                                                placeholder="Street address"
                                                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 ${isEditMode ? 'bg-white border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2] focus:outline-none' : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                                            {isEditMode ? (
                                                <div className="relative">
                                                    <select
                                                        value={editedData.province || ''}
                                                        onChange={(e) => handleInputChange('province', e.target.value)}
                                                        className="w-full px-4 py-2.5 border border-[#63A6B2] rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-[#63A6B2] focus:outline-none appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Select Province</option>
                                                        {provinces.map((province) => (
                                                            <option key={province} value={province}>
                                                                {province}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={userData.province}
                                                    readOnly
                                                    className="w-full px-4 py-2.5 border rounded-lg text-gray-900 bg-gray-50 border-gray-200"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                            {isEditMode ? (
                                                <div className="relative">
                                                    <select
                                                        value={editedData.city || ''}
                                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                                        disabled={!editedData.province}
                                                        className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-[#63A6B2] focus:outline-none appearance-none ${!editedData.province
                                                                ? 'cursor-not-allowed bg-gray-100 border-gray-300'
                                                                : 'cursor-pointer border-[#63A6B2]'
                                                            }`}
                                                    >
                                                        <option value="">
                                                            {!editedData.province ? 'Select Province First' : 'Select City'}
                                                        </option>
                                                        {editedData.province && citiesByProvince[editedData.province]?.map((city) => (
                                                            <option key={city} value={city}>
                                                                {city}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className={`w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${!editedData.province ? 'text-gray-300' : 'text-gray-400'
                                                        }`} />
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={userData.city}
                                                    readOnly
                                                    className="w-full px-4 py-2.5 border rounded-lg text-gray-900 bg-gray-50 border-gray-200"
                                                />
                                            )}
                                            {isEditMode && !editedData.province && (
                                                <p className="text-xs text-gray-500 mt-1">Please select a province first</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                                            <input
                                                type="text"
                                                value={isEditMode ? editedData.zipCode : userData.zipCode}
                                                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                                readOnly={!isEditMode}
                                                placeholder="1100"
                                                maxLength="4"
                                                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 ${isEditMode ? 'bg-white border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2] focus:outline-none' : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            />
                                            {isEditMode && <p className="text-xs text-gray-500 mt-1">4 digits only</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">TIN Number</label>
                                            <input
                                                type="text"
                                                value={isEditMode ? editedData.tinNumber : userData.tinNumber}
                                                onChange={(e) => handleInputChange('tinNumber', e.target.value)}
                                                readOnly={!isEditMode}
                                                placeholder="123-456-789-000"
                                                maxLength="15"
                                                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 ${isEditMode ? 'bg-white border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2] focus:outline-none' : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            />
                                            {isEditMode && <p className="text-xs text-gray-500 mt-1">Format: XXX-XXX-XXX-XXX</p>}
                                        </div>
                                    </div>
                                </div>
                            )}


                            {activeTab === 'history' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Donation History</h2>
                                        <button onClick={handleExportAll} className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition text-sm">
                                            <Download className="w-4 h-4" />
                                            Export All
                                        </button>
                                    </div>


                                    {/* Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Campaign</th>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {donationHistory.map((donation) => (
                                                    <tr key={donation.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-4 px-4 text-sm text-gray-900">{donation.date}</td>
                                                        <td className="py-4 px-4 text-sm text-gray-900">{donation.campaign}</td>
                                                        <td className="py-4 px-4 text-sm font-semibold text-[#63A6B2]">{formatCurrency(donation.amount)}</td>
                                                        <td className="py-4 px-4">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                {donation.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <button onClick={() => handleViewReceipt(donation.campaign)} className="flex items-center gap-1 text-[#63A6B2] hover:text-[#5a959f] text-sm font-medium">
                                                                <Eye className="w-4 h-4" />
                                                                View Receipt
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Footer */}
            <footer className="bg-[#63A6B2] text-white mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* About Section */}
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-3 mb-4">
                                <img src="/images/logov2.png" alt="Shepherd's Voice Logo" className="h-20 w-20 object-contain" />
                                <div>
                                    <div className="font-bold text-white text-sm leading-tight">Shepherd's Voice</div>
                                    <div className="text-xs text-white/90">Radio and TV Foundation Inc</div>
                                </div>
                            </div>
                            <p className="text-white/90 text-sm leading-relaxed max-w-md mb-6">
                                Empowering communities through compassion and service. Together, we can make a difference in the lives of those who need it most.
                            </p>
                            <div className="flex space-x-4">
                                <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" /></svg>
                                </a>
                            </div>
                        </div>


                        {/* Quick Links */}
                        <div>
                            <h3 className="font-bold text-white mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/" className="text-white/90 hover:text-white transition">Home</a></li>
                                <li><a href="/about" className="text-white/90 hover:text-white transition">About SVRTV</a></li>
                                <li><a href="#" className="text-white/90 hover:text-white transition">Campaigns</a></li>
                                <li><a href="/contact" className="text-white/90 hover:text-white transition">Contact Us</a></li>
                                <li><a href="#" className="text-white/90 hover:text-white transition">Privacy Policy</a></li>
                            </ul>
                        </div>


                        {/* Contact Info */}
                        <div>
                            <h3 className="font-bold text-white mb-4">Contact</h3>
                            <ul className="space-y-3 text-sm text-white/90">
                                <li className="flex items-start space-x-2">
                                    <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <span>info@svrtv.org</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <span>+63 123 456 7890</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <span>Quezon City, Philippines</span>
                                </li>
                            </ul>
                        </div>
                    </div>


                    {/* Copyright */}
                    <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/90">
                        <p>&copy; {new Date().getFullYear()} Shepherd's Voice Radio and TV Foundation Inc. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

