import React, { useState, useEffect } from 'react';
import {
    Home, Users, DollarSign, PieChart, FileText, BarChart3,
    UserCog, Settings, AlertTriangle, Search, Menu, X, LogOut,
    Plus, Edit, Trash2, Building2, Mail, Phone, MapPin,
    MoreVertical, Filter, ChevronDown, Upload, CreditCard, CheckCircle2, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminFoundationCreation() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [foundations, setFoundations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingFoundation, setEditingFoundation] = useState(null);
    const [selectedLogo, setSelectedLogo] = useState(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
    const [selectedCover, setSelectedCover] = useState(null);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [foundationToDelete, setFoundationToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingFoundation, setViewingFoundation] = useState(null);

    const [formData, setFormData] = useState({
        foundation_name: '',
        foundation_address: '',
        foundation_contact: '',
        foundation_email: '',
        bank_name: '',
        bank_information: '',
        focus_areas: '',
        about_foundation: '',
        mission: '',
        vision: ''
    });

    useEffect(() => {
        fetchFoundations();
    }, []);

    const fetchFoundations = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/foundations/all');
            const data = await response.json();
            setFoundations(data);
        } catch (error) {
            console.error('Error fetching foundations:', error);
            toast.error('Failed to load foundations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedLogo(file);
            setLogoPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedCover(file);
            setCoverPreviewUrl(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setFormData({
            foundation_name: '',
            foundation_address: '',
            foundation_contact: '',
            foundation_email: '',
            bank_name: '',
            bank_information: '',
            focus_areas: '',
            about_foundation: '',
            mission: '',
            vision: ''
        });
        setSelectedLogo(null);
        setLogoPreviewUrl(null);
        setSelectedCover(null);
        setCoverPreviewUrl(null);
        setEditingFoundation(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.foundation_name.trim()) {
            toast.error('Foundation name is required');
            return;
        }

        try {
            setIsLoading(true);
            const body = new FormData();
            Object.keys(formData).forEach(key => {
                body.append(key, formData[key]);
            });
            if (selectedLogo) {
                body.append('logo', selectedLogo);
            }
            if (selectedCover) {
                body.append('cover', selectedCover);
            }

            const url = editingFoundation
                ? `http://localhost:5000/api/foundations/update/${editingFoundation.foundation_id}`
                : 'http://localhost:5000/api/foundations/create';

            const response = await fetch(url, {
                method: editingFoundation ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: body
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message);
                fetchFoundations();
                resetForm();
            } else {
                toast.error(result.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error saving foundation:', error);
            toast.error('Failed to save foundation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (foundation) => {
        setEditingFoundation(foundation);
        setFormData({
            foundation_name: foundation.foundation_name || '',
            foundation_address: foundation.foundation_address || '',
            foundation_contact: foundation.foundation_contact || '',
            foundation_email: foundation.foundation_email || '',
            bank_name: foundation.bank_name || '',
            bank_information: foundation.bank_information || '',
            focus_areas: foundation.focus_areas || '',
            about_foundation: foundation.about_foundation || '',
            mission: foundation.mission || '',
            vision: foundation.vision || ''
        });
        setLogoPreviewUrl(foundation.image_logo ? `http://localhost:5000${foundation.image_logo}` : null);
        setCoverPreviewUrl(foundation.image_cover ? `http://localhost:5000${foundation.image_cover}` : null);
        setShowForm(true);
        setTimeout(() => {
            document.getElementById('foundation-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleDeleteClick = (foundation) => {
        setFoundationToDelete(foundation);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!foundationToDelete) return;

        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:5000/api/foundations/${foundationToDelete.foundation_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                toast.success('Foundation deleted successfully');
                fetchFoundations();
            } else {
                toast.error('Failed to delete foundation');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('An error occurred while deleting');
        } finally {
            setIsLoading(false);
            setShowDeleteModal(false);
            setFoundationToDelete(null);
        }
    };

    // Filter foundations
    const filteredFoundations = foundations.filter(f =>
        f.foundation_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate stats
    const stats = {
        total: foundations.length,
        recent: foundations.filter(f => {
            const date = new Date(f.created_at);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 30;
        }).length
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
            {/* Sidebar */}
            <AdminSidebar
                activePage="foundations"
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
                <AdminHeader
                    title="Foundations"
                    subtitle="Manage partner foundations"
                    onMobileMenuClick={() => setMobileMenuOpen(true)}
                >
                    <button
                        onClick={() => {
                            setShowForm(!showForm);
                            if (!showForm) {
                                setTimeout(() => {
                                    document.getElementById('foundation-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 100);
                            }
                        }}
                        className="bg-[#63A6B2] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#4d8b96] transition flex items-center gap-2 shadow-md"
                    >
                        {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        <span className="hidden sm:inline">{showForm ? 'Cancel' : 'Register Foundation'}</span>
                    </button>
                </AdminHeader>

                {/* Content Area */}
                <div className="p-4 lg:p-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
                        <StatCard
                            icon={<Building2 className="w-5 h-5 text-white" />}
                            iconBg="from-[#63A6B2] to-[#4d8b96]"
                            title="Total Foundations"
                            value={stats.total}
                        />
                        <StatCard
                            icon={<BarChart3 className="w-5 h-5 text-white" />}
                            iconBg="from-blue-500 to-blue-400"
                            title="Added This Month"
                            value={stats.recent}
                        />
                    </div>

                    {/* Inline Form */}
                    {showForm && (
                        <div id="foundation-form" className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">
                                {editingFoundation ? 'Edit Foundation' : 'Register New Foundation'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Foundation Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="foundation_name"
                                                value={formData.foundation_name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                                placeholder="Enter foundation name"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                About Foundation
                                            </label>
                                            <ReactQuill
                                                theme="snow"
                                                value={formData.about_foundation}
                                                onChange={(value) => setFormData({ ...formData, about_foundation: value })}
                                                placeholder="Brief description about the foundation"
                                                style={{ borderRadius: '0.5rem', overflow: 'hidden' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Focus Areas
                                            </label>
                                            <input
                                                type="text"
                                                name="focus_areas"
                                                value={formData.focus_areas}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                                placeholder="e.g. Education, Health, Environment"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Mission
                                            </label>
                                            <ReactQuill
                                                theme="snow"
                                                value={formData.mission}
                                                onChange={(value) => setFormData({ ...formData, mission: value })}
                                                placeholder="Mission statement"
                                                style={{ borderRadius: '0.5rem', overflow: 'hidden' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Vision
                                            </label>
                                            <ReactQuill
                                                theme="snow"
                                                value={formData.vision}
                                                onChange={(value) => setFormData({ ...formData, vision: value })}
                                                placeholder="Vision statement"
                                                style={{ borderRadius: '0.5rem', overflow: 'hidden' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Contact & Location
                                            </label>
                                            <div className="space-y-3">
                                                <input
                                                    type="email"
                                                    name="foundation_email"
                                                    value={formData.foundation_email}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                                    placeholder="Email Address"
                                                />
                                                <input
                                                    type="text"
                                                    name="foundation_contact"
                                                    value={formData.foundation_contact}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                                    placeholder="Contact Number"
                                                />
                                                <input
                                                    type="text"
                                                    name="foundation_address"
                                                    value={formData.foundation_address}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                                    placeholder="Office Address"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Bank Information
                                            </label>
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    name="bank_name"
                                                    value={formData.bank_name}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                                    placeholder="Bank Name"
                                                />
                                                <textarea
                                                    name="bank_information"
                                                    value={formData.bank_information}
                                                    onChange={handleChange}
                                                    rows="3"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                                    placeholder="Bank account details (account name, number, etc.)"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Foundation Logo
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <div className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                                                    {logoPreviewUrl ? (
                                                        <img src={logoPreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Upload className="w-8 h-8 text-gray-400" />
                                                    )}
                                                </div>
                                                <label className="flex-1 cursor-pointer">
                                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-[#63A6B2] transition text-center">
                                                        <p className="text-sm text-gray-600">Upload Logo</p>
                                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG</p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleLogoChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Cover Image
                                            </label>
                                            <div className="relative h-32 w-full rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 group">
                                                {coverPreviewUrl ? (
                                                    <img src={coverPreviewUrl} alt="Cover Preview" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="text-center">
                                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                        <p className="text-sm text-gray-500">Upload Cover Image</p>
                                                    </div>
                                                )}
                                                <label className="absolute inset-0 cursor-pointer bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleCoverChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 bg-[#63A6B2] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4d8b96] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Saving...' : (editingFoundation ? 'Update Foundation' : 'Register Foundation')}
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

                    {/* Search only */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search foundations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                />
                            </div>
                        </div>

                        {/* Results count */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                                Showing <span className="font-semibold text-gray-900">{filteredFoundations.length}</span> of <span className="font-semibold text-gray-900">{foundations.length}</span> foundations
                            </p>
                        </div>
                    </div>

                    {/* Foundations Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {filteredFoundations.length === 0 ? (
                            <div className="p-12 text-center">
                                <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 font-semibold text-lg">No foundations found</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    {searchTerm
                                        ? 'Try adjusting your search'
                                        : 'Register your first foundation to get started'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Logo</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Foundation Details</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Bank Info</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mission/Focus</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {filteredFoundations.map((foundation) => (
                                            <tr key={foundation.foundation_id} className="hover:bg-gray-50 transition-colors">
                                                {/* Logo */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {foundation.image_logo ? (
                                                        <img
                                                            src={`http://localhost:5000${foundation.image_logo}`}
                                                            alt={foundation.foundation_name}
                                                            className="h-16 w-16 object-cover rounded-lg shadow-sm border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-200">
                                                            <Building2 className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Foundation Details */}
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-gray-900">{foundation.foundation_name}</div>
                                                    {foundation.about_foundation && (
                                                        <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-xs ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: foundation.about_foundation }} />
                                                    )}

                                                </td>

                                                {/* Contact Info */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {foundation.foundation_email && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                <Mail className="w-3.5 h-3.5 text-[#63A6B2] flex-shrink-0" />
                                                                <span className="truncate max-w-[200px]">{foundation.foundation_email}</span>
                                                            </div>
                                                        )}
                                                        {foundation.foundation_contact && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                <Phone className="w-3.5 h-3.5 text-[#63A6B2] flex-shrink-0" />
                                                                <span>{foundation.foundation_contact}</span>
                                                            </div>
                                                        )}
                                                        {foundation.foundation_address && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                <MapPin className="w-3.5 h-3.5 text-[#63A6B2] flex-shrink-0" />
                                                                <span className="truncate max-w-[200px]">{foundation.foundation_address}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Bank Info */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {foundation.bank_name && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                <CreditCard className="w-3.5 h-3.5 text-[#63A6B2] flex-shrink-0" />
                                                                <span className="font-semibold">{foundation.bank_name}</span>
                                                            </div>
                                                        )}
                                                        {foundation.bank_information && (
                                                            <div className="text-xs text-gray-500 line-clamp-2 max-w-[200px]">
                                                                {foundation.bank_information}
                                                            </div>
                                                        )}
                                                        {!foundation.bank_name && !foundation.bank_information && (
                                                            <span className="text-xs text-gray-400 italic">No bank info</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Mission/Focus */}
                                                <td className="px-6 py-4">
                                                    {foundation.focus_areas && (
                                                        <div className="text-xs text-gray-600 mb-2">
                                                            <span className="font-semibold text-gray-700">Focus:</span> {foundation.focus_areas}
                                                        </div>
                                                    )}
                                                    {foundation.mission && (
                                                        <div className="text-xs text-gray-500 italic line-clamp-2 max-w-xs ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: foundation.mission }} />
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button
                                                            onClick={() => { setViewingFoundation(foundation); setShowViewModal(true); }}
                                                            className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 transition"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(foundation)}
                                                            className="text-[#63A6B2] hover:text-[#4d8b96] font-semibold text-sm flex items-center gap-1 transition"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(foundation)}
                                                            className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center gap-1 transition"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* View Foundation Modal */}
            {showViewModal && viewingFoundation && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        {/* Cover Image */}
                        {viewingFoundation.image_cover && (
                            <div className="h-40 w-full overflow-hidden rounded-t-xl">
                                <img src={`http://localhost:5000${viewingFoundation.image_cover}`} alt="Cover" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start gap-4 mb-6">
                                {viewingFoundation.image_logo ? (
                                    <img src={`http://localhost:5000${viewingFoundation.image_logo}`} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-gray-200 shadow-sm flex-shrink-0" />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200 flex-shrink-0">
                                        <Building2 className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-gray-900">{viewingFoundation.foundation_name}</h3>
                                    {viewingFoundation.focus_areas && (
                                        <p className="text-sm text-[#63A6B2] font-medium mt-1">{viewingFoundation.focus_areas}</p>
                                    )}
                                </div>
                                <button onClick={() => { setShowViewModal(false); setViewingFoundation(null); }} className="text-gray-400 hover:text-gray-600 transition flex-shrink-0">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* About */}
                            {viewingFoundation.about_foundation && (
                                <div className="mb-5">
                                    <h4 className="text-sm font-bold text-gray-700 mb-2">About Foundation</h4>
                                    <div className="text-sm text-gray-600 ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: viewingFoundation.about_foundation }} />
                                </div>
                            )}

                            {/* Mission & Vision */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                {viewingFoundation.mission && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-2">Mission</h4>
                                        <div className="text-sm text-gray-600 ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: viewingFoundation.mission }} />
                                    </div>
                                )}
                                {viewingFoundation.vision && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-2">Vision</h4>
                                        <div className="text-sm text-gray-600 ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: viewingFoundation.vision }} />
                                    </div>
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="mb-5 p-4 bg-gray-50 rounded-lg">
                                <h4 className="text-sm font-bold text-gray-700 mb-3">Contact Information</h4>
                                <div className="space-y-2">
                                    {viewingFoundation.foundation_email && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4 text-[#63A6B2] flex-shrink-0" />
                                            <span>{viewingFoundation.foundation_email}</span>
                                        </div>
                                    )}
                                    {viewingFoundation.foundation_contact && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 text-[#63A6B2] flex-shrink-0" />
                                            <span>{viewingFoundation.foundation_contact}</span>
                                        </div>
                                    )}
                                    {viewingFoundation.foundation_address && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 text-[#63A6B2] flex-shrink-0" />
                                            <span>{viewingFoundation.foundation_address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bank Info */}
                            {(viewingFoundation.bank_name || viewingFoundation.bank_information) && (
                                <div className="mb-5 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">Bank Information</h4>
                                    {viewingFoundation.bank_name && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                            <CreditCard className="w-4 h-4 text-[#63A6B2] flex-shrink-0" />
                                            <span className="font-semibold">{viewingFoundation.bank_name}</span>
                                        </div>
                                    )}
                                    {viewingFoundation.bank_information && (
                                        <p className="text-sm text-gray-500 ml-6">{viewingFoundation.bank_information}</p>
                                    )}
                                </div>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={() => { setShowViewModal(false); setViewingFoundation(null); }}
                                className="w-full px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Foundation</h3>
                            <p className="text-gray-600 text-center mb-6">
                                Are you sure you want to delete <span className="font-bold">{foundationToDelete?.foundation_name}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setFoundationToDelete(null);
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
function StatCard({ icon, iconBg, title, value }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium">{title}</p>
                    <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
                </div>
            </div>
        </div>
    );
}
