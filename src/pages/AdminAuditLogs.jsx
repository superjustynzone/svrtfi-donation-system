import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, Search, Filter, Calendar,
    Download, ChevronLeft, ChevronRight, RefreshCw,
    Clock, User, Shield, Info, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [module, setModule] = useState('');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const modules = ['All', 'User Management', 'Campaigns', 'Profile', 'Auth', 'Branding'];

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit,
                search,
                startDate,
                endDate
            });

            const response = await fetch(`http://localhost:5000/api/audit?${params}`);
            const data = await response.json();

            if (data.success) {
                setLogs(data.logs);
                setTotal(data.total);
            } else {
                toast.error(data.message || 'Failed to fetch logs');
            }
        } catch (error) {
            console.error('Fetch logs error:', error);
            toast.error('Connection error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, module, startDate, endDate]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const handleExport = () => {
        if (logs.length === 0) {
            toast.error('No logs to export');
            return;
        }

        setIsExporting(true);
        try {
            const headers = ['Audit ID', 'Timestamp', 'User', 'Role', 'Action', 'Details'];
            const csvContent = [
                headers.join(','),
                ...logs.map(log => [
                    log.audit_id,
                    new Date(log.timestamp).toLocaleString(),
                    `"${log.first_name ? `${log.first_name} ${log.last_name}` : 'System'}"`,
                    log.role_name || 'N/A',
                    `"${log.action}"`,
                    `"${log.details?.replace(/"/g, '""') || ''}"`
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Logs exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export logs');
        } finally {
            setIsExporting(false);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="flex h-screen bg-[#F8FAFB]">
            <AdminSidebar activePage="audit" />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AdminHeader />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <AlertTriangle className="w-6 h-6 text-[#63A6B2]" />
                                    Audit Logs
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">Track system activities and user actions</p>
                            </div>
                            <button
                                onClick={handleExport}
                                disabled={isExporting || logs.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#63A6B2] text-white rounded-xl font-semibold text-sm hover:bg-[#4a8a95] transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                <Download className="w-4 h-4" />
                                {isExporting ? 'Exporting...' : 'Export CSV'}
                            </button>
                        </div>

                        {/* Filters Bar */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Search */}
                                <div className="lg:col-span-2 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search action, details, or user..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/10 transition-all"
                                    />
                                </div>

                                {/* Start Date Filter */}
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/10 transition-all"
                                    />
                                </div>

                                {/* Search Button */}
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-[#63A6B2] text-[#63A6B2] rounded-xl font-semibold text-sm hover:bg-[#63A6B2] hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                    Apply Filters
                                </button>
                            </form>
                        </div>

                        {/* Logs Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Audit ID</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? (
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    {[...Array(5)].map((_, j) => (
                                                        <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded"></div></td>
                                                    ))}
                                                </tr>
                                            ))
                                        ) : logs.length > 0 ? (
                                            logs.map((log) => (
                                                <tr key={log.audit_id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-xs font-mono text-gray-500 font-semibold">#{log.audit_id}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                                {new Date(log.timestamp).toLocaleDateString()}
                                                            </div>
                                                            <span className="text-xs text-gray-400 ml-5">
                                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-[#63A6B2]" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-gray-900">
                                                                    {log.first_name ? `${log.first_name} ${log.last_name}` : 'System'}
                                                                </span>
                                                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                                    <Shield className="w-2.5 h-2.5" />
                                                                    {log.role_name || 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                                                            <Activity className="w-3.5 h-3.5 text-[#63A6B2]" />
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-xs">
                                                        <div className="flex items-start gap-2">
                                                            <Info className="w-3.5 h-3.5 text-gray-300 mt-0.5" />
                                                            <p className="text-sm text-gray-600 line-clamp-2" title={log.details}>
                                                                {log.details}
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                                                    No activity logs found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {total > limit && (
                                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-sm text-gray-500 font-medium">
                                        Showing <span className="text-gray-900">{(page - 1) * limit + 1}</span> to <span className="text-gray-900">{Math.min(page * limit, total)}</span> of <span className="text-gray-900">{total}</span> logs
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="p-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => setPage(i + 1)}
                                                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all active:scale-95 ${page === i + 1 ? 'bg-[#63A6B2] text-white' : 'hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="p-2 border border-gray-200 rounded-xl hover:bg-white disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
