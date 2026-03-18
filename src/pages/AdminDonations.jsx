import React, { useState, useEffect } from 'react';
import {
    DollarSign, Search, Menu, Download,
    RefreshCw, Eye, X, CheckCircle, Clock,
    TrendingUp, Users, CreditCard, BarChart3, XCircle, FileText,
    MessageSquare, Pencil, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatCurrency = (v) => {
    if (v === undefined || v === null || isNaN(v)) return '₱0';
    return '₱' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 });
};

const fmtDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmtShortDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const STATUS_STYLES = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
    pending_cancellation: 'bg-orange-100 text-orange-700',
};

export default function AdminDonations() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterFreq, setFilterFreq] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);

    // data
    const [donations, setDonations] = useState([]);
    const [filteredDonations, setFiltered] = useState([]);
    const [stats, setStats] = useState({
        total_donations: 0,
        total_amount: 0,
        pending_count: 0,
        completed_count: 0,
        cancelled_count: 0,
        unique_donors: 0,
        avg_donation: 0,
    });



    // edit modal
    const [editDonation, setEditDonation] = useState(null);

    // delete confirm
    const [deleteConfirm, setDeleteConfirm] = useState(null); // holds donation object

    // approve cancel confirm
    const [approveCancelConfirm, setApproveCancelConfirm] = useState(null); // holds donation object


    useEffect(() => { fetchAll(); }, []);

    useEffect(() => {
        let data = [...donations];
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            data = data.filter(d =>
                (d.first_name + ' ' + d.last_name).toLowerCase().includes(q) ||
                (d.payment_reference || '').toLowerCase().includes(q) ||
                (d.campaign_name || '').toLowerCase().includes(q)
            );
        }
        if (filterStatus !== 'All') {
            data = data.filter(d => 
                filterStatus === 'pending_cancellation' 
                ? d.status === 'pending_cancellation' 
                : (d.payment_status || 'pending') === filterStatus
            );
        }
        if (filterFreq !== 'All') {
            data = data.filter(d => d.frequency === (filterFreq === 'Monthly' ? 'monthly' : 'one_time'));
        }
        data.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.initiated_at) - new Date(a.initiated_at);
            if (sortBy === 'oldest') return new Date(a.initiated_at) - new Date(b.initiated_at);
            if (sortBy === 'highest') return b.amount - a.amount;
            if (sortBy === 'lowest') return a.amount - b.amount;
            return 0;
        });
        setFiltered(data);
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterFreq, sortBy, donations]);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [donRes, statRes] = await Promise.all([
                fetch('/api/donations/all', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                fetch('/api/donations/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
            ]);
            if (!donRes.ok) throw new Error('Failed to fetch donations');
            if (!statRes.ok) throw new Error('Failed to fetch stats');
            const [donData, statData] = await Promise.all([donRes.json(), statRes.json()]);
            setDonations(donData);
            setStats(statData);
        } catch (err) {
            console.error(err);
            toast.error('Could not load donations. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // mark as completed - kept for payment gateway flow compatibility
    const handleMarkCompleted = async (donationId) => {
        try {
            const res = await fetch(`/api/donations/${donationId}/complete`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!res.ok) throw new Error();
            toast.success('Donation marked as completed!');
            await fetchAll();

        } catch {
            toast.error('Failed to update donation.');
        }
    };

    const handleApproveCancellation = async (donationId) => {
        setApproveCancelConfirm(donations.find(d => d.donation_id === donationId));
    };

    const confirmApproveCancellation = async () => {
        const donationId = approveCancelConfirm?.donation_id;
        if (!donationId) return;
        try {
            const res = await fetch(`/api/donations/${donationId}/approve-cancellation`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!res.ok) throw new Error();
            toast.success('Cancellation approved.');
            setApproveCancelConfirm(null);
            await fetchAll();
        } catch {
            toast.error('Failed to approve cancellation.');
        }
    };

    // Edit donation
    const handleEdit = async (donationId, formData) => {
        try {
            const res = await fetch(`/api/donations/${donationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error();
            toast.success('Donation updated!');
            setEditDonation(null);
            await fetchAll();
        } catch {
            toast.error('Failed to update donation.');
        }
    };

    // Delete donation
    const handleDelete = async (donationId) => {
        try {
            const res = await fetch(`/api/donations/${donationId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error();
            toast.success('Donation deleted.');
            setDeleteConfirm(null);

            await fetchAll();
        } catch {
            toast.error('Failed to delete donation.');
        }
    };

    // export PDF
    const handleExportPDF = () => {
        try {
            const doc = new jsPDF({ orientation: 'landscape' });
            doc.setFontSize(18);
            doc.setTextColor(99, 166, 178);
            doc.text("Shepherd's Voice - Donations Report", 14, 18);
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleDateString()}   Total: ${filteredDonations.length} records   Amount: PHP ${Number(stats.total_amount).toLocaleString()}`, 14, 25);
            autoTable(doc, {
                head: [["#", "Donor", "Campaign", "Amount", "Method", "Frequency", "Status", "Date"]],
                body: filteredDonations.map((d, i) => [
                    i + 1,
                    d.first_name ? `${d.first_name} ${d.last_name}` : 'Anonymous',
                    d.campaign_name || 'N/A',
                    `PHP ${Number(d.amount || 0).toLocaleString()}`,
                    d.payment_method || 'N/A',
                    d.frequency === 'monthly' ? 'Monthly' : 'One-time',
                    d.payment_status || 'pending',
                    fmtShortDate(d.initiated_at),
                ]),
                startY: 30,
                headStyles: { fillColor: [99, 166, 178], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
                bodyStyles: { fontSize: 7 },
                alternateRowStyles: { fillColor: [245, 250, 251] },
            });
            doc.save(`donations-report-${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Report exported!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to export PDF');
        }
    };

    // Pagination
    const lastIdx = currentPage * itemsPerPage;
    const firstIdx = lastIdx - itemsPerPage;
    const paginated = filteredDonations.slice(firstIdx, lastIdx);
    const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafb]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#63A6B2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading donations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
            <AdminSidebar activePage="donations" mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="px-4 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-gray-600">
                                    <Menu className="w-6 h-6" />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Donation Tracking</h2>
                                    <p className="text-sm text-gray-500 mt-1">All donations from the database</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={fetchAll}
                                    className="px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="px-4 py-2 border-2 border-[#63A6B2] text-[#63A6B2] rounded-lg font-semibold hover:bg-[#63A6B2] hover:text-white transition flex items-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    <span className="hidden sm:inline">Export</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-8">
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                        <StatCard icon={<DollarSign className="w-6 h-6 text-white" />} iconBg="from-[#63A6B2] to-[#4d8b96]" title="Total Amount" value={formatCurrency(stats.total_amount)} />
                        <StatCard icon={<BarChart3 className="w-6 h-6 text-white" />} iconBg="from-purple-500 to-purple-400" title="Total Donations" value={stats.total_donations || 0} />
                        <StatCard icon={<CheckCircle className="w-6 h-6 text-white" />} iconBg="from-green-500 to-green-400" title="Completed" value={stats.completed_count || 0} />
                        <StatCard icon={<Clock className="w-6 h-6 text-white" />} iconBg="from-yellow-500 to-yellow-400" title="Pending" value={stats.pending_count || 0} />
                        <StatCard icon={<XCircle className="w-6 h-6 text-white" />} iconBg="from-red-500 to-red-400" title="Cancelled" value={stats.cancelled_count || 0} />
                    </div>

                    {/* Summary strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Unique Donors</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.unique_donors || 0}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Average Donation</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avg_donation)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search donor, campaign, reference..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:border-[#63A6B2]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="All">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="pending_cancellation">Pending Cancellation</option>
                            </select>
                            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:border-[#63A6B2]" value={filterFreq} onChange={e => setFilterFreq(e.target.value)}>
                                <option value="All">All Frequency</option>
                                <option value="Monthly">Monthly</option>
                                <option value="One-time">One-time</option>
                            </select>
                            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:border-[#63A6B2]" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="highest">Highest Amount</option>
                                <option value="lowest">Lowest Amount</option>
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
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Campaign</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Method</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Frequency</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center">
                                                <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                <p className="text-gray-500 font-semibold">No donations found</p>
                                                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginated.map((d) => {
                                            const status = d.payment_status || 'pending';
                                            const donorName = d.first_name ? `${d.first_name} ${d.last_name}` : 'Anonymous';
                                            return (
                                                <tr key={d.donation_id} className="hover:bg-gray-50 transition">
                                                    <td className="py-4 px-6">
                                                        <p className="font-semibold text-gray-900 text-sm">{donorName}</p>
                                                        <p className="text-xs text-gray-400 font-mono">{d.payment_reference || `#${d.donation_id}`}</p>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-gray-700 max-w-[160px] truncate">{d.campaign_name || 'N/A'}</td>
                                                    <td className="py-4 px-6 font-bold text-gray-900">{formatCurrency(d.amount)}</td>
                                                    <td className="py-4 px-6 text-sm text-gray-600 capitalize">{d.payment_method || 'N/A'}</td>
                                                    <td className="py-4 px-6">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${d.frequency === 'monthly' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                            {d.frequency === 'monthly' ? 'Monthly' : 'One-time'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${d.status === 'pending_cancellation' ? STATUS_STYLES.pending_cancellation : STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
                                                            {d.status === 'pending_cancellation' ? 'Pending Cancellation' : (d.status === 'cancelled' ? 'Cancelled' : status)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-gray-500 whitespace-nowrap">{fmtShortDate(d.initiated_at)}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {d.status === 'pending_cancellation' && (
                                                                <button
                                                                    onClick={() => handleApproveCancellation(d.donation_id)}
                                                                    className="p-2 hover:bg-green-50 rounded-lg transition text-green-600"
                                                                    title="Approve Cancellation"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => setEditDonation(d)}
                                                                className="p-2 hover:bg-amber-50 rounded-lg transition text-amber-500"
                                                                title="Edit Donation"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm(d)}
                                                                className="p-2 hover:bg-red-50 rounded-lg transition text-red-400"
                                                                title="Delete Donation"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
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

                        {totalPages > 1 && (
                            <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between bg-gray-50 gap-4">
                                <p className="text-sm text-gray-500">
                                    Showing <span className="font-semibold">{firstIdx + 1}</span> to{' '}
                                    <span className="font-semibold">{Math.min(lastIdx, filteredDonations.length)}</span> of{' '}
                                    <span className="font-semibold">{filteredDonations.length}</span> donations
                                </p>
                                <div className="flex gap-2">
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition">
                                        Previous
                                    </button>
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        let pn;
                                        if (totalPages <= 5) pn = i + 1;
                                        else if (currentPage <= 3) pn = i + 1;
                                        else if (currentPage >= totalPages - 2) pn = totalPages - 4 + i;
                                        else pn = currentPage - 2 + i;
                                        return (
                                            <button key={i} onClick={() => setCurrentPage(pn)}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${currentPage === pn ? 'bg-[#63A6B2] text-white' : 'border border-gray-300 hover:bg-white'}`}>
                                                {pn}
                                            </button>
                                        );
                                    })}
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition">
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>



            {/* Edit Donation Modal */}
            {editDonation && (
                <EditDonationModal
                    donation={editDonation}
                    handleClose={() => setEditDonation(null)}
                    handleSave={handleEdit}
                />
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-7 h-7 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Donation?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            This will permanently delete the donation record and its payment transaction. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm.donation_id)}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Cancellation Confirmation */}
            {approveCancelConfirm && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Approve Cancellation?</h3>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            You are about to approve the cancellation request for <span className="font-bold text-gray-700">{approveCancelConfirm.first_name} {approveCancelConfirm.last_name}</span>'s monthly donation of <span className="font-bold text-[#63A6B2]">{formatCurrency(approveCancelConfirm.amount)}</span>. This will stop all future billing.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setApproveCancelConfirm(null)}
                                className="flex-1 px-6 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition active:scale-95">
                                Keep Active
                            </button>
                            <button onClick={confirmApproveCancellation}
                                className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-200 active:scale-95">
                                Approve Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Stat Card ────────────────────────────────
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
// ─── Edit Donation Modal ──────────────────────
function EditDonationModal({ donation, handleClose, handleSave }) {
    const [formData, setFormData] = useState({
        amount: donation.amount || '',
        campaign_id: donation.campaign_id || '',
        frequency: donation.frequency || 'one_time',
        message: donation.message || ''
    });
    const [campaigns, setCampaigns] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch('/api/campaigns/all', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(r => r.json())
            .then(data => setCampaigns(data))
            .catch(err => console.error('Failed to load campaigns', err));
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await handleSave(donation.donation_id, formData);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white relative">
                    <button onClick={handleClose} type="button" className="absolute right-6 top-6 text-white/80 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Pencil className="w-5 h-5" /> Edit Donation
                    </h3>
                    <p className="text-white/80 text-sm mt-1">Ref: {donation.payment_reference || `#${donation.donation_id}`}</p>
                </div>
                
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Amount (PHP)</label>
                        <input 
                            type="number" step="0.01" required
                            value={formData.amount} 
                            onChange={e => setFormData({...formData, amount: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Campaign</label>
                        <select 
                            value={formData.campaign_id || ''} 
                            onChange={e => setFormData({...formData, campaign_id: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        >

                            {campaigns.map(c => (
                                <option key={c.campaign_id} value={c.campaign_id}>{c.title || c.campaign_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Frequency</label>
                        <select 
                            value={formData.frequency} 
                            onChange={e => setFormData({...formData, frequency: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="one_time">One-time</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Message</label>
                        <textarea 
                            rows="3"
                            value={formData.message} 
                            onChange={e => setFormData({...formData, message: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            placeholder="Optional donor message..."
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition disabled:opacity-50">
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}