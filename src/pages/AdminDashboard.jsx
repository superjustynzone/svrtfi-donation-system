import React, { useState, useEffect } from 'react';
import {
    Home, Users, DollarSign, PieChart, FileText, BarChart3,
    UserCog, Settings, AlertTriangle, Search, Plus,
    TrendingUp, TrendingDown, X, Menu, LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Dashboard data state
    const [dashboardData, setDashboardData] = useState({
        stats: {
            totalDonations: 0,
            activeDonors: 0,
            activeCampaigns: 0,
            avgDonation: 0,
            trends: {
                donations: 0,
                donors: 0,
                campaigns: 0,
                avgDonation: 0
            }
        },
        recentDonations: [],
        topCampaigns: [],
        donationTrends: [],
        paymentMethods: [],
        donorTypes: {
            recurring: 0,
            oneTime: 0
        },
        recentActivity: []
    });
    const [campaigns, setCampaigns] = useState([]);

    // Form state for new donation
    const [donationForm, setDonationForm] = useState({
        donorName: '',
        email: '',
        amount: '',
        paymentMethod: 'GCash',
        campaign: '',
        notes: ''
    });

    // Fetch dashboard data
    useEffect(() => {
        fetchDashboardData();
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/campaigns');
            if (!res.ok) throw new Error('Failed to fetch campaigns');
            const data = await res.json();
            setCampaigns(data);
        } catch (error) {
            console.error("Failed to fetch campaigns:", error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch dashboard data');

            const data = await response.json();
            setDashboardData(data);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load live dashboard stats. Using fallback state.');
        } finally {
            setIsLoading(false);
        }
    };

    // Chart configuration
    const chartData = {
        labels: dashboardData.donationTrends.length > 0 ? dashboardData.donationTrends.map(d => d.month) : ['Jan', 'Feb', 'Mar'],
        datasets: [
            {
                label: 'Donations',
                data: dashboardData.donationTrends.length > 0 ? dashboardData.donationTrends.map(d => d.amount) : [0, 0, 0],
                borderColor: '#63A6B2',
                backgroundColor: 'rgba(99, 166, 178, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#63A6B2',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#63A6B2',
                padding: 12,
                titleFont: {
                    size: 14,
                    weight: 'bold'
                },
                bodyFont: {
                    size: 13
                },
                callbacks: {
                    label: function (context) {
                        return '₱' + context.parsed.y.toLocaleString();
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#f5f5f4',
                    drawBorder: false
                },
                ticks: {
                    callback: function (value) {
                        return '₱' + (value / 1000) + 'K';
                    },
                    font: {
                        size: 11
                    },
                    color: '#78716c'
                }
            },
            x: {
                grid: {
                    display: false,
                    drawBorder: false
                },
                ticks: {
                    font: {
                        size: 11
                    },
                    color: '#78716c'
                }
            }
        }
    };

    // Handle form changes
    const handleFormChange = (e) => {
        setDonationForm({
            ...donationForm,
            [e.target.name]: e.target.value
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
        setTimeout(() => {
            navigate('/login');
        }, 500);
    };

    // Handle donation submission
    const handleDonationSubmit = async (e) => {
        e.preventDefault();

        if (!donationForm.donorName || !donationForm.email || !donationForm.amount || !donationForm.campaign) {
            toast.error('Please fill in all required fields, including campaign');
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/donations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    campaign_id: donationForm.campaign,
                    amount: donationForm.amount,
                    donor_name: donationForm.donorName,
                    donor_email: donationForm.email,
                    payment_method: donationForm.paymentMethod,
                    message: donationForm.notes
                })
            });

            if (!response.ok) throw new Error('Failed to create donation');

            toast.success('Donation added successfully!');
            setModalOpen(false);
            setDonationForm({
                donorName: '',
                email: '',
                amount: '',
                paymentMethod: 'GCash',
                campaign: '',
                notes: ''
            });

            // Refresh dashboard data
            fetchDashboardData();

        } catch (error) {
            toast.error('Failed to add donation. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return '₱' + (amount ? amount.toLocaleString() : '0');
    };

    // Get status badge color
    const getStatusColor = (status) => {
        const colors = {
            'success': 'bg-green-100 text-green-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'failed': 'bg-red-100 text-red-800'
        };
        return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    };

    // Get activity icon
    const getActivityIcon = (type) => {
        const icons = {
            'dollar': <DollarSign className="w-5 h-5 text-green-600" />,
            'user': <Users className="w-5 h-5 text-blue-600" />,
            'file': <FileText className="w-5 h-5 text-purple-600" />,
            'chart': <PieChart className="w-5 h-5 text-yellow-600" />
        };
        return icons[type] || <Home className="w-5 h-5" />;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafb]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#63A6B2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
            <AdminSidebar
                activePage="dashboard"
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />

            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <main className="flex-1 overflow-y-auto">
                <AdminHeader
                    title="Dashboard Overview"
                    subtitle="Welcome back, monitor your donation activities"
                    onMobileMenuClick={() => setMobileMenuOpen(true)}
                />

                <div className="p-4 lg:p-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            icon={<DollarSign className="w-6 h-6 text-white" />}
                            iconBg="from-[#63A6B2] to-[#4d8b96]"
                            title="Total Donations"
                            value={formatCurrency(dashboardData.stats.totalDonations)}
                            trend={dashboardData.stats.trends.donations}
                            trendLabel={dashboardData.stats.trends.donations > 0 ? `+₱${dashboardData.stats.trends.donations.toLocaleString()} from last month` : "Live database total"}
                        />
                        <StatCard
                            icon={<Users className="w-6 h-6 text-white" />}
                            iconBg="from-[#f0a500] to-[#ffb732]"
                            title="Active Donors"
                            value={dashboardData.stats.activeDonors.toLocaleString()}
                            trend={dashboardData.stats.trends.donors}
                            trendLabel={dashboardData.stats.trends.donors > 0 ? `+${dashboardData.stats.trends.donors} new this month` : "Active contributor count"}
                        />
                        <StatCard
                            icon={<PieChart className="w-6 h-6 text-white" />}
                            iconBg="from-blue-500 to-blue-400"
                            title="Active Campaigns"
                            value={dashboardData.stats.activeCampaigns}
                            isLive
                            trendLabel="Real-time status"
                        />
                        <StatCard
                            icon={<BarChart3 className="w-6 h-6 text-white" />}
                            iconBg="from-purple-500 to-purple-400"
                            title="Avg Donation"
                            value={formatCurrency(dashboardData.stats.avgDonation)}
                            trendLabel={`Based on ${dashboardData.stats.activeDonors} donors`}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Donation Trends Chart */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Donation Trends</h3>
                                    <p className="text-sm text-gray-500">Monthly overview</p>
                                </div>
                            </div>
                            <div className="h-64">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>

                        {/* Top Campaigns */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Top Campaigns</h3>
                                <p className="text-sm text-gray-500">By total raised</p>
                            </div>
                            <div className="space-y-4">
                                {dashboardData.topCampaigns?.map((campaign, index) => (
                                    <CampaignProgress
                                        key={index}
                                        name={campaign.name}
                                        raised={campaign.raised}
                                        goal={campaign.goal}
                                        progress={campaign.progress}
                                    />
                                ))}
                                {dashboardData.topCampaigns?.length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-8">No campaigns found</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Recent Donations</h3>
                                    <p className="text-sm text-gray-500">Latest transactions</p>
                                </div>
                                <a href="/admin_donations" className="text-sm font-semibold text-[#63A6B2] hover:underline">View All →</a>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Donor</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Campaign</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData.recentDonations?.map((donation) => (
                                            <tr key={donation.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${donation.donor.color} flex items-center justify-center text-white text-xs font-bold`}>
                                                            {donation.donor.initials}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-sm text-gray-900">{donation.donor.name}</p>
                                                            <p className="text-xs text-gray-500">{donation.donor.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-600">{donation.campaign}</td>
                                                <td className="py-4 px-4 font-bold text-sm text-gray-900">{formatCurrency(donation.amount)}</td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(donation.status)}`}>
                                                        {donation.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {dashboardData.recentDonations?.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="text-center py-8 text-gray-400">No recent donations</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Methods</h3>
                                <div className="space-y-3">
                                    {dashboardData.paymentMethods?.map((method, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">{method.name || 'Unknown'}</span>
                                            <span className="text-sm font-bold text-gray-900">{method.percentage}%</span>
                                        </div>
                                    ))}
                                    {dashboardData.paymentMethods?.length === 0 && (
                                        <p className="text-sm text-gray-400">No data</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Donor Types</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-600">Recurring</span>
                                            <span className="text-sm font-bold text-gray-900">{dashboardData.donorTypes.recurring}</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#63A6B2] to-[#f0a500] rounded-full transition-all duration-1000"
                                                style={{ width: `${(dashboardData.donorTypes.recurring / (dashboardData.donorTypes.recurring + dashboardData.donorTypes.oneTime + 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-600">One-time</span>
                                            <span className="text-sm font-bold text-gray-900">{dashboardData.donorTypes.oneTime}</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#63A6B2] to-[#f0a500] rounded-full transition-all duration-1000"
                                                style={{ width: `${(dashboardData.donorTypes.oneTime / (dashboardData.donorTypes.recurring + dashboardData.donorTypes.oneTime + 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                                <p className="text-sm text-gray-500">System and user actions</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {dashboardData.recentActivity?.map((activity) => (
                                <div key={activity.id} className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center`}>
                                            {getActivityIcon(activity.icon)}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">
                                            <span className="font-semibold">{activity.user} </span>
                                            {activity.action}
                                            {activity.target && <span className="font-semibold"> {activity.target}</span>}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                            {dashboardData.recentActivity?.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-gray-900">Add New Donation</h3>
                                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleDonationSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Donor Name *</label>
                                <input
                                    type="text"
                                    name="donorName"
                                    value={donationForm.donorName}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2]"
                                    placeholder="Enter donor name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={donationForm.email}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2]"
                                    placeholder="donor@email.com"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={donationForm.amount}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2]"
                                        placeholder="5000"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Payment</label>
                                    <select
                                        name="paymentMethod"
                                        value={donationForm.paymentMethod}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2]"
                                    >
                                        <option>GCash</option>
                                        <option>PayMaya</option>
                                        <option>Bank Transfer</option>
                                        <option>Cash</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign *</label>
                                <select
                                    name="campaign"
                                    value={donationForm.campaign}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2]"
                                    required
                                >
                                    <option value="">Select a campaign</option>
                                    {campaigns.map(c => (
                                        <option key={c.campaign_id} value={c.campaign_id}>
                                            {c.campaign_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                                <textarea
                                    name="notes"
                                    value={donationForm.notes}
                                    onChange={handleFormChange}
                                    rows="2"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2]"
                                    placeholder="Optional notes"
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border-2 border-[#63A6B2] text-[#63A6B2] rounded-lg font-semibold">Cancel</button>
                                <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-[#63A6B2] text-white rounded-lg font-semibold disabled:opacity-50">{isLoading ? 'Saving...' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, iconBg, title, value, trend, trendLabel, isLive }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${iconBg} flex items-center justify-center`}>
                    {icon}
                </div>
                {isLive ? (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                ) : trend !== undefined && (
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
            <p className="text-xs text-gray-500">{trendLabel}</p>
        </div>
    );
}

function CampaignProgress({ name, raised, goal, progress }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">{name}</span>
                <span className="text-sm font-bold text-[#63A6B2]">₱{(parseFloat(raised) / 1000).toFixed(0)}K</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-[#63A6B2] to-[#f0a500] rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress}% of ₱{(parseFloat(goal) / 1000).toFixed(0)}K goal</p>
        </div>
    );
}