import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';

/**
 * Shared top header for all admin pages.
 * Shows the admin's profile photo (or initials) and name/role in the upper-right.
 * Reads from localStorage and re-syncs when the custom 'adminProfileUpdated' event fires
 * (dispatched by AdminSettings when the user saves their profile).
 */
export default function AdminHeader({ title, subtitle, onMobileMenuClick, children }) {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
    });

    // Re-read whenever AdminSettings or Profile.jsx saves profile
    useEffect(() => {
        const sync = () => {
            try {
                const stored = JSON.parse(localStorage.getItem('user')) || {};
                setAdmin(stored);
            } catch { }
        };
        window.addEventListener('adminProfileUpdated', sync);
        window.addEventListener('userProfileUpdated', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('adminProfileUpdated', sync);
            window.removeEventListener('userProfileUpdated', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const getInitials = () => {
        const f = admin.first_name?.[0] || '';
        const l = admin.last_name?.[0] || '';
        if (f || l) return `${f}${l}`.toUpperCase();
        return (admin.email || 'A').substring(0, 2).toUpperCase();
    };

    const getRoleDisplay = () => {
        const map = { admin: 'Administrator', finance: 'Finance', encoder: 'Data Encoder', auditor: 'Auditor', viewer: 'Viewer' };
        return map[admin.role] || admin.role || 'Admin';
    };

    const displayName = [admin.first_name, admin.last_name].filter(Boolean).join(' ') || admin.email || 'Admin';

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="px-4 lg:px-8 py-6 flex items-center justify-between">
                {/* Left: mobile menu + page title */}
                <div className="flex items-center gap-4">
                    {onMobileMenuClick && (
                        <button
                            onClick={onMobileMenuClick}
                            className="lg:hidden text-gray-500 hover:text-gray-800"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    )}
                    <div>
                        {title && <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>}
                        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                    </div>
                </div>

                {/* Right: optional extra actions + admin chip */}
                <div className="flex items-center gap-3">
                    {children}

                    {/* Admin profile chip */}
                    <button 
                        onClick={() => navigate('/admin_profile')}
                        className="hidden sm:flex items-center gap-2.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-[#63A6B2]/30 transition-all text-left"
                    >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                            {admin.avatarImage
                                ? <img src={admin.avatarImage} alt="avatar" className="w-full h-full object-cover" />
                                : getInitials()
                            }
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{displayName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{getRoleDisplay()}</p>
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
}
