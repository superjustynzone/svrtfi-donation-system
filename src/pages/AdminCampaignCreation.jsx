import React, { useState, useEffect } from 'react';
import {
    Home, Users, DollarSign, PieChart, FileText, BarChart3,
    UserCog, Settings, AlertTriangle, Search, Menu, X, LogOut,
    Plus, Edit, Trash2, Calendar, Target, TrendingUp, Image as ImageIcon,
    MapPin, MoreVertical, Filter, ChevronDown, Upload, Star,
    Send, FileEdit, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminCampaignCreation() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [foundations, setFoundations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [campaignToDelete, setCampaignToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('draft'); // 'draft' or 'publish'
    const [sortBy, setSortBy] = useState('newest');

    const [formData, setFormData] = useState({
        campaign_name: '',
        campaign_type: '',
        campaign_description: '',
        foundation_id: '',
        goal_amount: '',
        start_date: '',
        end_date: '',
        is_featured: false
    });

    useEffect(() => {
        fetchCampaigns();
        fetchFoundations();
    }, []);

    // Separate campaigns by status
    const draftCampaigns = campaigns.filter(c => c.status === 'draft');
    const publishedCampaigns = campaigns.filter(c => c.status === 'publish');

    // Filter the active tab's campaigns
    const activeCampaigns = activeTab === 'draft' ? draftCampaigns : publishedCampaigns;

    const filteredCampaigns = activeCampaigns
        .filter(campaign => campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if (sortBy === 'progress') {
                const pA = (a.current_amount / a.goal_amount) * 100 || 0;
                const pB = (b.current_amount / b.goal_amount) * 100 || 0;
                return pB - pA;
            }
            return 0;
        });

    // Stats
    const stats = {
        totalCampaigns: campaigns.length,
        draftCount: draftCampaigns.length,
        publishedCount: publishedCampaigns.length,
        featuredCount: campaigns.filter(c => c.is_featured).length,
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
                setFoundations([]);
            }
        } catch (error) {
            console.error('Error fetching foundations:', error);
            toast.error('Failed to load foundations');
            setFoundations([]);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

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

            const body = new FormData();
            Object.keys(formData).forEach(key => {
                body.append(key, formData[key]);
            });
            if (selectedImage) {
                body.append('image', selectedImage);
            }

            const response = await fetch(url, { method, body });
            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                fetchCampaigns();
                resetForm();
                // Switch to draft tab when creating new
                if (!editingCampaign) setActiveTab('draft');
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

    const handleToggleStatus = async (campaignId, currentStatus) => {
        const newStatus = currentStatus === 'draft' ? 'publish' : 'draft';
        try {
            const response = await fetch(`http://localhost:5000/api/campaigns/status/${campaignId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                fetchCampaigns();
            } else {
                toast.error(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Failed to update campaign status');
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
            end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
            is_featured: campaign.is_featured || false
        });
        setImagePreviewUrl(campaign.file_url ? `http://localhost:5000${campaign.file_url}` : null);
        setShowForm(true);
        setTimeout(() => {
            document.getElementById('campaign-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleDelete = (campaignId) => {
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
                fetchCampaigns();
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

    const resetForm = () => {
        setFormData({
            campaign_name: '',
            campaign_type: '',
            campaign_description: '',
            foundation_id: '',
            goal_amount: '',
            start_date: '',
            end_date: '',
            is_featured: false
        });
        setSelectedImage(null);
        setImagePreviewUrl(null);
        setEditingCampaign(null);
        setShowForm(false);
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₱0';
        return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Ongoing';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getProgressPercentage = (current, goal) => {
        if (!goal || goal === 0) return 0;
        return Math.min((current / goal) * 100, 100);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
            <AdminSidebar
                activePage="campaigns"
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />

            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

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

                <div className="p-4 lg:p-8">
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            icon={<PieChart className="w-5 h-5 text-white" />}
                            iconBg="from-[#63A6B2] to-[#4d8b96]"
                            title="Total"
                            value={stats.totalCampaigns}
                        />
                        <StatCard
                            icon={<FileEdit className="w-5 h-5 text-white" />}
                            iconBg="from-amber-500 to-amber-400"
                            title="Drafts"
                            value={stats.draftCount}
                        />
                        <StatCard
                            icon={<Send className="w-5 h-5 text-white" />}
                            iconBg="from-green-500 to-green-400"
                            title="Published"
                            value={stats.publishedCount}
                        />
                        <StatCard
                            icon={<DollarSign className="w-5 h-5 text-white" />}
                            iconBg="from-purple-500 to-purple-400"
                            title="Raised"
                            value={formatCurrency(stats.totalRaised)}
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
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign Name *</label>
                                        <input
                                            type="text" name="campaign_name" value={formData.campaign_name} onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                            placeholder="Enter campaign name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign Type</label>
                                        <input
                                            type="text" name="campaign_type" value={formData.campaign_type} onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                            placeholder="e.g., Fundraising, Awareness"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Foundation *</label>
                                        <select
                                            name="foundation_id" value={formData.foundation_id} onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                        >
                                            <option value="">Select a foundation</option>
                                            {foundations.map((f) => (
                                                <option key={f.foundation_id} value={f.foundation_id}>{f.foundation_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Goal Amount (₱)</label>
                                        <input
                                            type="number" name="goal_amount" value={formData.goal_amount} onChange={handleChange}
                                            step="0.01" min="0"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                            placeholder="Enter goal amount"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                        <input
                                            type="date" name="start_date" value={formData.start_date} onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            End Date
                                            <span className="text-xs text-gray-400 font-normal ml-2">(Leave empty for endless campaign)</span>
                                        </label>
                                        <input
                                            type="date" name="end_date" value={formData.end_date} onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.campaign_description}
                                        onChange={(value) => setFormData({ ...formData, campaign_description: value })}
                                        placeholder="Enter campaign description"
                                        style={{ borderRadius: '0.5rem', overflow: 'hidden' }}
                                    />
                                </div>

                                {/* Campaign Image */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign Image</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-32 w-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                                            {imagePreviewUrl ? (
                                                <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                    <p className="text-xs text-gray-400">No image</p>
                                                </div>
                                            )}
                                        </div>
                                        <label className="flex-1 cursor-pointer">
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#63A6B2] transition text-center">
                                                <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                                                <p className="text-sm text-gray-600">Upload Image</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                            </div>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                {/* Featured Toggle */}
                                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <input
                                        type="checkbox" name="is_featured" id="is_featured"
                                        checked={formData.is_featured} onChange={handleChange}
                                        className="w-5 h-5 text-[#63A6B2] border-gray-300 rounded focus:ring-[#63A6B2]/20 cursor-pointer"
                                    />
                                    <label htmlFor="is_featured" className="cursor-pointer">
                                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Star className="w-4 h-4 text-amber-500" />
                                            Feature this campaign
                                        </span>
                                        <p className="text-xs text-gray-500 mt-0.5">Featured campaigns are highlighted on the homepage</p>
                                    </label>
                                </div>

                                {/* Info: Saved as Draft */}
                                {!editingCampaign && (
                                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <FileEdit className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                        <div>
                                            <span className="text-sm font-semibold text-gray-700">Saved as Draft</span>
                                            <p className="text-xs text-gray-500 mt-0.5">New campaigns are saved as drafts. You can publish them from the Drafts tab.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="submit" disabled={isLoading}
                                        className="flex-1 bg-[#63A6B2] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4d8b96] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Saving...' : (editingCampaign ? 'Update Campaign' : 'Save as Draft')}
                                    </button>
                                    <button
                                        type="button" onClick={resetForm}
                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Draft / Published Tabs */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('draft')}
                                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2
                                    ${activeTab === 'draft'
                                        ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <FileEdit className="w-4 h-4" />
                                Drafts
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                                    ${activeTab === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    {draftCampaigns.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('publish')}
                                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2
                                    ${activeTab === 'publish'
                                        ? 'text-green-600 border-b-2 border-green-500 bg-green-50/50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Send className="w-4 h-4" />
                                Published
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                                    ${activeTab === 'publish' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    {publishedCampaigns.length}
                                </span>
                            </button>
                        </div>

                        {/* Search & Sort inside tab panel */}
                        <div className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text" placeholder="Search campaigns..."
                                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                    />
                                </div>
                                <div className="relative">
                                    <select
                                        value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                                        className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 appearance-none bg-white cursor-pointer"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="progress">By Progress</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-sm text-gray-600">
                                    Showing <span className="font-semibold text-gray-900">{filteredCampaigns.length}</span>{' '}
                                    {activeTab === 'draft' ? 'draft' : 'published'} campaign{filteredCampaigns.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Campaigns Grid */}
                    {filteredCampaigns.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            {activeTab === 'draft' ? (
                                <FileEdit className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            ) : (
                                <Send className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            )}
                            <p className="text-gray-500 font-semibold text-lg">
                                No {activeTab === 'draft' ? 'draft' : 'published'} campaigns
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                {activeTab === 'draft'
                                    ? 'Create a new campaign to get started — it will appear here as a draft.'
                                    : 'Publish a draft campaign to make it visible to the public.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCampaigns.map((campaign) => (
                                <CampaignCard
                                    key={campaign.campaign_id}
                                    campaign={campaign}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleStatus={handleToggleStatus}
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
                                    onClick={() => { setShowDeleteModal(false); setCampaignToDelete(null); }}
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
function CampaignCard({ campaign, onEdit, onDelete, onToggleStatus, formatCurrency, formatDate, getProgressPercentage }) {
    const [showMenu, setShowMenu] = useState(false);
    const progress = getProgressPercentage(campaign.current_amount || 0, campaign.goal_amount);
    const isDraft = campaign.status === 'draft';

    return (
        <div className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all group
            ${isDraft ? 'border-amber-200' : 'border-gray-200'}`}
        >
            {/* Image Section */}
            <div className="relative h-48 bg-gradient-to-br from-[#63A6B2] to-[#4d8b96] overflow-hidden">
                {campaign.file_url ? (
                    <img
                        src={`http://localhost:5000${campaign.file_url}`}
                        alt={campaign.campaign_name}
                        className={`w-full h-full object-cover ${isDraft ? 'opacity-80' : ''}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-white/30" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                    {isDraft ? (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500 text-white flex items-center gap-1">
                            <FileEdit className="w-3 h-3" />
                            Draft
                        </span>
                    ) : (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-500 text-white flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Published
                        </span>
                    )}
                    {campaign.is_featured && (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-400 text-yellow-900 flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Featured
                        </span>
                    )}
                </div>

                {/* Ongoing badge */}
                {!campaign.end_date && (
                    <div className="absolute bottom-3 left-3">
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/90 text-white">Ongoing</span>
                    </div>
                )}

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
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                                    <button
                                        onClick={() => { onEdit(campaign); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { onToggleStatus(campaign.campaign_id, campaign.status); setShowMenu(false); }}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${isDraft ? 'text-green-600' : 'text-amber-600'}`}
                                    >
                                        {isDraft ? <Send className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        {isDraft ? 'Publish' : 'Unpublish'}
                                    </button>
                                    <div className="border-t border-gray-100 my-1" />
                                    <button
                                        onClick={() => { onDelete(campaign.campaign_id); setShowMenu(false); }}
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

            {/* Content */}
            <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">{campaign.campaign_name}</h3>

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

                {campaign.campaign_description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{campaign.campaign_description}</p>
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

                {/* Financial */}
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{formatDate(campaign.start_date)}</span>
                        <span>→</span>
                        <span>{formatDate(campaign.end_date)}</span>
                    </div>
                </div>

                {/* Publish / Unpublish Button */}
                <button
                    onClick={() => onToggleStatus(campaign.campaign_id, campaign.status)}
                    className={`w-full mt-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2
                        ${isDraft
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300'
                        }`}
                >
                    {isDraft ? <Send className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {isDraft ? 'Publish Campaign' : 'Unpublish'}
                </button>
            </div>
        </div>
    );
}
