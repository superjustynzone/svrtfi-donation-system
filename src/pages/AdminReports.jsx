import React, { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, Users, DollarSign,
    Calendar, ArrowUpRight, ArrowDownRight, Download,
    CheckCircle2, Target, History
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function AdminReports() {
    const [summary, setSummary] = useState(null);
    const [trends, setTrends] = useState([]);
    const [interval, setInterval] = useState('month');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchReportData();
    }, [interval]);

    const fetchReportData = async () => {
        try {
            setIsLoading(true);
            const [summaryRes, trendsRes] = await Promise.all([
                fetch('http://localhost:5000/api/admin/reports/summary', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch(`http://localhost:5000/api/admin/reports/trends?interval=${interval}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            if (!summaryRes.ok) throw new Error('Summary API failed');
            if (!trendsRes.ok) throw new Error('Trends API failed');

            const summaryData = await summaryRes.json();
            const trendsData = await trendsRes.json();

            setSummary(summaryData);
            setTrends(Array.isArray(trendsData) ? trendsData : []);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load report data. Please check your connection or permissions.');
        } finally {
            setIsLoading(false);
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
            return interval === 'week'
                ? `Wk ${date.toLocaleDateString()}`
                : date.toLocaleDateString('en-US', { month: 'short' });
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

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
            <AdminSidebar activePage="reports" />

            <main className="flex-1 overflow-y-auto">
                <AdminHeader
                    title="Analytics & Reports"
                    subtitle="Visualize donation trends and campaign performance"
                >
                    <button className="px-4 py-2 bg-[#63A6B2] text-white rounded-lg font-semibold hover:bg-[#4d8b96] transition flex items-center gap-2 shadow-sm">
                        <Download className="w-5 h-5" />
                        <span>Download Report</span>
                    </button>
                </AdminHeader>

                <div className="p-4 lg:p-8 space-y-8">
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

                    {/* Chart & Top Campaigns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Trend Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-gray-900 border-l-4 border-[#63A6B2] pl-3">Donation Analytics</h3>
                                <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
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
                            <div className="h-[350px] w-full">
                                {isLoading ? (
                                    <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#63A6B2]"></div>
                                    </div>
                                ) : (
                                    <Line data={chartData} options={chartOptions} />
                                )}
                            </div>
                        </div>

                        {/* Top Campaigns */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-orange-400 pl-3">Top Campaigns</h3>
                            <div className="space-y-4 flex-1 overflow-y-auto">
                                {summary?.topCampaigns?.map((camp, idx) => (
                                    <div key={idx} className="flex items-center gap-4 group p-2 hover:bg-gray-50 rounded-xl transition">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex-shrink-0 flex items-center justify-center font-bold text-orange-600 text-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 text-sm truncate group-hover:text-[#63A6B2] transition">
                                                {camp.campaign_name}
                                            </p>
                                            <p className="text-xs text-gray-500 font-medium">
                                                {formatCurrency(camp.total)} raised
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!summary?.topCampaigns || summary.topCampaigns.length === 0) && !isLoading && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 italic py-10">
                                        <History className="w-12 h-12 mb-3 opacity-20" />
                                        <p>No campaign data yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Section */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-blue-500 pl-3">Recent Donations</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Donor</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Campaign</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Amount</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {summary?.recentDonations?.map((don, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 font-semibold text-gray-700">{don.donor_name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[200px]">{don.campaign_name}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-[#63A6B2] text-right">{formatCurrency(don.amount)}</td>
                                            <td className="px-4 py-3 text-xs text-gray-400 text-right">{new Date(don.initiated_at).toLocaleTimeString()}</td>
                                        </tr>
                                    ))}
                                    {(!summary?.recentDonations || summary.recentDonations.length === 0) && (
                                        <tr>
                                            <td colSpan="4" className="text-center py-6 text-gray-400 italic">No recent activity</td>
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
