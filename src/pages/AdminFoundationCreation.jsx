import React, { useState, useEffect } from 'react';
import {
    Home, Users, DollarSign, PieChart, FileText, BarChart3,
    UserCog, Settings, AlertTriangle, Search, Menu, X, LogOut,
    Plus, Edit, Trash2, Building2, Mail, Phone, MapPin,
    MoreVertical, Filter, ChevronDown, Upload, CreditCard, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function AdminFoundationCreation() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [foundations, setFoundations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingFoundation, setEditingFoundation] = useState(null);
    const [selectedLogo, setSelectedLogo] = useState(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [foundationToDelete, setFoundationToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAcceptsDonations, setFilterAcceptsDonations] = useState('all'); // 'all', 'yes', 'no'

    const [formData, setFormData] = useState({
        foundation_name: '',
        foundation_desc: '',
        foundation_address: '',
        foundation_contact: '',
        foundation_email: '',
        accepts_donations: false,
        bank_name: '',
        bank_account_name: '',
        bank_account_number: ''
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

    const resetForm = () => {
        setFormData({
            foundation_name: '',
            foundation_desc: '',
            foundation_address: '',
            foundation_contact: '',
            foundation_email: '',
            accepts_donations: false,
            bank_name: '',
            bank_account_name: '',
            bank_account_number: ''
        });
        setSelectedLogo(null);
        setLogoPreviewUrl(null);
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

            const url = editingFoundation
                ? `http://localhost:5000/api/foundations/update/${editingFoundation.foundation_id}`
                : 'http://localhost:5000/api/foundations/create';

            const response = await fetch(url, {
                method: editingFoundation ? 'PUT' : 'POST',
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
            foundation_desc: foundation.foundation_desc || '',
            foundation_address: foundation.foundation_address || '',
            foundation_contact: foundation.foundation_contact || '',
            foundation_email: foundation.foundation_email || '',
            accepts_donations: foundation.accepts_donations || false,
            bank_name: foundation.bank_name || '',
            bank_account_name: foundation.bank_account_name || '',
            bank_account_number: foundation.bank_account_number || ''
        });
        setLogoPreviewUrl(foundation.foundation_logo ? `http://localhost:5000${foundation.foundation_logo}` : null);
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
                method: 'DELETE'
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
        setTimeout(() => {
            navigate('/login');
        }, 500);
    };

    // Filter foundations
    const filteredFoundations = foundations.filter(f => {
        const matchesSearch = f.foundation_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterAcceptsDonations === 'all' ||
            (filterAcceptsDonations === 'yes' && f.accepts_donations) ||
            (filterAcceptsDonations === 'no' && !f.accepts_donations);
        return matchesSearch && matchesFilter;
    });

    // Calculate stats
    const stats = {
        total: foundations.length,
        acceptingDonations: foundations.filter(f => f.accepts_donations).length,
        withBankInfo: foundations.filter(f => f.bank_name && f.bank_account_number).length
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-gradient-to-b from-[#63A6B2] to-[#4d8b96]
                transform transition-transform duration-300 ease-in-out
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                shadow-2xl flex flex-col
            `}>
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-lg leading-tight">SVRTFI</h1>
                                <p className="text-white/70 text-xs">Donation CRM</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="lg:hidden text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 overflow-y-auto">
                    <div className="px-3 space-y-1">
                        <NavItem icon={<Home />} label="Dashboard" onClick={() => navigate('/admin_dashboard')} />
                        <NavItem icon={<Users />} label="Donors" onClick={() => navigate('/admin_donors')} />
                        <NavItem icon={<DollarSign />} label="Donations" onClick={() => navigate('/admin_donations')} />
                        <NavItem icon={<PieChart />} label="Campaigns" onClick={() => navigate('/admin_campaigns')} />
                        <NavItem icon={<FileText />} label="Foundations" active />
                        <NavItem icon={<BarChart3 />} label="Reports" onClick={() => navigate('/admin_reports')} />
                        <NavItem icon={<UserCog />} label="User Management" onClick={() => navigate('/admin_users')} />
                    </div>

                    <div className="px-3 mt-6 pt-6 border-t border-white/10">
                        <div className="text-xs font-semibold text-white/50 px-4 mb-3 uppercase tracking-wider">System</div>
                        <NavItem icon={<Settings />} label="Settings" onClick={() => navigate('/admin_settings')} />
                        <NavItem icon={<AlertTriangle />} label="Audit Logs" onClick={() => navigate('/admin_audit')} />
                    </div>
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-white/10">
                    <div
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition"
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-white font-bold">
                            JD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">John Dela Cruz</p>
                            <p className="text-white/60 text-xs truncate">Super Admin</p>
                        </div>
                        <LogOut className="w-4 h-4 text-white/60" />
                    </div>
                </div>
            </aside>

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
                                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Foundations</h2>
                                    <p className="text-sm text-gray-500 mt-1">Manage partner foundations</p>
                                </div>
                            </div>
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
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-4 lg:p-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        <StatCard
                            icon={<Building2 className="w-5 h-5 text-white" />}
                            iconBg="from-[#63A6B2] to-[#4d8b96]"
                            title="Total Foundations"
                            value={stats.total}
                        />
                        <StatCard
                            icon={<CheckCircle2 className="w-5 h-5 text-white" />}
                            iconBg="from-green-500 to-green-400"
                            title="Accepting Donations"
                            value={stats.acceptingDonations}
                        />
                        <StatCard
                            icon={<CreditCard className="w-5 h-5 text-white" />}
                            iconBg="from-blue-500 to-blue-400"
                            title="With Bank Info"
                            value={stats.withBankInfo}
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
                                                Description
                                            </label>
                                            <textarea
                                                name="foundation_desc"
                                                value={formData.foundation_desc}
                                                onChange={handleChange}
                                                rows="3"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                                placeholder="Brief description"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                name="foundation_email"
                                                value={formData.foundation_email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                                placeholder="contact@foundation.org"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Contact Number
                                            </label>
                                            <input
                                                type="text"
                                                name="foundation_contact"
                                                value={formData.foundation_contact}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                                placeholder="(02) 1234-5678"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Office Address
                                            </label>
                                            <input
                                                type="text"
                                                name="foundation_address"
                                                value={formData.foundation_address}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                                placeholder="Street, City, Province"
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-4">
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
                                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#63A6B2] transition text-center">
                                                        <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                                        <p className="text-sm text-gray-600">Click to upload</p>
                                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
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

                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-blue-600" />
                                                Bank Transfer Information
                                            </h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                        Bank Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="bank_name"
                                                        value={formData.bank_name}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 text-sm"
                                                        placeholder="e.g. BPI, BDO"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                        Account Holder Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="bank_account_name"
                                                        value={formData.bank_account_name}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 text-sm"
                                                        placeholder="Account holder name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                        Account Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="bank_account_number"
                                                        value={formData.bank_account_number}
                                                        onChange={handleChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 text-sm"
                                                        placeholder="Account number"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <input
                                                type="checkbox"
                                                id="accepts_donations"
                                                name="accepts_donations"
                                                checked={formData.accepts_donations}
                                                onChange={(e) => setFormData({ ...formData, accepts_donations: e.target.checked })}
                                                className="h-5 w-5 rounded border-gray-300 text-[#63A6B2] focus:ring-[#63A6B2]"
                                            />
                                            <label htmlFor="accepts_donations" className="text-sm font-semibold text-gray-700 cursor-pointer">
                                                Accepts Donations Directly
                                            </label>
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

                    {/* Search and Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
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

                            {/* Filter */}
                            <div className="relative">
                                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterAcceptsDonations}
                                    onChange={(e) => setFilterAcceptsDonations(e.target.value)}
                                    className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 appearance-none bg-white cursor-pointer"
                                >
                                    <option value="all">All Foundations</option>
                                    <option value="yes">Accepts Donations</option>
                                    <option value="no">No Direct Donations</option>
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                                    {searchTerm || filterAcceptsDonations !== 'all'
                                        ? 'Try adjusting your search or filters'
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
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Bank Information</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {filteredFoundations.map((foundation) => (
                                            <tr key={foundation.foundation_id} className="hover:bg-gray-50 transition-colors">
                                                {/* Logo */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {foundation.foundation_logo ? (
                                                        <img
                                                            src={`http://localhost:5000${foundation.foundation_logo}`}
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
                                                    {foundation.foundation_desc && (
                                                        <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-xs">
                                                            {foundation.foundation_desc}
                                                        </div>
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

                                                {/* Bank Information */}
                                                <td className="px-6 py-4">
                                                    {foundation.bank_name ? (
                                                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                                                                <span className="text-xs font-bold text-blue-900">{foundation.bank_name}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-700 font-medium">{foundation.bank_account_number}</p>
                                                            {foundation.bank_account_name && (
                                                                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{foundation.bank_account_name}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">No bank info</span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${foundation.accepts_donations
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {foundation.accepts_donations ? (
                                                            <>
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                Accepting
                                                            </>
                                                        ) : (
                                                            'Not Accepting'
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-3">
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
