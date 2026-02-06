import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function AdminCampaignCreation() {
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

    const filteredCampaigns = campaigns.filter(campaign =>
        campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fetchCampaigns = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/campaigns/all');
            const data = await response.json();
            setCampaigns(data);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            toast.error('Failed to load campaigns');
        }
    };

    const fetchFoundations = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/foundations/all');
            const data = await response.json();
            setFoundations(data);
        } catch (error) {
            console.error('Error fetching foundations:', error);
            toast.error('Failed to load foundations');
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

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Campaign Management</h1>
                    <p className="text-gray-600 mt-2">Create and manage campaigns for foundations</p>
                </div>

                {/* Create Button */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-[#63A6B2] text-white px-6 py-3 rounded-lg hover:bg-[#5a959f] transition-colors"
                    >
                        {showForm ? 'Cancel' : '+ Create New Campaign'}
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Campaign Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="campaign_name"
                                        value={formData.campaign_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent"
                                        placeholder="Enter campaign name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Campaign Type
                                    </label>
                                    <input
                                        type="text"
                                        name="campaign_type"
                                        value={formData.campaign_type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent"
                                        placeholder="e.g., Fundraising, Awareness, etc."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Foundation *
                                    </label>
                                    <select
                                        name="foundation_id"
                                        value={formData.foundation_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Goal Amount (₱)
                                    </label>
                                    <input
                                        type="number"
                                        name="goal_amount"
                                        value={formData.goal_amount}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent"
                                        placeholder="Enter goal amount"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="campaign_description"
                                    value={formData.campaign_description}
                                    onChange={handleChange}
                                    rows="4"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent"
                                    placeholder="Enter campaign description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Campaign Images
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent"
                                />
                                {selectedImages.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-500 mb-2">
                                            {selectedImages.length} image(s) selected
                                        </p>
                                        <div className="grid grid-cols-3 gap-4">
                                            {imagePreviewUrls.map((url, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={url}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                                    />
                                                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                        {selectedImages[index].name}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={isLoading || uploadingImages}
                                    className="bg-[#63A6B2] text-white px-6 py-2 rounded-lg hover:bg-[#5a959f] transition-colors disabled:opacity-50"
                                >
                                    {isLoading || uploadingImages ? 'Saving...' : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Campaigns List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-xl font-semibold">All Campaigns</h2>
                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                placeholder="Search campaign name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none text-sm transition-all shadow-sm"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {campaigns.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No campaigns found. Create your first campaign!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                            Images
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Campaign Info
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Financials & Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Dates
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredCampaigns.map((campaign) => (
                                        <tr key={campaign.campaign_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {campaignMedia[campaign.campaign_id] && campaignMedia[campaign.campaign_id].length > 0 ? (
                                                        campaignMedia[campaign.campaign_id].slice(0, 3).map((media, idx) => (
                                                            <div key={media.media_id} className="relative group">
                                                                <img
                                                                    src={`http://localhost:5000${media.file_url}`}
                                                                    alt="Campaign"
                                                                    className="inline-block h-16 w-24 rounded-lg ring-2 ring-white object-cover shadow-sm transition-transform hover:scale-105"
                                                                />
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteMedia(media.media_id, campaign.campaign_id);
                                                                    }}
                                                                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
                                                                >
                                                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="h-16 w-24 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-[10px] italic border border-gray-200 border-dashed">
                                                            No pic
                                                        </div>
                                                    )}
                                                    {campaignMedia[campaign.campaign_id]?.length > 3 && (
                                                        <div className="flex items-center justify-center h-16 w-16 min-w-[40px] rounded-lg ring-2 ring-white bg-[#63A6B2] text-white text-xs font-bold shadow-sm">
                                                            +{campaignMedia[campaign.campaign_id].length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900">
                                                    {campaign.campaign_name}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">
                                                    {campaign.foundation_name || 'No foundation'} • {campaign.campaign_type || 'General'}
                                                </div>
                                                {campaign.campaign_description && (
                                                    <div className="text-xs text-gray-400 mt-1 line-clamp-1 max-w-xs">
                                                        {campaign.campaign_description}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Raised</span>
                                                        <span className="text-sm font-bold text-[#63A6B2]">{formatCurrency(campaign.current_amount || 0)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Goal</span>
                                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(campaign.goal_amount)}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-widest ${campaign.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {campaign.status || 'Active'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                <div className="font-semibold">{formatDate(campaign.start_date)}</div>
                                                <div className="text-gray-400 italic">to {formatDate(campaign.end_date)}</div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(campaign)}
                                                    className="text-[#63A6B2] hover:text-[#5a959f] mr-4"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(campaign.campaign_id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this campaign? This action cannot be undone and will also delete all associated media.
                            </p>
                            <div className="flex gap-4 justify-end">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setCampaignToDelete(null);
                                    }}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete Campaign
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
