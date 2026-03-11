import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Home,
    Users,
    DollarSign,
    PieChart,
    FileText,
    BarChart3,
    UserCog,
    Settings,
    AlertTriangle,
    LogOut,
    X,
    Menu,
    LayoutTemplate,
    Mail,
    CreditCard
} from 'lucide-react';


const getAppSettings = () => {
    try { return JSON.parse(localStorage.getItem('appSettings')) || {}; } catch { return {}; }
};

// Role-based permissions configuration
const rolePermissions = {
    admin: ['dashboard', 'donors', 'donations', 'transactions', 'campaigns', 'foundations', 'reports', 'users', 'settings', 'audit', 'mailing'],
    finance: ['dashboard', 'donors', 'donations', 'transactions', 'reports'],
    encoder: ['dashboard', 'donors', 'donations', 'transactions', 'campaigns', 'foundations', 'reports'],
    auditor: ['dashboard', 'donors', 'donations', 'transactions', 'campaigns', 'foundations', 'reports', 'audit'],
    viewer: [] // Blocked from admin pages
};

// Navigation items configuration
const navigationItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/admin_dashboard' },
    { id: 'donors', icon: Users, label: 'Donors', path: '/admin_donors' },
    { id: 'donations', icon: DollarSign, label: 'Donations', path: '/admin_donations' },
    { id: 'transactions', icon: CreditCard, label: 'Transactions', path: '/admin_transactions' },
    { id: 'campaigns', icon: PieChart, label: 'Campaigns', path: '/admin_campaigns' },
    { id: 'foundations', icon: FileText, label: 'Foundations', path: '/admin_foundations' },
    { id: 'reports', icon: BarChart3, label: 'Reports', path: '/admin_reports' },
    { id: 'users', icon: UserCog, label: 'User Management', path: '/admin_users' }
];

const systemItems = [
    { id: 'settings', icon: Settings, label: 'Settings', path: '/admin_settings' },
    { id: 'audit', icon: AlertTriangle, label: 'Logs', path: '/admin_audit' },
    { id: 'mailing', icon: Mail, label: 'Mailing', path: '/admin_mailing' }
];

// NavItem Component
const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
            ${active
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }
        `}
    >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
    </button>
);

export default function AdminSidebar({ activePage, mobileMenuOpen, setMobileMenuOpen }) {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || {});
    const [appSettings, setAppSettings] = useState(getAppSettings);

    // Re-read settings whenever sidebar mounts or storage changes
    useEffect(() => {
        const onStorage = () => setAppSettings(getAppSettings());
        window.addEventListener('storage', onStorage);
        // Also re-check on focus (same-tab updates)
        window.addEventListener('appSettingsUpdated', onStorage);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('appSettingsUpdated', onStorage);
        };
    }, []);

    // Get user's role and permissions
    const userRole = user.role || 'viewer';
    const userPermissions = rolePermissions[userRole] || [];

    // Filter navigation items based on role
    const allowedNavItems = navigationItems.filter(item => userPermissions.includes(item.id));
    const allowedSystemItems = systemItems.filter(item => userPermissions.includes(item.id));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
        setTimeout(() => {
            navigate('/login');
        }, 500);
    };

    const handleNavigation = (path) => {
        navigate(path);
        if (setMobileMenuOpen) {
            setMobileMenuOpen(false);
        }
    };

    // Get user initials
    const getUserInitials = () => {
        if (user.first_name && user.last_name) {
            return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
        }
        if (user.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    // Get display name
    const getDisplayName = () => {
        if (user.first_name && user.last_name) {
            return `${user.first_name} ${user.last_name}`;
        }
        if (user.email) {
            return user.email;
        }
        return 'User';
    };

    // Get role display name
    const getRoleDisplay = () => {
        const roleNames = {
            admin: 'Administrator',
            finance: 'Finance',
            encoder: 'Data Encoder',
            auditor: 'Auditor',
            viewer: 'Viewer'
        };
        return roleNames[userRole] || userRole;
    };

    return (
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
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
                            {appSettings.logoImage
                                ? <img src={appSettings.logoImage} alt="logo" className="w-full h-full object-cover" />
                                : <LayoutTemplate className="w-5 h-5 text-white/70" />
                            }
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg leading-tight">
                                {appSettings.siteName || 'SVRTFI'}
                            </h1>
                            <p className="text-white/70 text-xs">
                                {appSettings.siteSubtitle || 'Donation CRM'}
                            </p>
                        </div>
                    </div>
                    {setMobileMenuOpen && (
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="lg:hidden text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 overflow-y-auto">
                {/* Main Navigation */}
                {allowedNavItems.length > 0 && (
                    <div className="px-3 space-y-1">
                        {allowedNavItems.map(item => (
                            <NavItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                active={activePage === item.id}
                                onClick={() => handleNavigation(item.path)}
                            />
                        ))}
                    </div>
                )}

                {/* System Navigation */}
                {allowedSystemItems.length > 0 && (
                    <div className="px-3 mt-6 pt-6 border-t border-white/10">
                        <div className="text-xs font-semibold text-white/50 px-4 mb-3 uppercase tracking-wider">
                            System
                        </div>
                        {allowedSystemItems.map(item => (
                            <NavItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                active={activePage === item.id}
                                onClick={() => handleNavigation(item.path)}
                            />
                        ))}
                    </div>
                )}

                {/* No Access Message for Viewers */}
                {allowedNavItems.length === 0 && allowedSystemItems.length === 0 && (
                    <div className="px-6 py-4 text-center">
                        <p className="text-white/70 text-sm">No admin access available</p>
                    </div>
                )}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-white/10">
                <div
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition"
                >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] flex items-center justify-center text-white font-bold">
                        {(() => { try { const u = JSON.parse(localStorage.getItem('user')); return u?.avatarImage ? <img src={u.avatarImage} alt="avatar" className="w-full h-full object-cover" /> : getUserInitials(); } catch { return getUserInitials(); } })()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{getDisplayName()}</p>
                        <p className="text-white/60 text-xs truncate">{getRoleDisplay()}</p>
                    </div>
                    <LogOut className="w-4 h-4 text-white/60" />
                </div>
            </div>
        </aside>
    );
}
