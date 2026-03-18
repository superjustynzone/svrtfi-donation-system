import React, { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, Users, DollarSign,
    Calendar, ArrowUpRight, ArrowDownRight, Download,
    CheckCircle2, Target, History, Award
} from 'lucide-react';
import { toast } from 'sonner';
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

export default function AdminReports() {
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

    useEffect(() => {
        fetchDropdownData();
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [interval, startDate, endDate, campaignId, foundationId, donorId]);

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
            if (donorRes.ok) {
                const data = await donorRes.json();
                setDonors(data.donors || []);
            }
        } catch (err) {
            console.error("Filter data fetch failed:", err);
        }
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

            const [summaryRes, trendsRes, distRes, pmRes] = await Promise.all([
                fetch(`http://localhost:5000/api/admin/reports/summary?${queryParams}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:5000/api/admin/reports/trends?${queryParams}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:5000/api/admin/reports/distribution?${queryParams}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:5000/api/admin/reports/payment-methods?${queryParams}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!summaryRes.ok) throw new Error('Summary API failed');
            if (!trendsRes.ok) throw new Error('Trends API failed');

            const summaryData = await summaryRes.json();
            const trendsData = await trendsRes.json();
            const distData = distRes.ok ? await distRes.json() : [];
            const pmData = pmRes.ok ? await pmRes.json() : [];

            console.log("Reports Data Fetched:", { summaryData, trendsData, distData, pmData });

            setSummary(summaryData);
            setTrends(Array.isArray(trendsData) ? trendsData : []);
            setDistribution(distData);
            setPaymentMethods(pmData);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load report data.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
                ...(campaignId && { campaignId }),
                ...(foundationId && { foundationId }),
                ...(donorId && { donorId })
            }).toString();

            const response = await fetch(`http://localhost:5000/api/admin/reports/download?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `donation_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            toast.error("Failed to download report");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount || 0);
    };

    // Calculate Success Rate %
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
        datasets: [
            {
                label: 'Donations (PHP)',
                data: Array.isArray(trends) ? trends.map(t => parseFloat(t.total_amount || 0)) : [],
                backgroundColor: 'rgba(99, 166, 178, 0.2)',
                borderColor: '#63A6B2',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#63A6B2',
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
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
            backgroundColor: [
                '#63A6B2',
                '#F97316',
                '#3B82F6',
                '#10B981',
                '#8B5CF6'
            ],
            borderRadius: 8,
            barThickness: 20
        }]
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
            <AdminSidebar activePage="reports" />

            <main className="flex-1 overflow-y-auto">
                <AdminHeader
                    title="Analytics & Reports"
                    subtitle="Visualize donation trends and campaign performance"
                >
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-[#63A6B2] text-white rounded-lg font-semibold hover:bg-[#4d8b96] transition flex items-center gap-2 shadow-sm"
                    >
                        <Download className="w-5 h-5" />
                        <span>Download Report</span>
                    </button>
                </AdminHeader>

                <div className="p-4 lg:p-8 space-y-8">
                    {/* Filter Bar */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2 text-gray-700 font-bold">
                            <Calendar className="w-5 h-5 text-[#63A6B2]" />
                            <span>Filter</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Foundation</label>
                                <select
                                    value={foundationId}
                                    onChange={(e) => setFoundationId(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition"
                                >
                                    <option value="">All Foundations</option>
                                    {foundations.map(f => <option key={f.foundation_id} value={f.foundation_id}>{f.foundation_name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Campaign</label>
                                <select
                                    value={campaignId}
                                    onChange={(e) => setCampaignId(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition"
                                >
                                    <option value="">All Campaigns</option>
                                    {campaigns.map(c => <option key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Donor</label>
                                <select
                                    value={donorId}
                                    onChange={(e) => setDonorId(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition"
                                >
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
                    {/* Summary Cards Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <SummaryCard
                            title="Total Raised"
                            value={formatCurrency(summary?.summary?.total_amount)}
                            icon={<DollarSign className="w-6 h-6 text-white" />}
                            color="bg-blue-500"
                        />
                        <SummaryCard
                            title="Total Donors"
                            value={summary?.summary?.total_count || 0}
                            icon={<Users className="w-6 h-6 text-white" />}
                            color="bg-purple-500"
                        />
                        <SummaryCard
                            title="Avg Donation"
                            value={formatCurrency(summary?.summary?.avg_amount)}
                            icon={<Target className="w-6 h-6 text-white" />}
                            color="bg-green-500"
                        />
                        <SummaryCard
                            title="Success Rate"
                            value={`${successRate}%`}
                            icon={<CheckCircle2 className="w-6 h-6 text-white" />}
                            color="bg-teal-500"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Trend Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[450px]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-gray-900 border-l-4 border-[#63A6B2] pl-3">Donation Analytics</h3>
                                <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                    <button
                                        onClick={() => setInterval('day')}
                                        className={`px-4 py-2 text-sm font-semibold transition ${interval === 'day' ? 'bg-[#63A6B2] text-white shadow-inner' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        Daily
                                    </button>
                                    <button
                                        onClick={() => setInterval('week')}
                                        className={`px-4 py-2 text-sm font-semibold transition ${interval === 'week' ? 'bg-[#63A6B2] text-white shadow-inner' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        Weekly
                                    </button>
                                    <button
                                        onClick={() => setInterval('month')}
                                        className={`px-4 py-2 text-sm font-semibold transition ${interval === 'month' ? 'bg-[#63A6B2] text-white shadow-inner' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        Monthly
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 w-full">
                                {isLoading ? (
                                    <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#63A6B2]"></div>
                                    </div>
                                ) : (
                                    <Line data={chartData} options={chartOptions} />
                                )}
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
                                    {isLoading ? (
                                        <div className="h-full w-full animate-pulse bg-gray-100 rounded-full" />
                                    ) : distribution.length > 0 ? (
                                        <Doughnut
                                            data={{
                                                labels: distribution.map(d => d.label),
                                                datasets: [{
                                                    data: distribution.map(d => parseFloat(d.value)),
                                                    backgroundColor: ['#63A6B2', '#F97316', '#3B82F6', '#10B981', '#8B5CF6'],
                                                    borderWidth: 0,
                                                }]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } }
                                            }}
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-300 italic text-sm border-2 border-dashed border-gray-100 rounded-full">
                                            No data
                                        </div>
                                    )}
                                </div>
                                <div className="w-full space-y-2">
                                    {distribution.slice(0, 5).map((d, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 truncate pr-2">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ['#63A6B2', '#F97316', '#3B82F6', '#10B981', '#8B5CF6'][i] }} />
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
                                    {isLoading ? (
                                        <div className="h-full w-full animate-pulse bg-gray-100 rounded-xl" />
                                    ) : paymentMethods.length > 0 ? (
                                        <Bar
                                            data={pmBarData}
                                            options={{
                                                indexAxis: 'y',
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { 
                                                    legend: { display: false },
                                                    tooltip: {
                                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                                        padding: 12,
                                                        titleFont: { size: 12, weight: 'bold' },
                                                        callbacks: {
                                                            label: (context) => ` ${context.raw} donations`
                                                        }
                                                    }
                                                },
                                                scales: {
                                                    x: { 
                                                        beginAtZero: true, 
                                                        grid: { display: false },
                                                        ticks: { display: false }
                                                    },
                                                    y: { 
                                                        grid: { display: false },
                                                        ticks: { font: { size: 10, weight: 'bold' } }
                                                    }
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-300 italic text-sm border-2 border-dashed border-gray-100 rounded-xl">
                                            No data
                                        </div>
                                    )}
                                </div>
                                <div className="w-full space-y-3 pt-4 border-t border-gray-50">
                                    {paymentMethods.map((pm, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 truncate pr-2">
                                                <div className="w-3 h-3 rounded-md flex-shrink-0" style={{ backgroundColor: pmBarData.datasets[0].backgroundColor[i] }} />
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
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex-shrink-0 flex items-center justify-center font-bold text-orange-600 text-sm">
                                            #{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 text-sm truncate group-hover:text-[#63A6B2] transition">
                                                {camp.campaign_name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                {formatCurrency(camp.total)} raised
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!summary?.topCampaigns || summary.topCampaigns.length === 0) && !isLoading && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 italic py-10">
                                        <History className="w-12 h-12 mb-3 opacity-20" />
                                        <p>No campaign data</p>
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
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex-shrink-0 flex items-center justify-center font-bold text-purple-600 text-sm">
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 text-sm truncate group-hover:text-[#63A6B2] transition">
                                                {donor.donor_name}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-[#63A6B2] font-black uppercase tracking-wider">
                                                    {formatCurrency(donor.total_amount)}
                                                </p>
                                                <span className="text-[10px] text-gray-300">•</span>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                    {donor.donation_count} txns
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!summary?.topDonors || summary.topDonors.length === 0) && !isLoading && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 italic py-10">
                                        <Users className="w-12 h-12 mb-3 opacity-20" />
                                        <p>No donor data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Full Width Table */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 border-l-4 border-blue-500 pl-3">Filtered Activity</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Showing latest activity matching filters</p>
                        </div>
                        <div className="overflow-x-auto min-h-[300px]">
                            <table className="w-full text-left font-inter">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Donor Detail</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Campaign</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Method</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {summary?.recentDonations?.map((don, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition border-b border-gray-50">
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-gray-800 text-sm">{don.donor_name}</div>
                                                <div className="text-[10px] text-gray-400 font-medium tracking-tighter">{don.donation_id}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="text-xs text-gray-600 font-bold px-3 py-1 bg-gray-100 rounded-full inline-block truncate max-w-[150px]">{don.campaign_name}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="text-[10px] text-gray-500 font-black uppercase">{don.payment_method}</div>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-black text-[#63A6B2] text-right">
                                                {formatCurrency(don.amount)}
                                            </td>
                                            <td className="px-4 py-4 text-xs text-gray-500 text-right font-medium">
                                                {new Date(don.initiated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!summary?.recentDonations || summary.recentDonations.length === 0) && !isLoading && (
                                        <tr>
                                            <td colSpan="5" className="text-center py-20 text-gray-400 italic bg-gray-50/30 rounded-xl">
                                                <div className="flex flex-col items-center gap-2">
                                                    <History className="w-8 h-8 opacity-20" />
                                                    <span>No donations match your filters</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
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
                <div className={`${color} p-3 rounded-2xl shadow-lg flex-shrink-0 animate-pulse-slow`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
