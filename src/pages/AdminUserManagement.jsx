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
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

    // Role definitions with descriptions (viewer excluded - for normal users only)
    const roles = [
        { value: 'admin', label: 'Admin', color: 'from-purple-500 to-purple-600', description: 'Administrative access' },
        { value: 'finance', label: 'Finance', color: 'from-green-500 to-green-600', description: 'Financial operations' },
        { value: 'encoder', label: 'Encoder', color: 'from-yellow-500 to-yellow-600', description: 'Data entry access' },
        { value: 'auditor', label: 'Auditor', color: 'from-orange-500 to-orange-600', description: 'Audit & compliance' }
    ];

    // All roles including viewer for display purposes
    const allRoles = [
        ...roles,
        { value: 'viewer', label: 'Viewer', color: 'from-gray-500 to-gray-600', description: 'Read-only access' }
    ];

    // Get role info (check all roles including viewer)
    const getRoleInfo = (roleValue) => {
        const role = allRoles.find(r => r.value === roleValue);
        // Default to viewer if role not found or is null/undefined
        return role || allRoles.find(r => r.value === 'viewer') || allRoles[0];
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
            filtered = filtered.filter(user => {
                const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
                const email = (user.email || '').toLowerCase();
                return fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
            });
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
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'name') return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
            if (sortBy === 'role') return (a.role || '').localeCompare(b.role || '');
            return 0;
        });

        setFilteredUsers(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterRole, filterStatus, sortBy, users]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();

            // Transform data to match frontend expectations
            const transformedUsers = data.users.map(user => {
                const userRole = user.role || 'viewer'; // Default to viewer if no role
                const roleInfo = getRoleInfo(userRole);

                return {
                    ...user,
                    name: `${user.first_name} ${user.last_name}`,
                    status: user.is_active !== false ? 'Active' : 'Inactive', // Default to Active (handle null/undefined)
                    username: user.email?.split('@')[0] || '',
                    initials: `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`,
                    color: roleInfo.color,
                    lastLogin: 'N/A',
                    createdAt: user.created_at,
                    address: user.address || '', // Renamed from department
                    employeeId: user.user_id, // Display user_id directly
                    role: userRole // Ensure role is set
                };
            });

            setUsers(transformedUsers);
            setStats(data.stats);

        } catch (error) {
            console.error('Error fetching users:', error);
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
            role: 'encoder', // Default to encoder
            status: 'Active',
            address: '', // Renamed from department
            employeeId: '', // No need to generate
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

            const response = await fetch('http://localhost:5000/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    firstName: userForm.firstName,
                    lastName: userForm.lastName,
                    email: userForm.email,
                    password: userForm.password,
                    phone: userForm.phone,
                    role: userForm.role,
                    department: userForm.department,
                    employeeId: userForm.employeeId
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to add user');
            }

            toast.success('User added successfully!');
            fetchUsers(); // Refresh the user list
            setIsAddModalOpen(false);
            resetForm();

        } catch (error) {
            toast.error(error.message || 'Failed to add user. Please try again.');
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

            const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.user_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    firstName: userForm.firstName,
                    lastName: userForm.lastName,
                    email: userForm.email,
                    phone: userForm.phone,
                    role: userForm.role,
                    department: userForm.department,
                    status: userForm.status
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update user');
            }

            toast.success('User updated successfully!');
            fetchUsers(); // Refresh the user list
            setIsEditModalOpen(false);
            setSelectedUser(null);
            resetForm();

        } catch (error) {
            toast.error(error.message || 'Failed to update user. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Delete user
    const handleDeleteUser = async () => {
        try {
            setIsLoading(true);

            const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.user_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete user');
            }

            toast.success('User deleted successfully!');
            fetchUsers(); // Refresh the user list
            setIsDeleteModalOpen(false);
            setSelectedUser(null);

        } catch (error) {
            toast.error(error.message || 'Failed to delete user. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle user status
    const handleToggleUserStatus = async (user) => {
        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        const originalStatus = user.status;

        // Optimistic update
        setUsers(prevUsers => prevUsers.map(u =>
            u.user_id === user.user_id ? { ...u, status: newStatus, is_active: newStatus === 'Active' } : u
        ));

        try {
            const response = await fetch(`http://localhost:5000/api/admin/users/${user.user_id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update status');

            toast.success(`User ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`);
            // fetchUsers(); // No need to fetch if optimistic update is correct, but can keep for sync

        } catch (error) {
            // Revert on error
            setUsers(prevUsers => prevUsers.map(u =>
                u.user_id === user.user_id ? { ...u, status: originalStatus, is_active: originalStatus === 'Active' } : u
            ));
            toast.error('Failed to update user status. Please try again.');
        }
    };

    // Reset password
    const handleResetPassword = async () => {
        try {
            setIsLoading(true);

            const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.user_id}/reset-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to reset password');
            }

            toast.success('Password reset email sent successfully!');
            setIsResetPasswordModalOpen(false);
            setSelectedUser(null);

        } catch (error) {
            toast.error(error.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Open edit modal with user data
    const openEditModal = (user) => {
        setSelectedUser(user);
        setUserForm({
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            email: user.email || '',
            username: user.username || '',
            phone: user.contact_number || '',
            role: user.role || 'viewer',
            status: user.status || 'Active',
            address: user.address || '', // Renamed from department
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
            autoTable(doc, {
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
            <AdminSidebar
                activePage="users"
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <AdminHeader
                    title="User Management"
                    subtitle="Manage system users and access levels"
                    onMobileMenuClick={() => setMobileMenuOpen(true)}
                >
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
                </AdminHeader>

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
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
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
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.status === 'Active'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-gray-50 text-gray-500 border-gray-100'
                                                        }`}
                                                    >
                                                        {user.status}
                                                    </span>
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
                                                            onClick={() => handleToggleUserStatus(user)}
                                                            className={`p-2 rounded-lg transition ${user.status === 'Active'
                                                                ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                                                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                                                }`}
                                                            title={user.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                                                        >
                                                            {user.status === 'Active' ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleFormChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition-all"
                                    placeholder="123 Main St, City"
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
                <div className="grid grid-cols-3 bg-[#f8fafb] border-b border-gray-100">
                    <div className="p-4 border-r border-gray-100 text-center">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Role</p>
                        <p className="text-lg font-bold text-[#63A6B2]">{roleInfo.label}</p>
                    </div>
                    <div className="p-4 border-r border-gray-100 text-center">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">User ID</p>
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
                                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 group hover:shadow-sm transition-all duration-300">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-[#63A6B2] group-hover:bg-[#63A6B2] group-hover:text-white transition-all">
                                                <UserCog className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Address</p>
                                                <p className="text-gray-900 font-semibold">{user.address || 'N/A'}</p>
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
