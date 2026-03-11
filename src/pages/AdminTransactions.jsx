import React, { useState, useEffect } from 'react';
import {
    CreditCard, Search, Calendar, Download,
    ChevronLeft, ChevronRight, RefreshCw,
    CheckCircle, XCircle, Clock, User, TrendingUp
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
    const options = ['completed', 'pending', 'failed', 'cancelled'];
    return (
        <div className="flex items-center gap-1 flex-wrap">
            {options
                .filter(s => s !== current?.toLowerCase())
                .map(s => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                        <button
                            key={s}
                            onClick={() => onUpdate(s)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 transition-all hover:scale-105 active:scale-95 ${cfg.bg} ${cfg.text} ${cfg.ring} opacity-60 hover:opacity-100`}
                        >
                            {cfg.label}
                        </button>
                    );
                })}
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

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit, search, startDate });
            if (statusFilter) params.append('status', statusFilter);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/transactions?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setTransactions(data.transactions || []);
            setTotal(data.total || 0);
        } catch {
            toast.error('Failed to load transactions');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (txnId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/transactions/${txnId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error();
            toast.success(`Marked as ${newStatus}`);
            setTransactions(prev => prev.map(t => t.transaction_id === txnId ? { ...t, status: newStatus } : t));
        } catch {
            toast.error('Failed to update status');
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

    // Summary stats
    const stats = {
        total: transactions.length,
        completed: transactions.filter(t => t.status === 'completed').length,
        pending: transactions.filter(t => t.status === 'pending').length,
        totalAmount: transactions.reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    };

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
                                                    <StatusPill status={txn.status} />
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
        </div>
    );
}
