import React, { useState, useEffect } from 'react';
import {
    Home, Users, DollarSign, PieChart, FileText, BarChart3,
    UserCog, Settings, AlertTriangle, Search, Menu, X, LogOut,
    Plus, Edit, Trash2, Calendar, Target, TrendingUp, Image as ImageIcon,
    MapPin, MoreVertical, Filter, ChevronDown, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminCampaignCreation() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [foundations, setFoundations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState(null);
    const [campaignMedia, setCampaignMedia] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'Active', 'Inactive'
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'progress'

    const [formData, setFormData] = useState({
        campaign_name: '',
        campaign_type: '',
        campaign_description: '',
        foundation_id: '',
        goal_amount: '',
        start_date: '',
        end_date: ''
    });

    // Fetch all campaigns on component mount
    useEffect(() => {
        fetchCampaigns();
        fetchFoundations();
    }, []);

    // Fetch media for all campaigns when campaigns change
    useEffect(() => {
        campaigns.forEach(campaign => {
            if (!campaignMedia[campaign.campaign_id]) {
                fetchCampaignMedia(campaign.campaign_id);
            }
        });
    }, [campaigns]);

    // Filter and sort campaigns
    const filteredCampaigns = campaigns
        .filter(campaign => {
            const matchesSearch = campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.start_date) - new Date(a.start_date);
            } else if (sortBy === 'oldest') {
                return new Date(a.start_date) - new Date(b.start_date);
            } else if (sortBy === 'progress') {
                const progressA = (a.current_amount / a.goal_amount) * 100 || 0;
                const progressB = (b.current_amount / b.goal_amount) * 100 || 0;
                return progressB - progressA;
            }
            return 0;
        });

    // Calculate stats
    const stats = {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'Active').length,
        totalRaised: campaigns.reduce((sum, c) => sum + (parseFloat(c.current_amount) || 0), 0),
        totalGoal: campaigns.reduce((sum, c) => sum + (parseFloat(c.goal_amount) || 0), 0)
    };

    const fetchCampaigns = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/campaigns/all');
            const data = await response.json();
            if (Array.isArray(data)) {
                setCampaigns(data);
            } else {
                console.error('Expected array of campaigns, got:', data);
                setCampaigns([]);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            toast.error('Failed to load campaigns');
            setCampaigns([]);
        }
    };

    const fetchFoundations = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/foundations/all');
            const data = await response.json();
            if (Array.isArray(data)) {
                setFoundations(data);
            } else {
                console.error('Expected array of foundations, got:', data);
                setFoundations([]);
            }
        } catch (error) {
            console.error('Error fetching foundations:', error);
            toast.error('Failed to load foundations');
            setFoundations([]);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedImages(files);

        // Create preview URLs
        const previewUrls = files.map(file => URL.createObjectURL(file));
        setImagePreviewUrls(previewUrls);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.campaign_name.trim()) {
            toast.error('Campaign name is required');
            return;
        }

        if (!formData.foundation_id) {
            toast.error('Please select a foundation');
            return;
        }

        try {
            setIsLoading(true);

            const url = editingCampaign
                ? `http://localhost:5000/api/campaigns/update/${editingCampaign.campaign_id}`
                : 'http://localhost:5000/api/campaigns/create';

            const method = editingCampaign ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);

                // Upload images if any were selected
                if (selectedImages.length > 0 && data.campaign_id) {
                    await uploadImages(data.campaign_id);
                } else if (selectedImages.length > 0 && editingCampaign) {
                    await uploadImages(editingCampaign.campaign_id);
                }

                fetchCampaigns(); // Refresh the list
                resetForm();
            } else {
                toast.error(data.message || 'Operation failed');
            }

        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to save campaign');
        } finally {
            setIsLoading(false);
        }
    };

    const uploadImages = async (campaignId) => {
        try {
            setUploadingImages(true);
            const formData = new FormData();

            selectedImages.forEach((image) => {
                formData.append('images', image);
            });

            const response = await fetch(`http://localhost:5000/api/campaigns/upload-media/${campaignId}`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`${selectedImages.length} image(s) uploaded successfully!`);
            } else {
                toast.error(data.message || 'Image upload failed');
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Failed to upload images');
        } finally {
            setUploadingImages(false);
        }
    };

    const handleEdit = (campaign) => {
        setEditingCampaign(campaign);
        setFormData({
            campaign_name: campaign.campaign_name,
            campaign_type: campaign.campaign_type || '',
            campaign_description: campaign.campaign_description || '',
            foundation_id: campaign.foundation_id || '',
            goal_amount: campaign.goal_amount || '',
            start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
            end_date: campaign.end_date ? campaign.end_date.split('T')[0] : ''
        });
        setShowForm(true);
        // Scroll to form
        setTimeout(() => {
            document.getElementById('campaign-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleDelete = async (campaignId) => {
        setCampaignToDelete(campaignId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!campaignToDelete) return;

        try {
            const response = await fetch(`http://localhost:5000/api/campaigns/delete/${campaignToDelete}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                fetchCampaigns(); // Refresh the list
            } else {
                toast.error(data.message || 'Delete failed');
            }

        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to delete campaign');
        } finally {
            setShowDeleteModal(false);
            setCampaignToDelete(null);
        }
    };

    const fetchCampaignMedia = async (campaignId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/campaigns/${campaignId}`);
            const data = await response.json();

            if (response.ok && data.media) {
                setCampaignMedia(prev => ({
                    ...prev,
                    [campaignId]: data.media
                }));
            }
        } catch (error) {
            console.error('Error fetching campaign media:', error);
        }
    };

    const deleteMedia = async (mediaId, campaignId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/campaigns/media/${mediaId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                // Refresh media for this campaign
                fetchCampaignMedia(campaignId);
            } else {
                toast.error(data.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to delete media');
        }
    };

    const resetForm = () => {
        setFormData({
            campaign_name: '',
            campaign_type: '',
            campaign_description: '',
            foundation_id: '',
            goal_amount: '',
            start_date: '',
            end_date: ''
        });
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setEditingCampaign(null);
        setShowForm(false);
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₱0';
        return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getProgressPercentage = (current, goal) => {
        if (!goal || goal === 0) return 0;
        return Math.min((current / goal) * 100, 100);
    };

    const handleLogout = () => {
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Show success message
        toast.success('Logged out successfully');

        // Redirect to login page
        setTimeout(() => {
            navigate('/login');
        }, 500);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
            {/* Sidebar */}
            <AdminSidebar
                activePage="campaigns"
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Top Bar */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="px-4 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setMobileMenuOpen(true)}
                                    className="lg:hidden text-gray-600 hover:text-gray-900"
                                >
                                    <Menu className="w-6 h-6" />
                                </button>
                                <div>
                                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Campaigns</h2>
                                    <p className="text-sm text-gray-500 mt-1">Manage your fundraising campaigns</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowForm(!showForm);
                                    if (!showForm) {
                                        setTimeout(() => {
                                            document.getElementById('campaign-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }, 100);
                                    }
                                }}
                                className="bg-[#63A6B2] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#4d8b96] transition flex items-center gap-2 shadow-md"
                            >
                                {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                <span className="hidden sm:inline">{showForm ? 'Cancel' : 'Create Campaign'}</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-4 lg:p-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            icon={<PieChart className="w-5 h-5 text-white" />}
                            iconBg="from-[#63A6B2] to-[#4d8b96]"
                            title="Total"
                            value={stats.totalCampaigns}
                        />
                        <StatCard
                            icon={<TrendingUp className="w-5 h-5 text-white" />}
                            iconBg="from-green-500 to-green-400"
                            title="Active"
                            value={stats.activeCampaigns}
                        />
                        <StatCard
                            icon={<DollarSign className="w-5 h-5 text-white" />}
                            iconBg="from-purple-500 to-purple-400"
                            title="Raised"
                            value={formatCurrency(stats.totalRaised)}
                            small
                        />
                        <StatCard
                            icon={<Target className="w-5 h-5 text-white" />}
                            iconBg="from-blue-500 to-blue-400"
                            title="Goal"
                            value={formatCurrency(stats.totalGoal)}
                            small
                        />
                    </div>

                    {/* Inline Form */}
                    {showForm && (
                        <div id="campaign-form" className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">
                                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Campaign Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="campaign_name"
                                            value={formData.campaign_name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                            placeholder="Enter campaign name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Campaign Type
                                        </label>
                                        <input
                                            type="text"
                                            name="campaign_type"
                                            value={formData.campaign_type}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                            placeholder="e.g., Fundraising, Awareness"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Foundation *
                                        </label>
                                        <select
                                            name="foundation_id"
                                            value={formData.foundation_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                        >
                                            <option value="">Select a foundation</option>
                                            {foundations.map((foundation) => (
                                                <option key={foundation.foundation_id} value={foundation.foundation_id}>
                                                    {foundation.foundation_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Goal Amount (₱)
                                        </label>
                                        <input
                                            type="number"
                                            name="goal_amount"
                                            value={formData.goal_amount}
                                            onChange={handleChange}
                                            step="0.01"
                                            min="0"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                            placeholder="Enter goal amount"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            value={formData.start_date}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            name="end_date"
                                            value={formData.end_date}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="campaign_description"
                                        value={formData.campaign_description}
                                        onChange={handleChange}
                                        rows="4"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                        placeholder="Enter campaign description"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Campaign Images
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1 cursor-pointer">
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#63A6B2] transition text-center">
                                                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                <p className="text-sm text-gray-600">Click to upload images</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    {selectedImages.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 mb-3 font-medium">
                                                {selectedImages.length} image(s) selected
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {imagePreviewUrls.map((url, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={url}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                                                        />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                                                            <p className="text-white text-xs font-medium px-2 text-center truncate">
                                                                {selectedImages[index].name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={isLoading || uploadingImages}
                                        className="flex-1 bg-[#63A6B2] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4d8b96] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading || uploadingImages ? 'Saving...' : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Search and Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search campaigns..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="relative">
                                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 appearance-none bg-white cursor-pointer"
                                >
                                    <option value="all">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>

                            {/* Sort */}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 appearance-none bg-white cursor-pointer"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="progress">By Progress</option>
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Results count */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                                Showing <span className="font-semibold text-gray-900">{filteredCampaigns.length}</span> of <span className="font-semibold text-gray-900">{campaigns.length}</span> campaigns
                            </p>
                        </div>
                    </div>

                    {/* Campaigns Grid */}
                    {filteredCampaigns.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500 font-semibold text-lg">No campaigns found</p>
                            <p className="text-sm text-gray-400 mt-2">
                                {searchTerm || filterStatus !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'Create your first campaign to get started'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCampaigns.map((campaign) => (
                                <CampaignCard
                                    key={campaign.campaign_id}
                                    campaign={campaign}
                                    media={campaignMedia[campaign.campaign_id]}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    formatCurrency={formatCurrency}
                                    formatDate={formatDate}
                                    getProgressPercentage={getProgressPercentage}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Campaign</h3>
                            <p className="text-gray-600 text-center mb-6">
                                Are you sure you want to delete this campaign? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setCampaignToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Navigation Item Component
function NavItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
                ${active
                    ? 'bg-white/15 text-white border-l-4 border-[#f0a500] pl-3'
                    : 'text-white/70 hover:text-white hover:bg-white/10 hover:pl-5'
                }
            `}
        >
            {React.cloneElement(icon, { className: 'w-5 h-5' })}
            <span>{label}</span>
        </button>
    );
}

// Stat Card Component
function StatCard({ icon, iconBg, title, value, small }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium">{title}</p>
                    <p className={`${small ? 'text-sm' : 'text-xl'} font-bold text-gray-900 truncate`}>{value}</p>
                </div>
            </div>
        </div>
    );
}

// Campaign Card Component
function CampaignCard({ campaign, media, onEdit, onDelete, formatCurrency, formatDate, getProgressPercentage }) {
    const [showMenu, setShowMenu] = useState(false);
    const primaryImage = media && media.length > 0 ? media[0] : null;
    const progress = getProgressPercentage(campaign.current_amount || 0, campaign.goal_amount);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
            {/* Image Section */}
            <div className="relative h-48 bg-gradient-to-br from-[#63A6B2] to-[#4d8b96] overflow-hidden">
                {primaryImage ? (
                    <img
                        src={`http://localhost:5000${primaryImage.file_url}`}
                        alt={campaign.campaign_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-white/30" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${campaign.status === 'Active'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                        }`}>
                        {campaign.status || 'Active'}
                    </span>
                </div>

                {/* More Menu */}
                <div className="absolute top-3 right-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-700" />
                        </button>
                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                                    <button
                                        onClick={() => {
                                            onEdit(campaign);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDelete(campaign.campaign_id);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5">
                {/* Campaign Name */}
                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                    {campaign.campaign_name}
                </h3>

                {/* Foundation & Type */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{campaign.foundation_name || 'No foundation'}</span>
                    {campaign.campaign_type && (
                        <>
                            <span>•</span>
                            <span className="truncate">{campaign.campaign_type}</span>
                        </>
                    )}
                </div>

                {/* Description */}
                {campaign.campaign_description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {campaign.campaign_description}
                    </p>
                )}

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-500">Progress</span>
                        <span className="text-xs font-bold text-[#63A6B2]">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-[#63A6B2] to-[#4d8b96] h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Financial Info */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Raised</p>
                        <p className="text-sm font-bold text-[#63A6B2]">{formatCurrency(campaign.current_amount || 0)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Goal</p>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(campaign.goal_amount)}</p>
                    </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{formatDate(campaign.start_date)}</span>
                    <span>→</span>
                    <span className="truncate">{formatDate(campaign.end_date)}</span>
                </div>
            </div>
        </div>
    );
}
