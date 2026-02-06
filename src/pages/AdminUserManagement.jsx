import React, { useState, useEffect } from 'react';
import {
    Home, Users, DollarSign, PieChart, FileText, BarChart3,
    UserCog, Settings, AlertTriangle, Search, Bell, Plus,
    Menu, X, LogOut, Edit, Trash2, Eye, Download,
    Mail, Phone, Shield, Calendar, TrendingUp, UserCheck,
    UserX, RefreshCw, Lock, Key, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import jsPDF from "jspdf";
import 'jspdf-autotable';

export default function AdminUserManagement() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('All');
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
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form state
    const [userForm, setUserForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        phone: '',
        role: 'viewer',
        status: 'Active',
        department: '',
        employeeId: '',
        password: '',
        confirmPassword: ''
    });

    const [activeViewTab, setActiveViewTab] = useState('profile');

    // Users data state
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        recentLogins: 0
    });

    // Role definitions with descriptions
    const roles = [
        { value: 'super_admin', label: 'Super Admin', color: 'from-red-500 to-red-600', description: 'Full system access' },
        { value: 'admin', label: 'Admin', color: 'from-purple-500 to-purple-600', description: 'Administrative access' },
        { value: 'hr', label: 'HR', color: 'from-blue-500 to-blue-600', description: 'Human resources management' },
        { value: 'finance', label: 'Finance', color: 'from-green-500 to-green-600', description: 'Financial operations' },
        { value: 'encoder', label: 'Encoder', color: 'from-yellow-500 to-yellow-600', description: 'Data entry access' },
        { value: 'viewer', label: 'Viewer', color: 'from-gray-500 to-gray-600', description: 'Read-only access' },
        { value: 'auditor', label: 'Auditor', color: 'from-orange-500 to-orange-600', description: 'Audit & compliance' }
    ];

    // Get role info
    const getRoleInfo = (roleValue) => {
        return roles.find(r => r.value === roleValue) || roles[5]; // Default to viewer
    };

    // Fetch users data
    useEffect(() => {
        fetchUsers();
    }, []);

    // Filter and search users
    useEffect(() => {
        let filtered = [...users];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.username.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Role filter
        if (filterRole !== 'All') {
            filtered = filtered.filter(user => user.role === filterRole);
        }

        // Status filter
        if (filterStatus !== 'All') {
            filtered = filtered.filter(user => user.status === filterStatus);
        }

        // Sorting
        filtered.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'role') return a.role.localeCompare(b.role);
            return 0;
        });

        setFilteredUsers(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterRole, filterStatus, sortBy, users]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            // Replace with actual API endpoint
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();
            setUsers(data.users);
            setStats(data.stats);

        } catch (error) {
            console.error('Error fetching users:', error);
            // Mock data for development
            const mockUsers = [
                {
                    id: 1,
                    name: 'John Dela Cruz',
                    email: 'john.delacruz@svrtfi.org',
                    username: 'jdelacruz',
                    phone: '0917-123-4567',
                    role: 'super_admin',
                    status: 'Active',
                    department: 'Administration',
                    employeeId: 'EMP-001',
                    lastLogin: 'Feb 6, 2026 10:30 AM',
                    createdAt: '2023-01-15',
                    initials: 'JD',
                    color: 'from-red-400 to-red-600'
                },
                {
                    id: 2,
                    name: 'Maria Santos',
                    email: 'maria.santos@svrtfi.org',
                    username: 'msantos',
                    phone: '0918-987-6543',
                    role: 'admin',
                    status: 'Active',
                    department: 'Operations',
                    employeeId: 'EMP-002',
                    lastLogin: 'Feb 6, 2026 09:15 AM',
                    createdAt: '2023-02-20',
                    initials: 'MS',
                    color: 'from-purple-400 to-purple-600'
                },
                {
                    id: 3,
                    name: 'Sarah Lopez',
                    email: 'sarah.lopez@svrtfi.org',
                    username: 'slopez',
                    phone: '0919-555-0000',
                    role: 'finance',
                    status: 'Active',
                    department: 'Finance',
                    employeeId: 'EMP-003',
                    lastLogin: 'Feb 6, 2026 08:45 AM',
                    createdAt: '2023-03-10',
                    initials: 'SL',
                    color: 'from-green-400 to-green-600'
                },
                {
                    id: 4,
                    name: 'Pedro Garcia',
                    email: 'pedro.garcia@svrtfi.org',
                    username: 'pgarcia',
                    phone: '0915-444-3333',
                    role: 'encoder',
                    status: 'Active',
                    department: 'Data Management',
                    employeeId: 'EMP-004',
                    lastLogin: 'Feb 5, 2026 04:20 PM',
                    createdAt: '2023-05-05',
                    initials: 'PG',
                    color: 'from-yellow-400 to-yellow-600'
                },
                {
                    id: 5,
                    name: 'Lisa Tan',
                    email: 'lisa.tan@svrtfi.org',
                    username: 'ltan',
                    phone: '0916-222-1111',
                    role: 'auditor',
                    status: 'Active',
                    department: 'Compliance',
                    employeeId: 'EMP-005',
                    lastLogin: 'Feb 5, 2026 02:10 PM',
                    createdAt: '2023-06-12',
                    initials: 'LT',
                    color: 'from-orange-400 to-orange-600'
                },
                {
                    id: 6,
                    name: 'Mark Santos',
                    email: 'mark.santos@svrtfi.org',
                    username: 'msantos2',
                    phone: '0920-111-2222',
                    role: 'viewer',
                    status: 'Active',
                    department: 'General',
                    employeeId: 'EMP-006',
                    lastLogin: 'Feb 4, 2026 11:30 AM',
                    createdAt: '2023-07-18',
                    initials: 'MK',
                    color: 'from-gray-400 to-gray-600'
                },
                {
                    id: 7,
                    name: 'Anna Reyes',
                    email: 'anna.reyes@svrtfi.org',
                    username: 'areyes',
                    phone: '0921-333-4444',
                    role: 'hr',
                    status: 'Active',
                    department: 'Human Resources',
                    employeeId: 'EMP-007',
                    lastLogin: 'Feb 6, 2026 07:00 AM',
                    createdAt: '2023-08-14',
                    initials: 'AR',
                    color: 'from-blue-400 to-blue-600'
                },
                {
                    id: 8,
                    name: 'Carlos Mendoza',
                    email: 'carlos.mendoza@svrtfi.org',
                    username: 'cmendoza',
                    phone: '0922-555-6666',
                    role: 'encoder',
                    status: 'Inactive',
                    department: 'Data Management',
                    employeeId: 'EMP-008',
                    lastLogin: 'Jan 15, 2026 03:45 PM',
                    createdAt: '2024-01-20',
                    initials: 'CM',
                    color: 'from-teal-400 to-teal-600'
                },
                {
                    id: 9,
                    name: 'Elena Cruz',
                    email: 'elena.cruz@svrtfi.org',
                    username: 'ecruz',
                    phone: '0923-777-8888',
                    role: 'finance',
                    status: 'Active',
                    department: 'Finance',
                    employeeId: 'EMP-009',
                    lastLogin: 'Feb 5, 2026 01:20 PM',
                    createdAt: '2024-02-08',
                    initials: 'EC',
                    color: 'from-emerald-400 to-emerald-600'
                },
                {
                    id: 10,
                    name: 'Roberto Torres',
                    email: 'roberto.torres@svrtfi.org',
                    username: 'rtorres',
                    phone: '0924-999-0000',
                    role: 'viewer',
                    status: 'Active',
                    department: 'General',
                    employeeId: 'EMP-010',
                    lastLogin: 'Feb 3, 2026 09:00 AM',
                    createdAt: '2024-03-22',
                    initials: 'RT',
                    color: 'from-cyan-400 to-cyan-600'
                }
            ];

            setUsers(mockUsers);
            setStats({
                totalUsers: mockUsers.length,
                activeUsers: mockUsers.filter(u => u.status === 'Active').length,
                adminUsers: mockUsers.filter(u => ['super_admin', 'admin'].includes(u.role)).length,
                recentLogins: mockUsers.filter(u => {
                    const loginDate = new Date(u.lastLogin);
                    const today = new Date();
                    return loginDate.toDateString() === today.toDateString();
                }).length
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    // Handle form changes
    const handleFormChange = (e) => {
        setUserForm({
            ...userForm,
            [e.target.name]: e.target.value
        });
    };

    // Reset form
    const resetForm = () => {
        setUserForm({
            firstName: '',
            lastName: '',
            email: '',
            username: '',
            phone: '',
            role: 'viewer',
            status: 'Active',
            department: '',
            employeeId: '',
            password: '',
            confirmPassword: ''
        });
    };

    // Add new user
    const handleAddUser = async (e) => {
        e.preventDefault();

        // Validation
        if (!userForm.firstName.trim() || !userForm.lastName.trim()) {
            toast.error('First name and last name are required');
            return;
        }

        if (!userForm.email.trim()) {
            toast.error('Email is required');
            return;
        }

        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailRegex.test(userForm.email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (!userForm.username.trim()) {
            toast.error('Username is required');
            return;
        }

        if (!userForm.password || userForm.password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        if (userForm.password !== userForm.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setIsLoading(true);

            // Replace with actual API endpoint
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(userForm)
            });

            if (!response.ok) throw new Error('Failed to add user');

            // For development - add to mock data
            const roleInfo = getRoleInfo(userForm.role);
            const newUser = {
                id: users.length + 1,
                name: `${userForm.firstName} ${userForm.lastName}`,
                email: userForm.email,
                username: userForm.username,
                phone: userForm.phone,
                role: userForm.role,
                status: userForm.status,
                department: userForm.department,
                employeeId: userForm.employeeId,
                lastLogin: 'Never',
                createdAt: new Date().toISOString(),
                initials: `${userForm.firstName[0]}${userForm.lastName[0]}`,
                color: roleInfo.color
            };

            setUsers([newUser, ...users]);
            toast.success('User added successfully!');
            setIsAddModalOpen(false);
            resetForm();

        } catch (error) {
            toast.error('Failed to add user. Please try again.');
            console.error('Error adding user:', error);
        } finally {
            setIsLoading(false);
        }
    };
    // Edit user
    const handleEditUser = async (e) => {
        e.preventDefault();

        try {
            setIsLoading(true);

            // Replace with actual API endpoint
            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(userForm)
            });

            if (!response.ok) throw new Error('Failed to update user');

            // For development - update mock data
            const roleInfo = getRoleInfo(userForm.role);
            const updatedUsers = users.map(u => {
                if (u.id === selectedUser.id) {
                    return {
                        ...u,
                        name: `${userForm.firstName} ${userForm.lastName}`,
                        email: userForm.email,
                        username: userForm.username,
                        phone: userForm.phone,
                        role: userForm.role,
                        status: userForm.status,
                        department: userForm.department,
                        employeeId: userForm.employeeId,
                        color: roleInfo.color
                    };
                }
                return u;
            });

            setUsers(updatedUsers);
            toast.success('User updated successfully!');
            setIsEditModalOpen(false);
            setSelectedUser(null);
            resetForm();

        } catch (error) {
            toast.error('Failed to update user. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Delete user
    const handleDeleteUser = async () => {
        try {
            setIsLoading(true);

            // Replace with actual API endpoint
            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete user');

            // For development - remove from mock data
            setUsers(users.filter(u => u.id !== selectedUser.id));
            toast.success('User deleted successfully!');
            setIsDeleteModalOpen(false);
            setSelectedUser(null);

        } catch (error) {
            toast.error('Failed to delete user. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle user status
    const handleToggleUserStatus = async (user) => {
        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';

        try {
            // Replace with actual API endpoint
            const response = await fetch(`/api/admin/users/${user.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update status');

            // For development - update mock data
            setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
            toast.success(`User ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`);

        } catch (error) {
            toast.error('Failed to update user status. Please try again.');
        }
    };

    // Reset password
    const handleResetPassword = async () => {
        try {
            setIsLoading(true);

            // Replace with actual API endpoint
            const response = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to reset password');

            toast.success('Password reset email sent successfully!');
            setIsResetPasswordModalOpen(false);
            setSelectedUser(null);

        } catch (error) {
            toast.error('Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Open edit modal with user data
    const openEditModal = (user) => {
        setSelectedUser(user);
        const nameParts = user.name.split(' ');
        setUserForm({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: user.email,
            username: user.username,
            phone: user.phone || '',
            role: user.role,
            status: user.status,
            department: user.department || '',
            employeeId: user.employeeId || '',
            password: '',
            confirmPassword: ''
        });
        setIsEditModalOpen(true);
    };

    // Export to PDF
    const handleExportUsers = () => {
        try {
            const doc = new jsPDF();

            // Add Title
            doc.setFontSize(20);
            doc.setTextColor(99, 166, 178);
            doc.text("SVRTFI - User Management Report", 14, 22);

            // Add Date
            doc.setFontSize(10);
            doc.setTextColor(100);
            const date = new Date().toLocaleDateString();
            doc.text(`Generated on: ${date}`, 14, 30);

            // Define Table Headers
            const headers = [
                ["Name", "Username", "Email", "Role", "Department", "Status"]
            ];

            // Define Table Data
            const data = filteredUsers.map(user => [
                user.name,
                user.username,
                user.email,
                getRoleInfo(user.role).label,
                user.department,
                user.status
            ]);

            // Create the table
            doc.autoTable({
                head: headers,
                body: data,
                startY: 40,
                headStyles: {
                    fillColor: [99, 166, 178],
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                alternateRowStyles: { fillColor: [245, 250, 251] },
                margin: { top: 40 }
            });

            // Save PDF
            doc.save(`users-report-${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('Users report exported as PDF!');
        } catch (error) {
            console.error('PDF Export Error:', error);
            toast.error('Failed to export PDF');
        }
    };

    if (isLoading && users.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafb]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#63A6B2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
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
                        <NavItem icon={<Users />} label="Donors" onClick={() => navigate('/admin_donors')} />
                        <NavItem icon={<DollarSign />} label="Donations" onClick={() => navigate('/admin_donations')} />
                        <NavItem icon={<PieChart />} label="Campaigns" onClick={() => navigate('/admin_campaigns')} />
                        <NavItem icon={<FileText />} label="Receipts" onClick={() => navigate('/admin_receipts')} />
                        <NavItem icon={<BarChart3 />} label="Reports" onClick={() => navigate('/admin_reports')} />
                        <NavItem icon={<UserCog />} label="User Management" active />
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
                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">User Management</h2>
                                <p className="text-sm text-gray-500 mt-1">Manage system users and access levels</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleExportUsers}
                                className="px-4 py-2 border-2 border-[#63A6B2] text-[#63A6B2] rounded-lg font-semibold hover:bg-[#63A6B2] hover:text-white transition flex items-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                <span className="hidden sm:inline">Export PDF</span>
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-[#63A6B2] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#4d8b96] transition flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add User</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-8">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            icon={<Users className="w-6 h-6 text-white" />}
                            iconBg="from-[#63A6B2] to-[#4d8b96]"
                            title="Total Users"
                            value={stats.totalUsers}
                        />
                        <StatCard
                            icon={<UserCheck className="w-6 h-6 text-white" />}
                            iconBg="from-emerald-500 to-emerald-400"
                            title="Active Users"
                            value={stats.activeUsers}
                        />
                        <StatCard
                            icon={<Shield className="w-6 h-6 text-white" />}
                            iconBg="from-purple-500 to-purple-400"
                            title="Admin Users"
                            value={stats.adminUsers}
                        />
                        <StatCard
                            icon={<Activity className="w-6 h-6 text-white" />}
                            iconBg="from-blue-500 to-blue-400"
                            title="Active Today"
                            value={stats.recentLogins}
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                        <div className="relative w-full md:w-96">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, username..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <select
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] bg-white text-sm shadow-sm"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="All">All Roles</option>
                                {roles.map(role => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>
                            <select
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] bg-white text-sm shadow-sm"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active Only</option>
                                <option value="Inactive">Inactive Only</option>
                            </select>
                            <select
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] bg-white text-sm shadow-sm"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newest">Newest First</option>
                                <option value="name">Name A-Z</option>
                                <option value="role">By Role</option>
                            </select>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">User Profile</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Role & Dept</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Last Login</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedUsers.map((user) => {
                                        const roleInfo = getRoleInfo(user.role);
                                        return (
                                            <tr key={user.id} className="hover:bg-[#f8fafb] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${user.color || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white font-bold shadow-sm`}>
                                                            {user.initials}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900">{user.name}</div>
                                                            <div className="text-xs text-gray-500 font-medium">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter bg-gradient-to-br ${roleInfo.color} text-white shadow-sm mb-1 inline-block`}>
                                                        {roleInfo.label}
                                                    </span>
                                                    <div className="text-xs text-gray-400 font-bold uppercase">{user.department}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleToggleUserStatus(user)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${user.status === 'Active'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                                            : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {user.status}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-700 font-medium">{user.lastLogin}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">ID: {user.employeeId}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setIsViewModalOpen(true);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-[#63A6B2] hover:bg-[#63A6B2]/10 rounded-lg transition"
                                                            title="View Profile"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Edit User"
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setIsResetPasswordModalOpen(true);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                            title="Reset Password"
                                                        >
                                                            <Key className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setIsDeleteModalOpen(true);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Section */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-600 font-medium">
                                Showing <span className="font-bold text-[#63A6B2]">{Math.min(indexOfFirstItem + 1, filteredUsers.length)}</span> to <span className="font-bold text-[#63A6B2]">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of <span className="font-bold text-[#63A6B2]">{filteredUsers.length}</span> users
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white transition disabled:opacity-50 shadow-sm"
                                >
                                    Previous
                                </button>
                                <div className="flex gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${currentPage === i + 1
                                                ? 'bg-[#63A6B2] text-white shadow-lg'
                                                : 'text-gray-600 hover:bg-white border border-transparent hover:border-gray-300'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white transition disabled:opacity-50 shadow-sm"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {/* Add User Modal */}
            {isAddModalOpen && (
                <UserFormModal
                    title="Add New User"
                    formData={userForm}
                    handleFormChange={handleFormChange}
                    handleSubmit={handleAddUser}
                    handleClose={() => {
                        setIsAddModalOpen(false);
                        resetForm();
                    }}
                    isLoading={isLoading}
                    roles={roles}
                />
            )}

            {/* Edit User Modal */}
            {isEditModalOpen && (
                <UserFormModal
                    title="Edit User"
                    formData={userForm}
                    handleFormChange={handleFormChange}
                    handleSubmit={handleEditUser}
                    handleClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedUser(null);
                        resetForm();
                    }}
                    isLoading={isLoading}
                    isEdit
                    roles={roles}
                />
            )}

            {/* View User Modal */}
            {isViewModalOpen && selectedUser && (
                <ViewUserModal
                    user={selectedUser}
                    handleClose={() => {
                        setIsViewModalOpen(false);
                        setSelectedUser(null);
                        setActiveViewTab('profile');
                    }}
                    activeTab={activeViewTab}
                    setActiveTab={setActiveViewTab}
                    getRoleInfo={getRoleInfo}
                />
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete User</h3>
                            <p className="text-gray-600 text-center mb-6">
                                Are you sure you want to delete <strong>{selectedUser.name}</strong>?
                                This action cannot be undone and will revoke all system access.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setSelectedUser(null);
                                    }}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Deleting...' : 'Delete User'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {isResetPasswordModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mx-auto mb-4">
                                <Key className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Reset Password</h3>
                            <p className="text-gray-600 text-center mb-6">
                                Send a password reset email to <strong>{selectedUser.name}</strong> at <strong>{selectedUser.email}</strong>?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsResetPasswordModalOpen(false);
                                        setSelectedUser(null);
                                    }}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Sending...' : 'Send Reset Email'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper Components

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

function UserFormModal({ title, formData, handleFormChange, handleSubmit, handleClose, isLoading, isEdit, roles }) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h4 className="text-sm font-black text-[#63A6B2] uppercase tracking-[0.2em] mb-4">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition-all"
                                    placeholder="John"
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition-all"
                                    placeholder="Dela Cruz"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div>
                        <h4 className="text-sm font-black text-[#63A6B2] uppercase tracking-[0.2em] mb-4">Account Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition-all"
                                    placeholder="john@svrtfi.org"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Username *</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition-all"
                                    placeholder="jdelacruz"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition-all"
                                    placeholder="0917-123-4567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
                                <input
                                    type="text"
                                    name="employeeId"
                                    value={formData.employeeId}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition-all"
                                    placeholder="EMP-001"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Role & Status */}
                    <div>
                        <h4 className="text-sm font-black text-[#63A6B2] uppercase tracking-[0.2em] mb-4">System Access</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Role *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition-all bg-white"
                                    required
                                >
                                    {roles.map(role => (
                                        <option key={role.value} value={role.value}>
                                            {role.label} - {role.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition-all"
                                    placeholder="Administration"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Password Fields (Only for New Users) */}
                    {!isEdit && (
                        <div>
                            <h4 className="text-sm font-black text-[#63A6B2] uppercase tracking-[0.2em] mb-4">Security</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition-all"
                                        placeholder="Min. 8 characters"
                                        required={!isEdit}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition-all"
                                        placeholder="Re-type password"
                                        required={!isEdit}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Footer */}
                    <div className="flex gap-3 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border-2 border-[#63A6B2] text-[#63A6B2] rounded-lg font-semibold hover:bg-[#63A6B2] hover:text-white transition-all shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-[#63A6B2] text-white rounded-lg font-semibold hover:bg-[#4d8b96] transition-all shadow-lg shadow-[#63A6B2]/20 disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : isEdit ? 'Update User' : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ViewUserModal({ user, handleClose, activeTab, setActiveTab, getRoleInfo }) {
    const roleInfo = getRoleInfo(user.role);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#63A6B2] to-[#4d8b96] p-8 text-white relative">
                    <button onClick={handleClose} className="absolute right-6 top-6 text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition">
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex flex-col md:flex-row items-center gap-6 mt-4">
                        <div className={`w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-4xl font-bold shadow-xl`}>
                            {user.initials}
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h3 className="text-3xl font-bold mb-2">{user.name}</h3>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/90">
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-white/10">
                                    <Mail className="w-4 h-4" />
                                    {user.email}
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-white/10">
                                    <Phone className="w-4 h-4" />
                                    {user.phone || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-white/10">
                                    <Shield className="w-4 h-4" />
                                    {user.username}
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${user.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}`}>
                                {user.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 bg-[#f8fafb] border-b border-gray-100">
                    <div className="p-4 border-r border-gray-100 text-center">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Role</p>
                        <p className="text-lg font-bold text-[#63A6B2]">{roleInfo.label}</p>
                    </div>
                    <div className="p-4 border-r border-gray-100 text-center">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Department</p>
                        <p className="text-lg font-bold text-[#63A6B2]">{user.department}</p>
                    </div>
                    <div className="p-4 border-r border-gray-100 text-center">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Employee ID</p>
                        <p className="text-lg font-bold text-[#63A6B2]">{user.employeeId}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Last Login</p>
                        <p className="text-sm font-bold text-[#63A6B2]">{user.lastLogin}</p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-white px-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-6 py-4 text-xs font-black tracking-widest transition-all border-b-2 ${activeTab === 'profile'
                            ? 'text-[#63A6B2] border-[#63A6B2]'
                            : 'text-gray-400 border-transparent hover:text-gray-600'
                            }`}
                    >
                        PROFILE INFORMATION
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`px-6 py-4 text-xs font-black tracking-widest transition-all border-b-2 ${activeTab === 'activity'
                            ? 'text-[#63A6B2] border-[#63A6B2]'
                            : 'text-gray-400 border-transparent hover:text-gray-600'
                            }`}
                    >
                        ACTIVITY LOG
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-white">
                    {activeTab === 'profile' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <section>
                                    <h5 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Account Details</h5>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 group hover:shadow-sm transition-all duration-300">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-[#63A6B2] group-hover:bg-[#63A6B2] group-hover:text-white transition-all">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Email Address</p>
                                                <p className="text-gray-900 font-semibold">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 group hover:shadow-sm transition-all duration-300">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-[#63A6B2] group-hover:bg-[#63A6B2] group-hover:text-white transition-all">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Username</p>
                                                <p className="text-gray-900 font-semibold">{user.username}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 group hover:shadow-sm transition-all duration-300">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-[#63A6B2] group-hover:bg-[#63A6B2] group-hover:text-white transition-all">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Phone Number</p>
                                                <p className="text-gray-900 font-semibold">{user.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                            <div className="space-y-8">
                                <section>
                                    <h5 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Role & Permissions</h5>
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-inner">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${roleInfo.color} shadow-sm`}></div>
                                                <p className="text-xl font-bold text-gray-900">{roleInfo.label}</p>
                                            </div>
                                            <p className="text-sm text-gray-600 italic leading-relaxed">{roleInfo.description}</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 group hover:shadow-sm transition-all duration-300">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-[#63A6B2] group-hover:bg-[#63A6B2] group-hover:text-white transition-all">
                                                <UserCog className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Department</p>
                                                <p className="text-gray-900 font-semibold">{user.department}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Activity History</h5>
                                <span className="text-[10px] font-black text-[#63A6B2] bg-[#63A6B2]/10 px-3 py-1 rounded-full uppercase tracking-tighter">Last 30 Days</span>
                            </div>
                            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden shadow-inner">
                                <table className="w-full text-left">
                                    <thead className="bg-[#63A6B2]/10 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Type</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Description</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date & Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        <tr className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-6 py-4"><span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-md uppercase">Login</span></td>
                                            <td className="px-6 py-4 text-sm text-gray-700">Successful login from browser</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">{user.lastLogin}</td>
                                        </tr>
                                        <tr className="hover:bg-emerald-50/50 transition-colors">
                                            <td className="px-6 py-4"><span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md uppercase">Update</span></td>
                                            <td className="px-6 py-4 text-sm text-gray-700">Modified user profile settings</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">Feb 5, 2026 3:45 PM</td>
                                        </tr>
                                        <tr className="hover:bg-purple-50/50 transition-colors">
                                            <td className="px-6 py-4"><span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-1 rounded-md uppercase">Export</span></td>
                                            <td className="px-6 py-4 text-sm text-gray-700">Generated donors report PDF</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">Feb 4, 2026 11:20 AM</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={handleClose}
                        className="px-10 py-3 bg-[#63A6B2] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#4d8b96] transition-all shadow-lg hover:shadow-[#63A6B2]/40 shadow-[#63A6B2]/20"
                    >
                        Close Viewer
                    </button>
                </div>
            </div>
        </div>
    );
}
