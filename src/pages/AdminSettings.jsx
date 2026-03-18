import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
    Save, RefreshCw, CheckCircle,
    LayoutTemplate, Upload, X, Server
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

export default function AdminSettings() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const logoInputRef = useRef(null);

    // ─── Site branding state ──────────────────────────────────────────
    const getSettings = () => {
        try { return JSON.parse(localStorage.getItem('appSettings')) || {}; } catch { return {}; }
    };
    const [siteForm, setSiteForm] = useState(() => {
        const s = getSettings();
        return { siteName: s.siteName || '', siteSubtitle: s.siteSubtitle || '', logoImage: s.logoImage || null };
    });
    const [isSavingSite, setIsSavingSite] = useState(false);
    const [savedSite, setSavedSite] = useState(false);

    // ─── SMTP Settings State ──────────────────────────────────────────
    const [smtpForm, setSmtpForm] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('smtpSettings')) || {
                host: '',
                port: '',
                user: '',
                password: '',
                fromEmail: '',
                fromName: ''
            };
        } catch {
            return {
                host: '', port: '', user: '', password: '', fromEmail: '', fromName: ''
            };
        }
    });
    const [isSavingSmtp, setIsSavingSmtp] = useState(false);
    const [savedSmtp, setSavedSmtp] = useState(false);

    // ─── Image helpers ────────────────────────────────────────────────
    const readImage = (file, onLoad) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return; }
        const reader = new FileReader();
        reader.onload = e => onLoad(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleLogoUpload = e => readImage(e.target.files[0], img => setSiteForm(p => ({ ...p, logoImage: img })));

    // ─── Save: branding ───────────────────────────────────────────────
    const handleSaveSite = () => {
        setIsSavingSite(true);
        try {
            const settings = { siteName: siteForm.siteName.trim(), siteSubtitle: siteForm.siteSubtitle.trim(), logoImage: siteForm.logoImage };
            localStorage.setItem('appSettings', JSON.stringify(settings));
            window.dispatchEvent(new Event('appSettingsUpdated'));
            setSavedSite(true);
            toast.success('Website branding saved!');
            setTimeout(() => setSavedSite(false), 3000);
        } catch { toast.error('Failed to save.'); }
        finally { setIsSavingSite(false); }
    };

    // ─── Save: SMTP ───────────────────────────────────────────────────
    const handleSaveSmtp = () => {
        setIsSavingSmtp(true);
        try {
            localStorage.setItem('smtpSettings', JSON.stringify(smtpForm));
            setSavedSmtp(true);
            toast.success('SMTP Configuration saved!');
            setTimeout(() => setSavedSmtp(false), 3000);
        } catch {
            toast.error('Failed to save SMTP settings.');
        } finally {
            setIsSavingSmtp(false);
        }
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
            <AdminSidebar activePage="settings" mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            <main className="flex-1 overflow-y-auto">
                <AdminHeader
                    title="System Settings"
                    subtitle="Manage platform-wide branding and configurations"
                    onMobileMenuClick={() => setMobileMenuOpen(true)}
                />

                {/* ── Page content ── */}
                <div className="px-6 lg:px-10 py-8 max-w-5xl mx-auto space-y-8">

                    {/* ① WEBSITE BRANDING ──────────────────────────── */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <LayoutTemplate className="w-4 h-4 text-[#63A6B2]" />
                                <h2 className="text-base font-bold text-gray-900">Website Branding</h2>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Logo and name displayed across the admin panel</p>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Logo upload row */}
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-xl bg-[#f0f7f8] border-2 border-dashed border-[#63A6B2]/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {siteForm.logoImage
                                        ? <img src={siteForm.logoImage} alt="logo" className="w-full h-full object-cover" />
                                        : <LayoutTemplate className="w-7 h-7 text-[#63A6B2]/40" />
                                    }
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-1.5">Logo Image</p>
                                    <p className="text-xs text-gray-400 mb-2">PNG, JPG, SVG · max 5 MB</p>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => logoInputRef.current?.click()}
                                            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#63A6B2] text-[#63A6B2] text-xs font-semibold rounded-lg hover:bg-[#63A6B2] hover:text-white transition-all">
                                            <Upload className="w-3.5 h-3.5" /> {siteForm.logoImage ? 'Replace' : 'Upload'}
                                        </button>
                                        {siteForm.logoImage && (
                                            <button type="button" onClick={() => { setSiteForm(p => ({ ...p, logoImage: null })); logoInputRef.current && (logoInputRef.current.value = ''); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-50 transition-all">
                                                <X className="w-3.5 h-3.5" /> Remove
                                            </button>
                                        )}
                                    </div>
                                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                </div>
                            </div>

                            {/* Name + subtitle */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Site Name</label>
                                    <input type="text" value={siteForm.siteName}
                                        onChange={e => setSiteForm(p => ({ ...p, siteName: e.target.value }))} maxLength={30}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="e.g. SVRTFI" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subtitle</label>
                                    <input type="text" value={siteForm.siteSubtitle}
                                        onChange={e => setSiteForm(p => ({ ...p, siteSubtitle: e.target.value }))} maxLength={40}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="e.g. Donation CRM" />
                                </div>
                            </div>

                            {/* Sidebar preview */}
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Preview</p>
                                <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] rounded-xl shadow-sm">
                                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {siteForm.logoImage
                                            ? <img src={siteForm.logoImage} alt="logo" className="w-full h-full object-cover" />
                                            : <LayoutTemplate className="w-5 h-5 text-white/60" />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm leading-tight">{siteForm.siteName || 'Site Name'}</p>
                                        <p className="text-white/65 text-xs">{siteForm.siteSubtitle || 'Subtitle'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={handleSaveSite} disabled={isSavingSite} className={saveBtnClass(savedSite)}>
                                {isSavingSite ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                                    : savedSite ? <><CheckCircle className="w-4 h-4" /> Saved!</>
                                        : <><Save className="w-4 h-4" /> Save Branding</>}
                            </button>
                        </div>
                    </section>

                    {/* ② SMTP CONFIGURATION ────────────────────────── */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Server className="w-4 h-4 text-[#63A6B2]" />
                                <h2 className="text-base font-bold text-gray-900">SMTP Configuration</h2>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Set up your mail server credentials for system notifications.</p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Server Details</h3>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">SMTP Host</label>
                                    <input type="text" value={smtpForm.host}
                                        onChange={e => setSmtpForm(p => ({ ...p, host: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="smtp.example.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">SMTP Port</label>
                                    <input type="text" value={smtpForm.port}
                                        onChange={e => setSmtpForm(p => ({ ...p, port: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="587, 465, or 25" />
                                </div>
                                
                                <div className="md:col-span-2 mt-2">
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Authentication</h3>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
                                    <input type="text" value={smtpForm.user}
                                        onChange={e => setSmtpForm(p => ({ ...p, user: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="your-email@example.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                                    <input type="password" value={smtpForm.password}
                                        onChange={e => setSmtpForm(p => ({ ...p, password: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="••••••••••••••••" />
                                </div>

                                <div className="md:col-span-2 mt-2">
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Sender Details</h3>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">From Name</label>
                                    <input type="text" value={smtpForm.fromName}
                                        onChange={e => setSmtpForm(p => ({ ...p, fromName: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="e.g. SVRTFI Donations" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">From Email</label>
                                    <input type="email" value={smtpForm.fromEmail}
                                        onChange={e => setSmtpForm(p => ({ ...p, fromEmail: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                        placeholder="e.g. no-reply@svrtfi.org" />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={handleSaveSmtp} disabled={isSavingSmtp} className={saveBtnClass(savedSmtp)}>
                                {isSavingSmtp ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                                    : savedSmtp ? <><CheckCircle className="w-4 h-4" /> Saved!</>
                                        : <><Save className="w-4 h-4" /> Save Configuration</>}
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
