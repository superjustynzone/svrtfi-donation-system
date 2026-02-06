import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function AdminFoundationCreation() {
    const [foundations, setFoundations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingFoundation, setEditingFoundation] = useState(null);
    const [selectedLogo, setSelectedLogo] = useState(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [foundationToDelete, setFoundationToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const filteredFoundations = foundations.filter(f =>
        f.foundation_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Foundation Management</h1>
                    <p className="text-gray-500 mt-1">Manage and register partner foundations</p>
                </div>
                <button
                    onClick={() => {
                        if (showForm) resetForm();
                        else setShowForm(true);
                    }}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${showForm
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-[#63A6B2] text-white hover:bg-[#5a959f] active:scale-95'
                        }`}
                >
                    {showForm ? 'Cancel' : 'Register Foundation'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-10 transition-all">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        {editingFoundation ? 'Edit Foundation' : 'New Foundation Registration'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Foundation Name *</label>
                                    <input
                                        type="text"
                                        name="foundation_name"
                                        value={formData.foundation_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#63A6B2] outline-none transition-all bg-gray-50"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="foundation_desc"
                                        value={formData.foundation_desc}
                                        onChange={handleChange}
                                        rows="4"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#63A6B2] outline-none transition-all bg-gray-50"
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="foundation_email"
                                        value={formData.foundation_email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#63A6B2] outline-none transition-all bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Contact Number</label>
                                    <input
                                        type="text"
                                        name="foundation_contact"
                                        value={formData.foundation_contact}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#63A6B2] outline-none transition-all bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Office Address</label>
                                    <input
                                        type="text"
                                        name="foundation_address"
                                        value={formData.foundation_address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#63A6B2] outline-none transition-all bg-gray-50"
                                    />
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <input
                                        type="checkbox"
                                        id="accepts_donations"
                                        name="accepts_donations"
                                        checked={formData.accepts_donations}
                                        onChange={(e) => setFormData({ ...formData, accepts_donations: e.target.checked })}
                                        className="h-5 w-5 rounded border-gray-300 text-[#63A6B2] focus:ring-[#63A6B2]"
                                    />
                                    <label htmlFor="accepts_donations" className="text-sm font-bold text-gray-700 cursor-pointer">
                                        Accepts Donations Directly
                                    </label>
                                </div>
                            </div>

                            {/* Right Column: Payment & Logo */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Foundation Logo</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 shadow-inner">
                                            {logoPreviewUrl ? (
                                                <img src={logoPreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#63A6B2] file:text-white hover:file:bg-[#5a959f] cursor-pointer shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></div>
                                        Bank Transfer Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">Bank Name</label>
                                            <input
                                                type="text"
                                                name="bank_name"
                                                placeholder="e.g. BPI, BDO"
                                                value={formData.bank_name}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#63A6B2] outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">Account Holder Name</label>
                                            <input
                                                type="text"
                                                name="bank_account_name"
                                                value={formData.bank_account_name}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#63A6B2] outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1">Account Number</label>
                                            <input
                                                type="text"
                                                name="bank_account_number"
                                                value={formData.bank_account_number}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#63A6B2] outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-10 py-2.5 bg-[#63A6B2] text-white rounded-xl font-bold hover:bg-[#5a959f] shadow-lg shadow-[#63a6b244] disabled:bg-gray-400 transition-all"
                            >
                                {isLoading ? 'Saving...' : editingFoundation ? 'Update Foundation' : 'Register Foundation'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-800">Foundation Directory</h2>
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Search foundation name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#63A6B2] outline-none text-sm bg-gray-50 flex"
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {isLoading && foundations.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Loading foundations...</div>
                ) : filteredFoundations.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        {searchTerm ? 'No matches found for your search.' : 'No foundations registered yet.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Logo</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Foundation Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Info</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredFoundations.map((foundation) => (
                                    <tr key={foundation.foundation_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {foundation.foundation_logo ? (
                                                <img
                                                    src={`http://localhost:5000${foundation.foundation_logo}`}
                                                    alt={foundation.foundation_name}
                                                    className="h-16 w-16 object-cover rounded-2xl shadow-sm border border-gray-100"
                                                />
                                            ) : (
                                                <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center text-xs text-gray-400 font-bold border border-dashed border-gray-200">
                                                    No Logo
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900">{foundation.foundation_name}</div>
                                            <div className="mt-1 flex flex-col gap-0.5">
                                                {foundation.foundation_email && (
                                                    <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-[#63A6B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        {foundation.foundation_email}
                                                    </div>
                                                )}
                                                {foundation.foundation_contact && (
                                                    <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-[#63A6B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        {foundation.foundation_contact}
                                                    </div>
                                                )}
                                            </div>
                                            {foundation.foundation_desc && (
                                                <div className="text-xs text-gray-400 line-clamp-1 mt-2 italic leading-relaxed">
                                                    "{foundation.foundation_desc}"
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="space-y-3">
                                                {foundation.bank_name && (
                                                    <div className="flex flex-col p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                                                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Bank Account</span>
                                                        <span className="font-bold text-gray-800 text-xs">{foundation.bank_name}</span>
                                                        <span className="text-gray-600 font-medium">{foundation.bank_account_number}</span>
                                                        <span className="text-gray-400 text-[10px] truncate">{foundation.bank_account_name}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${foundation.accepts_donations ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                        {foundation.accepts_donations ? 'Accepts Donations' : 'No Direct Donations'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => handleEdit(foundation)}
                                                    className="text-[#63A6B2] hover:text-[#5a959f] font-bold flex items-center gap-1"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(foundation)}
                                                    className="text-red-600 hover:text-red-900 font-bold flex items-center gap-1"
                                                >
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100">
                        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6 mx-auto">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-8 text-center leading-relaxed">
                            Are you sure you want to delete <span className="font-bold text-gray-900">{foundationToDelete?.foundation_name}</span>? This action is irreversible.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setFoundationToDelete(null);
                                }}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                            >
                                Keep it
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                            >
                                Delete Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
