import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Heart, Users, Edit2, Eye, Download, LogOut, ChevronDown, FileText, X, CheckCircle, CreditCard, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { provinces, citiesByProvince } from '../data/philippineLocations';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Profile() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [donationHistory, setDonationHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [viewReceiptId, setViewReceiptId] = useState(null);
    const [receiptData, setReceiptData] = useState(null);
    const [isReceiptLoading, setIsReceiptLoading] = useState(false);
    const [cancelRequestModalId, setCancelRequestModalId] = useState(null);


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
        if (!donationHistory || donationHistory.length === 0) {
            toast.error('No donations to export.');
            return;
        }

        try {
            toast.info('Generating PDF report...');
            const doc = new jsPDF({ orientation: 'portrait' });

            // Header
            doc.setFontSize(18);
            doc.setTextColor(99, 166, 178); // #63A6B2
            doc.text("Shepherd's Voice - My Donation History", 14, 18);

            const safeFormatCurrency = (amount) => `PHP ${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            // Details
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 26);
            doc.text(`Donor: ${userData.firstName} ${userData.lastName}`, 14, 32);
            doc.text(`Total Donations: ${userData.totalDonations}   |   Total Amount: ${safeFormatCurrency(userData.totalAmount)}`, 14, 38);

            // Prepare table data
            const tableData = donationHistory.map((d, i) => [
                i + 1,
                new Date(d.initiated_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
                d.campaign_name || 'N/A',
                safeFormatCurrency(d.amount),
                d.frequency === 'monthly' ? 'Monthly' : 'One-time',
                (d.payment_status || 'pending').toUpperCase()
            ]);

            autoTable(doc, {
                head: [["#", "Date", "Campaign", "Amount", "Frequency", "Status"]],
                body: tableData,
                startY: 45,
                headStyles: { fillColor: [99, 166, 178], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
                bodyStyles: { fontSize: 8 },
                alternateRowStyles: { fillColor: [245, 250, 251] },
            });

            doc.save(`my-donations-${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Donation history exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to generate PDF. Please try again.');
        }
    };

    const fetchReceiptDetails = async (id) => {
        setIsReceiptLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/donations/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setReceiptData(data);
            setViewReceiptId(id);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load receipt details.');
        } finally {
            setIsReceiptLoading(false);
        }
    };


    const handleCancelRecurring = async (donationId) => {
        setCancelRequestModalId(donationId);
    };

    const confirmCancelRecurring = async () => {
        const donationId = cancelRequestModalId;
        if (!donationId) return;
        
        try {
            const res = await fetch(`http://localhost:5000/api/donations/${donationId}/cancel-recurring`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error();
            toast.success('Wait for admin approval of cancellation request.');
            setCancelRequestModalId(null);
            // Refresh history
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (storedUser && storedUser.user_id) {
                fetch(`http://localhost:5000/api/donations/user/${storedUser.user_id}`)
                    .then(r => r.json())
                    .then(data => setDonationHistory(data));
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to cancel subscription.');
        }
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
        fetch(`http://localhost:5000/api/donations/user/${storedUser.user_id}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setDonationHistory(data);
                    // Only count completed and pending (processing) donations
                    const activeDonations = data.filter(d =>
                        d.payment_status === 'completed' || d.payment_status === 'pending'
                    );
                    const totalAmount = activeDonations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
                    const lastCompleted = data.find(d => d.payment_status === 'completed');
                    const lastDonation = lastCompleted
                        ? new Date(lastCompleted.initiated_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                        : (data.length > 0 ? new Date(data[0].initiated_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No donations yet');
                    setUserData(prev => ({
                        ...prev,
                        totalDonations: activeDonations.length,
                        totalAmount,
                        lastDonation
                    }));
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
                    {/* Modern Profile Header */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        {/* Cover Banner */}
                        <div className="h-48 md:h-56 bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] relative w-full"></div>

                        <div className="px-6 md:px-10 pb-8 relative z-10">
                            <div className="flex flex-col md:flex-row gap-6 md:gap-8">

                                {/* Avatar column (Overlaps the banner) */}
                                <div className="flex justify-center md:justify-start -mt-16 md:-mt-20 flex-shrink-0">
                                    <div className="relative">
                                        <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full p-1.5 shadow-md">
                                            <div className="w-full h-full bg-[#63A6B2] rounded-full flex items-center justify-center text-white text-4xl md:text-5xl font-bold flex-shrink-0 overflow-hidden shadow-inner">
                                                {isUploading ? (
                                                    <div className="flex flex-col items-center justify-center bg-[#63A6B2] w-full h-full">
                                                        <div className="w-8 h-8 md:w-10 md:h-10 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                ) : imagePreview || userData.profileImage ? (
                                                    <img
                                                        src={imagePreview || userData.profileImage}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover rounded-full"
                                                    />
                                                ) : (
                                                    <span>{userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Edit Icon Button (only visible in Edit Mode) */}
                                        {isEditMode && !isUploading && (
                                            <>
                                                <label
                                                    htmlFor="profile-image-upload"
                                                    className="absolute bottom-2 right-2 bg-white p-2.5 rounded-full shadow-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition transform hover:scale-110 active:scale-95 flex items-center justify-center"
                                                    title="Change profile picture"
                                                >
                                                    <Edit2 className="w-5 h-5 text-[#63A6B2]" />
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
                                </div>


                                {/* Info and Actions Column (Normal layout, below banner) */}
                                <div className="flex flex-col md:flex-row items-center md:items-center justify-between flex-1 gap-6 md:pt-4">

                                    {/* User Info */}
                                    <div className="text-center md:text-left flex-1">
                                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">
                                            {userData.firstName} {userData.lastName}
                                        </h1>
                                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-gray-500 text-sm font-medium">
                                            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {userData.email}</span>
                                            <span className="hidden md:block text-gray-300">•</span>
                                            <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> Member since {userData.memberSince}</span>
                                        </div>
                                    </div>

                                    {/* Logout Button */}
                                    <div className="w-full md:w-auto flex justify-center mt-2 md:mt-0">
                                        <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-6 py-3 border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-full font-bold transition w-full md:w-auto shadow-sm">
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>

                                </div>

                            </div>


                            {/* Stats Row */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
                                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50 hover:shadow-sm transition">
                                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> Donations</p>
                                    <p className="text-3xl font-black text-gray-800">{userData.totalDonations}</p>
                                </div>
                                <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-100/50 hover:shadow-sm transition">
                                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Heart className="w-4 h-4 text-teal-400" /> Total Impact</p>
                                    <p className="text-3xl font-black text-[#63A6B2]">{formatCurrency(userData.totalAmount)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50 hover:shadow-sm transition">
                                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /> Last Activity</p>
                                    <p className="text-lg font-bold text-gray-800">{userData.lastDonation}</p>
                                </div>
                                <div className="bg-green-50/50 rounded-2xl p-5 border border-green-100/50 hover:shadow-sm transition">
                                    <p className="text-green-600 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Donor Status
                                    </p>
                                    <p className="text-lg font-bold text-green-700">Active</p>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Tabs area wrapper - subtle layout update */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-100 bg-gray-50/50">
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
                                <button
                                    onClick={() => setActiveTab('manage')}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium transition ${activeTab === 'manage'
                                        ? 'text-[#63A6B2] border-b-2 border-[#63A6B2]'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Manage Donations
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
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Frequency</th>
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
                                                        <tr key={donation.donation_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="py-4 px-4 text-sm text-gray-900">
                                                                {new Date(donation.initiated_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                            </td>
                                                            <td className="py-4 px-4 text-sm text-gray-900">{donation.campaign_name || 'N/A'}</td>
                                                            <td className="py-4 px-4 text-sm font-semibold text-[#63A6B2]">{formatCurrency(donation.amount)}</td>
                                                            <td className="py-4 px-4">
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${donation.frequency === 'monthly' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                                    }`}>
                                                                    {donation.frequency === 'monthly' ? 'Monthly' : 'One-time'}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${donation.payment_status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                        donation.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                            'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    {donation.payment_status ? donation.payment_status.charAt(0).toUpperCase() + donation.payment_status.slice(1) : 'Pending'}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                {donation.payment_status === 'completed' ? (
                                                                    <button
                                                                        onClick={() => fetchReceiptDetails(donation.donation_id)}
                                                                        disabled={isReceiptLoading && viewReceiptId === donation.donation_id}
                                                                        className="flex items-center gap-1 text-teal-600 hover:text-teal-800 text-sm font-medium"
                                                                    >
                                                                        <FileText className={`w-4 h-4 ${isReceiptLoading && viewReceiptId === donation.donation_id ? 'animate-pulse' : ''}`} />
                                                                        View Receipt
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 italic">Not available</span>
                                                                )}
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

                            {activeTab === 'manage' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Recurring Donations</h2>
                                            <p className="text-sm text-gray-500 mt-1">Manage your active monthly support plans and billing cycles.</p>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Started</th>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Campaign</th>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Next Payment</th>
                                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Reminders</th>
                                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {isLoadingHistory ? (
                                                    <tr>
                                                        <td colSpan="7" className="py-12 text-center text-gray-500">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <RefreshCw className="w-8 h-8 text-[#63A6B2] animate-spin" />
                                                                <p className="text-sm font-medium">Loading your plans...</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : donationHistory.filter(d => d.frequency === 'monthly').length > 0 ? (
                                                    donationHistory.filter(d => d.frequency === 'monthly').map((donation) => (
                                                        <tr key={donation.donation_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                            <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                                                                {new Date(donation.initiated_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="text-sm text-gray-900 font-semibold">{donation.campaign_name || 'General Support'}</div>
                                                                <div className="text-[10px] text-gray-400 uppercase tracking-tight">Recurring Monthly</div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="text-sm font-bold text-[#63A6B2]">{formatCurrency(donation.amount)}</div>
                                                                <div className="text-[10px] text-gray-400 uppercase tracking-tight">Per Month</div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                 <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                                     donation.status === 'cancelled'
                                                                     ? 'bg-red-100 text-red-700 border border-red-200'
                                                                     : donation.status === 'pending_cancellation'
                                                                     ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                                                     : donation.payment_status === 'completed' 
                                                                     ? 'bg-green-100 text-green-700 border border-green-200' 
                                                                     : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                                 }`}>
                                                                     <div className={`w-1.5 h-1.5 rounded-full ${
                                                                         donation.status === 'cancelled' 
                                                                         ? 'bg-red-500' 
                                                                         : donation.status === 'pending_cancellation' 
                                                                         ? 'bg-orange-500' 
                                                                         : donation.payment_status === 'completed' 
                                                                         ? 'bg-green-500' 
                                                                         : 'bg-yellow-500'
                                                                     } ${donation.status !== 'cancelled' ? 'animate-pulse' : ''}`}></div>
                                                                     {donation.status === 'cancelled' ? 'Stopped' : 
                                                                      donation.status === 'pending_cancellation' ? 'Cancellation Pending' : 
                                                                      (donation.payment_status === 'completed' ? 'Active' : 'Processing')}
                                                                 </span>
                                                             </td>
                                                            <td className="py-4 px-4">
                                                                <div className="text-sm text-gray-700 font-medium">
                                                                    {donation.status === 'cancelled' ? (
                                                                        <span className="text-red-400 font-bold uppercase text-[10px] tracking-widest bg-red-50 px-2 py-0.5 rounded">Stopped</span>
                                                                    ) : (
                                                                        (() => {
                                                                            const nextDate = new Date(donation.initiated_at);
                                                                            nextDate.setMonth(nextDate.getMonth() + 1);
                                                                            return nextDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
                                                                        })()
                                                                    )}
                                                                </div>
                                                                {donation.status !== 'cancelled' && <div className="text-[10px] text-gray-400">Estimated</div>}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className="w-4 h-4 rounded border-gray-300 text-[#63A6B2] focus:ring-[#63A6B2] cursor-pointer" 
                                                                        id={`remind-${donation.donation_id}`}
                                                                    />
                                                                    <label htmlFor={`remind-${donation.donation_id}`} className="text-[10px] text-gray-500 font-medium leading-tight cursor-pointer">
                                                                        Do you want to be reminded<br/>for donation deadline?
                                                                    </label>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4 text-right">
                                                                {(donation.status === 'active' || !donation.status) && (
                                                                    <button 
                                                                        onClick={() => handleCancelRecurring(donation.donation_id)}
                                                                        className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold uppercase hover:bg-red-600 hover:text-white transition shadow-sm"
                                                                    >
                                                                        Request Cancellation
                                                                    </button>
                                                                )}
                                                                {donation.status === 'pending_cancellation' && (
                                                                    <span className="px-4 py-1.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg text-[10px] font-bold uppercase cursor-not-allowed">
                                                                        Request Pending
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" className="py-16 text-center">
                                                            <div className="flex flex-col items-center gap-4">
                                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200">
                                                                    <RefreshCw className="w-8 h-8 text-gray-300" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-900 font-bold">No recurring donations</p>
                                                                    <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1">You haven't set up any monthly support plans yet. Recurring donations help us create long-term impact.</p>
                                                                </div>
                                                                <button onClick={() => navigate('/campaigns')} className="mt-2 px-6 py-2 bg-[#63A6B2] text-white rounded-full text-xs font-bold hover:bg-[#4a8a95] transition shadow-md">
                                                                    Explore Campaigns
                                                                </button>
                                                            </div>
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

            {/* Receipt Modal */}
            {viewReceiptId && receiptData && (
                <ProfileReceiptModal
                    data={receiptData}
                    handleClose={() => { setViewReceiptId(null); setReceiptData(null); }}
                />
            )}

            {/* Cancel Request Modal */}
            {cancelRequestModalId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Recurring Plan?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to request a cancellation for this recurring donation? This request will be processed by our admin team.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setCancelRequestModalId(null)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition active:scale-95"
                            >
                                No, Keep it
                            </button>
                            <button 
                                onClick={confirmCancelRecurring}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition shadow-md active:scale-95"
                            >
                                Yes, Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Profile Receipt Modal ────────────────────────────
function ProfileReceiptModal({ data: d, handleClose }) {
    const printRef = React.useRef();

    const handlePrint = () => {
        const content = printRef.current;
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Official Receipt</title>');
        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none; } }</style>');
        printWindow.document.write('</head><body class="bg-white">');
        printWindow.document.write(content.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 800);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const fmt = (amount) =>
        `₱${parseFloat(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const getPaymentMethodName = (method) => {
        const methods = { gcash: 'GCash', paymaya: 'PayMaya', bank: 'Bank Transfer', card: 'Credit/Debit Card' };
        return methods[method] || method || 'N/A';
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#63A6B2]" /> Official Receipt Preview
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="bg-[#63A6B2] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#4d8b96] transition shadow-sm">
                            <Download className="w-4 h-4" /> Download / Print
                        </button>
                        <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100/50">
                    <div ref={printRef} className="bg-white mx-auto shadow-xl rounded-2xl overflow-hidden max-w-3xl text-left border border-gray-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white p-6 md:p-8">
                            <div className="flex justify-between items-center">
                                {/* Logos */}
                                <div className="flex items-center gap-6">
                                    {/* SVRTV Logo - Circle */}
                                    <div className="bg-white shadow-lg flex items-center justify-center flex-shrink-0" style={{ width: '110px', height: '110px', borderRadius: '50%', padding: '8px' }}>
                                        <img src="/images/logo.png" alt="SVRTV Logo" className="w-full h-full object-contain" style={{ borderRadius: '50%' }} />
                                    </div>
                                    {/* Divider */}
                                    <div className="w-px h-16 bg-white/30"></div>
                                    {/* Foundation Logo - Circle */}
                                    {d.foundation_logo ? (
                                        <div className="bg-white shadow-lg flex items-center justify-center flex-shrink-0" style={{ width: '110px', height: '110px', borderRadius: '50%', padding: '8px' }}>
                                            <img
                                                src={`http://localhost:5000${d.foundation_logo}`}
                                                alt={`${d.foundation_name} Logo`}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0" style={{ width: '110px', height: '110px', borderRadius: '50%' }}>
                                            <span className="text-white font-bold text-3xl">
                                                {d.foundation_name ? d.foundation_name.charAt(0) : 'F'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <h1 className="text-3xl font-bold mb-1">Official Receipt</h1>
                                    <p className="text-teal-100 text-sm mb-3">Tax Deductible Donation</p>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                                        <p className="text-xs text-teal-100">Receipt No.</p>
                                        <p className="text-xl font-bold">RCP-2026-{String(d.donation_id).padStart(6, '0')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 space-y-8">
                            {/* Org Info */}
                            <div className="pb-6 border-b-2 border-gray-50">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-[#63A6B2] rounded-full"></div>Organization Information</h2>
                                <div className="space-y-1 text-sm">
                                    <p className="text-[#63A6B2] font-extrabold text-xl">{d.foundation_name || "Shepherd's Voice Radio and Television Foundation, Inc."}</p>
                                    <p className="text-gray-600">456 Faith Avenue, Manila, Metro Manila 1003</p>
                                    <p className="text-gray-600">Phone: (02) 1234-5678</p>
                                    <p className="text-gray-600">Email: info@svrtf.org</p>
                                    <p className="text-gray-600">TIN: 000-123-456-000</p>
                                </div>
                            </div>

                            {/* Donor Info */}
                            <div className="pb-6 border-b-2 border-gray-50 text-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-[#63A6B2] rounded-full"></div>Donor Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Full Name</p><p className="text-gray-900 font-bold text-base">{d.donor_name || 'N/A'}</p></div>
                                    <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Email Address</p><p className="text-gray-900 font-medium">{d.donor_email || 'N/A'}</p></div>
                                    <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Contact Number</p><p className="text-gray-900 font-medium">{d.donor_phone || 'N/A'}</p></div>
                                    <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Address</p><p className="text-gray-900 font-medium">{d.address || 'N/A'}</p></div>
                                </div>
                            </div>

                            {/* Donation Details */}
                            <div className="pb-6 border-b-2 border-gray-50 text-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-1 h-6 bg-[#63A6B2] rounded-full"></div>Donation Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Date &amp; Time</p><p className="text-gray-900 font-bold">{formatDateTime(d.created_at)}</p></div>
                                    <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Reference Number</p><p className="text-gray-900 font-bold font-mono">DON-2026-{String(d.donation_id).padStart(6, '0')}</p></div>
                                    <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Campaign Purpose</p><p className="text-[#63A6B2] font-bold">{d.campaign_name || 'N/A'}</p></div>
                                    <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Payment Method</p><p className="text-gray-900 font-bold">{getPaymentMethodName(d.payment_method)}</p></div>
                                    <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Donation Type</p><p className="text-gray-900 font-bold">{d.frequency === 'monthly' ? 'Monthly (Recurring)' : 'One-Time'}</p></div>
                                    <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Transaction ID</p><p className="text-gray-900 font-mono italic">{d.payment_reference || `TXN-${d.donation_id}-SVRTF`}</p></div>
                                </div>
                            </div>

                            {/* Total Amount */}
                            <div className="pb-6 border-b-2 border-gray-50">
                                <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-br from-teal-50 to-blue-50 p-6 rounded-2xl border-2 border-[#63A6B2] gap-4">
                                    <span className="text-xl font-bold text-gray-900">TOTAL DONATION AMOUNT:</span>
                                    <span className="text-5xl font-black text-[#63A6B2] drop-shadow-sm">{fmt(d.amount)}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 text-right mt-3 italic font-semibold uppercase tracking-widest">Confirmed &amp; Verified Transaction</p>
                            </div>

                            {/* Tax Deductible Info */}
                            <div className="pb-6 border-b-2 border-gray-50">
                                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
                                    <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-orange-600" />Tax Deductible Information</h3>
                                    <p className="text-xs text-orange-900 leading-relaxed font-medium">This donation is <strong>tax deductible</strong> under the laws of the Republic of the Philippines. Please retain this receipt for your tax filing purposes.</p>
                                </div>
                            </div>

                            {d.message && (
                                <div className="pb-6 border-b-2 border-gray-50">
                                    <h3 className="font-bold text-gray-900 mb-2">Notes &amp; Recognition</h3>
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-xs font-black text-[#63A6B2] mb-2 uppercase tracking-widest">Donor Message:</p>
                                        <p className="text-sm italic text-gray-800 font-medium">"{d.message}"</p>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="text-center pt-8 border-t border-gray-100">
                                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                                <p className="text-base font-black text-[#63A6B2] mb-2">Your support makes a difference!</p>
                                <p className="text-[10px] text-gray-400 leading-relaxed font-medium">This is a computer-generated receipt valid for tax deduction purposes.<br />© 2026 Shepherd's Voice Radio and Television Foundation, Inc.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}