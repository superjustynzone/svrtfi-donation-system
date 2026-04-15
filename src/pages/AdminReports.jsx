import React, { useState, useEffect, useRef } from 'react';
import {
    BarChart3, TrendingUp, Users, DollarSign,
    Calendar, Download,
    CheckCircle2, Target, History, Award, ChevronDown, Check,
    ChevronUp, Globe, Monitor, Smartphone, Tablet,
    AlertCircle, RefreshCw, MapPin, Activity, Clock,
    XCircle, Layers, Plus, Trash2, Filter, Search, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Table columns definition for the Filtered Activity table
const TABLE_COLUMNS = [
    { key: 'donor_name', label: 'Donor Detail' },
    { key: 'campaign_name', label: 'Campaign' },
    { key: 'payment_method', label: 'Method' },
    { key: 'payment_status', label: 'Status' },
    { key: 'amount', label: 'Amount' },
    { key: 'initiated_at', label: 'Date' },
];

const PALETTE = ['#63A6B2', '#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4'];

export default function AdminReports() {
    const [activeTab, setActiveTab] = useState('donations');

    // ── Donation Report States ────────────────────────────────────
    const [summary, setSummary] = useState(null);
    const [trends, setTrends] = useState([]);
    const [distribution, setDistribution] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [interval, setInterval] = useState('month');
    const [isLoading, setIsLoading] = useState(true);

    // Filter States
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [campaignId, setCampaignId] = useState('');
    const [foundationId, setFoundationId] = useState('');
    const [donorId, setDonorId] = useState('');

    // Dropdown Data
    const [campaigns, setCampaigns] = useState([]);
    const [foundations, setFoundations] = useState([]);
    const [donors, setDonors] = useState([]);

    // Column visibility
    const [visibleColumns, setVisibleColumns] = useState(
        Object.fromEntries(TABLE_COLUMNS.map(c => [c.key, true]))
    );
    const [colMenuOpen, setColMenuOpen] = useState(false);
    const colMenuRef = useRef(null);

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'initiated_at', direction: 'desc' });

    // Advanced Search Builder Data
    const [advancedDonations, setAdvancedDonations] = useState([]);
    const [searchRules, setSearchRules] = useState([]);
    const [statusFilter, setStatusFilter] = useState('completed'); // Toggle completed, pending, failed, all

    // ── Analytics States ─────────────────────────────────────────
    const [gaOverview, setGaOverview]   = useState(null);
    const [gaGeo, setGaGeo]             = useState(null);
    const [gaDevices, setGaDevices]     = useState(null);
    const [partialDons, setPartialDons] = useState(null);
    const [topPerCamp, setTopPerCamp]   = useState([]);
    const [gaLoading, setGaLoading]     = useState(false);
    const [gaDays, setGaDays]           = useState('30');
    const [expandedCamp, setExpandedCamp] = useState(null);

    // ── Effects ──────────────────────────────────────────────────
    useEffect(() => { fetchDropdownData(); }, []);
    useEffect(() => { fetchReportData(); }, [interval, startDate, endDate, campaignId, foundationId, donorId]);
    useEffect(() => {
        if (activeTab === 'analytics') fetchAnalyticsData();
    }, [activeTab, gaDays]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (colMenuRef.current && !colMenuRef.current.contains(e.target)) setColMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Data Fetching ────────────────────────────────────────────
    const fetchDropdownData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [campRes, foundRes, donorRes] = await Promise.all([
                fetch('http://localhost:5000/api/campaigns/all', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/foundations/all', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/donations/donors', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (campRes.ok) setCampaigns(await campRes.json());
            if (foundRes.ok) setFoundations(await foundRes.json());
            if (donorRes.ok) { const d = await donorRes.json(); setDonors(d.donors || []); }
        } catch (err) { console.error("Filter data fetch failed:", err); }
    };

    const fetchReportData = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                interval,
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
                ...(campaignId && { campaignId }),
                ...(foundationId && { foundationId }),
                ...(donorId && { donorId })
            }).toString();

            const [summaryRes, trendsRes, distRes, pmRes, advRes] = await Promise.all([
                fetch(`http://localhost:5000/api/admin/reports/summary?${queryParams}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`http://localhost:5000/api/admin/reports/trends?${queryParams}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`http://localhost:5000/api/admin/reports/distribution?${queryParams}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`http://localhost:5000/api/admin/reports/payment-methods?${queryParams}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`http://localhost:5000/api/admin/reports/advanced-table`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!summaryRes.ok) throw new Error('Summary API failed');
            if (!trendsRes.ok) throw new Error('Trends API failed');

            const summaryData = await summaryRes.json();
            const trendsData  = await trendsRes.json();
            const distData    = distRes.ok ? await distRes.json() : [];
            const pmData      = pmRes.ok ? await pmRes.json() : [];
            const advData     = advRes.ok ? await advRes.json() : [];

            setSummary(summaryData);
            setTrends(Array.isArray(trendsData) ? trendsData : []);
            setDistribution(distData);
            setPaymentMethods(pmData);
            setAdvancedDonations(advData.data || advData || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load report data.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAnalyticsData = async () => {
        setGaLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const q = `?days=${gaDays}`;

            const [overRes, geoRes, devRes, partRes, topRes] = await Promise.all([
                fetch(`http://localhost:5000/api/admin/analytics/ga-overview${q}`, { headers }),
                fetch(`http://localhost:5000/api/admin/analytics/ga-geography${q}`, { headers }),
                fetch(`http://localhost:5000/api/admin/analytics/ga-devices${q}`, { headers }),
                fetch(`http://localhost:5000/api/admin/analytics/partial-donations`, { headers }),
                fetch(`http://localhost:5000/api/admin/analytics/top-donors-per-campaign`, { headers }),
            ]);

            if (overRes.ok)  setGaOverview(await overRes.json());
            if (geoRes.ok)   setGaGeo(await geoRes.json());
            if (devRes.ok)   setGaDevices(await devRes.json());
            if (partRes.ok)  setPartialDons(await partRes.json());
            if (topRes.ok)   setTopPerCamp(await topRes.json());
        } catch (err) {
            console.error('Analytics fetch error:', err);
            toast.error('Failed to load analytics data.');
        } finally {
            setGaLoading(false);
        }
    };

    // ── Sorting ──────────────────────────────────────────────────
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedDonations = React.useMemo(() => {
        let items = Array.isArray(advancedDonations) ? [...advancedDonations] : [];

        // 1. Status Filter (Raised vs Pending)
        if (statusFilter !== 'all') {
            items = items.filter(d => d.payment_status === statusFilter);
        }

        // 2. SearchBuilder Filter Engine
        searchRules.forEach(rule => {
            if (!rule.field || !rule.operator) return;
            items = items.filter(d => {
                let val = d[rule.field];
                const tar = rule.value;
                
                if (rule.field === 'amount') {
                    val = Number(val) || 0;
                    const numTar = Number(tar) || 0;
                    if (rule.operator === '=') return val === numTar;
                    if (rule.operator === '>') return val > numTar;
                    if (rule.operator === '<') return val < numTar;
                } else if (rule.field === 'initiated_at') {
                    if (!val || !tar) return true;
                    const dateVal = new Date(val).getTime();
                    const dateTar = new Date(tar).getTime();
                    if (rule.operator === 'before') return dateVal < dateTar;
                    if (rule.operator === 'after') return dateVal > dateTar;
                    if (rule.operator === 'exact') return new Date(val).toDateString() === new Date(tar).toDateString();
                } else {
                    val = String(val || '').toLowerCase();
                    const strTar = String(tar || '').toLowerCase();
                    if (rule.operator === 'contains') return val.includes(strTar);
                    if (rule.operator === 'equals') return val === strTar;
                    if (rule.operator === 'starts_with') return val.startsWith(strTar);
                }
                return true;
            });
        });

        // 3. Sorting
        if (sortConfig.key) {
            items.sort((a, b) => {
                let av = a[sortConfig.key], bv = b[sortConfig.key];
                if (typeof av === 'string') { av = av.toLowerCase(); bv = (bv || '').toLowerCase(); }
                if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
                if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [advancedDonations, sortConfig, searchRules, statusFilter]);

    // Formatters for SearchBuilder
    const addRule = () => setSearchRules([...searchRules, { id: Date.now(), field: 'donor_name', operator: 'contains', value: '' }]);
    const removeRule = (id) => setSearchRules(searchRules.filter(r => r.id !== id));
    const updateRule = (id, key, val) => setSearchRules(searchRules.map(r => r.id === id ? { ...r, [key]: val } : r));
    const clearRules = () => setSearchRules([]);


    // ── Export Helpers ───────────────────────────────────────────
    const getVisibleCols = () => TABLE_COLUMNS.filter(c => visibleColumns[c.key]);

    const getAllSections = () => {
        const fmt = (v) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const dateLabel = (t) => { try { return new Date(t.period).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }); } catch { return t.period; } };

        const summaryRows = [
            ['Metric', 'Value'],
            ['Total Raised', fmt(summary?.summary?.total_amount)],
            ['Total Donations', summary?.summary?.total_count ?? 0],
            ['Average Donation', fmt(summary?.summary?.avg_amount)],
            ['Success Rate', `${successRate}%`],
        ];
        const trendsRows = [
            ['Period', 'Total Amount (PHP)', 'Count'],
            ...(Array.isArray(trends) ? trends.map(t => [dateLabel(t), parseFloat(t.total_amount || 0).toFixed(2), t.count ?? '']) : [])
        ];
        const distRows = [['Campaign', 'Amount (PHP)'], ...(distribution.map(d => [d.label, parseFloat(d.value || 0).toFixed(2)]))];
        const pmRows = [['Payment Method', 'Donations'], ...(paymentMethods.map(p => [p.label || 'Other', p.value]))];
        const topCampRows = [['Rank', 'Campaign Name', 'Total Raised (PHP)'], ...(summary?.topCampaigns?.map((c, i) => [i + 1, c.campaign_name, parseFloat(c.total || 0).toFixed(2)]) || [])];
        const topDonorRows = [['Donor Name', 'Total Amount (PHP)', 'Transactions'], ...(summary?.topDonors?.map(d => [d.donor_name, parseFloat(d.total_amount || 0).toFixed(2), d.donation_count]) || [])];
        const activityCols = getVisibleCols();
        const activityRows = [
            activityCols.map(c => c.label),
            ...(summary?.recentDonations || []).map(don => {
                const row = {
                    donor_name: don.donor_name || '',
                    campaign_name: don.campaign_name || '',
                    payment_method: don.payment_method || '',
                    amount: fmt(don.amount),
                    initiated_at: don.initiated_at ? new Date(don.initiated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '',
                };
                return activityCols.map(c => row[c.key] || '');
            })
        ];
        return { summaryRows, trendsRows, distRows, pmRows, topCampRows, topDonorRows, activityRows };
    };

    const handleExportCSV = () => {
        try {
            const { summaryRows, trendsRows, distRows, pmRows, topCampRows, topDonorRows, activityRows } = getAllSections();
            const toCSV = (rows) => rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
            const sections = [
                ['DONATION REPORT', `Generated: ${new Date().toLocaleDateString()}`].join('\n'),
                '\n--- SUMMARY ---\n' + toCSV(summaryRows),
                '\n--- DONATION TRENDS ---\n' + toCSV(trendsRows),
                '\n--- CAMPAIGN DISTRIBUTION ---\n' + toCSV(distRows),
                '\n--- PAYMENT METHODS ---\n' + toCSV(pmRows),
                '\n--- TOP CAMPAIGNS ---\n' + toCSV(topCampRows),
                '\n--- TOP DONORS ---\n' + toCSV(topDonorRows),
                '\n--- FILTERED ACTIVITY ---\n' + toCSV(activityRows),
            ];
            const blob = new Blob([sections.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `full_report_${new Date().toISOString().split('T')[0]}.csv`; a.click();
            URL.revokeObjectURL(url);
            toast.success('CSV exported!');
        } catch (e) { console.error(e); toast.error('CSV export failed'); }
    };

    const handleExportExcel = () => {
        try {
            const { summaryRows, trendsRows, distRows, pmRows, topCampRows, topDonorRows, activityRows } = getAllSections();
            const wb = XLSX.utils.book_new();
            const addSheet = (name, rows) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
            addSheet('Summary', summaryRows);
            addSheet('Donation Trends', trendsRows);
            addSheet('Campaign Distribution', distRows);
            addSheet('Payment Methods', pmRows);
            addSheet('Top Campaigns', topCampRows);
            addSheet('Top Donors', topDonorRows);
            addSheet('Filtered Activity', activityRows);
            XLSX.writeFile(wb, `full_report_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Excel exported!');
        } catch (e) { console.error(e); toast.error('Excel export failed'); }
    };

    const handleExportPDF = () => {
        try {
            const { summaryRows, trendsRows, distRows, pmRows, topCampRows, topDonorRows, activityRows } = getAllSections();
            const doc = new jsPDF({ orientation: 'landscape' });
            const teal = [99, 166, 178]; const alt = [245, 249, 250];
            const BASE_STYLE = { styles: { fontSize: 8 }, headStyles: { fillColor: teal, textColor: 255 }, alternateRowStyles: { fillColor: alt } };
            doc.setFontSize(16); doc.setTextColor(40, 40, 40); doc.text('SVRTV Donation Report', 14, 16);
            doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 23);
            const section = (title, rows, startY) => {
                doc.setFontSize(10); doc.setTextColor(99, 166, 178); doc.text(title, 14, startY);
                autoTable(doc, { startY: startY + 4, head: [rows[0]], body: rows.slice(1), ...BASE_STYLE });
                return doc.lastAutoTable.finalY + 8;
            };
            let y = 30;
            y = section('Summary', summaryRows, y);
            y = section('Donation Trends', trendsRows, y);
            y = section('Campaign Distribution', distRows, y);
            y = section('Payment Methods', pmRows, y);
            y = section('Top Campaigns', topCampRows, y);
            y = section('Top Donors', topDonorRows, y);
            section('Filtered Activity', activityRows, y);
            doc.save(`full_report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('PDF exported!');
        } catch (e) { console.error(e); toast.error('PDF export failed'); }
    };

    const handlePrint = () => {
        const { summaryRows, trendsRows, distRows, pmRows, topCampRows, topDonorRows, activityRows } = getAllSections();
        const teal = '#63A6B2';
        const makeTable = (rows) => {
            if (!rows || rows.length < 2) return '<p style="color:#999;font-style:italic">No data</p>';
            const head = rows[0].map(h => `<th style="background:${teal};color:#fff;padding:6px 10px;text-align:left">${h}</th>`).join('');
            const body = rows.slice(1).map((r, i) => `<tr style="background:${i % 2 === 0 ? '#f5f9fa' : '#fff'}">${r.map(v => `<td style="padding:5px 10px;border-bottom:1px solid #eee">${v}</td>`).join('')}</tr>`).join('');
            return `<table style="border-collapse:collapse;width:100%;font-size:12px;margin-bottom:24px"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
        };
        const section = (title, rows) => `<h3 style="color:${teal};font-size:13px;margin:20px 0 6px;border-left:4px solid ${teal};padding-left:8px">${title}</h3>${makeTable(rows)}`;
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Donation Report</title><style>body{font-family:sans-serif;padding:24px;color:#222}h1{font-size:20px;margin-bottom:4px}p.sub{color:#999;font-size:11px;margin-bottom:20px}</style></head><body>
            <h1>SVRTV Donation Report</h1>
            <p class="sub">Generated: ${new Date().toLocaleDateString()}</p>
            ${section('Summary', summaryRows)}
            ${section('Donation Trends', trendsRows)}
            ${section('Campaign Distribution', distRows)}
            ${section('Payment Methods', pmRows)}
            ${section('Top Campaigns', topCampRows)}
            ${section('Top Donors', topDonorRows)}
            ${section('Filtered Activity', activityRows)}
            <script>window.onload=()=>{window.print();window.close();}<\/script>
        </body></html>`);
        win.document.close();
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
    const formatDuration = (secs) => { const m = Math.floor(secs / 60); const s = parseInt(secs) % 60; return `${m}m ${s}s`; };

    const successRate = summary?.summary?.total_count > 0
        ? Math.round((summary.summary.total_count / (summary.summary.total_count + (summary.summary.failed_count || 0))) * 100)
        : 100;

    const chartData = {
        labels: Array.isArray(trends) ? trends.map(t => {
            const date = new Date(t.period);
            if (interval === 'day') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (interval === 'week') return `Wk ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }) : [],
        datasets: [{
            label: 'Donations (PHP)',
            data: Array.isArray(trends) ? trends.map(t => parseFloat(t.total_amount || 0)) : [],
            backgroundColor: 'rgba(99, 166, 178, 0.2)',
            borderColor: '#63A6B2',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#63A6B2',
        }]
    };

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
        }
    };

    const pmBarData = {
        labels: paymentMethods.map(p => p.label || 'Other'),
        datasets: [{
            indexAxis: 'y',
            label: 'Donations',
            data: paymentMethods.map(p => parseInt(p.value)),
            backgroundColor: PALETTE,
            borderRadius: 8,
            barThickness: 20
        }]
    };

    // ── Device Doughnut Data ────────────────────────────────────
    const deviceSummary = gaDevices?.summary;
    const deviceDoughnutData = deviceSummary ? {
        labels: ['iOS', 'Android', 'Desktop', 'Mobile Web', 'Tablet'],
        datasets: [{
            data: [
                deviceSummary.ios || 0,
                deviceSummary.android || 0,
                deviceSummary.desktop || 0,
                deviceSummary.mobile || 0,
                deviceSummary.tablet || 0,
            ],
            backgroundColor: ['#63A6B2', '#10B981', '#3B82F6', '#F97316', '#8B5CF6'],
            borderWidth: 0,
        }]
    } : null;

    // ── Geography Bar Data ──────────────────────────────────────
    const geoBarData = gaGeo?.countries ? {
        labels: gaGeo.countries.map(c => c.country),
        datasets: [{
            label: 'Users',
            data: gaGeo.countries.map(c => c.users),
            backgroundColor: '#63A6B2',
            borderRadius: 6,
            barThickness: 18,
        }]
    } : null;

    const isGAConfigured = gaOverview?.configured !== false;

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
            <AdminSidebar activePage="reports" />

            <main className="flex-1 overflow-y-auto">
                <AdminHeader
                    title="Analytics & Reports"
                    subtitle="Visualize donation trends and campaign performance"
                >
                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 mr-2 uppercase tracking-wider hidden lg:inline">Export:</span>
                        <button onClick={handleExportExcel} title="Export to Excel" className="px-4 py-2 border-2 border-emerald-500 text-emerald-600 rounded-lg font-semibold hover:bg-emerald-500 hover:text-white transition flex items-center gap-2 bg-white">
                            <Download className="w-5 h-5" /><span className="hidden xl:inline">Excel</span>
                        </button>
                        <button onClick={handleExportCSV} title="Export to CSV" className="px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-500 hover:text-white transition flex items-center gap-2 bg-white">
                            <Download className="w-5 h-5" /><span className="hidden xl:inline">CSV</span>
                        </button>
                        <button onClick={handleExportPDF} title="Export to PDF" className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg font-semibold hover:bg-red-500 hover:text-white transition flex items-center gap-2 bg-white">
                            <Download className="w-5 h-5" /><span className="hidden xl:inline">PDF</span>
                        </button>
                        <button onClick={handlePrint} title="Print report" className="px-4 py-2 border-2 border-gray-500 text-gray-600 rounded-lg font-semibold hover:bg-gray-500 hover:text-white transition flex items-center gap-2 bg-white">
                            <Download className="w-5 h-5" /><span className="hidden xl:inline">Print</span>
                        </button>
                    </div>
                </AdminHeader>

                {/* ── Tab Navigation ──────────────────────────────────── */}
                <div className="px-4 lg:px-8 pt-6">
                    <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
                        <button
                            onClick={() => setActiveTab('donations')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'donations' ? 'bg-[#63A6B2] text-white shadow' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                        >
                            <DollarSign className="w-4 h-4" /> Donation Reports
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-[#63A6B2] text-white shadow' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                        >
                            <Globe className="w-4 h-4" /> Site Analytics
                        </button>
                    </div>
                </div>

                <div className="p-4 lg:p-8 space-y-8">

                    {/* ════════════════════════════════════════════════════════
                        TAB 1 — DONATION REPORTS
                    ════════════════════════════════════════════════════════ */}
                    {activeTab === 'donations' && (
                        <>
                            {/* Filter Bar */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 mb-2 text-gray-700 font-bold">
                                    <Calendar className="w-5 h-5 text-[#63A6B2]" />
                                    <span>Filter</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start Date</label>
                                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">End Date</label>
                                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Foundation</label>
                                        <select value={foundationId} onChange={(e) => setFoundationId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition">
                                            <option value="">All Foundations</option>
                                            {foundations.map(f => <option key={f.foundation_id} value={f.foundation_id}>{f.foundation_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Campaign</label>
                                        <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition">
                                            <option value="">All Campaigns</option>
                                            {campaigns.map(c => <option key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Donor</label>
                                        <select value={donorId} onChange={(e) => setDonorId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition">
                                            <option value="">All Donors</option>
                                            {donors.map(d => (
                                                <option key={d.donor_id} value={d.donor_id}>
                                                    {d.first_name ? `${d.first_name} ${d.last_name || ''}` : d.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <SummaryCard title="Total Raised" value={formatCurrency(summary?.summary?.total_amount)} icon={<DollarSign className="w-6 h-6 text-white" />} color="bg-blue-500" />
                                <SummaryCard title="Total Donors" value={summary?.summary?.total_count || 0} icon={<Users className="w-6 h-6 text-white" />} color="bg-purple-500" />
                                <SummaryCard title="Avg Donation" value={formatCurrency(summary?.summary?.avg_amount)} icon={<Target className="w-6 h-6 text-white" />} color="bg-green-500" />
                                <SummaryCard title="Success Rate" value={`${successRate}%`} icon={<CheckCircle2 className="w-6 h-6 text-white" />} color="bg-teal-500" />
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Trend Chart */}
                                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[450px]">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-bold text-gray-900 border-l-4 border-[#63A6B2] pl-3">Donation Analytics</h3>
                                        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                            <button onClick={() => setInterval('day')} className={`px-4 py-2 text-sm font-semibold transition ${interval === 'day' ? 'bg-[#63A6B2] text-white shadow-inner' : 'text-gray-600 hover:bg-gray-100'}`}>Daily</button>
                                            <button onClick={() => setInterval('week')} className={`px-4 py-2 text-sm font-semibold transition ${interval === 'week' ? 'bg-[#63A6B2] text-white shadow-inner' : 'text-gray-600 hover:bg-gray-100'}`}>Weekly</button>
                                            <button onClick={() => setInterval('month')} className={`px-4 py-2 text-sm font-semibold transition ${interval === 'month' ? 'bg-[#63A6B2] text-white shadow-inner' : 'text-gray-600 hover:bg-gray-100'}`}>Monthly</button>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full">
                                        {isLoading
                                            ? <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#63A6B2]"></div></div>
                                            : <Line data={chartData} options={chartOptions} />
                                        }
                                    </div>
                                </div>
                                {/* Distribution Chart */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[450px]">
                                    <div className="mb-6 border-l-4 border-purple-500 pl-3">
                                        <h3 className="text-xl font-bold text-gray-900">Campaign Share</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Donation volume distribution</p>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        <div className="w-full max-w-[200px] aspect-square mb-6">
                                            {isLoading ? <div className="h-full w-full animate-pulse bg-gray-100 rounded-full" /> : distribution.length > 0 ? (
                                                <Doughnut data={{ labels: distribution.map(d => d.label), datasets: [{ data: distribution.map(d => parseFloat(d.value)), backgroundColor: PALETTE, borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-300 italic text-sm border-2 border-dashed border-gray-100 rounded-full">No data</div>
                                            )}
                                        </div>
                                        <div className="w-full space-y-2">
                                            {distribution.slice(0, 5).map((d, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2 truncate pr-2">
                                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PALETTE[i] }} />
                                                        <span className="text-gray-600 truncate">{d.label}</span>
                                                    </div>
                                                    <span className="font-bold text-gray-900">{formatCurrency(d.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Payment Method Chart */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[450px]">
                                    <div className="mb-6 border-l-4 border-emerald-500 pl-3">
                                        <h3 className="text-xl font-bold text-gray-900">Payment Tools</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Transaction method breakdown</p>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="w-full h-[220px] mb-6">
                                            {isLoading ? <div className="h-full w-full animate-pulse bg-gray-100 rounded-xl" /> : paymentMethods.length > 0 ? (
                                                <Bar data={pmBarData} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, callbacks: { label: (ctx) => ` ${ctx.raw} donations` } } }, scales: { x: { beginAtZero: true, grid: { display: false }, ticks: { display: false } }, y: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } } } }} />
                                            ) : <div className="h-full w-full flex items-center justify-center text-gray-300 italic text-sm border-2 border-dashed border-gray-100 rounded-xl">No data</div>}
                                        </div>
                                        <div className="w-full space-y-3 pt-4 border-t border-gray-50">
                                            {paymentMethods.map((pm, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2 truncate pr-2">
                                                        <div className="w-3 h-3 rounded-md flex-shrink-0" style={{ backgroundColor: PALETTE[i] }} />
                                                        <span className="text-gray-600 font-bold truncate uppercase tracking-tighter">{pm.label || 'Other'}</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="font-black text-gray-900 text-sm">{pm.value}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase">donations</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {/* Top Campaigns */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col min-w-0 min-h-[450px]">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-orange-400 pl-3">Top Campaigns</h3>
                                    <div className="space-y-4 flex-1">
                                        {summary?.topCampaigns?.slice(0, 5).map((camp, idx) => (
                                            <div key={idx} className="flex items-center gap-4 group p-2 hover:bg-gray-50 rounded-xl transition">
                                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex-shrink-0 flex items-center justify-center font-bold text-orange-600 text-sm">#{idx + 1}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 text-sm truncate group-hover:text-[#63A6B2] transition">{camp.campaign_name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{formatCurrency(camp.total)} raised</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!summary?.topCampaigns || summary.topCampaigns.length === 0) && !isLoading && (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 italic py-10">
                                                <History className="w-12 h-12 mb-3 opacity-20" /><p>No campaign data</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Top Donors */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col min-w-0 min-h-[450px]">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-purple-500 pl-3">Top Donors</h3>
                                    <div className="space-y-4 flex-1">
                                        {summary?.topDonors?.slice(0, 5).map((donor, idx) => (
                                            <div key={idx} className="flex items-center gap-4 group p-2 hover:bg-gray-50 rounded-xl transition">
                                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex-shrink-0 flex items-center justify-center font-bold text-purple-600 text-sm"><Award className="w-5 h-5" /></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 text-sm truncate group-hover:text-[#63A6B2] transition">{donor.donor_name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] text-[#63A6B2] font-black uppercase tracking-wider">{formatCurrency(donor.total_amount)}</p>
                                                        <span className="text-[10px] text-gray-300">•</span>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{donor.donation_count} txns</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(!summary?.topDonors || summary.topDonors.length === 0) && !isLoading && (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 italic py-10">
                                                <Users className="w-12 h-12 mb-3 opacity-20" /><p>No donor data</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Advanced SearchBuilder Table */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.1)] overflow-hidden">
                                
                                {/* Header & Global Toggles */}
                                <div className="p-6 pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shadow-inner">
                                                <Filter className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 leading-tight">Advanced Analytics</h3>
                                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest pl-0.5">Real-time filtering engine</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex flex-col">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[#63A6B2] mb-1">Donation Status</label>
                                            <div className="inline-flex bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200/60">
                                                <button onClick={() => setStatusFilter('completed')} className={`px-4 py-1.5 text-xs font-black capitalize rounded-lg transition-all duration-200 ${statusFilter === 'completed' ? 'bg-white text-[#10B981] shadow-sm transform scale-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 scale-95'}`}>Raised (Success)</button>
                                                <button onClick={() => setStatusFilter('pending')} className={`px-4 py-1.5 text-xs font-black capitalize rounded-lg transition-all duration-200 ${statusFilter === 'pending' ? 'bg-white text-orange-500 shadow-sm transform scale-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 scale-95'}`}>Pending</button>
                                                <button onClick={() => setStatusFilter('failed')} className={`px-4 py-1.5 text-xs font-black capitalize rounded-lg transition-all duration-200 ${statusFilter === 'failed' ? 'bg-white text-red-500 shadow-sm transform scale-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 scale-95'}`}>Failed</button>
                                                <button onClick={() => setStatusFilter('all')} className={`px-4 py-1.5 text-xs font-black capitalize rounded-lg transition-all duration-200 ${statusFilter === 'all' ? 'bg-white text-gray-800 shadow-sm transform scale-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 scale-95'}`}>All</button>
                                            </div>
                                        </div>
                                        
                                        <div className="relative border-l border-gray-200 pl-4" ref={colMenuRef}>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Columns</label>
                                            <button onClick={() => setColMenuOpen(v => !v)} className="flex items-center gap-2 px-4 py-[8px] bg-white border border-gray-200 hover:border-[#63A6B2] text-gray-700 text-xs font-bold rounded-xl transition shadow-sm">
                                                <Layers className="w-3.5 h-3.5 text-[#63A6B2]" /> 
                                                Visibility <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                            </button>
                                            {colMenuOpen && (
                                                <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl py-3 min-w-[220px] origin-top-right animate-in fade-in zoom-in-95">
                                                    <div className="px-4 pb-2 mb-2 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">Toggle Columns</div>
                                                    {TABLE_COLUMNS.map(col => (
                                                        <button key={col.key} onClick={() => setVisibleColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))} className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-blue-50/50 transition">
                                                            <span className="font-semibold">{col.label}</span>
                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${visibleColumns[col.key] ? 'border-[#63A6B2] bg-[#63A6B2]' : 'border-gray-200'}`}>
                                                                {visibleColumns[col.key] && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* SearchBuilder UI Area */}
                                <div className="px-6 py-6 border-b border-gray-100">
                                    <div className="bg-gray-50/50 border border-gray-200/60 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                                <Search className="w-3.5 h-3.5" /> Condition Builder
                                            </h4>
                                            {searchRules.length > 0 && (
                                                <button onClick={clearRules} className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-700 transition">Clear All</button>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-3 mb-4">
                                            {searchRules.map((rule, idx) => (
                                                <div key={rule.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-left-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-[#63A6B2]/10 text-[#63A6B2] font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                            {idx === 0 ? 'Where' : 'And'}
                                                        </span>
                                                        <select value={rule.field} onChange={e => updateRule(rule.id, 'field', e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#63A6B2] outline-none">
                                                            <option value="donor_name">Donor Name</option>
                                                            <option value="campaign_name">Campaign</option>
                                                            <option value="payment_method">Payment Method</option>
                                                            <option value="amount">Amount</option>
                                                            <option value="initiated_at">Date</option>
                                                        </select>
                                                    </div>
                                                    
                                                    <select value={rule.operator} onChange={e => updateRule(rule.id, 'operator', e.target.value)} className="bg-gray-50 border border-gray-200 text-[#63A6B2] font-bold text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#63A6B2] outline-none min-w-[120px]">
                                                        {rule.field === 'amount' ? (
                                                            <><option value="=">Equals (=)</option><option value=">">Greater Than (&gt;)</option><option value="<">Less Than (&lt;)</option></>
                                                        ) : rule.field === 'initiated_at' ? (
                                                            <><option value="exact">On exact date</option><option value="before">Before</option><option value="after">After</option></>
                                                        ) : (
                                                            <><option value="contains">Contains</option><option value="equals">Equals</option><option value="starts_with">Starts With</option></>
                                                        )}
                                                    </select>
                                                    
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <input 
                                                            type={rule.field === 'amount' ? 'number' : rule.field === 'initiated_at' ? 'date' : 'text'}
                                                            className="flex-1 bg-white border border-gray-300 text-gray-900 font-medium text-sm rounded-lg px-4 py-1.5 focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition outline-none" 
                                                            placeholder="Value..." 
                                                            value={rule.value} 
                                                            onChange={e => updateRule(rule.id, 'value', e.target.value)} 
                                                        />
                                                        <button onClick={() => removeRule(rule.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Remove condition"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {searchRules.length === 0 && (
                                                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-white/50 text-gray-400">
                                                    <p className="text-sm font-semibold italic">No conditions applied.</p>
                                                    <p className="text-xs mt-1">Showing all {sortedDonations.length} matching rows.</p>
                                                </div>
                                            )}
                                        </div>

                                        <button onClick={addRule} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:border-[#63A6B2] hover:text-[#63A6B2] font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-sm">
                                            <Plus className="w-4 h-4" /> Add Condition
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <span className="text-[#63A6B2]">{sortedDonations.length}</span> records match filter
                                    </div>
                                    <div className="text-[10px] bg-white px-2 py-1 rounded text-gray-400 font-bold tracking-widest border border-gray-200 shadow-sm">DATA_SET: ADVANCED</div>
                                </div>

                                <div className="overflow-x-auto min-h-[350px]">
                                    <table className="w-full text-left font-inter">
                                        <thead className="bg-[#f8fafc] border-b border-gray-200/80">
                                            <tr>
                                                {visibleColumns.donor_name && <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors border-r border-slate-100 last:border-0" onClick={() => handleSort('donor_name')}><div className="flex items-center justify-between">Donor Detail <SortIcon columnKey="donor_name" sortConfig={sortConfig} /></div></th>}
                                                {visibleColumns.campaign_name && <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors border-r border-slate-100 last:border-0" onClick={() => handleSort('campaign_name')}><div className="flex items-center justify-between">Campaign <SortIcon columnKey="campaign_name" sortConfig={sortConfig} /></div></th>}
                                                {visibleColumns.payment_method && <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors border-r border-slate-100 last:border-0 text-center" onClick={() => handleSort('payment_method')}><div className="flex items-center justify-center gap-2">Method <SortIcon columnKey="payment_method" sortConfig={sortConfig} /></div></th>}
                                                {visibleColumns.payment_status && <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors border-r border-slate-100 last:border-0 text-center" onClick={() => handleSort('payment_status')}><div className="flex items-center justify-center gap-2">Status <SortIcon columnKey="payment_status" sortConfig={sortConfig} /></div></th>}
                                                {visibleColumns.amount && <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors border-r border-slate-100 last:border-0" onClick={() => handleSort('amount')}><div className="flex items-center justify-end gap-2">Amount <SortIcon columnKey="amount" sortConfig={sortConfig} /></div></th>}
                                                {visibleColumns.initiated_at && <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors border-r border-slate-100 last:border-0" onClick={() => handleSort('initiated_at')}><div className="flex items-center justify-end gap-2">Date <SortIcon columnKey="initiated_at" sortConfig={sortConfig} /></div></th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100/60 bg-white">
                                            {sortedDonations.map((don, i) => (
                                                <tr key={i} className="hover:bg-blue-50/30 transition-colors duration-150 relative group">
                                                    {visibleColumns.donor_name && <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-800 text-sm mb-0.5">{don.donor_name}</div>
                                                        <div className="text-[10px] text-gray-400 font-semibold font-mono tracking-tighter truncate max-w-[150px]">{don.donation_id}</div>
                                                    </td>}
                                                    {visibleColumns.campaign_name && <td className="px-6 py-4">
                                                        <div className="text-xs text-gray-700 font-bold hover:text-[#63A6B2] transition line-clamp-2 leading-tight max-w-[200px]">
                                                            {don.campaign_name}
                                                        </div>
                                                    </td>}
                                                    {visibleColumns.payment_method && <td className="px-6 py-4 text-center">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{don.payment_method}</span>
                                                        </div>
                                                    </td>}
                                                    {visibleColumns.payment_status && <td className="px-6 py-4 text-center">
                                                        {don.payment_status === 'completed' && <div className="inline-flex items-center px-2 py-1 bg-emerald-50 border border-emerald-100 rounded text-[10px] font-black tracking-widest text-emerald-600 uppercase"><CheckCircle2 className="w-3 h-3 mr-1" /> Raised</div>}
                                                        {don.payment_status === 'pending' && <div className="inline-flex items-center px-2 py-1 bg-orange-50 border border-orange-100 rounded text-[10px] font-black tracking-widest text-orange-600 uppercase"><Clock className="w-3 h-3 mr-1" /> Pending</div>}
                                                        {don.payment_status === 'failed' && <div className="inline-flex items-center px-2 py-1 bg-red-50 border border-red-100 rounded text-[10px] font-black tracking-widest text-red-600 uppercase"><XCircle className="w-3 h-3 mr-1" /> Failed</div>}
                                                    </td>}
                                                    {visibleColumns.amount && <td className="px-6 py-4 text-right">
                                                        <div className="text-sm font-black text-gray-900 drop-shadow-sm">{formatCurrency(don.amount)}</div>
                                                    </td>}
                                                    {visibleColumns.initiated_at && <td className="px-6 py-4 text-right">
                                                        <div className="text-xs text-gray-500 font-semibold bg-gray-50 inline-block px-2 py-1 rounded border border-gray-100">
                                                            {new Date(don.initiated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    </td>}
                                                </tr>
                                            ))}
                                            {(!sortedDonations || sortedDonations.length === 0) && !isLoading && (
                                                <tr>
                                                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length || 6} className="text-center py-24 bg-gray-50/50">
                                                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                            <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                                                <Search className="w-8 h-8 text-gray-300" />
                                                            </div>
                                                            <h4 className="text-gray-900 font-bold mb-1">No matching donations found</h4>
                                                            <p className="text-sm text-gray-500 mb-4">Try adjusting or clearing your SearchBuilder conditions.</p>
                                                            <button onClick={clearRules} className="text-sm font-black text-[#63A6B2] hover:text-[#4d8b96] hover:underline transition">Clear all conditions</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ════════════════════════════════════════════════════════
                        TAB 2 — SITE ANALYTICS
                    ════════════════════════════════════════════════════════ */}
                    {activeTab === 'analytics' && (
                        <>
                            {/* Analytics Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-[#63A6B2]" /> Google Analytics 4 · Site Traffic
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Property ID: <span className="font-bold text-gray-600">{import.meta.env.VITE_GA_PROPERTY_ID || '533047358'}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Range:</span>
                                    {['7', '30', '90'].map(d => (
                                        <button key={d} onClick={() => setGaDays(d)} className={`px-4 py-2 text-sm font-bold rounded-lg transition ${gaDays === d ? 'bg-[#63A6B2] text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{d}d</button>
                                    ))}
                                    <button onClick={fetchAnalyticsData} disabled={gaLoading} className="ml-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-600" title="Refresh">
                                        <RefreshCw className={`w-4 h-4 ${gaLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* GA Not Configured Banner */}
                            {!gaLoading && gaOverview && !isGAConfigured && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                                    <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-amber-800">Google Analytics Not Yet Active</p>
                                        <p className="text-sm text-amber-700 mt-1">{gaOverview.message}</p>
                                        <p className="text-xs text-amber-600 mt-2">DB-powered sections below (Partial Donations, Top Donors per Campaign) are always available.</p>
                                    </div>
                                </div>
                            )}

                            {/* Loading Skeleton */}
                            {gaLoading && (
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
                                </div>
                            )}

                            {/* ── GA4 Overview Cards ─────────────────────────────────── */}
                            {!gaLoading && isGAConfigured && gaOverview && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    <AnalyticsCard icon={<Activity className="w-5 h-5" />} label="Total Visits" value={gaOverview.sessions?.toLocaleString() || '—'} color="bg-[#63A6B2]" />
                                    <AnalyticsCard icon={<Users className="w-5 h-5" />} label="Unique Users" value={gaOverview.totalUsers?.toLocaleString() || '—'} color="bg-purple-500" />
                                    <AnalyticsCard icon={<BarChart3 className="w-5 h-5" />} label="Page Views" value={gaOverview.pageViews?.toLocaleString() || '—'} color="bg-blue-500" />
                                    <AnalyticsCard icon={<TrendingUp className="w-5 h-5" />} label="Bounce Rate" value={`${gaOverview.bounceRate || '—'}%`} color="bg-orange-500" />
                                    <AnalyticsCard icon={<Clock className="w-5 h-5" />} label="Avg Session" value={gaOverview.avgSessionDuration ? formatDuration(gaOverview.avgSessionDuration) : '—'} color="bg-emerald-500" />
                                </div>
                            )}

                            {/* ── Location + Device Row ─────────────────────────────── */}
                            {!gaLoading && isGAConfigured && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Geographic Data */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6 border-l-4 border-[#63A6B2] pl-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Location / Regional Data</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Users by country (last {gaDays} days)</p>
                                            </div>
                                            <MapPin className="w-5 h-5 text-[#63A6B2] ml-auto flex-shrink-0" />
                                        </div>
                                        {gaGeo?.countries?.length > 0 ? (
                                            <>
                                                <div className="h-[260px] mb-4">
                                                    <Bar
                                                        data={geoBarData}
                                                        options={{
                                                            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                                                            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw.toLocaleString()} users` } } },
                                                            scales: { x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } } }, y: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' } } } }
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-2 border-t border-gray-50 pt-4">
                                                    {gaGeo.countries.slice(0, 5).map((c, i) => {
                                                        const max = gaGeo.countries[0]?.users || 1;
                                                        return (
                                                            <div key={i} className="flex items-center gap-3 text-xs">
                                                                <span className="w-5 text-gray-400 font-bold">{i + 1}</span>
                                                                <span className="font-bold text-gray-700 w-28 truncate">{c.country}</span>
                                                                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                                                    <div className="h-1.5 rounded-full bg-[#63A6B2]" style={{ width: `${(c.users / max) * 100}%` }} />
                                                                </div>
                                                                <span className="font-black text-gray-900 w-12 text-right">{c.users.toLocaleString()}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                                                <MapPin className="w-12 h-12 mb-3 opacity-30" />
                                                <p className="text-sm italic">No location data yet</p>
                                                <p className="text-xs mt-1">Data appears after site receives traffic</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Device Breakdown */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6 border-l-4 border-indigo-500 pl-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Device Breakdown</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">iOS · Android · Mobile · Desktop</p>
                                            </div>
                                            <Monitor className="w-5 h-5 text-indigo-500 ml-auto flex-shrink-0" />
                                        </div>
                                        {deviceDoughnutData ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-52 h-52 mb-6">
                                                    <Doughnut data={deviceDoughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw.toLocaleString()} sessions` } } }, cutout: '65%' }} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 w-full">
                                                    {[
                                                        { label: 'iOS', icon: <Smartphone className="w-3.5 h-3.5" />, value: deviceSummary?.ios, color: '#63A6B2' },
                                                        { label: 'Android', icon: <Smartphone className="w-3.5 h-3.5" />, value: deviceSummary?.android, color: '#10B981' },
                                                        { label: 'Desktop', icon: <Monitor className="w-3.5 h-3.5" />, value: deviceSummary?.desktop, color: '#3B82F6' },
                                                        { label: 'Mobile Web', icon: <Smartphone className="w-3.5 h-3.5" />, value: deviceSummary?.mobile, color: '#F97316' },
                                                        { label: 'Tablet', icon: <Tablet className="w-3.5 h-3.5" />, value: deviceSummary?.tablet, color: '#8B5CF6' },
                                                    ].map((item, i) => (
                                                        <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                            <div className="p-1.5 rounded-lg text-white flex-shrink-0" style={{ backgroundColor: item.color }}>{item.icon}</div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</p>
                                                                <p className="text-sm font-black text-gray-900">{(item.value || 0).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                                                <Monitor className="w-12 h-12 mb-3 opacity-30" />
                                                <p className="text-sm italic">No device data yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── Partial Donations ─────────────────────────────────── */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="border-l-4 border-amber-400 pl-3">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <XCircle className="w-5 h-5 text-amber-500" /> Partial / Incomplete Donations
                                        </h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Pending, initiated, or failed transactions</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {partialDons?.summary?.map((s, i) => (
                                            <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${s.payment_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {s.payment_status}: {s.count}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {gaLoading ? (
                                    <div className="h-40 animate-pulse bg-gray-50 rounded-xl" />
                                ) : partialDons?.donations?.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    {['Donor', 'Campaign', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                                                        <th key={h} className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {partialDons.donations.map((d, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/50 transition">
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-gray-800">{d.donor_name}</div>
                                                            <div className="text-[10px] text-gray-400">{d.donor_email}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-gray-600 font-medium max-w-[160px] truncate">{d.campaign_name}</td>
                                                        <td className="px-4 py-3 font-black text-gray-900">{formatCurrency(d.amount)}</td>
                                                        <td className="px-4 py-3 text-xs text-gray-500 uppercase font-bold">{d.payment_method || '—'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${d.payment_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {d.payment_status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(d.initiated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                                        <CheckCircle2 className="w-12 h-12 mb-3 opacity-30" />
                                        <p className="text-sm italic font-medium text-gray-400">No incomplete donations found</p>
                                    </div>
                                )}
                            </div>

                            {/* ── Top Donors per Campaign ───────────────────────────── */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="border-l-4 border-[#63A6B2] pl-3 mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-[#63A6B2]" /> Top Donors per Campaign
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Top 5 donors ranked for each campaign</p>
                                </div>
                                {gaLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse bg-gray-50 rounded-xl" />)}
                                    </div>
                                ) : topPerCamp.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {topPerCamp.map((camp) => (
                                            <div key={camp.campaign_id} className="border border-gray-100 rounded-xl overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedCamp(expandedCamp === camp.campaign_id ? null : camp.campaign_id)}
                                                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white hover:from-[#f0f9fa] transition"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-2 h-2 rounded-full bg-[#63A6B2] flex-shrink-0" />
                                                        <span className="font-bold text-gray-800 text-sm truncate">{camp.campaign_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{camp.donors.length} donors</span>
                                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedCamp === camp.campaign_id ? 'rotate-180' : ''}`} />
                                                    </div>
                                                </button>
                                                {(expandedCamp === camp.campaign_id || topPerCamp.length <= 6) && (
                                                    <div className="divide-y divide-gray-50">
                                                        {camp.donors.map((donor, idx) => (
                                                            <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition">
                                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-gray-200 text-gray-600'}`}>
                                                                    {idx + 1}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-bold text-gray-800 truncate">{donor.donor_name}</p>
                                                                    <p className="text-[10px] text-gray-400">{donor.donation_count} donation{donor.donation_count !== 1 ? 's' : ''}</p>
                                                                </div>
                                                                <p className="text-sm font-black text-[#63A6B2] flex-shrink-0">{formatCurrency(donor.total_amount)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                                        <Award className="w-12 h-12 mb-3 opacity-30" />
                                        <p className="text-sm italic font-medium text-gray-400">No campaign donor data available</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

function SortIcon({ columnKey, sortConfig }) {
    const isActive = sortConfig.key === columnKey;
    const isAsc = isActive && sortConfig.direction === 'asc';
    const isDesc = isActive && sortConfig.direction === 'desc';
    return (
        <div className="flex flex-col ml-1.5 -space-y-1 opacity-80">
            <ChevronUp className={`w-2.5 h-2.5 ${isAsc ? 'text-[#63A6B2]' : 'text-gray-300'}`} />
            <ChevronDown className={`w-2.5 h-2.5 ${isDesc ? 'text-[#63A6B2]' : 'text-gray-300'}`} />
        </div>
    );
}

function SummaryCard({ title, value, icon, color }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">{title}</p>
                    <h4 className="text-2xl font-black text-gray-900 truncate">{value}</h4>
                </div>
                <div className={`${color} p-3 rounded-2xl shadow-lg flex-shrink-0 animate-pulse-slow`}>{icon}</div>
            </div>
        </div>
    );
}

function AnalyticsCard({ icon, label, value, color }) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center gap-3 mb-3">
                <div className={`${color} p-2 rounded-xl text-white`}>{icon}</div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
        </div>
    );
}
