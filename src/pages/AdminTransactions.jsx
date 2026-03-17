import React, { useState, useEffect } from 'react';
import {
    CreditCard, Search, Calendar, Download,
    ChevronLeft, ChevronRight, RefreshCw,
    CheckCircle, XCircle, Clock, User, TrendingUp,
    Eye, X, FileText, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

const STATUS_CONFIG = {
    completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
    pending:   { label: 'Pending',   bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   ring: 'ring-amber-200' },
    failed:    { label: 'Failed',    bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     ring: 'ring-red-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-gray-100',   text: 'text-gray-500',    dot: 'bg-gray-400',    ring: 'ring-gray-200' },
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

function StatusSwitcher({ current, onUpdate }) {
    const [selected, setSelected] = useState(current?.toLowerCase() || 'pending');

    useEffect(() => {
        setSelected(current?.toLowerCase() || 'pending');
    }, [current]);

    const isChanged = selected !== (current?.toLowerCase() || 'pending');

    return (
        <div className="flex items-center gap-2">
            <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg font-semibold focus:outline-none focus:border-[#63A6B2] focus:ring-1 focus:ring-[#63A6B2] bg-gray-50 text-gray-700 cursor-pointer"
            >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
            </select>
            {isChanged && (
                <button
                    onClick={() => onUpdate(selected)}
                    className="px-2 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-1 active:scale-95"
                    title="Update Status"
                >
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Update</span>
                </button>
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
            setPreview(URL.createObjectURL(selected));
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
                            <div className="relative w-full h-32 border-2 border-gray-200 rounded-xl overflow-hidden">
                                <img src={preview} alt="Receipt preview" className="w-full h-full object-cover" />
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
                                <span className="text-sm text-gray-500">Click to upload receipt</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
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
    const [cancelModalTransaction, setCancelModalTransaction] = useState(null);
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
            
            setCancelModalTransaction(null);
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
        if (newStatus === 'cancelled') {
            const txn = transactions.find(t => t.transaction_id === txnId);
            setCancelModalTransaction(txn);
        } else if (newStatus === 'completed') {
            const txn = transactions.find(t => t.transaction_id === txnId);
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
        <div className="flex h-screen bg-[#F0F4F8]">
            <AdminSidebar activePage="transactions" />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AdminHeader />

                <main className="flex-1 overflow-y-auto p-5 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* Page Title */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                                    <CreditCard className="w-6 h-6 text-[#63A6B2]" />
                                    Transactions
                                </h1>
                                <p className="text-sm text-gray-400 mt-0.5">Track and manage all payment transactions</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setPage(1); fetchTransactions(); }}
                                    className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition active:scale-95">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button onClick={handleExport} disabled={isExporting || !transactions.length}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#63A6B2] text-white rounded-xl font-semibold text-sm hover:bg-[#4a8a95] transition shadow-sm active:scale-95 disabled:opacity-50">
                                    <Download className="w-4 h-4" />
                                    {isExporting ? 'Exporting...' : 'Export CSV'}
                                </button>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Total', value: total, icon: <CreditCard className="w-5 h-5 text-[#63A6B2]" />, color: 'from-[#63A6B2]/10 to-white' },
                                { label: 'Completed', value: stats.completed, icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, color: 'from-emerald-50 to-white' },
                                { label: 'Pending', value: stats.pending, icon: <Clock className="w-5 h-5 text-amber-500" />, color: 'from-amber-50 to-white' },
                                { label: 'Total Amount', value: `₱${stats.totalAmount.toLocaleString()}`, icon: <TrendingUp className="w-5 h-5 text-purple-500" />, color: 'from-purple-50 to-white' },
                            ].map(card => (
                                <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl border border-white shadow-sm p-4 flex items-center gap-3`}>
                                    <div className="p-2 bg-white rounded-xl shadow-sm">{card.icon}</div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                                        <p className="text-xl font-extrabold text-gray-900">{card.value}</p>
                                    </div>
                                </div>
                            ))}
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

                        {/* Transaction Cards */}
                        <div className="space-y-3">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-100 rounded w-1/4" />
                                                <div className="h-3 bg-gray-100 rounded w-1/3" />
                                            </div>
                                            <div className="h-8 bg-gray-100 rounded-xl w-24" />
                                        </div>
                                    </div>
                                ))
                            ) : transactions.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
                                    <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400 font-medium">No transactions found</p>
                                    <p className="text-gray-300 text-sm mt-1">Try adjusting your filters</p>
                                </div>
                            ) : (
                                transactions.map(txn => (
                                    <div key={txn.transaction_id}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                                            {/* Avatar + Donor */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                    {txn.donor_name && txn.donor_name !== 'Anonymous'
                                                        ? txn.donor_name.charAt(0).toUpperCase()
                                                        : <User className="w-4 h-4" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 truncate">{txn.donor_name || 'Anonymous'}</p>
                                                    <p className="text-xs text-gray-400 font-mono truncate">{txn.reference_number || '—'}</p>
                                                </div>
                                            </div>

                                            {/* Amount + Method */}
                                            <div className="flex items-center gap-6 sm:gap-8 flex-shrink-0">
                                                <div className="text-center sm:text-right">
                                                    <p className="text-lg font-extrabold text-gray-900">₱{parseFloat(txn.amount || 0).toLocaleString()}</p>
                                                    <p className="text-xs text-gray-400 capitalize">{txn.payment_method || 'N/A'}</p>
                                                </div>

                                                {/* Date */}
                                                <div className="hidden md:block text-right">
                                                    <p className="text-sm font-semibold text-gray-700">{new Date(txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    <p className="text-xs text-gray-400">{new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>

                                                {/* Status + Switch */}
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-2">
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
                                                        <StatusPill status={txn.status} />
                                                    </div>
                                                    <StatusSwitcher current={txn.status} onUpdate={(s) => updateStatus(txn.transaction_id, s)} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {total > limit && (
                            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
                                <p className="text-sm text-gray-400">
                                    Showing <span className="font-semibold text-gray-700">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</span> of <span className="font-semibold text-gray-700">{total}</span>
                                </p>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition active:scale-95">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                                        const p = i + 1;
                                        return (
                                            <button key={p} onClick={() => setPage(p)}
                                                className={`w-8 h-8 rounded-xl text-sm font-bold transition active:scale-95 ${page === p ? 'bg-[#63A6B2] text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                                                {p}
                                            </button>
                                        );
                                    })}
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition active:scale-95">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {viewDonation && (
                <ViewDonationModal 
                    donation={viewDonation} 
                    handleClose={() => setViewDonation(null)} 
                />
            )}

            {cancelModalTransaction && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 text-center transform transition-all duration-300 scale-100 opacity-100">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Transaction?</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to cancel the transaction <span className="font-semibold text-gray-700">{cancelModalTransaction.reference_number || `#${cancelModalTransaction.transaction_id}`}</span> from <span className="font-semibold text-gray-700">{cancelModalTransaction.donor_name || 'Anonymous'}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setCancelModalTransaction(null)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition active:scale-95"
                            >
                                No, Keep it
                            </button>
                            <button
                                onClick={() => executeStatusUpdate(cancelModalTransaction.transaction_id, 'cancelled')}
                                className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition active:scale-95 shadow-sm shadow-red-500/30"
                            >
                                Yes, Cancel it
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
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh]">
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
                                <Download className="w-4 h-4" /> View Full Image
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
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100/50">
                    {d.receipt_upload ? (
                        <div className="max-w-3xl mx-auto">
                            <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center">
                                <div className="w-full mb-4 flex justify-between items-center border-b pb-2">
                                    <p className="text-sm font-bold text-gray-600">Reference: <span className="font-mono text-[#63A6B2]">{d.payment_reference || `#${d.donation_id}`}</span></p>
                                    <p className="text-sm font-bold text-gray-600">Donor: <span className="text-gray-900">{d.donor_name}</span></p>
                                </div>
                                <img 
                                    src={`http://localhost:5000${d.receipt_upload}`} 
                                    alt="Uploaded Receipt" 
                                    className="max-w-full rounded-xl shadow-inner border border-gray-100 cursor-zoom-in"
                                    onClick={() => window.open(`http://localhost:5000${d.receipt_upload}`, '_blank')}
                                />
                                <div className="mt-6 w-full p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <p className="text-center text-xs text-gray-500 font-medium italic">
                                        This is the official receipt uploaded by the administrator for this transaction. 
                                        Click the image to view the original full-size file.
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
                                    <div className="bg-white shadow-lg flex items-center justify-center flex-shrink-0" style={{width: '110px', height: '110px', borderRadius: '50%', padding: '8px'}}>
                                        <img src="/images/logo.png" alt="SVRTV Logo" className="w-full h-full object-contain" style={{borderRadius: '50%'}} />
                                    </div>
                                    {/* Divider */}
                                    <div className="w-px h-16 bg-white/30"></div>
                                    {/* Foundation Logo - Circle */}
                                    {d.foundation_logo ? (
                                        <div className="bg-white shadow-lg flex items-center justify-center flex-shrink-0" style={{width: '110px', height: '110px', borderRadius: '50%', padding: '8px'}}>
                                            <img
                                                src={`http://localhost:5000${d.foundation_logo}`}
                                                alt={`${d.foundation_name} Logo`}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0" style={{width: '110px', height: '110px', borderRadius: '50%'}}>
                                            <span className="text-white font-bold text-3xl">
                                                {d.foundation_name ? d.foundation_name.charAt(0) : 'F'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <h1 className="text-3xl font-bold mb-1">Official Receipt</h1>
                                    <p className="text-teal-100 text-sm mb-3">Tax Deductible Donation</p>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
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
