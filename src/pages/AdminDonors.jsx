import React, { useState, useEffect } from 'react';
import {
    Users, DollarSign, Search, Plus,
    Menu, X, Download,
    Mail, Phone, MapPin, Calendar, UserCheck,
    RefreshCw, Eye, AlertTriangle, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Colour palette for avatars (cycles by index)
const AVATAR_COLORS = [
    'from-blue-400 to-blue-600',
    'from-green-400 to-green-600',
    'from-purple-400 to-purple-600',
    'from-yellow-400 to-yellow-600',
    'from-pink-400 to-pink-600',
    'from-red-400 to-red-600',
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
    'from-orange-400 to-orange-600',
    'from-cyan-400 to-cyan-600',
    'from-rose-400 to-rose-600',
    'from-emerald-400 to-emerald-600',
];

const getInitials = (first, last) => {
    const f = first || '';
    const l = last || '';
    return `${f[0] || ''}${l[0] || ''}`.toUpperCase() || '?';
};

const fmtDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₱0';
    return '₱' + Number(amount).toLocaleString();
};

export default function AdminDonors() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [sortBy, setSortBy] = useState('donations');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedDonor, setSelectedDonor] = useState(null);
    const [activeViewTab, setActiveViewTab] = useState('profile');
    const [donorHistory, setDonorHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Data
    const [donors, setDonors] = useState([]);
    const [filteredDonors, setFilteredDonors] = useState([]);
    const [stats, setStats] = useState({
        totalDonors: 0,
        activeDonors: 0,
        recurringDonors: 0,
        totalLifetimeDonations: 0
    });

    useEffect(() => { fetchDonors(); }, []);

    // Filter / sort
    useEffect(() => {
        let filtered = [...donors];

        // Exclude anonymous donors (those without first_name and last_name)
        filtered = filtered.filter(d => d.first_name || d.last_name);

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            filtered = filtered.filter(d =>
                `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase().includes(q) ||
                (d.email || '').toLowerCase().includes(q)
            );
        }

        if (filterType !== 'All') {
            if (filterType === 'Recurring') {
                filtered = filtered.filter(d => d.is_recurring === true);
            } else {
                filtered = filtered.filter(d => !d.is_recurring);
            }
        }

        filtered.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.last_donation_at) - new Date(a.last_donation_at);
            if (sortBy === 'name') return (a.first_name || '').localeCompare(b.first_name || '');
            if (sortBy === 'donations') return (b.total_donated || 0) - (a.total_donated || 0);
            return 0;
        });

        setFilteredDonors(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterType, sortBy, donors]);

    const fetchDonors = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/donations/donors', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch donors');
            const data = await res.json();
            setDonors(data.donors || []);
            setStats(data.stats || {});
        } catch (err) {
            console.error('Error fetching donors:', err);
            toast.error('Could not load donors. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const openViewModal = async (donor) => {
        setSelectedDonor(donor);
        setIsViewModalOpen(true);
        setActiveViewTab('profile');
        setDonorHistory([]);
        setHistoryLoading(true);
        try {
            const res = await fetch(`/api/donations/donor/${donor.donor_id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setDonorHistory(data);
        } catch {
            toast.error('Could not load donation history.');
        } finally {
            setHistoryLoading(false);
        }
    };


    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedDonors = filteredDonors.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDonors.length / itemsPerPage);

    // PDF Export
    const handleExportPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.setTextColor(99, 166, 178);
            doc.text("Shepherd's Voice - Donors Report", 14, 22);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
            autoTable(doc, {
                head: [["Name", "Email", "Type", "Total Donated", "Donations", "Last Donation"]],
                body: filteredDonors.map(d => [
                    d.first_name || d.last_name ? `${d.first_name || ''} ${d.last_name || ''}`.trim() : 'Anonymous',
                    d.email || 'N/A',
                    d.is_recurring ? 'Recurring' : 'One-time',
                    `PHP ${Number(d.total_donated || 0).toLocaleString()}`,
                    d.donation_count || 0,
                    fmtDate(d.last_donation_at)
                ]),
                startY: 40,
                headStyles: { fillColor: [99, 166, 178], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 250, 251] },
            });
            doc.save(`donors-report-${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Donors report exported!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to export PDF');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafb]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#63A6B2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading donors...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
            <AdminSidebar activePage="donors" mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            <main className="flex-1 overflow-y-auto">
                <AdminHeader
                    title="Donor Management"
                    subtitle="Manage and track your donors"
                    onMobileMenuClick={() => setMobileMenuOpen(true)}
                >
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 border-2 border-[#63A6B2] text-[#63A6B2] rounded-lg font-semibold hover:bg-[#63A6B2] hover:text-white transition flex items-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                    <button
                        onClick={() => toast.info('Donor creation is handled via registration.')}
                        className="bg-[#63A6B2] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#4d8b96] transition flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Donor</span>
                    </button>
                </AdminHeader>

                <div className="p-4 lg:p-8">
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard icon={<Users className="w-6 h-6 text-white" />} iconBg="from-[#63A6B2] to-[#4d8b96]" title="Total Donors" value={stats.totalDonors || 0} />
                        <StatCard icon={<UserCheck className="w-6 h-6 text-white" />} iconBg="from-green-500 to-green-400" title="Active (Last 12 mo)" value={stats.activeDonors || 0} />
                        <StatCard icon={<RefreshCw className="w-6 h-6 text-white" />} iconBg="from-blue-500 to-blue-400" title="Recurring" value={stats.recurringDonors || 0} />
                        <StatCard icon={<DollarSign className="w-6 h-6 text-white" />} iconBg="from-purple-500 to-purple-400" title="Lifetime Value" value={formatCurrency(stats.totalLifetimeDonations)} />
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <select
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] bg-white text-sm"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="All">All Types</option>
                                <option value="Recurring">Recurring</option>
                                <option value="One-time">One-time</option>
                            </select>
                            <select
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] bg-white text-sm"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="donations">Highest Donation</option>
                                <option value="newest">Most Recent</option>
                                <option value="name">Name A–Z</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Donor</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Type</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Total Donated</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Donations</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Last Donation</th>
                                        <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedDonors.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center">
                                                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                <p className="text-gray-500 font-semibold">No donors found</p>
                                                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedDonors.map((donor, idx) => {
                                            const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                                            const initials = getInitials(donor.first_name, donor.last_name);
                                            const isRecurring = donor.is_recurring === true;
                                            return (
                                                <tr key={donor.donor_id} className="hover:bg-gray-50 transition">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm`}>
                                                                {initials || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{donor.first_name || donor.last_name ? `${donor.first_name || ''} ${donor.last_name || ''}`.trim() : 'Anonymous'}</p>
                                                                <p className="text-xs text-gray-500">{donor.email || 'No email'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isRecurring ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                            {isRecurring ? 'Recurring' : 'One-time'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 font-bold text-gray-900">{formatCurrency(donor.total_donated)}</td>
                                                    <td className="py-4 px-6 text-gray-700">{donor.donation_count}</td>
                                                    <td className="py-4 px-6 text-sm text-gray-500">{fmtDate(donor.last_donation_at)}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-end">
                                                            <button
                                                                onClick={() => openViewModal(donor)}
                                                                className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between bg-gray-50 gap-4">
                                <p className="text-sm text-gray-500">
                                    Showing <span className="font-semibold">{indexOfFirstItem + 1}</span> to{' '}
                                    <span className="font-semibold">{Math.min(indexOfLastItem, filteredDonors.length)}</span> of{' '}
                                    <span className="font-semibold">{filteredDonors.length}</span> donors
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >Previous</button>
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${currentPage === pageNum ? 'bg-[#63A6B2] text-white' : 'border border-gray-300 hover:bg-white'}`}
                                            >{pageNum}</button>
                                        );
                                    })}
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* View Donor Modal */}
            {isViewModalOpen && selectedDonor && (
                <ViewDonorModal
                    donor={selectedDonor}
                    history={donorHistory}
                    historyLoading={historyLoading}
                    handleClose={() => { setIsViewModalOpen(false); setSelectedDonor(null); setActiveViewTab('profile'); }}
                    formatCurrency={formatCurrency}
                    fmtDate={fmtDate}
                    activeTab={activeViewTab}
                    setActiveTab={setActiveViewTab}
                />
            )}
        </div>
    );
}

// ─── Stat Card ───────────────────────────────
function StatCard({ icon, iconBg, title, value }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${iconBg} flex items-center justify-center`}>{icon}</div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

// ─── View Donor Modal ────────────────────────
function ViewDonorModal({ donor, history, historyLoading, handleClose, formatCurrency, fmtDate, activeTab, setActiveTab }) {
    const initials = `${donor.first_name?.[0] || ''}${donor.last_name?.[0] || ''}`.toUpperCase();
    const isRecurring = donor.is_recurring === true;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#63A6B2] to-[#4d8b96] p-6 text-white relative">
                    <button onClick={handleClose} className="absolute right-6 top-6 text-white/80 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col md:flex-row items-center gap-6 mt-4">
                        <div className="w-24 h-24 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-4xl font-bold shadow-lg">
                            {initials}
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h3 className="text-3xl font-bold mb-2">{donor.first_name || donor.last_name ? `${donor.first_name || ''} ${donor.last_name || ''}`.trim() : 'Anonymous'}</h3>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-white/90">
                                {donor.email && (
                                    <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm">
                                        <Mail className="w-4 h-4" />{donor.email}
                                    </span>
                                )}
                                {donor.phone && (
                                    <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm">
                                        <Phone className="w-4 h-4" />{donor.phone}
                                    </span>
                                )}
                                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm">
                                    <Calendar className="w-4 h-4" />First: {fmtDate(donor.first_donation_at)}
                                </span>
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${isRecurring ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                            {isRecurring ? 'RECURRING' : 'ONE-TIME'}
                        </span>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 bg-[#f8fafb] border-b border-gray-100">
                    {[
                        { label: 'Total Donated', value: formatCurrency(donor.total_donated) },
                        { label: 'Donations', value: donor.donation_count },
                        { label: 'Avg. Donation', value: formatCurrency((donor.total_donated || 0) / (donor.donation_count || 1)) },
                        { label: 'Last Donation', value: fmtDate(donor.last_donation_at) },
                    ].map((s, i, arr) => (
                        <div key={s.label} className={`p-4 text-center ${i < arr.length - 1 ? 'border-r border-gray-100' : ''}`}>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{s.label}</p>
                            <p className="text-xl font-black text-[#63A6B2]">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex bg-white px-6 border-b border-gray-200">
                    {['profile', 'donations'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === tab ? 'text-[#63A6B2] border-[#63A6B2]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                        >
                            {tab === 'profile' ? 'PROFILE INFORMATION' : 'DONATION HISTORY'}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-8 bg-white">
                    {activeTab === 'profile' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <section>
                                <h5 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Contact Details</h5>
                                <div className="space-y-4">
                                    <InfoRow icon={<Mail className="w-5 h-5 text-[#63A6B2]" />} label="Email" value={donor.email || 'N/A'} />
                                    <InfoRow icon={<Phone className="w-5 h-5 text-[#63A6B2]" />} label="Phone" value={donor.phone || 'N/A'} />
                                    <InfoRow icon={<FileText className="w-5 h-5 text-[#63A6B2]" />} label="Donor Type" value={isRecurring ? 'Recurring (Monthly)' : 'One-time'} />
                                </div>
                            </section>
                            <section>
                                <h5 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Address</h5>
                                <div className="flex items-start gap-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm mt-1">
                                        <MapPin className="w-5 h-5 text-[#63A6B2]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Address on File</p>
                                        <p className="text-gray-900 font-semibold">{donor.address || 'No address provided'}</p>
                                    </div>
                                </div>

                            </section>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Transaction History</h5>
                                <span className="text-xs font-bold text-[#63A6B2] bg-[#63A6B2]/10 px-3 py-1 rounded-full">
                                    {history.length} Records
                                </span>
                            </div>
                            {historyLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-8 h-8 border-4 border-[#63A6B2] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
                                    <p>No donation records found.</p>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#63A6B2]/5 border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaign</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {history.map((row) => (
                                                <tr key={row.donation_id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs text-gray-700">{row.payment_reference || `#${row.donation_id}`}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-700">{row.campaign_name || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-700">{fmtDate(row.initiated_at)}</td>
                                                    <td className="px-6 py-4 font-bold text-[#63A6B2]">{formatCurrency(row.amount)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${row.payment_status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            row.payment_status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                                                                row.payment_status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                                                                                                    'bg-red-100 text-red-700'
                                                            }`}>{row.payment_status || 'pending'}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-[#f8fafb] flex justify-end">
                    <button
                        onClick={handleClose}
                        className="px-8 py-3 bg-[#63A6B2] text-white rounded-xl font-black text-sm hover:bg-[#4d8b96] transition-all shadow-lg"
                    >CLOSE WINDOW</button>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">{icon}</div>
            <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{label}</p>
                <p className="text-gray-900 font-semibold">{value}</p>
            </div>
        </div>
    );
}