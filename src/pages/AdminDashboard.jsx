import React, { useState, useEffect } from 'react';
import {
    Home, Users, DollarSign, PieChart, FileText, BarChart3,
    UserCog, Settings, AlertTriangle, Search, Bell, Plus,
    TrendingUp, TrendingDown, X, Menu, LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);

            // Replace with actual API endpoint
            const response = await fetch('/api/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch dashboard data');

            const data = await response.json();
            setDashboardData(data);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);

            // Mock data for development
            setDashboardData({
                stats: {
                    totalDonations: 2547890,
                    activeDonors: 1247,
                    activeCampaigns: 12,
                    avgDonation: 2042,
                    trends: {
                        donations: 12.5,
                        donors: 8.2,
                        campaigns: 0,
                        avgDonation: -3.1
                    }
                },
                recentDonations: [
                    {
                        id: 1,
                        donor: { name: 'Maria Santos', email: 'maria.s@email.com', initials: 'MS', color: 'from-blue-400 to-blue-600' },
                        campaign: 'Medical Mission',
                        amount: 5000,
                        method: 'GCash',
                        status: 'Completed',
                        date: 'Feb 6, 2026'
                    },
                    {
                        id: 2,
                        donor: { name: 'Juan Reyes', email: 'juan.r@email.com', initials: 'JR', color: 'from-green-400 to-green-600' },
                        campaign: 'Education Fund',
                        amount: 10000,
                        method: 'Bank',
                        status: 'Completed',
                        date: 'Feb 5, 2026'
                    },
                    {
                        id: 3,
                        donor: { name: 'Ana Cruz', email: 'ana.c@email.com', initials: 'AC', color: 'from-purple-400 to-purple-600' },
                        campaign: 'Building Restoration',
                        amount: 25000,
                        method: 'PayMaya',
                        status: 'Pending',
                        date: 'Feb 5, 2026'
                    },
                    {
                        id: 4,
                        donor: { name: 'Roberto Lopez', email: 'roberto.l@email.com', initials: 'RL', color: 'from-yellow-400 to-yellow-600' },
                        campaign: 'General Fund',
                        amount: 3500,
                        method: 'Cash',
                        status: 'Completed',
                        date: 'Feb 4, 2026'
                    },
                    {
                        id: 5,
                        donor: { name: 'Lisa Garcia', email: 'lisa.g@email.com', initials: 'LG', color: 'from-pink-400 to-pink-600' },
                        campaign: 'Youth Programs',
                        amount: 7500,
                        method: 'PayPal',
                        status: 'Completed',
                        date: 'Feb 4, 2026'
                    }
                ],
                topCampaigns: [
                    { name: 'Medical Mission 2024', raised: 850000, goal: 1000000, progress: 85 },
                    { name: 'Education Fund', raised: 620000, goal: 850000, progress: 72 },
                    { name: 'Building Restoration', raised: 445000, goal: 750000, progress: 59 },
                    { name: 'Community Outreach', raised: 280000, goal: 500000, progress: 56 },
                    { name: 'Youth Programs', raised: 195000, goal: 400000, progress: 48 }
                ],
                donationTrends: [
                    { month: 'Jan', amount: 185000 },
                    { month: 'Feb', amount: 220000 },
                    { month: 'Mar', amount: 195000 },
                    { month: 'Apr', amount: 245000 },
                    { month: 'May', amount: 280000 },
                    { month: 'Jun', amount: 255000 },
                    { month: 'Jul', amount: 290000 },
                    { month: 'Aug', amount: 310000 },
                    { month: 'Sep', amount: 275000 },
                    { month: 'Oct', amount: 320000 },
                    { month: 'Nov', amount: 298000 },
                    { month: 'Dec', amount: 254789 }
                ],
                paymentMethods: [
                    { name: 'Bank Transfer', percentage: 38 },
                    { name: 'GCash', percentage: 27 },
                    { name: 'PayMaya', percentage: 20 },
                    { name: 'Cash', percentage: 15 }
                ],
                donorTypes: {
                    recurring: 542,
                    oneTime: 705
                },
                recentActivity: [
                    {
                        id: 1,
                        type: 'donation',
                        user: 'Maria Santos',
                        action: 'made a donation of',
                        amount: 5000,
                        target: 'Medical Mission 2024',
                        time: '2 minutes ago',
                        icon: 'dollar'
                    },
                    {
                        id: 2,
                        type: 'user',
                        user: 'Admin',
                        action: 'added new donor',
                        target: 'Pedro Pascual',
                        time: '15 minutes ago',
                        icon: 'user'
                    },
                    {
                        id: 3,
                        type: 'receipt',
                        action: 'Receipt',
                        target: '#REC-2024-0245',
                        extra: 'generated for Juan Reyes',
                        time: '1 hour ago',
                        icon: 'file'
                    },
                    {
                        id: 4,
                        type: 'campaign',
                        action: 'New campaign',
                        target: 'Summer Relief 2024',
                        extra: 'created',
                        time: '3 hours ago',
                        icon: 'chart'
                    },
                    {
                        id: 5,
                        type: 'donation',
                        user: 'Ana Cruz',
                        action: 'made a donation of',
                        amount: 25000,
                        target: 'Building Restoration',
                        time: '5 hours ago',
                        icon: 'dollar'
                    }
                ]
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Chart configuration
    const chartData = {
        labels: dashboardData.donationTrends.map(d => d.month),
        datasets: [
            {
                label: 'Donations',
                data: dashboardData.donationTrends.map(d => d.amount),
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

    // Handle donation submission
    const handleDonationSubmit = async (e) => {
        e.preventDefault();

        if (!donationForm.donorName || !donationForm.email || !donationForm.amount) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsLoading(true);

            // Replace with actual API endpoint
            const response = await fetch('/api/admin/donations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(donationForm)
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
        return '₱' + amount.toLocaleString();
    };

    // Get status badge color
    const getStatusColor = (status) => {
        const colors = {
            'Completed': 'bg-green-100 text-green-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Failed': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
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
            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gradient-to-b from-[#63A6B2] to-[#4d8b96]
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shadow-2xl flex flex-col
      `}>
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-lg leading-tight">SVRTFI</h1>
                                <p className="text-white/70 text-xs">Donation CRM</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="lg:hidden text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 overflow-y-auto">
                    <div className="px-3 space-y-1">
                        <NavItem icon={<Home />} label="Dashboard" active />
                        <NavItem icon={<Users />} label="Donors" onClick={() => navigate('/admin_donors')} />
                        <NavItem icon={<DollarSign />} label="Donations" onClick={() => navigate('/admin_donations')} />
                        <NavItem icon={<PieChart />} label="Campaigns" onClick={() => navigate('/admin_campaigns')} />
                        <NavItem icon={<FileText />} label="Receipts" onClick={() => navigate('/admin_receipts')} />
                        <NavItem icon={<BarChart3 />} label="Reports" onClick={() => navigate('/admin_reports')} />
                        <NavItem icon={<UserCog />} label="User Management" onClick={() => navigate('/admin_users')} />
                    </div>

                    <div className="px-3 mt-6 pt-6 border-t border-white/10">
                        <div className="text-xs font-semibold text-white/50 px-4 mb-3 uppercase tracking-wider">System</div>
                        <NavItem icon={<Settings />} label="Settings" onClick={() => navigate('/admin_settings')} />
                        <NavItem icon={<AlertTriangle />} label="Audit Logs" onClick={() => navigate('/admin_audit')} />
                    </div>
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-white font-bold">
                            JD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">John Dela Cruz</p>
                            <p className="text-white/60 text-xs truncate">Super Admin</p>
                        </div>
                        <LogOut className="w-4 h-4 text-white/60" />
                    </div>
                </div>
            </aside>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Top Bar */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="lg:hidden text-gray-600 hover:text-gray-900"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <div>
                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                                <p className="text-sm text-gray-500 mt-1">Welcome back, monitor your donation activities</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Search - Hidden on mobile */}
                            <div className="hidden md:block relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search donors, campaigns..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 w-64 lg:w-80"
                                />
                            </div>

                            {/* Notifications */}
                            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
                                <Bell className="w-6 h-6 text-gray-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* Add Donation Button */}
                            <button
                                onClick={() => setModalOpen(true)}
                                className="bg-[#63A6B2] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#4d8b96] transition flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">Add Donation</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-4 lg:p-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            icon={<DollarSign className="w-6 h-6 text-white" />}
                            iconBg="from-[#63A6B2] to-[#4d8b96]"
                            title="Total Donations"
                            value={formatCurrency(dashboardData.stats.totalDonations)}
                            trend={dashboardData.stats.trends.donations}
                            trendLabel="+₱284,120 from last month"
                        />
                        <StatCard
                            icon={<Users className="w-6 h-6 text-white" />}
                            iconBg="from-[#f0a500] to-[#ffb732]"
                            title="Active Donors"
                            value={dashboardData.stats.activeDonors.toLocaleString()}
                            trend={dashboardData.stats.trends.donors}
                            trendLabel="+95 new this month"
                        />
                        <StatCard
                            icon={<PieChart className="w-6 h-6 text-white" />}
                            iconBg="from-blue-500 to-blue-400"
                            title="Active Campaigns"
                            value={dashboardData.stats.activeCampaigns}
                            isLive
                            trendLabel="3 ending this week"
                        />
                        <StatCard
                            icon={<BarChart3 className="w-6 h-6 text-white" />}
                            iconBg="from-purple-500 to-purple-400"
                            title="Avg Donation"
                            value={formatCurrency(dashboardData.stats.avgDonation)}
                            trend={dashboardData.stats.trends.avgDonation}
                            trendLabel="Based on 1,247 donations"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Donation Trends Chart */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Donation Trends</h3>
                                    <p className="text-sm text-gray-500">Monthly overview</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">6M</button>
                                    <button className="px-3 py-1 text-xs font-semibold bg-[#63A6B2] text-white rounded-lg">1Y</button>
                                    <button className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">All</button>
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
                                {dashboardData.topCampaigns.map((campaign, index) => (
                                    <CampaignProgress
                                        key={index}
                                        name={campaign.name}
                                        raised={campaign.raised}
                                        goal={campaign.goal}
                                        progress={campaign.progress}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity and Quick Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Recent Donations Table */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Recent Donations</h3>
                                    <p className="text-sm text-gray-500">Latest transactions</p>
                                </div>
                                <a href="#" className="text-sm font-semibold text-[#63A6B2] hover:underline">View All →</a>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Donor</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Campaign</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase hidden sm:table-cell">Method</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Status</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase hidden xl:table-cell">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData.recentDonations.map((donation) => (
                                            <tr key={donation.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${donation.donor.color} flex items-center justify-center text-white text-xs font-bold`}>
                                                            {donation.donor.initials}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-sm text-gray-900">{donation.donor.name}</p>
                                                            <p className="text-xs text-gray-500 hidden sm:block">{donation.donor.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-600 hidden md:table-cell">{donation.campaign}</td>
                                                <td className="py-4 px-4 font-bold text-sm text-gray-900">{formatCurrency(donation.amount)}</td>
                                                <td className="py-4 px-4 hidden sm:table-cell">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                                        {donation.method}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 hidden lg:table-cell">
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(donation.status)}`}>
                                                        {donation.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-500 hidden xl:table-cell">{donation.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="space-y-6">
                            {/* Payment Methods */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Methods</h3>
                                <div className="space-y-3">
                                    {dashboardData.paymentMethods.map((method, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">{method.name}</span>
                                            <span className="text-sm font-bold text-gray-900">{method.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Donor Types */}
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
                                                style={{ width: `${(dashboardData.donorTypes.recurring / (dashboardData.donorTypes.recurring + dashboardData.donorTypes.oneTime)) * 100}%` }}
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
                                                style={{ width: `${(dashboardData.donorTypes.oneTime / (dashboardData.donorTypes.recurring + dashboardData.donorTypes.oneTime)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-900">Total Active</span>
                                        <span className="text-2xl font-bold text-[#63A6B2]">{dashboardData.donorTypes.recurring + dashboardData.donorTypes.oneTime}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                                <p className="text-sm text-gray-500">System and user actions</p>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="px-4 py-2 border-2 border-[#63A6B2] text-[#63A6B2] rounded-lg font-semibold hover:bg-[#63A6B2] hover:text-white transition flex items-center gap-2"
                                >
                                    Filter
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 transition">All Activities</button>
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 transition">Donations</button>
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 transition">User Actions</button>
                                        <button className="w-full text-left px-4 py-2 hover:bg-gray-50 transition">System Events</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {dashboardData.recentActivity.map((activity) => (
                                <div key={activity.id} className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-full ${activity.type === 'donation' ? 'bg-green-100' :
                                            activity.type === 'user' ? 'bg-blue-100' :
                                                activity.type === 'receipt' ? 'bg-purple-100' :
                                                    'bg-yellow-100'
                                            } flex items-center justify-center`}>
                                            {getActivityIcon(activity.icon)}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">
                                            {activity.user && <span className="font-semibold">{activity.user} </span>}
                                            {activity.action}
                                            {activity.amount && <span className="font-semibold text-[#63A6B2]"> ₱{activity.amount.toLocaleString()}</span>}
                                            {activity.target && <span className="font-semibold"> {activity.target}</span>}
                                            {activity.extra && <span> {activity.extra}</span>}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Donation Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-gray-900">Add New Donation</h3>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                        placeholder="5000"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                                    <select
                                        name="paymentMethod"
                                        value={donationForm.paymentMethod}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                    >
                                        <option>GCash</option>
                                        <option>PayMaya</option>
                                        <option>Bank Transfer</option>
                                        <option>Cash</option>
                                        <option>PayPal</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign</label>
                                <select
                                    name="campaign"
                                    value={donationForm.campaign}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                >
                                    <option value="">General Fund</option>
                                    <option>Medical Mission 2024</option>
                                    <option>Education Fund</option>
                                    <option>Building Restoration</option>
                                    <option>Community Outreach</option>
                                    <option>Youth Programs</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                                <textarea
                                    name="notes"
                                    value={donationForm.notes}
                                    onChange={handleFormChange}
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                    placeholder="Additional notes..."
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 px-4 py-2 border-2 border-[#63A6B2] text-[#63A6B2] rounded-lg font-semibold hover:bg-[#63A6B2] hover:text-white transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-[#63A6B2] text-white rounded-lg font-semibold hover:bg-[#4d8b96] transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Saving...' : 'Save Donation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Navigation Item Component
function NavItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
        ${active
                    ? 'bg-white/15 text-white border-l-4 border-[#f0a500] pl-3'
                    : 'text-white/70 hover:text-white hover:bg-white/10 hover:pl-5'
                }
      `}
        >
            {React.cloneElement(icon, { className: 'w-5 h-5' })}
            <span>{label}</span>
        </button>
    );
}

// Stat Card Component
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
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
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

// Campaign Progress Component
function CampaignProgress({ name, raised, goal, progress }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">{name}</span>
                <span className="text-sm font-bold text-[#63A6B2]">₱{(raised / 1000).toFixed(0)}K</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-[#63A6B2] to-[#f0a500] rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress}% of ₱{(goal / 1000).toFixed(0)}K goal</p>
        </div>
    );
}