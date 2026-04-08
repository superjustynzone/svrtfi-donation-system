import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
    Save, User, Lock, Eye, EyeOff, RefreshCw, CheckCircle,
    Upload, X, Camera, Phone
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { provinces, citiesByProvince } from '../data/philippineLocations';

export default function AdminProfile() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const avatarInputRef = useRef(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // ─── User state ───────────────────────────────────────────────────
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
    });
    const [profileForm, setProfileForm] = useState({
        firstName: (user.firstName || user.first_name) || '',
        lastName: (user.lastName || user.last_name) || '',
        email: user.email || '',
        phone: (user.phone || user.contact_number) || '',
        addressLine1: (user.personalAddress || user.address || user.address1) || '',
        addressLine2: user.address2 || '',
        barangay: user.barangay || '',
        province: user.province || '',
        city: user.city || '',
        country: user.country || 'Philippines',
        zipCode: (user.zipCode || user.zip_code) || '',
        tinNumber: (user.tinNumber || user.tin_number) || '',
        avatarImage: user.avatarImage || user.profileImage || null
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // ─── Password state ───────────────────────────────────────────────
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('user')) || {};
        setUser(stored);
        setProfileForm({
            firstName: (stored.firstName || stored.first_name) || '',
            lastName: (stored.lastName || stored.last_name) || '',
            email: stored.email || '',
            phone: (stored.phone || stored.contact_number) || '',
            addressLine1: (stored.personalAddress || stored.address || stored.address1) || '',
            addressLine2: stored.address2 || '',
            barangay: stored.barangay || '',
            province: stored.province || '',
            city: stored.city || '',
            country: stored.country || 'Philippines',
            zipCode: (stored.zipCode || stored.zip_code) || '',
            tinNumber: (stored.tinNumber || stored.tin_number) || '',
            avatarImage: stored.avatarImage || stored.profileImage || null
        });
    }, []);

    // ─── Helpers ──────────────────────────────────────────────────────
    const getRoleDisplay = () => {
        const map = { admin: 'Administrator', finance: 'Finance', encoder: 'Data Encoder', auditor: 'Auditor', viewer: 'Viewer', superadmin: 'Super Admin' };
        return map[user.role] || user.role || 'User';
    };
    const getInitials = () => {
        if (profileForm.firstName && profileForm.lastName)
            return `${profileForm.firstName[0]}${profileForm.lastName[0]}`.toUpperCase();
        return (profileForm.email || 'U').substring(0, 2).toUpperCase();
    };
    const username = user.username || user.email?.split('@')[0] || 'N/A';
    const employeeId = user.user_id || user.id || 'N/A';
    const lastLogin = user.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A';

    // ─── Image helpers ────────────────────────────────────────────────
    const readImage = (file, onLoad) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return; }
        const reader = new FileReader();
        reader.onload = e => onLoad(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return; }

        setIsUploadingAvatar(true);
        toast.info('Uploading photo...');

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('userId', user.user_id);

            const response = await fetch('http://localhost:5000/api/user/profile/upload-image', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                const fullImagePath = `http://localhost:5000${data.imagePath}`;
                applyAvatarChange(fullImagePath);
                toast.success('Profile photo updated!');
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch {
            // Fallback to base64 if backend unavailable
            readImage(file, img => {
                applyAvatarChange(img);
                toast.success('Profile photo updated!');
            });
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const applyAvatarChange = (src) => {
        setProfileForm(p => ({ ...p, avatarImage: src }));
        const updated = { ...user, avatarImage: src, profileImage: src };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        window.dispatchEvent(new Event('adminProfileUpdated'));
        window.dispatchEvent(new Event('userProfileUpdated'));
    };

    // ─── Save: profile ────────────────────────────────────────────────
    const handleSaveProfile = async () => {
        if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
            toast.error('First name and last name are required.'); return;
        }
        setIsSaving(true);
        try {
            const response = await fetch(`http://localhost:5000/api/user/profile/${user.user_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: profileForm.firstName.trim(),
                    lastName: profileForm.lastName.trim(),
                    phone: profileForm.phone.trim(),
                    address: profileForm.addressLine1.trim(),
                    address2: profileForm.addressLine2.trim(),
                    barangay: profileForm.barangay.trim(),
                    province: profileForm.province,
                    city: profileForm.city,
                    country: profileForm.country,
                    zipCode: profileForm.zipCode.trim(),
                    tinNumber: profileForm.tinNumber?.trim() || '',
                    profileImage: profileForm.avatarImage
                }),
            });
            if (response.ok) {
                const updatedUser = {
                    ...user,
                    firstName: profileForm.firstName.trim(),
                    first_name: profileForm.firstName.trim(),
                    lastName: profileForm.lastName.trim(),
                    last_name: profileForm.lastName.trim(),
                    phone: profileForm.phone.trim(),
                    contact_number: profileForm.phone.trim(),
                    address1: profileForm.addressLine1.trim(),
                    address: profileForm.addressLine1.trim(),
                    address2: profileForm.addressLine2.trim(),
                    barangay: profileForm.barangay.trim(),
                    province: profileForm.province,
                    city: profileForm.city,
                    country: profileForm.country,
                    zipCode: profileForm.zipCode.trim(),
                    zip_code: profileForm.zipCode.trim(),
                    tinNumber: profileForm.tinNumber?.trim() || '',
                    tin_number: profileForm.tinNumber?.trim() || '',
                    profileImage: profileForm.avatarImage,
                    avatarImage: profileForm.avatarImage,
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                window.dispatchEvent(new Event('adminProfileUpdated'));
                window.dispatchEvent(new Event('userProfileUpdated'));
                setSaved(true);
                toast.success('Profile updated!');
                setTimeout(() => setSaved(false), 3000);
            } else {
                const err = await response.json();
                toast.error(err.message || 'Failed to update profile.');
            }
        } catch { toast.error('Could not connect to the server.'); }
        finally { setIsSaving(false); }
    };

    // ─── Save: password ───────────────────────────────────────────────
    const handleSavePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error('All password fields are required.'); return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Passwords do not match.'); return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters.'); return;
        }
        setIsSavingPassword(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.user_id, currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
            });
            if (res.ok) {
                toast.success('Password changed!');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to change password.');
            }
        } catch { toast.error('Could not connect to the server.'); }
        finally { setIsSavingPassword(false); }
    };

    // ─── Shared button styles ─────────────────────────────────────────
    const saveBtnClass = (active) =>
        `flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${active
            ? 'bg-green-500 text-white'
            : 'bg-[#63A6B2] hover:bg-[#4a8a95] text-white hover:shadow-md'
        } disabled:opacity-50 disabled:cursor-not-allowed`;

    // ─── Render ───────────────────────────────────────────────────────
    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f6f8]">
            <AdminSidebar activePage="profile" mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            <main className="flex-1 overflow-y-auto">
                <AdminHeader
                    title="Account Profile"
                    subtitle="Manage your personal information and security"
                    onMobileMenuClick={() => setMobileMenuOpen(true)}
                />

                {/* ── Page content ── */}
                <div className="px-6 lg:px-10 py-8 w-full max-w-full space-y-6">

                    {/* ① ADMIN PROFILE ─────────────────────────────── */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-[#63A6B2]" />
                                <h2 className="text-base font-bold text-gray-900">Admin Profile</h2>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Your display name, photo and contact details</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Avatar upload */}
                            <div className="flex items-center gap-5 pb-6 border-b border-gray-100">
                                <div className="relative flex-shrink-0">
                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#63A6B2] to-[#4a8a95] flex items-center justify-center text-white font-bold text-2xl shadow-md">
                                        {isUploadingAvatar ? (
                                            <div className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                                        ) : profileForm.avatarImage ? (
                                            <img src={profileForm.avatarImage} alt="avatar" className="w-full h-full object-cover" />
                                        ) : getInitials()}
                                    </div>
                                    <button type="button" onClick={() => avatarInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#63A6B2] hover:bg-[#4a8a95] border-2 border-white flex items-center justify-center shadow transition-colors">
                                        <Camera className="w-3.5 h-3.5 text-white" />
                                    </button>
                                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Profile Photo</p>
                                    <p className="text-xs text-gray-400 mt-0.5 mb-2">PNG, JPG · max 5 MB</p>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => avatarInputRef.current?.click()}
                                            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#63A6B2] text-[#63A6B2] text-xs font-semibold rounded-lg hover:bg-[#63A6B2] hover:text-white transition-all">
                                            <Upload className="w-3.5 h-3.5" /> {profileForm.avatarImage ? 'Replace' : 'Upload'}
                                        </button>
                                        {profileForm.avatarImage && (
                                            <button type="button" onClick={() => { applyAvatarChange(null); avatarInputRef.current && (avatarInputRef.current.value = ''); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-50 transition-all">
                                                <X className="w-3.5 h-3.5" /> Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Read-only info strip */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Role', value: getRoleDisplay() },
                                    { label: 'Username', value: username },
                                    { label: 'Employee ID', value: employeeId },
                                    { label: 'Last Login', value: lastLogin },
                                ].map(({ label, value }) => (
                                    <div key={label} className="bg-gray-50 rounded-xl px-3 py-3 border border-gray-100">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                                        <p className="text-sm font-bold text-[#63A6B2] truncate" title={String(value)}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Editable fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">First Name <span className="text-red-400">*</span></label>
                                    <input type="text" value={profileForm.firstName}
                                        onChange={e => setProfileForm(p => ({ ...p, firstName: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="First name" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last Name <span className="text-red-400">*</span></label>
                                    <input type="text" value={profileForm.lastName}
                                        onChange={e => setProfileForm(p => ({ ...p, lastName: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="Last name" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                                    <input type="email" value={profileForm.email} disabled
                                        className="w-full px-3.5 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
                                </div>

                                {/* ── Structured Address ── */}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                        Address Line 1 <span className="font-normal text-gray-400">(House/Unit No., Street)</span>
                                    </label>
                                    <input type="text" value={profileForm.addressLine1}
                                        onChange={e => setProfileForm(p => ({ ...p, addressLine1: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="e.g. 123 Rizal Street" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                        Address Line 2 <span className="font-normal text-gray-400">(Subdivision, Building, Floor — optional)</span>
                                    </label>
                                    <input type="text" value={profileForm.addressLine2}
                                        onChange={e => setProfileForm(p => ({ ...p, addressLine2: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="e.g. Green Park Village" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Barangay</label>
                                    <input type="text" value={profileForm.barangay}
                                        onChange={e => setProfileForm(p => ({ ...p, barangay: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="e.g. Barangay Kapasigan" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Province</label>
                                    <select value={profileForm.province}
                                        onChange={e => setProfileForm(p => ({ ...p, province: e.target.value, city: '' }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all bg-white">
                                        <option value="">Select province</option>
                                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">City / Municipality</label>
                                    <select value={profileForm.city}
                                        onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all bg-white"
                                        disabled={!profileForm.province}>
                                        <option value="">{profileForm.province ? 'Select city' : 'Select province first'}</option>
                                        {(citiesByProvince[profileForm.province] || []).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Country</label>
                                    <input type="text" value={profileForm.country}
                                        onChange={e => setProfileForm(p => ({ ...p, country: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="Philippines" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Zip Code</label>
                                    <input type="text" value={profileForm.zipCode}
                                        onChange={e => setProfileForm(p => ({ ...p, zipCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="e.g. 1600" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                        <span className="inline-flex items-center gap-1">TIN Number</span>
                                    </label>
                                    <input type="text" value={profileForm.tinNumber}
                                        onChange={e => setProfileForm(p => ({ ...p, tinNumber: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="123-456-789-000" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                        <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number</span>
                                    </label>
                                    <input type="tel" value={profileForm.phone}
                                        onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="09XXXXXXXXX" />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={handleSaveProfile} disabled={isSaving} className={saveBtnClass(saved)}>
                                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                                    : saved ? <><CheckCircle className="w-4 h-4" /> Saved!</>
                                        : <><Save className="w-4 h-4" /> Save Profile</>}
                            </button>
                        </div>
                    </section>

                    {/* ② CHANGE PASSWORD ───────────────────────────── */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-[#63A6B2]" />
                                <h2 className="text-base font-bold text-gray-900">Change Password</h2>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Minimum 6 characters</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Current Password', key: 'currentPassword', show: showPw.current, toggle: () => setShowPw(p => ({ ...p, current: !p.current })) },
                                { label: 'New Password', key: 'newPassword', show: showPw.newPw, toggle: () => setShowPw(p => ({ ...p, newPw: !p.newPw })) },
                                { label: 'Confirm New Password', key: 'confirmPassword', show: showPw.confirm, toggle: () => setShowPw(p => ({ ...p, confirm: !p.confirm })) },
                            ].map(({ label, key, show, toggle }) => (
                                <div key={key}>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                                    <div className="relative">
                                        <input type={show ? 'text' : 'password'} value={passwordForm[key]}
                                            onChange={e => setPasswordForm(p => ({ ...p, [key]: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                            placeholder="••••••••" />
                                        <button type="button" onClick={toggle}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={handleSavePassword} disabled={isSavingPassword} className={saveBtnClass(false)}>
                                {isSavingPassword ? <><RefreshCw className="w-4 h-4 animate-spin" /> Updating...</> : <><Lock className="w-4 h-4" /> Update Password</>}
                            </button>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
