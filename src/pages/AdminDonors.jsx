import React, { useState, useEffect } from 'react';
import {
    Home, Users, DollarSign, PieChart, FileText, BarChart3,
    UserCog, Settings, AlertTriangle, Search, Bell, Plus,
    Menu, X, LogOut, Edit, Trash2, Eye, Download,
    Mail, Phone, MapPin, Calendar, TrendingUp, UserCheck,
    UserX, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminDonors() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);

    // Modals state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDonor, setSelectedDonor] = useState(null);

    // Form state
    const [donorForm, setDonorForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        zipCode: '',
        donorType: 'One-time',
        status: 'Active',
        notes: '',
        tinNumber: ''
    });

    const [activeViewTab, setActiveViewTab] = useState('profile');

    // Donors data state
    const [donors, setDonors] = useState([]);
    const [filteredDonors, setFilteredDonors] = useState([]);
    const [stats, setStats] = useState({
        totalDonors: 0,
        activeDonors: 0,
        recurringDonors: 0,
        totalLifetimeDonations: 0
    });

    // Fetch donors data
    useEffect(() => {
        fetchDonors();
    }, []);

    // Filter and search donors
    useEffect(() => {
        let filtered = [...donors];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(donor =>
                donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                donor.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Type filter
        if (filterType !== 'All') {
            filtered = filtered.filter(donor => donor.type === filterType);
        }

        // Status filter
        if (filterStatus !== 'All') {
            filtered = filtered.filter(donor => donor.status === filterStatus);
        }

        // Sorting
        filtered.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.joinDate) - new Date(a.joinDate);
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'donations') return b.totalDonated - a.totalDonated;
            return 0;
        });

        setFilteredDonors(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterType, filterStatus, sortBy, donors]);

    const fetchDonors = async () => {
        try {
            setIsLoading(true);
            // Replace with actual API endpoint
            const response = await fetch('/api/admin/donors', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch donors');

            const data = await response.json();
            setDonors(data.donors);
            setStats(data.stats);

        } catch (error) {
            console.error('Error fetching donors:', error);
            // Mock data for development
            const mockDonors = [
                {
                    id: 1,
                    name: 'Maria Santos',
                    email: 'maria.s@email.com',
                    phone: '0917-123-4567',
                    address: '123 Rizal Street',
                    city: 'Manila',
                    province: 'Metro Manila',
                    zipCode: '1000',
                    type: 'Recurring',
                    status: 'Active',
                    totalDonated: 45000,
                    donationCount: 12,
                    lastDonation: 'Feb 6, 2026',
                    joinDate: '2024-01-15',
                    initials: 'MS',
                    color: 'from-blue-400 to-blue-600',
                    notes: 'Prefers GCash payments'
                },
                {
                    id: 2,
                    name: 'Juan Reyes',
                    email: 'juan.r@email.com',
                    phone: '0918-987-6543',
                    address: '456 Bonifacio Ave',
                    city: 'Quezon City',
                    province: 'Metro Manila',
                    zipCode: '1100',
                    type: 'One-time',
                    status: 'Active',
                    totalDonated: 12500,
                    donationCount: 3,
                    lastDonation: 'Feb 5, 2026',
                    joinDate: '2024-03-10',
                    initials: 'JR',
                    color: 'from-green-400 to-green-600',
                    notes: ''
                },
                {
                    id: 3,
                    name: 'Ana Cruz',
                    email: 'ana.c@email.com',
                    phone: '0919-555-0000',
                    address: '789 Luna Street',
                    city: 'Makati',
                    province: 'Metro Manila',
                    zipCode: '1200',
                    type: 'Recurring',
                    status: 'Active',
                    totalDonated: 75000,
                    donationCount: 18,
                    lastDonation: 'Feb 5, 2026',
                    joinDate: '2023-11-20',
                    initials: 'AC',
                    color: 'from-purple-400 to-purple-600',
                    notes: 'VIP Donor - Building projects'
                },
                {
                    id: 4,
                    name: 'Roberto Lopez',
                    email: 'roberto.l@email.com',
                    phone: '0915-444-3333',
                    address: '321 Del Pilar Street',
                    city: 'Pasig',
                    province: 'Metro Manila',
                    zipCode: '1600',
                    type: 'One-time',
                    status: 'Inactive',
                    totalDonated: 3500,
                    donationCount: 1,
                    lastDonation: 'Dec 12, 2025',
                    joinDate: '2025-05-05',
                    initials: 'RL',
                    color: 'from-yellow-400 to-yellow-600',
                    notes: 'Email bounced - needs update'
                },
                {
                    id: 5,
                    name: 'Lisa Garcia',
                    email: 'lisa.g@email.com',
                    phone: '0916-222-1111',
                    address: '654 Mabini Street',
                    city: 'Taguig',
                    province: 'Metro Manila',
                    zipCode: '1630',
                    type: 'Recurring',
                    status: 'Active',
                    totalDonated: 115000,
                    donationCount: 24,
                    lastDonation: 'Feb 4, 2026',
                    joinDate: '2023-08-12',
                    initials: 'LG',
                    color: 'from-pink-400 to-pink-600',
                    notes: 'Youth programs supporter'
                },
                {
                    id: 6,
                    name: 'Carlos Mendoza',
                    email: 'carlos.m@email.com',
                    phone: '0920-111-2222',
                    address: '147 Roxas Boulevard',
                    city: 'Paranaque',
                    province: 'Metro Manila',
                    zipCode: '1700',
                    type: 'One-time',
                    status: 'Active',
                    totalDonated: 8500,
                    donationCount: 2,
                    lastDonation: 'Jan 28, 2026',
                    joinDate: '2025-06-18',
                    initials: 'CM',
                    color: 'from-red-400 to-red-600',
                    notes: ''
                },
                {
                    id: 7,
                    name: 'Sofia Ramirez',
                    email: 'sofia.r@email.com',
                    phone: '0921-333-4444',
                    address: '258 Ortigas Avenue',
                    city: 'Mandaluyong',
                    province: 'Metro Manila',
                    zipCode: '1550',
                    type: 'Recurring',
                    status: 'Active',
                    totalDonated: 96000,
                    donationCount: 20,
                    lastDonation: 'Feb 3, 2026',
                    joinDate: '2024-02-14',
                    initials: 'SR',
                    color: 'from-indigo-400 to-indigo-600',
                    notes: 'Medical mission supporter'
                },
                {
                    id: 8,
                    name: 'Miguel Torres',
                    email: 'miguel.t@email.com',
                    phone: '0922-555-6666',
                    address: '369 EDSA',
                    city: 'Caloocan',
                    province: 'Metro Manila',
                    zipCode: '1400',
                    type: 'One-time',
                    status: 'Active',
                    totalDonated: 5000,
                    donationCount: 1,
                    lastDonation: 'Jan 20, 2026',
                    joinDate: '2026-01-20',
                    initials: 'MT',
                    color: 'from-teal-400 to-teal-600',
                    notes: ''
                },
                {
                    id: 9,
                    name: 'Elena Villanueva',
                    email: 'elena.v@email.com',
                    phone: '0923-777-8888',
                    address: '741 Quezon Avenue',
                    city: 'Quezon City',
                    province: 'Metro Manila',
                    zipCode: '1100',
                    type: 'Recurring',
                    status: 'Active',
                    totalDonated: 150000,
                    donationCount: 30,
                    lastDonation: 'Feb 2, 2026',
                    joinDate: '2023-05-08',
                    initials: 'EV',
                    color: 'from-orange-400 to-orange-600',
                    notes: 'Major donor - Education fund'
                },
                {
                    id: 10,
                    name: 'Diego Fernandez',
                    email: 'diego.f@email.com',
                    phone: '0924-999-0000',
                    address: '852 Taft Avenue',
                    city: 'Manila',
                    province: 'Metro Manila',
                    zipCode: '1000',
                    type: 'One-time',
                    status: 'Active',
                    totalDonated: 20000,
                    donationCount: 4,
                    lastDonation: 'Jan 15, 2026',
                    joinDate: '2025-09-22',
                    initials: 'DF',
                    color: 'from-cyan-400 to-cyan-600',
                    notes: ''
                },
                {
                    id: 11,
                    name: 'Patricia Gomez',
                    email: 'patricia.g@email.com',
                    phone: '0925-123-9999',
                    address: '963 Shaw Boulevard',
                    city: 'Mandaluyong',
                    province: 'Metro Manila',
                    zipCode: '1550',
                    type: 'Recurring',
                    status: 'Active',
                    totalDonated: 85000,
                    donationCount: 17,
                    lastDonation: 'Feb 1, 2026',
                    joinDate: '2024-04-03',
                    initials: 'PG',
                    color: 'from-rose-400 to-rose-600',
                    notes: 'Community outreach volunteer'
                },
                {
                    id: 12,
                    name: 'Rafael Silva',
                    email: 'rafael.s@email.com',
                    phone: '0926-888-7777',
                    address: '159 Aurora Boulevard',
                    city: 'Pasig',
                    province: 'Metro Manila',
                    zipCode: '1600',
                    type: 'One-time',
                    status: 'Inactive',
                    totalDonated: 2000,
                    donationCount: 1,
                    lastDonation: 'Aug 10, 2025',
                    joinDate: '2025-08-10',
                    initials: 'RS',
                    color: 'from-gray-400 to-gray-600',
                    notes: 'Moved overseas'
                }
            ];

            setDonors(mockDonors);
            setStats({
                totalDonors: mockDonors.length,
                activeDonors: mockDonors.filter(d => d.status === 'Active').length,
                recurringDonors: mockDonors.filter(d => d.type === 'Recurring' && d.status === 'Active').length,
                totalLifetimeDonations: mockDonors.reduce((sum, d) => sum + d.totalDonated, 0)
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedDonors = filteredDonors.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDonors.length / itemsPerPage);

    // Handle form changes
    const handleFormChange = (e) => {
        setDonorForm({
            ...donorForm,
            [e.target.name]: e.target.value
        });
    };

    // Reset form
    const resetForm = () => {
        setDonorForm({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            province: '',
            zipCode: '',
            donorType: 'One-time',
            status: 'Active',
            notes: ''
        });
    };

    // Add new donor
    const handleAddDonor = async (e) => {
        e.preventDefault();

        // Validation
        if (!donorForm.firstName.trim() || !donorForm.lastName.trim()) {
            toast.error('First name and last name are required');
            return;
        }

        if (!donorForm.email.trim()) {
            toast.error('Email is required');
            return;
        }

        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailRegex.test(donorForm.email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (!donorForm.phone.trim()) {
            toast.error('Phone number is required');
            return;
        }

        try {
            setIsLoading(true);

            // Replace with actual API endpoint
            const response = await fetch('/api/admin/donors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(donorForm)
            });

            if (!response.ok) throw new Error('Failed to add donor');

            // For development - add to mock data
            const newDonor = {
                id: donors.length + 1,
                name: `${donorForm.firstName} ${donorForm.lastName}`,
                email: donorForm.email,
                phone: donorForm.phone,
                address: donorForm.address,
                city: donorForm.city,
                province: donorForm.province,
                zipCode: donorForm.zipCode,
                type: donorForm.donorType,
                status: donorForm.status,
                totalDonated: 0,
                donationCount: 0,
                lastDonation: 'N/A',
                joinDate: new Date().toISOString(),
                initials: `${donorForm.firstName[0]}${donorForm.lastName[0]}`,
                color: 'from-emerald-400 to-emerald-600',
                notes: donorForm.notes,
                tinNumber: donorForm.tinNumber
            };

            setDonors([newDonor, ...donors]);
            toast.success('Donor added successfully!');
            setIsAddModalOpen(false);
            resetForm();

        } catch (error) {
            toast.error('Failed to add donor. Please try again.');
            console.error('Error adding donor:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Edit donor
    const handleEditDonor = async (e) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            // Replace with actual API endpoint
            const response = await fetch(`/api/admin/donors/${selectedDonor.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(donorForm)
            });

            if (!response.ok) throw new Error('Failed to update donor');

            // For development - update mock data
            const updatedDonors = donors.map(d => {
                if (d.id === selectedDonor.id) {
                    return {
                        ...d,
                        name: `${donorForm.firstName} ${donorForm.lastName}`,
                        email: donorForm.email,
                        phone: donorForm.phone,
                        address: donorForm.address,
                        city: donorForm.city,
                        province: donorForm.province,
                        zipCode: donorForm.zipCode,
                        type: donorForm.donorType,
                        status: donorForm.status,
                        notes: donorForm.notes,
                        tinNumber: donorForm.tinNumber
                    };
                }
                return d;
            });

            setDonors(updatedDonors);
            toast.success('Donor updated successfully!');
            setIsEditModalOpen(false);
            setSelectedDonor(null);
            resetForm();

        } catch (error) {
            toast.error('Failed to update donor. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Delete donor
    const handleDeleteDonor = async () => {
        try {
            setIsLoading(true);

            // Replace with actual API endpoint
            const response = await fetch(`/api/admin/donors/${selectedDonor.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete donor');

            // For development - remove from mock data
            setDonors(donors.filter(d => d.id !== selectedDonor.id));
            toast.success('Donor deleted successfully!');
            setIsDeleteModalOpen(false);
            setSelectedDonor(null);

        } catch (error) {
            toast.error('Failed to delete donor. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle donor status
    const handleToggleDonorStatus = async (donor) => {
        const newStatus = donor.status === 'Active' ? 'Inactive' : 'Active';

        try {
            // Replace with actual API endpoint
            const response = await fetch(`/api/admin/donors/${donor.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update status');

            // For development - update mock data
            setDonors(donors.map(d => d.id === donor.id ? { ...d, status: newStatus } : d));
            toast.success(`Donor ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`);

        } catch (error) {
            toast.error('Failed to update donor status. Please try again.');
        }
    };

    // Open edit modal with donor data
    const openEditModal = (donor) => {
        setSelectedDonor(donor);
        const nameParts = donor.name.split(' ');
        setDonorForm({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: donor.email,
            phone: donor.phone,
            address: donor.address || '',
            city: donor.city || '',
            province: donor.province || '',
            zipCode: donor.zipCode || '',
            donorType: donor.type,
            status: donor.status,
            notes: donor.notes || '',
            tinNumber: donor.tinNumber || ''
        });
        setIsEditModalOpen(true);
    };

    // Export to PDF
    const handleExportDonors = () => {
        try {
            const doc = new jsPDF();

            // Add Title
            doc.setFontSize(20);
            doc.setTextColor(99, 166, 178); // #63A6B2
            doc.text("Shepherd's Voice - Donors Report", 14, 22);

            // Add Date
            doc.setFontSize(10);
            doc.setTextColor(100);
            const date = new Date().toLocaleDateString();
            doc.text(`Generated on: ${date}`, 14, 30);

            // Define Table Headers
            const headers = [
                ["Name", "Email", "Type", "Status", "Total Donated", "Last Donation"]
            ];

            // Define Table Data
            const data = filteredDonors.map(donor => [
                donor.name,
                donor.email,
                donor.type,
                donor.status,
                `PHP ${Number(donor.totalDonated || 0).toLocaleString()}`,
                donor.lastDonation
            ]);

            // Create the table
            autoTable(doc, {
                head: headers,
                body: data,
                startY: 40,
                headStyles: {
                    fillColor: [99, 166, 178], // #63A6B2
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                alternateRowStyles: { fillColor: [245, 250, 251] },
                margin: { top: 40 }
            });

            // Save PDF
            doc.save(`donors-report-${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Donors report exported as PDF!');
        } catch (error) {
            console.error('PDF Export Error:', error);
            toast.error('Failed to export PDF');
        }
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null || isNaN(amount)) return '₱0';
        return '₱' + Number(amount).toLocaleString();
    };

    const handleLogout = () => {
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Show success message
        toast.success('Logged out successfully');

        // Redirect to login page
        setTimeout(() => {
            navigate('/login');
        }, 500);
    };

    if (isLoading && donors.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafb]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#63A6B2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading donors...</p>
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
                        <NavItem icon={<Home />} label="Dashboard" onClick={() => navigate('/admin_dashboard')} />
                        <NavItem icon={<Users />} label="Donors" active />
                        <NavItem icon={<DollarSign />} label="Donations" onClick={() => navigate('/admin_donations')} />
                        <NavItem icon={<PieChart />} label="Campaigns" onClick={() => navigate('/admin_campaigns')} />
                        <NavItem icon={<FileText />} label="Foundations" onClick={() => navigate('/admin_foundations')} />
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
                    <div
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition"
                    >
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
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="px-4 lg:px-8 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-gray-600">
                                    <Menu className="w-6 h-6" />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Donor Management</h2>
                                    <p className="text-sm text-gray-500 mt-1">Manage and track your donors</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleExportDonors}
                                    className="px-4 py-2 border-2 border-[#63A6B2] text-[#63A6B2] rounded-lg font-semibold hover:bg-[#63A6B2] hover:text-white transition flex items-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    <span className="hidden sm:inline">Export</span>
                                </button>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="bg-[#63A6B2] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#4d8b96] transition flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Add Donor</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-8">
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            icon={<Users className="w-6 h-6 text-white" />}
                            iconBg="from-[#63A6B2] to-[#4d8b96]"
                            title="Total Donors"
                            value={stats.totalDonors}
                        />
                        <StatCard
                            icon={<UserCheck className="w-6 h-6 text-white" />}
                            iconBg="from-green-500 to-green-400"
                            title="Active Donors"
                            value={stats.activeDonors}
                        />
                        <StatCard
                            icon={<RefreshCw className="w-6 h-6 text-white" />}
                            iconBg="from-blue-500 to-blue-400"
                            title="Recurring"
                            value={stats.recurringDonors}
                        />
                        <StatCard
                            icon={<DollarSign className="w-6 h-6 text-white" />}
                            iconBg="from-purple-500 to-purple-400"
                            title="Lifetime Value"
                            value={formatCurrency(stats.totalLifetimeDonations)}
                        />
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <select
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] bg-white text-sm"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="All">All Types</option>
                                <option value="Recurring">Recurring</option>
                                <option value="One-time">One-time</option>
                            </select>
                            <select
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] bg-white text-sm"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                            <select
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] bg-white text-sm"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newest">Newest First</option>
                                <option value="name">Name A-Z</option>
                                <option value="donations">Highest Donation</option>
                            </select>
                        </div>
                    </div>

                    {/* Donors Table */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Donor</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Type</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Total Donated</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Last Donation</th>
                                        <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedDonors.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center">
                                                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                <p className="text-gray-500 font-semibold">No donors found</p>
                                                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedDonors.map((donor) => (
                                            <tr key={donor.id} className="hover:bg-gray-50 transition">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${donor.color} flex items-center justify-center text-white font-bold text-sm`}>
                                                            {donor.initials}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{donor.name}</p>
                                                            <p className="text-xs text-gray-500">{donor.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${donor.type === 'Recurring' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {donor.type}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${donor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {donor.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 font-bold text-gray-900">{formatCurrency(donor.totalDonated)}</td>
                                                <td className="py-4 px-6 text-sm text-gray-500">{donor.lastDonation}</td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => { setSelectedDonor(donor); setIsViewModalOpen(true); }}
                                                            className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(donor)}
                                                            className="p-2 hover:bg-yellow-50 rounded-lg transition text-yellow-600"
                                                            title="Edit Donor"
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleDonorStatus(donor)}
                                                            className={`p-2 rounded-lg transition ${donor.status === 'Active'
                                                                ? 'hover:bg-gray-50 text-gray-600'
                                                                : 'hover:bg-green-50 text-green-600'
                                                                }`}
                                                            title={donor.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {donor.status === 'Active' ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectedDonor(donor); setIsDeleteModalOpen(true); }}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                                                            title="Delete Donor"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between bg-gray-50 gap-4">
                                <p className="text-sm text-gray-500">
                                    Showing <span className="font-semibold">{indexOfFirstItem + 1}</span> to <span className="font-semibold">{Math.min(indexOfLastItem, filteredDonors.length)}</span> of <span className="font-semibold">{filteredDonors.length}</span> donors
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${currentPage === pageNum
                                                    ? 'bg-[#63A6B2] text-white'
                                                    : 'border border-gray-300 hover:bg-white'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Add Donor Modal */}
            {isAddModalOpen && (
                <DonorFormModal
                    title="Add New Donor"
                    formData={donorForm}
                    handleFormChange={handleFormChange}
                    handleSubmit={handleAddDonor}
                    handleClose={() => {
                        setIsAddModalOpen(false);
                        resetForm();
                    }}
                    isLoading={isLoading}
                />
            )}

            {/* Edit Donor Modal */}
            {isEditModalOpen && (
                <DonorFormModal
                    title="Edit Donor"
                    formData={donorForm}
                    handleFormChange={handleFormChange}
                    handleSubmit={handleEditDonor}
                    handleClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedDonor(null);
                        resetForm();
                    }}
                    isLoading={isLoading}
                    isEdit
                />
            )}

            {/* View Donor Modal */}
            {isViewModalOpen && selectedDonor && (
                <ViewDonorModal
                    donor={selectedDonor}
                    handleClose={() => {
                        setIsViewModalOpen(false);
                        setSelectedDonor(null);
                        setActiveViewTab('profile');
                    }}
                    formatCurrency={formatCurrency}
                    activeTab={activeViewTab}
                    setActiveTab={setActiveViewTab}
                />
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedDonor && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Donor</h3>
                            <p className="text-gray-600 text-center mb-6">
                                Are you sure you want to delete <strong>{selectedDonor.name}</strong>?
                                This action cannot be undone and will remove all associated donation history.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setSelectedDonor(null);
                                    }}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteDonor}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Deleting...' : 'Delete Donor'}
                                </button>
                            </div>
                        </div>
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
function StatCard({ icon, iconBg, title, value }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${iconBg} flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

// Donor Form Modal Component
function DonorFormModal({ title, formData, handleFormChange, handleSubmit, handleClose, isLoading, isEdit }) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                    placeholder="Juan"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                    placeholder="Dela Cruz"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                    placeholder="juan@email.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                    placeholder="0917-123-4567"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Address</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                    placeholder="123 Rizal Street"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                        placeholder="Manila"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Zip Code</label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                        placeholder="1000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">TIN Number</label>
                                    <input
                                        type="text"
                                        name="tinNumber"
                                        value={formData.tinNumber}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                        placeholder="000-000-000"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Province</label>
                                <input
                                    type="text"
                                    name="province"
                                    value={formData.province}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                    placeholder="Metro Manila"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Donor Settings */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Donor Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Donor Type</label>
                                <select
                                    name="donorType"
                                    value={formData.donorType}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                >
                                    <option value="One-time">One-time</option>
                                    <option value="Recurring">Recurring</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleFormChange}
                            rows="4"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                            placeholder="Additional notes about this donor..."
                        ></textarea>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border-2 border-[#63A6B2] text-[#63A6B2] rounded-lg font-semibold hover:bg-[#63A6B2] hover:text-white transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-[#63A6B2] text-white rounded-lg font-semibold hover:bg-[#4d8b96] transition disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : isEdit ? 'Update Donor' : 'Add Donor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// View Donor Modal Component
function ViewDonorModal({ donor, handleClose, formatCurrency, activeTab, setActiveTab }) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#63A6B2] to-[#4d8b96] p-6 text-white relative">
                    <button
                        onClick={handleClose}
                        className="absolute right-6 top-6 text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex flex-col md:flex-row items-center gap-6 mt-4">
                        <div className={`w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-4xl font-bold shadow-lg`}>
                            {donor.initials}
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h3 className="text-3xl font-bold mb-2">{donor.name}</h3>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/90">
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm">
                                    <Mail className="w-4 h-4" />
                                    {donor.email}
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm">
                                    <Phone className="w-4 h-4" />
                                    {donor.phone}
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm">
                                    <Calendar className="w-4 h-4" />
                                    Joined {donor.joinDate}
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${donor.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                                }`}>
                                {donor.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 bg-[#f8fafb] border-b border-gray-100">
                    <div className="p-4 border-r border-gray-100 text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Donated</p>
                        <p className="text-xl font-black text-[#63A6B2]">{formatCurrency(donor.totalDonated)}</p>
                    </div>
                    <div className="p-4 border-r border-gray-100 text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Donation Count</p>
                        <p className="text-xl font-black text-[#63A6B2]">{donor.donationCount}</p>
                    </div>
                    <div className="p-4 border-r border-gray-100 text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Donor Type</p>
                        <p className="text-xl font-black text-[#63A6B2]">{donor.type}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Last Donation</p>
                        <p className="text-xl font-black text-[#63A6B2]">{donor.lastDonation}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white px-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'profile'
                            ? 'text-[#63A6B2] border-[#63A6B2]'
                            : 'text-gray-400 border-transparent hover:text-gray-600'
                            }`}
                    >
                        PROFILE INFORMATION
                    </button>
                    <button
                        onClick={() => setActiveTab('donations')}
                        className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'donations'
                            ? 'text-[#63A6B2] border-[#63A6B2]'
                            : 'text-gray-400 border-transparent hover:text-gray-600'
                            }`}
                    >
                        DONATION HISTORY
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-white">
                    {activeTab === 'profile' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <section>
                                    <h5 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Account Details</h5>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                <Mail className="w-5 h-5 text-[#63A6B2]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Email Address</p>
                                                <p className="text-gray-900 font-semibold">{donor.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                <Phone className="w-5 h-5 text-[#63A6B2]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Phone Number</p>
                                                <p className="text-gray-900 font-semibold">{donor.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                <FileText className="w-5 h-5 text-[#63A6B2]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">TIN Number</p>
                                                <p className="text-gray-900 font-semibold">{donor.tinNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                            <div className="space-y-8">
                                <section>
                                    <h5 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Address Information</h5>
                                    <div className="flex items-start gap-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm mt-1">
                                            <MapPin className="w-5 h-5 text-[#63A6B2]" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Complete Address</p>
                                            <p className="text-gray-900 font-semibold leading-relaxed">
                                                {donor.address ? `${donor.address}, ${donor.city}, ${donor.province} ${donor.zipCode}` : 'No address provided'}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                                {donor.notes && (
                                    <section>
                                        <h5 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Additional Notes</h5>
                                        <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100/50">
                                            <p className="text-gray-700 leading-relaxed text-sm italic">"{donor.notes}"</p>
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Transaction History</h5>
                                <span className="text-xs font-bold text-[#63A6B2] bg-[#63A6B2]/10 px-3 py-1 rounded-full">
                                    {donor.donationCount} Records Found
                                </span>
                            </div>
                            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#63A6B2]/5 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference ID</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {/* Mocking some donations if none exist in the object yet */}
                                        {[1, 2, 3].map((item) => (
                                            <tr key={item} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs text-gray-900">DON-2026-00{item}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700">Feb {7 - item}, 2026</td>
                                                <td className="px-6 py-4 font-bold text-[#63A6B2]">{formatCurrency(1500 * item)}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold">SUCCESS</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-[#f8fafb] flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-8 py-3 bg-[#63A6B2] text-white rounded-xl font-black text-sm hover:bg-[#4d8b96] transition-all shadow-lg hover:shadow-[#63A6B2]/20 shadow-[#63A6B2]/10"
                    >
                        CLOSE WINDOW
                    </button>
                </div>
            </div>
        </div>
    );
}