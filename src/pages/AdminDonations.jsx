import React, { useState, useEffect } from 'react';
import {
    DollarSign, Search, Menu, Download,
    RefreshCw, Eye, X, CheckCircle, Clock,
    TrendingUp, Users, CreditCard, BarChart3, XCircle, FileText,
    MessageSquare
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

    // view modal
    const [viewDonation, setViewDonation] = useState(null);

    // receipt modal
    const [viewReceiptId, setViewReceiptId] = useState(null);
    const [receiptData, setReceiptData] = useState(null);
    const [isReceiptLoading, setIsReceiptLoading] = useState(false);

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
            data = data.filter(d => (d.payment_status || 'pending') === filterStatus);
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

    // mark as completed
    const handleMarkCompleted = async (donationId) => {
        try {
            const res = await fetch(`/api/donations/${donationId}/complete`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!res.ok) throw new Error();
            toast.success('Donation marked as completed!');
            await fetchAll();
            if (viewDonation?.donation_id === donationId) setViewDonation(null);
        } catch {
            toast.error('Failed to update donation.');
        }
    };

    // mark as cancelled
    const handleMarkCancelled = async (donationId) => {
        try {
            const res = await fetch(`/api/donations/${donationId}/cancel`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!res.ok) throw new Error();
            toast.success('Donation cancelled.');
            await fetchAll();
            if (viewDonation?.donation_id === donationId) setViewDonation(null);
        } catch {
            toast.error('Failed to cancel donation.');
        }
    };

    // fetch receipt details
    const fetchReceiptDetails = async (id) => {
        setIsReceiptLoading(true);
        try {
            const res = await fetch(`/api/donations/${id}`, {
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
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-gray-500 whitespace-nowrap">{fmtShortDate(d.initiated_at)}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => setViewDonation(d)}
                                                                className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </button>
                                                            {status === 'completed' && (
                                                                <button
                                                                    onClick={() => fetchReceiptDetails(d.donation_id)}
                                                                    className="p-2 hover:bg-teal-50 rounded-lg transition text-teal-600"
                                                                    title="View Receipt"
                                                                    disabled={isReceiptLoading && viewReceiptId === d.donation_id}
                                                                >
                                                                    <FileText className={`w-5 h-5 ${isReceiptLoading && viewReceiptId === d.donation_id ? 'animate-pulse' : ''}`} />
                                                                </button>
                                                            )}
                                                            {status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleMarkCompleted(d.donation_id)}
                                                                        className="p-2 hover:bg-green-50 rounded-lg transition text-green-600"
                                                                        title="Mark as Completed"
                                                                    >
                                                                        <CheckCircle className="w-5 h-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleMarkCancelled(d.donation_id)}
                                                                        className="p-2 hover:bg-red-50 rounded-lg transition text-red-500"
                                                                        title="Cancel Donation"
                                                                    >
                                                                        <XCircle className="w-5 h-5" />
                                                                    </button>
                                                                </>
                                                            )}
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

            {/* View Donation Modal */}
            {viewDonation && (
                <ViewDonationModal
                    donation={viewDonation}
                    handleClose={() => setViewDonation(null)}
                    handleMarkCompleted={handleMarkCompleted}
                    handleMarkCancelled={handleMarkCancelled}
                    formatCurrency={formatCurrency}
                    fmtDate={fmtDate}
                />
            )}

            {/* Receipt Modal */}
            {viewReceiptId && receiptData && (
                <ReceiptModal
                    data={receiptData}
                    handleClose={() => { setViewReceiptId(null); setReceiptData(null); }}
                />
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

// ─── Receipt Modal ────────────────────────────
function ReceiptModal({ data: d, handleClose }) {
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
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 800);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const formatCurrency = (amount) => {
        return `₱${parseFloat(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getPaymentMethodName = (method) => {
        const methods = {
            'gcash': 'GCash',
            'paymaya': 'PayMaya',
            'bank': 'Bank Transfer',
            'card': 'Credit/Debit Card'
        };
        return methods[method] || method;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh]">
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#63A6B2]" />
                        Official Receipt Preview
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-[#63A6B2] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#4d8b96] transition shadow-sm"
                        >
                            <Download className="w-4 h-4" /> Download / Print
                        </button>
                        <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100/50">
                    <div ref={printRef} className="bg-white mx-auto shadow-xl rounded-2xl overflow-hidden max-w-3xl text-left border border-gray-200">
                        {/* Receipt Inner Header */}
                        <div className="bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white p-6 md:p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 text-2xl font-bold">SV</div>
                                    <h1 className="text-3xl font-bold mb-2">Official Receipt</h1>
                                    <p className="text-teal-100">Tax Deductible Donation</p>
                                </div>
                                <div className="text-right">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 mb-2">
                                        <p className="text-xs text-teal-100">Receipt No.</p>
                                        <p className="text-xl font-bold">RCP-2026-{String(d.donation_id).padStart(6, '0')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 space-y-8">
                            {/* Organization Information */}
                            <div className="pb-6 border-b-2 border-gray-50">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-[#63A6B2] rounded-full"></div>
                                    Organization Information
                                </h2>
                                <div className="space-y-1 text-sm">
                                    <p className="text-[#63A6B2] font-extrabold text-xl">{d.foundation_name || "Shepherd's Voice Radio and Television Foundation, Inc."}</p>
                                    <p className="text-gray-600">456 Faith Avenue, Manila, Metro Manila 1003</p>
                                    <p className="text-gray-600">Phone: (02) 1234-5678</p>
                                    <p className="text-gray-600">Email: info@svrtf.org</p>
                                    <p className="text-gray-600">Website: www.svrtf.org</p>
                                    <p className="text-gray-600 font-medium">TIN: 000-123-456-000</p>
                                </div>
                            </div>

                            {/* Donor Information */}
                            <div className="pb-6 border-b-2 border-gray-50 text-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-[#63A6B2] rounded-full"></div>
                                    Donor Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Full Name</p>
                                        <p className="text-gray-900 font-bold text-base">{d.donor_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">TIN Number</p>
                                        <p className="text-gray-900 font-bold text-base">123-456-789-000</p>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Address</p>
                                        <p className="text-gray-900 font-medium">{d.address || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Email Address</p>
                                        <p className="text-gray-900 font-medium">{d.donor_email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Contact Number</p>
                                        <p className="text-gray-900 font-medium">{d.donor_phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Donation Details */}
                            <div className="pb-6 border-b-2 border-gray-50 text-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-[#63A6B2] rounded-full"></div>
                                    Donation Details
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Date & Time</p>
                                        <p className="text-gray-900 font-bold">{formatDateTime(d.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Reference Number</p>
                                        <p className="text-gray-900 font-bold font-mono">DON-2026-{String(d.donation_id).padStart(6, '0')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Campaign Purpose</p>
                                        <p className="text-[#63A6B2] font-bold">{d.campaign_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Payment Method</p>
                                        <p className="text-gray-900 font-bold">{getPaymentMethodName(d.payment_method)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Donation Type</p>
                                        <p className="text-gray-900 font-bold">{d.donation_type === 'monthly' ? 'Monthly (Recurring)' : 'One-Time'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Transaction ID</p>
                                        <p className="text-gray-900 font-mono italic">{d.payment_reference || `TXN-${d.donation_id}-MOCK`}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Total Amount */}
                            <div className="pb-6 border-b-2 border-gray-50">
                                <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-br from-teal-50 to-blue-50 p-6 rounded-2xl border-2 border-[#63A6B2] gap-4">
                                    <span className="text-xl font-bold text-gray-900">TOTAL DONATION AMOUNT:</span>
                                    <span className="text-5xl font-black text-[#63A6B2] drop-shadow-sm">{formatCurrency(d.amount)}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 text-right mt-3 italic font-semibold uppercase tracking-widest">Confirmed & Verified Transaction</p>
                            </div>

                            {/* Tax Deductible Info */}
                            <div className="pb-6 border-b-2 border-gray-50">
                                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
                                    <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-orange-600" />
                                        Tax Deductible Information
                                    </h3>
                                    <p className="text-xs text-orange-900 leading-relaxed font-medium">
                                        This donation is <strong>tax deductible</strong> under the laws of the Republic of the Philippines. Please retain this receipt for your tax filing purposes. Shepherd's Voice Radio and Television Foundation, Inc. is a registered non-profit organization accredited by the Bureau of Internal Revenue (BIR).
                                    </p>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="pb-6 border-b-2 border-gray-50 space-y-4 font-sm text-gray-700">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-[#63A6B2]" />
                                    Notes & Recognition
                                </h3>
                                {d.message ? (
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm">
                                        <p className="text-[10px] font-black text-[#63A6B2] mb-2 uppercase tracking-widest">Donor Message:</p>
                                        <p className="text-sm italic leading-relaxed text-gray-800 font-medium">"{d.message}"</p>
                                    </div>
                                ) : null}
                                <p className="text-xs italic text-gray-500 leading-relaxed">
                                    Thank you for your generosity. Your contribution helps us continue our mission to reach hearts and change lives through media ministry. This receipt serves as your official acknowledgment.
                                </p>
                            </div>

                            {/* Signatures */}
                            <div className="grid grid-cols-2 gap-12 pb-8 pt-4">
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 tracking-widest">Prepared by:</p>
                                    <div className="border-b-2 border-gray-200 h-12 w-full max-w-[200px] mb-3 relative">
                                        <div className="absolute -bottom-2 left-0 right-0 h-10 italic text-[#63A6B2]/20 font-serif text-2xl select-none pointer-events-none">Digital Signature</div>
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">Finance Department</p>
                                    <p className="text-[10px] text-gray-500 font-medium">SVRTF, Inc.</p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-4 tracking-widest">Authorized by:</p>
                                    <div className="border-b-2 border-gray-200 h-12 w-full max-w-[200px] mb-3 relative">
                                        <div className="absolute -bottom-2 left-0 right-0 h-10 italic text-[#63A6B2]/20 font-serif text-2xl select-none pointer-events-none">Digital Signature</div>
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">Executive Director</p>
                                    <p className="text-[10px] text-gray-500 font-medium">SVRTF, Inc.</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center pt-8 border-t border-gray-100">
                                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                                <p className="text-base font-black text-[#63A6B2] mb-2 tracking-tight">Your support makes a difference!</p>
                                <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                    This is a computer-generated receipt valid for tax deduction purposes.<br />
                                    Secured & Verified Transaction | © 2026 Shepherd's Voice Radio and Television Foundation, Inc.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── View Donation Modal ──────────────────────
function ViewDonationModal({ donation: d, handleClose, handleMarkCompleted, handleMarkCancelled, formatCurrency, fmtDate }) {
    const status = d.payment_status || 'pending';
    const donorName = d.first_name ? `${d.first_name} ${d.last_name}` : 'Anonymous';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#63A6B2] to-[#4d8b96] p-6 text-white relative">
                    <button onClick={handleClose} className="absolute right-6 top-6 text-white/80 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                    <p className="text-sm text-white/70 mb-1">Donation Details</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(d.amount)}</h3>
                    <p className="text-white/80 mt-1 font-mono text-sm">{d.payment_reference || `Donation #${d.donation_id}`}</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <DetailRow label="Donor" value={donorName} />
                        <DetailRow label="Campaign" value={d.campaign_name || 'N/A'} />
                        <DetailRow label="Amount" value={formatCurrency(d.amount)} />
                        <DetailRow label="Currency" value={d.currency || 'PHP'} />
                        <DetailRow label="Payment Method" value={d.payment_method || 'N/A'} />
                        <DetailRow label="Frequency" value={d.frequency === 'monthly' ? 'Monthly' : 'One-time'} />
                        <DetailRow label="Initiated" value={fmtDate(d.initiated_at)} />
                        <DetailRow label="Completed" value={fmtDate(d.completed_at)} />
                        <div className="col-span-2">
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Status</p>
                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>
                        </div>
                        {d.message && (
                            <div className="col-span-2">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Message</p>
                                <p className="text-gray-700 text-sm italic bg-gray-50 p-3 rounded-lg border border-gray-100">"{d.message}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-[#f8fafb] flex gap-3 justify-end">
                    {status === 'pending' && (
                        <>
                            <button
                                onClick={() => handleMarkCancelled(d.donation_id)}
                                className="px-6 py-2 bg-red-100 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-200 transition flex items-center gap-2"
                            >
                                <XCircle className="w-4 h-4" /> Cancel
                            </button>
                            <button
                                onClick={() => handleMarkCompleted(d.donation_id)}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> Mark Completed
                            </button>
                        </>
                    )}
                    {status === 'completed' && (
                        <button
                            onClick={() => fetchReceiptDetails(d.donation_id)}
                            className="px-6 py-2 bg-teal-100 text-teal-700 rounded-lg font-semibold text-sm hover:bg-teal-200 transition flex items-center gap-2"
                            disabled={isReceiptLoading}
                        >
                            <FileText className="w-4 h-4" /> {isReceiptLoading ? 'Loading...' : 'View Receipt'}
                        </button>
                    )}
                    <button
                        onClick={handleClose}
                        className="px-8 py-2 bg-[#63A6B2] text-white rounded-lg font-bold text-sm hover:bg-[#4d8b96] transition"
                    >Close</button>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div>
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">{label}</p>
            <p className="text-gray-900 font-semibold text-sm">{value}</p>
        </div>
    );
}