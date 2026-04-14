import React, { useState, useEffect } from 'react';
import {
    CreditCard, Search, Calendar, Download,
    ChevronLeft, ChevronRight, RefreshCw,
    CheckCircle, XCircle, Clock, TrendingUp, AlertCircle,
    Eye, X, FileText, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

function StatCard({ icon, iconBg, title, value }) {
    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-start gap-4 transition-all hover:border-[#63A6B2]/30 hover:shadow-md">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${iconBg}`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
        </div>
    );
}

const STATUS_CONFIG = {
    completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
    pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', ring: 'ring-amber-200' },
    failed: { label: 'Failed', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', ring: 'ring-red-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', ring: 'ring-gray-200' },
};

function StatusPill({ status }) {
    const cfg = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

const STATUS_SELECT_EMOJIS = {
    pending: '⏳', completed: '✅', failed: '❌', cancelled: '🚫'
};

function StatusSwitcher({ current, onUpdate, id, editingRowId, setEditingRowId }) {
    const [selected, setSelected] = useState(current?.toLowerCase() || 'pending');

    useEffect(() => {
        setSelected(current?.toLowerCase() || 'pending');
    }, [current]);

    const isEditing = editingRowId === id;
    const isOtherEditing = editingRowId !== null && editingRowId !== id;
    const isChanged = selected !== (current?.toLowerCase() || 'pending');

    // Auto-revert if another row starts editing while we have unsaved changes
    useEffect(() => {
        if (isOtherEditing && isChanged) {
            setSelected(current?.toLowerCase() || 'pending');
        }
    }, [isOtherEditing, isChanged, current]);

    const cfg = STATUS_CONFIG[selected] || STATUS_CONFIG.pending;

    const handleSelectChange = (e) => {
        const newVal = e.target.value;
        setSelected(newVal);
        if (newVal !== (current?.toLowerCase() || 'pending')) {
            setEditingRowId(id);
        } else {
            setEditingRowId(null);
        }
    };

    const handleCancel = () => {
        setSelected(current?.toLowerCase() || 'pending');
        setEditingRowId(null);
    };

    const handleSave = () => {
        onUpdate(selected);
        setEditingRowId(null);
    };

    return (
        <div className="flex items-center gap-2 relative w-[max-content]">
            <select
                value={selected}
                onChange={handleSelectChange}
                disabled={isOtherEditing}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#63A6B2]/50 transition-all ${isOtherEditing ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${cfg.bg} ${cfg.text} ${cfg.ring}`}
                title={isOtherEditing ? "Save or cancel the current edit first" : "Change status"}
            >
                <option className="font-sans" value="pending">{STATUS_SELECT_EMOJIS.pending} Pending</option>
                <option className="font-sans" value="completed">{STATUS_SELECT_EMOJIS.completed} Completed</option>
                <option className="font-sans" value="failed">{STATUS_SELECT_EMOJIS.failed} Failed</option>
                <option className="font-sans" value="cancelled">{STATUS_SELECT_EMOJIS.cancelled} Cancelled</option>
            </select>

            {isChanged && isEditing && (
                <div className="absolute left-full ml-2 flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                    <button
                        onClick={handleSave}
                        className="px-2 py-1 bg-[#63A6B2] text-white rounded-full text-[10px] font-bold hover:bg-[#4a8a95] transition-all active:scale-95 shadow-sm whitespace-nowrap"
                        title="Apply status change"
                    >
                        Save
                    </button>
                    <button
                        onClick={handleCancel}
                        className="px-2 py-1 bg-white text-gray-500 rounded-full text-[10px] font-bold border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                        title="Cancel edit"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}


function CompleteTransactionModal({ txn, onClose, onConfirm }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            if (selected.type.startsWith('image/')) {
                setPreview(URL.createObjectURL(selected));
            } else {
                setPreview('pdf');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 transform transition-all duration-300 scale-100 opacity-100">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Complete Transaction</h2>
                <p className="text-sm text-gray-500 mb-6 text-center">
                    Upload a receipt image for <span className="font-semibold text-gray-700">{txn.reference_number || `#${txn.transaction_id}`}</span> from <span className="font-semibold text-gray-700">{txn.donor_name || 'Anonymous'}</span>.
                </p>

                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Receipt Upload (Optional)</label>
                    <div className="flex flex-col items-center gap-3">
                        {preview ? (
                            <div className="relative w-full h-32 border-2 border-gray-200 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50">
                                {preview === 'pdf' ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <FileText className="w-10 h-10 text-red-500" />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase truncate max-w-[200px]">{file?.name}</span>
                                    </div>
                                ) : (
                                    <img src={preview} alt="Receipt preview" className="w-full h-full object-cover" />
                                )}
                                <button
                                    onClick={() => { setFile(null); setPreview(null); }}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="w-full cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-emerald-500 transition-colors h-32 rounded-xl bg-gray-50 hover:bg-emerald-50/30">
                                <FileText className="w-6 h-6 text-gray-400 mb-2" />
                                <div className="text-center">
                                    <span className="text-sm text-gray-700 font-bold block">Click to upload receipt</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Image or PDF supported</span>
                                </div>
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                            </label>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(file)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition active:scale-95 shadow-sm shadow-emerald-500/30"
                    >
                        Mark as Completed
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [viewDonation, setViewDonation] = useState(null);
    const [editingRowId, setEditingRowId] = useState(null);
    const [statusConfirmModal, setStatusConfirmModal] = useState(null); // { txn, status }
    const [completeModalTransaction, setCompleteModalTransaction] = useState(null);
    const [summaryStats, setSummaryStats] = useState({
        pending: 0,
        totalAmount: 0
    });

    // receipt modal states
    const [viewReceiptId, setViewReceiptId] = useState(null);
    const [receiptData, setReceiptData] = useState(null);
    const [isReceiptLoading, setIsReceiptLoading] = useState(false);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit, search, startDate });
            if (statusFilter) params.append('status', statusFilter);
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/transactions?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setTransactions(data.transactions || []);
            setTotal(data.total || 0);
            if (data.stats) {
                setSummaryStats(data.stats);
            }
        } catch {
            toast.error('Failed to load transactions');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const executeStatusUpdate = async (txnId, newStatus, file = null) => {
        try {
            const token = localStorage.getItem('token');
            const url = `/api/transactions/${txnId}/status`;

            let res;
            if (file) {
                const formData = new FormData();
                formData.append('status', newStatus);
                formData.append('receipt_image', file);
                res = await fetch(url, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
            } else {
                res = await fetch(url, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ status: newStatus })
                });
            }

            if (!res.ok) throw new Error();
            toast.success(`Marked as ${newStatus}`);
            // Force refetch to ensure new receipt/status is updated locally
            fetchTransactions();

            setStatusConfirmModal(null);
            setCompleteModalTransaction(null);
        } catch {
            toast.error('Failed to update status');
        }
    };

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

    const updateStatus = (txnId, newStatus) => {
        const txn = transactions.find(t => t.transaction_id === txnId);
        if (['pending', 'failed', 'cancelled'].includes(newStatus)) {
            setStatusConfirmModal({ txn, status: newStatus });
        } else if (newStatus === 'completed') {
            setCompleteModalTransaction(txn);
        } else {
            executeStatusUpdate(txnId, newStatus);
        }
    };

    const handleExport = () => {
        if (!transactions.length) { toast.error('No transactions to export'); return; }
        setIsExporting(true);
        try {
            const headers = ['ID', 'Date', 'Donor', 'Amount', 'Method', 'Reference', 'Status'];
            const rows = transactions.map(t => [
                t.transaction_id,
                new Date(t.created_at).toLocaleString(),
                `"${t.donor_name || 'Anonymous'}"`,
                t.amount,
                t.payment_method || 'N/A',
                t.reference_number || 'N/A',
                t.status
            ].join(','));
            const csv = [headers.join(','), ...rows].join('\n');
            const link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(new Blob([csv], { type: 'text/csv' })));
            link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            toast.success('Exported!');
        } finally { setIsExporting(false); }
    };



    useEffect(() => { fetchTransactions(); }, [page, statusFilter, startDate]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Stats are now fetched from backend to show totals across all pages
    const stats = summaryStats;

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
            <AdminSidebar activePage="transactions" />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    <AdminHeader
                        title="Transaction Tracking"
                        subtitle="Track and manage all payment transactions"
                    >
                        <button
                            onClick={() => { setPage(1); fetchTransactions(); }}
                            className="px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting || !transactions.length}
                            className="px-4 py-2 border-2 border-[#63A6B2] text-[#63A6B2] rounded-lg font-semibold hover:bg-[#63A6B2] hover:text-white transition flex items-center gap-2 disabled:opacity-50"
                        >
                            <Download className="w-5 h-5" />
                            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
                        </button>
                    </AdminHeader>

                    <div className="p-4 lg:p-8">
                        <div className="w-full space-y-6">

                            {/* Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard icon={<TrendingUp className="w-6 h-6 text-white" />} iconBg="from-[#63A6B2] to-[#4d8b96]" title="Total Amount" value={`₱${stats.totalAmount.toLocaleString()}`} />
                                <StatCard icon={<CreditCard className="w-6 h-6 text-white" />} iconBg="from-purple-500 to-purple-400" title="Total Transactions" value={total} />
                                <StatCard icon={<CheckCircle className="w-6 h-6 text-white" />} iconBg="from-green-500 to-green-400" title="Completed" value={stats.completed || 0} />
                                <StatCard icon={<Clock className="w-6 h-6 text-white" />} iconBg="from-yellow-500 to-yellow-400" title="Pending" value={stats.pending || 0} />
                            </div>

                            {/* Filters */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="relative sm:col-span-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input
                                            type="text"
                                            placeholder="Search donor or reference..."
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && fetchTransactions()}
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/10 transition"
                                        />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        {['', 'pending', 'completed', 'failed', 'cancelled'].map(s => {
                                            const labels = { '': 'All', pending: 'Pending', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled' };
                                            const active = statusFilter === s;
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => { setStatusFilter(s); setPage(1); }}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${active ? 'bg-[#63A6B2] text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                >
                                                    {labels[s]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => { setStartDate(e.target.value); setPage(1); }}
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Table */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Donor</th>
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Method</th>
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Reference</th>
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {loading ? (
                                                [...Array(5)].map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-32" /></td>
                                                        <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                                                        <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                                                        <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-28" /></td>
                                                        <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                                                        <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                                                        <td className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-16 ml-auto" /></td>
                                                    </tr>
                                                ))
                                            ) : transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="py-16 text-center">
                                                        <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                                        <p className="text-gray-500 font-semibold">No transactions found</p>
                                                        <p className="text-sm text-gray-400">Try adjusting your filters</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                transactions.map(txn => (
                                                    <tr key={txn.transaction_id} className="hover:bg-gray-50 transition">
                                                        <td className="py-4 px-6">
                                                            <p className="font-semibold text-gray-900 text-sm">{txn.donor_name || 'Anonymous'}</p>
                                                        </td>
                                                        <td className="py-4 px-6 font-bold text-gray-900">
                                                            ₱{parseFloat(txn.amount || 0).toLocaleString()}
                                                        </td>
                                                        <td className="py-4 px-6 text-sm text-gray-600 capitalize">
                                                            {txn.payment_method || 'N/A'}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="text-xs text-gray-500 font-mono">{txn.reference_number || '—'}</span>
                                                        </td>
                                                        <td className="py-4 px-6 text-sm text-gray-500 whitespace-nowrap">
                                                            <p className="font-medium text-gray-700">{new Date(txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                            <p className="text-xs text-gray-400">{new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <StatusSwitcher
                                                                current={txn.status}
                                                                onUpdate={(s) => updateStatus(txn.transaction_id, s)}
                                                                id={txn.transaction_id}
                                                                editingRowId={editingRowId}
                                                                setEditingRowId={setEditingRowId}
                                                            />
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => setViewDonation(txn)}
                                                                    className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-500"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                {txn.status === 'completed' && (
                                                                    <button
                                                                        onClick={() => fetchReceiptDetails(txn.donation_id || txn.transaction_id)}
                                                                        className="p-2 hover:bg-teal-50 rounded-lg transition text-teal-600"
                                                                        title="View Receipt"
                                                                        disabled={isReceiptLoading && viewReceiptId === (txn.donation_id || txn.transaction_id)}
                                                                    >
                                                                        <FileText className={`w-4 h-4 ${isReceiptLoading && viewReceiptId === (txn.donation_id || txn.transaction_id) ? 'animate-pulse' : ''}`} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {total > limit && (
                                    <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between bg-gray-50 gap-4">
                                        <p className="text-sm text-gray-500">
                                            Showing <span className="font-semibold">{(page - 1) * limit + 1}</span> to{' '}
                                            <span className="font-semibold">{Math.min(page * limit, total)}</span> of{' '}
                                            <span className="font-semibold">{total}</span> transactions
                                        </p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition">
                                                Previous
                                            </button>
                                            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                                                const p = i + 1;
                                                return (
                                                    <button key={p} onClick={() => setPage(p)}
                                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${page === p ? 'bg-[#63A6B2] text-white' : 'border border-gray-300 hover:bg-white'}`}>
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition">
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </main>
            </div>

            {viewDonation && (
                <ViewDonationModal
                    donation={viewDonation}
                    handleClose={() => setViewDonation(null)}
                />
            )}

            {statusConfirmModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 text-center transform transition-all duration-300 scale-100 opacity-100">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                            statusConfirmModal.status === 'cancelled' ? 'bg-gray-100' :
                            statusConfirmModal.status === 'failed' ? 'bg-red-100' : 'bg-amber-100'
                        }`}>
                            {statusConfirmModal.status === 'cancelled' && <XCircle className="w-8 h-8 text-gray-500" />}
                            {statusConfirmModal.status === 'failed' && <AlertCircle className="w-8 h-8 text-red-500" />}
                            {statusConfirmModal.status === 'pending' && <Clock className="w-8 h-8 text-amber-500" />}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {statusConfirmModal.status === 'cancelled' ? 'Cancel Transaction?' : 
                             statusConfirmModal.status === 'failed' ? 'Mark as Failed?' : 'Mark as Pending?'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to change the status of transaction <span className="font-semibold text-gray-700">{statusConfirmModal.txn.reference_number || `#${statusConfirmModal.txn.transaction_id}`}</span> to <span className="font-bold capitalize">{statusConfirmModal.status}</span>?
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setStatusConfirmModal(null)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition active:scale-95"
                            >
                                No, Keep it
                            </button>
                            <button
                                onClick={() => executeStatusUpdate(statusConfirmModal.txn.transaction_id, statusConfirmModal.status)}
                                className={`px-5 py-2.5 rounded-xl text-white font-bold text-sm transition active:scale-95 shadow-sm ${
                                    statusConfirmModal.status === 'cancelled' ? 'bg-gray-600 hover:bg-gray-700' :
                                    statusConfirmModal.status === 'failed' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 
                                    'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                                }`}
                            >
                                Yes, Update it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {completeModalTransaction && (
                <CompleteTransactionModal
                    txn={completeModalTransaction}
                    onClose={() => setCompleteModalTransaction(null)}
                    onConfirm={(file) => executeStatusUpdate(completeModalTransaction.transaction_id, 'completed', file)}
                />
            )}

            {viewReceiptId && receiptData && (
                <ReceiptModal
                    data={receiptData}
                    handleClose={() => { setViewReceiptId(null); setReceiptData(null); }}
                />
            )}
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
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#63A6B2]" />
                            {d.receipt_upload ? 'Uploaded Receipt' : 'Official Receipt Preview'}
                        </h3>
                        {d.receipt_upload && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-7">Admin Uploaded</span>}
                    </div>
                    <div className="flex gap-2">
                        {d.receipt_upload ? (
                            <a
                                href={`http://localhost:5000${d.receipt_upload}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#63A6B2] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#4d8b96] transition shadow-sm"
                            >
                                <Download className="w-4 h-4" /> {d.receipt_upload.toLowerCase().endsWith('.pdf') ? 'Download PDF' : 'View Full Image'}
                            </a>
                        ) : (
                            <button
                                onClick={handlePrint}
                                className="bg-[#63A6B2] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#4d8b96] transition shadow-sm"
                            >
                                <Download className="w-4 h-4" /> Download / Print
                            </button>
                        )}
                        <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 flex flex-col h-full">
                    {d.receipt_upload ? (
                        <div className="mx-auto w-full h-full flex flex-col flex-1">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center w-full h-full flex-1">
                                <div className="w-full mb-4 flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 shrink-0">
                                    <p className="text-sm font-bold text-gray-500">
                                        REFERENCE: <span className="font-mono text-[#63A6B2] bg-white px-2 py-0.5 rounded border border-[#63A6B2]/20">{d.payment_reference || `#${d.donation_id}`}</span>
                                    </p>
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-tighter">
                                        DONOR: <span className="text-gray-900">{d.donor_name}</span>
                                    </p>
                                </div>
                                
                                {d.receipt_upload.toLowerCase().endsWith('.pdf') ? (
                                    <div className="w-full h-full flex-1 bg-gray-900/5 rounded-xl overflow-hidden border border-gray-200 relative group min-h-[500px]">
                                        <iframe 
                                            src={`http://localhost:5000${d.receipt_upload}`} 
                                            className="w-full h-full border-none block"
                                            title="Receipt PDF"
                                        />
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <p className="text-white font-bold bg-[#63A6B2] px-6 py-2 rounded-full shadow-2xl shadow-[#63A6B2]/40 text-sm whitespace-nowrap">Viewing Secure PDF Receipt</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full flex-1 flex flex-col items-center justify-center overflow-hidden">
                                        <img
                                            src={`http://localhost:5000${d.receipt_upload}`}
                                            alt="Uploaded Receipt"
                                            className="max-h-full max-w-full rounded-xl shadow-inner border border-gray-100 cursor-zoom-in object-contain shadow-2xl"
                                            onClick={() => window.open(`http://localhost:5000${d.receipt_upload}`, '_blank')}
                                        />
                                    </div>
                                )}
                                
                                <div className="mt-4 w-full p-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 shrink-0">
                                    <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                        Authorized Document Upload
                                        <span className="mx-2 text-gray-200">|</span>
                                        {d.receipt_upload.toLowerCase().endsWith('.pdf') ? 'Interactive Viewer' : 'Click to View Full Image'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div ref={printRef} className="bg-white mx-auto shadow-xl rounded-2xl overflow-hidden max-w-3xl text-left border border-gray-200">
                            {/* Receipt Inner Header */}
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
                                        {d.receipt_number && (
                                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                                                <p className="text-xs text-teal-100">Receipt No.</p>
                                                <p className="text-xl font-bold">{d.receipt_number}</p>
                                            </div>
                                        )}
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
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── View Donation Modal ──────────────────────
function ViewDonationModal({ donation: d, handleClose }) {
    const status = d.status || 'pending';
    const donorName = d.donor_name || 'Anonymous';

    const formatCurrency = (v) => {
        if (v === undefined || v === null || isNaN(v)) return '₱0';
        return '₱' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    };

    const fmtDate = (iso) => {
        if (!iso) return 'N/A';
        return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const STATUS_STYLES = {
        completed: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        failed: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-100 text-gray-600',
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#63A6B2] to-[#4d8b96] p-6 text-white relative text-left">
                    <button onClick={handleClose} className="absolute right-6 top-6 text-white/80 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                    <p className="text-sm text-white/70 mb-1">Donation Details</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(d.amount)}</h3>
                    <p className="text-white/80 mt-1 font-mono text-sm">{d.reference_number || `Donation #${d.donation_id}`}</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 text-left">
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
                        {d.receipt_upload && (
                            <div className="col-span-2 mt-2 border-t pt-4">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Uploaded Receipt</p>
                                <a href={`http://localhost:5000${d.receipt_upload}`} target="_blank" rel="noopener noreferrer">
                                    <div className="h-48 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center hover:border-[#63A6B2] transition">
                                        <img src={`http://localhost:5000${d.receipt_upload}`} alt="Receipt" className="max-h-full max-w-full object-contain" />
                                    </div>
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-[#f8fafb] flex gap-3 justify-end">
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
