import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Heart, Users, Edit2, Eye, Download, LogOut, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { provinces, citiesByProvince } from '../data/philippineLocations';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Profile() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false); const [donationHistory, setDonationHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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


    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        // Create preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Auto-upload the image
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser) {
            toast.error('User not found. Please login again.');
            setImagePreview(null);
            return;
        }

        setIsUploading(true);
        toast.info('Uploading image...');

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('userId', storedUser.user_id);

            const response = await fetch('http://localhost:5000/api/user/profile/upload-image', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                const fullImagePath = `http://localhost:5000${data.imagePath}`;
                toast.success('Profile image uploaded successfully!');

                // Update userData
                setUserData(prev => ({
                    ...prev,
                    profileImage: fullImagePath
                }));

                // Update localStorage to persist across pages and sync with admin
                const updatedUser = {
                    ...storedUser,
                    profileImage: fullImagePath,
                    avatarImage: fullImagePath,  // keep admin key in sync too
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Notify admin header / settings in any open tab
                window.dispatchEvent(new Event('userProfileUpdated'));
                window.dispatchEvent(new Event('adminProfileUpdated'));

                setImagePreview(null);
            } else {
                toast.error(data.message || 'Failed to upload image');
                setImagePreview(null);
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image. Please try again.');
            setImagePreview(null);
        } finally {
            setIsUploading(false);
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

    const [userData, setUserData] = useState(() => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const empty = {
                firstName: "", lastName: "", email: "", phone: "",
                address1: "", address2: "", barangay: "", province: "", city: "",
                country: "Philippines", zipCode: "", tinNumber: "",
                memberSince: "", totalDonations: 0, totalAmount: 0, lastDonation: "",
                profileImage: null
            };
            if (!storedUser) return empty;

            return {
                firstName: storedUser.firstName || storedUser.first_name || "",
                lastName: storedUser.lastName || storedUser.last_name || "",
                email: storedUser.email || "",
                phone: storedUser.phone || storedUser.contact_number || "",
                address1: storedUser.address1 || storedUser.address || "",
                address2: storedUser.address2 || "",
                barangay: storedUser.barangay || "",
                province: storedUser.province || "",
                city: storedUser.city || "",
                country: storedUser.country || "Philippines",
                zipCode: storedUser.zipCode || "",
                tinNumber: storedUser.tinNumber || "",
                memberSince: storedUser.memberSince || "",
                totalDonations: storedUser.totalDonations || 0,
                totalAmount: storedUser.totalAmount || 0,
                lastDonation: storedUser.lastDonation || "",
                profileImage: storedUser.profileImage || storedUser.profile_image || null
            };
        } catch (e) {
            console.error("Error initializing profile data:", e);
            return {
                firstName: "", lastName: "", email: "", phone: "",
                address1: "", address2: "", barangay: "", province: "", city: "",
                country: "Philippines", zipCode: "", tinNumber: "",
                memberSince: "", totalDonations: 0, totalAmount: 0, lastDonation: "",
                profileImage: null
            };
        }
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) return;

        fetch(`http://localhost:5000/api/user/profile/${storedUser.user_id}`)
            .then(res => res.json())
            .then(data => {
                const profileImageUrl = data.profile_image ? (data.profile_image.startsWith('http') ? data.profile_image : `http://localhost:5000${data.profile_image}`) : null;
                const memberSinceDate = (data.created_at || data.member_since) ? new Date(data.created_at || data.member_since).toLocaleDateString() : "Not provided";

                setUserData(prev => {
                    const newState = {
                        ...prev,
                        firstName: data.first_name || prev.firstName,
                        lastName: data.last_name || prev.lastName,
                        email: data.email || prev.email,
                        phone: data.contact_number || prev.phone,
                        address: data.address || prev.address,
                        memberSince: memberSinceDate,
                        profileImage: profileImageUrl || prev.profileImage
                    };

                    // Synchronize with localStorage
                    const updatedUser = {
                        ...storedUser,
                        firstName: newState.firstName,
                        lastName: newState.lastName,
                        email: newState.email,
                        profileImage: newState.profileImage
                    };
                    localStorage.setItem('user', JSON.stringify(updatedUser));

                    return newState;
                });
            })
            .catch(err => console.error("Error fetching profile:", err));
    }, []);

    useEffect(() => {
        // Sync profile image whenever admin side saves/uploads
        const syncFromAdmin = () => {
            try {
                const stored = JSON.parse(localStorage.getItem('user'));
                if (!stored) return;
                const img = stored.profileImage || stored.avatarImage || null;
                setUserData(prev => ({ ...prev, profileImage: img }));
            } catch { }
        };
        window.addEventListener('adminProfileUpdated', syncFromAdmin);
        window.addEventListener('userProfileUpdated', syncFromAdmin);
        window.addEventListener('storage', syncFromAdmin);
        return () => {
            window.removeEventListener('adminProfileUpdated', syncFromAdmin);
            window.removeEventListener('userProfileUpdated', syncFromAdmin);
            window.removeEventListener('storage', syncFromAdmin);
        };
    }, []);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || !storedUser.user_id) return;

        setIsLoadingHistory(true);
        fetch(`http://localhost:5000/api/user/donations/${storedUser.user_id}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setDonationHistory(data);
                }
            })
            .catch(err => console.error("Error fetching donations:", err))
            .finally(() => setIsLoadingHistory(false));
    }, []);

    return (
        <div className="min-h-screen bg-[#f5f5f5]">
            <Navbar userData={userData} />


            {/* Main Content */}
            <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Teal Background Section for Profile Header */}
                    <div className="bg-gradient-to-br from-[#63A6B2] to-[#7bb5c0] rounded-3xl p-8 md:p-10 mb-8">
                        {/* Profile Header Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    {/* Avatar with Upload */}
                                    <div className="relative">
                                        <div className="w-24 h-24 bg-[#63A6B2] rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 overflow-hidden shadow-inner">
                                            {isUploading ? (
                                                <div className="flex flex-col items-center justify-center bg-[#63A6B2] w-full h-full">
                                                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            ) : imagePreview || userData.profileImage ? (
                                                <img
                                                    src={imagePreview || userData.profileImage}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span>{userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}</span>
                                            )}
                                        </div>

                                        {/* Edit Icon Button (only visible in Edit Mode) */}
                                        {isEditMode && !isUploading && (
                                            <>
                                                <label
                                                    htmlFor="profile-image-upload"
                                                    className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-lg shadow-md border border-gray-100 cursor-pointer hover:bg-gray-50 transition transform hover:scale-110 active:scale-95 flex items-center justify-center"
                                                    title="Change profile picture"
                                                >
                                                    <Edit2 className="w-4 h-4 text-[#63A6B2]" />
                                                </label>
                                                <input
                                                    id="profile-image-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageSelect}
                                                    className="hidden"
                                                />
                                            </>
                                        )}
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
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center gap-1.5 pointer-events-none">
                                                    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <rect width="20" height="7" fill="#0038A8" />
                                                        <rect y="7" width="20" height="7" fill="#CE1126" />
                                                        <path d="M0 0L9 7L0 14V0Z" fill="white" />
                                                        <path d="M4.5 7L5.5 6.5L5 5.5L6 5L5.5 4L6.5 3.5L5.5 3L6 2L5 1.5L4.5 2.5L4 1.5L3 2L3.5 3L2.5 3.5L3.5 4L3 5L4 5.5L3.5 6.5L4.5 7Z" fill="#FCD116" />
                                                        <circle cx="2.5" cy="3" r="0.5" fill="#FCD116" />
                                                        <circle cx="2.5" cy="11" r="0.5" fill="#FCD116" />
                                                        <circle cx="6.5" cy="7" r="0.5" fill="#FCD116" />
                                                    </svg>
                                                    <span className="text-gray-700 text-sm font-medium">+63</span>
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
                                        {/* ── Address Section ── */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 <span className="text-gray-400 font-normal">(House/Unit No., Street)</span></label>
                                            <input
                                                type="text"
                                                value={isEditMode ? editedData.address1 : userData.address1}
                                                onChange={(e) => handleInputChange('address1', e.target.value)}
                                                readOnly={!isEditMode}
                                                placeholder="e.g. 123 Rizal Street"
                                                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 ${isEditMode ? 'bg-white border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2] focus:outline-none' : 'bg-gray-50 border-gray-200'}`}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2 <span className="text-gray-400 font-normal">(Subdivision, Building, Floor — optional)</span></label>
                                            <input
                                                type="text"
                                                value={isEditMode ? editedData.address2 : userData.address2}
                                                onChange={(e) => handleInputChange('address2', e.target.value)}
                                                readOnly={!isEditMode}
                                                placeholder="e.g. Green Park Village"
                                                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 ${isEditMode ? 'bg-white border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2] focus:outline-none' : 'bg-gray-50 border-gray-200'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                                            <input
                                                type="text"
                                                value={isEditMode ? editedData.barangay : userData.barangay}
                                                onChange={(e) => handleInputChange('barangay', e.target.value)}
                                                readOnly={!isEditMode}
                                                placeholder="e.g. Barangay Kapasigan"
                                                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 ${isEditMode ? 'bg-white border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2] focus:outline-none' : 'bg-gray-50 border-gray-200'}`}
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
                                                            <option key={province} value={province}>{province}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            ) : (
                                                <input type="text" value={userData.province} readOnly className="w-full px-4 py-2.5 border rounded-lg text-gray-900 bg-gray-50 border-gray-200" />
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">City / Municipality</label>
                                            {isEditMode ? (
                                                <div className="relative">
                                                    <select
                                                        value={editedData.city || ''}
                                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                                        disabled={!editedData.province}
                                                        className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-[#63A6B2] focus:outline-none appearance-none ${!editedData.province ? 'cursor-not-allowed bg-gray-100 border-gray-300' : 'cursor-pointer border-[#63A6B2]'}`}
                                                    >
                                                        <option value="">{!editedData.province ? 'Select Province First' : 'Select City'}</option>
                                                        {editedData.province && citiesByProvince[editedData.province]?.map((city) => (
                                                            <option key={city} value={city}>{city}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className={`w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${!editedData.province ? 'text-gray-300' : 'text-gray-400'}`} />
                                                </div>
                                            ) : (
                                                <input type="text" value={userData.city} readOnly className="w-full px-4 py-2.5 border rounded-lg text-gray-900 bg-gray-50 border-gray-200" />
                                            )}
                                            {isEditMode && !editedData.province && <p className="text-xs text-gray-500 mt-1">Please select a province first</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                            <input
                                                type="text"
                                                value={isEditMode ? editedData.country : userData.country}
                                                onChange={(e) => handleInputChange('country', e.target.value)}
                                                readOnly={!isEditMode}
                                                placeholder="Philippines"
                                                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 ${isEditMode ? 'bg-white border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2] focus:outline-none' : 'bg-gray-50 border-gray-200'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                                            <input
                                                type="text"
                                                value={isEditMode ? editedData.zipCode : userData.zipCode}
                                                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                                readOnly={!isEditMode}
                                                placeholder="1600"
                                                maxLength="4"
                                                className={`w-full px-4 py-2.5 border rounded-lg text-gray-900 ${isEditMode ? 'bg-white border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2] focus:outline-none' : 'bg-gray-50 border-gray-200'}`}
                                            />
                                            {isEditMode && <p className="text-xs text-gray-500 mt-1">4-digit PH ZIP code</p>}
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
                                                {isLoadingHistory ? (
                                                    <tr>
                                                        <td colSpan="5" className="py-8 text-center text-gray-500">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-6 h-6 border-2 border-[#63A6B2] border-t-transparent rounded-full animate-spin"></div>
                                                                <p className="text-xs">Loading donations...</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : donationHistory.length > 0 ? (
                                                    donationHistory.map((donation) => (
                                                        <tr key={donation.id || donation.donation_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="py-4 px-4 text-sm text-gray-900">
                                                                {donation.date || new Date(donation.donation_date).toLocaleDateString()}
                                                            </td>
                                                            <td className="py-4 px-4 text-sm text-gray-900">{donation.campaign || donation.campaign_name}</td>
                                                            <td className="py-4 px-4 text-sm font-semibold text-[#63A6B2]">{formatCurrency(donation.amount)}</td>
                                                            <td className="py-4 px-4">
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${donation.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                                    }`}>
                                                                    {donation.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <button onClick={() => handleViewReceipt(donation.campaign || donation.campaign_name)} className="flex items-center gap-1 text-[#63A6B2] hover:text-[#5a959f] text-sm font-medium">
                                                                    <Eye className="w-4 h-4" />
                                                                    View Receipt
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="py-8 text-center text-gray-500">
                                                            <p className="text-sm">No donations found yet.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            <Footer />
        </div>
    );
}