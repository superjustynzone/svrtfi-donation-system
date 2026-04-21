import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
    Save, RefreshCw, CheckCircle,
    LayoutTemplate, Upload, X, ShieldCheck, FileText, Download, List
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminSettings() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const logoInputRef = useRef(null);
    const csvFileRef = useRef(null);

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

    // ─── Legal Settings State ─────────────────────────────────────────
    const [terms, setTerms] = useState('<p></p>');
    const [privacy, setPrivacy] = useState('<p></p>');
    const [isSavingTerms, setIsSavingTerms] = useState(false);
    const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
    const [savedTerms, setSavedTerms] = useState(false);
    const [savedPrivacy, setSavedPrivacy] = useState(false);

    // ─── Receipt Sequence State ───────────────────────────────────────
    const [isSavingSeq, setIsSavingSeq] = useState(false);
    const [savedSeq, setSavedSeq] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [sequences, setSequences] = useState([]);
    const [isLoadingView, setIsLoadingView] = useState(false);

    const handleViewSequences = async () => {
        setShowViewModal(true);
        setIsLoadingView(true);
        try {
            const res = await fetch('/api/admin/settings/receipt-sequences');
            const data = await res.json();
            if (res.ok) {
                setSequences(data);
            } else {
                toast.error('Failed to fetch sequences');
            }
        } catch (err) {
            toast.error('Connection error.');
            console.error(err);
        } finally {
            setIsLoadingView(false);
        }
    };

    const handleCSVUpload = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;
            if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                toast.error('Please upload a CSV file.');
                if (csvFileRef.current) csvFileRef.current.value = '';
                return;
            }

            setIsSavingSeq(true);
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const dataUrl = ev.target.result; // data:text/csv;base64,....
                    const base64 = dataUrl.split(',')[1];
                    const payload = { fileName: file.name, contentBase64: base64 };
                    const res = await fetch('/api/admin/settings/receipt-sequences/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (res.ok) {
                        toast.success(data.message || 'Sequences uploaded successfully!');
                        setSavedSeq(true);
                        setTimeout(() => setSavedSeq(false), 3000);
                    } else {
                        toast.error(data.message || 'Failed to upload sequences.');
                    }
                } catch (err) {
                    toast.error('Connection error.');
                } finally {
                    setIsSavingSeq(false);
                    if (csvFileRef.current) csvFileRef.current.value = '';
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            toast.error('Connection error.');
            setIsSavingSeq(false);
            if (csvFileRef.current) csvFileRef.current.value = '';
        }
        };

        const handleSavePolicy = async (key, value, setSaving, setSaved) => {
            setSaving(true);
            try {
                const res = await fetch('/api/admin/settings/site-settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ setting_key: key, setting_value: value })
                });
                if (res.ok) {
                    toast.success('Successfully saved!');
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                } else {
                    toast.error('Failed to save settings.');
                }
            } catch (err) {
                toast.error('Connection error.');
            } finally {
                setSaving(false);
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
                <div className="px-6 lg:px-10 py-8 w-full space-y-8">

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

                    {/* ② RECEIPT SEQUENCES ─────────────────────────── */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-50 to-white px-6 pt-6 pb-5 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-[#63A6B2]/10 rounded-lg">
                                    <FileText className="w-4 h-4 text-[#63A6B2]" />
                                </div>
                                <h2 className="text-base font-bold text-slate-800">Receipt Sequences</h2>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">Manage bulk receipt sequence numbers for your email receipts. Warning: Uploading a new CSV will overwrite existing unused sequences.</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Upload Box */}
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="w-10 h-10 rounded-lg bg-[#63A6B2]/10 border border-[#63A6B2]/20 flex items-center justify-center mb-3">
                                            <Upload className="w-5 h-5 text-[#63A6B2]" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800 mb-1">Upload New Sequences</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mb-5">
                                            Upload a CSV containing your sequence numbers in the first column. Existing unused sequences will be deleted.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        <button type="button" onClick={() => csvFileRef.current?.click()} disabled={isSavingSeq}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#63A6B2] text-white text-xs font-semibold rounded-lg hover:bg-[#4a8a95] transition-all shadow-sm shadow-[#63A6B2]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isSavingSeq ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
                                            {isSavingSeq ? 'Uploading...' : 'Choose CSV File'}
                                        </button>
                                        <input ref={csvFileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                                    </div>
                                </div>

                                {/* Manage Box */}
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100/50 flex items-center justify-center mb-3">
                                            <List className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800 mb-1">Sequence Management</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mb-5">
                                            Download a template to get started, or view the status of currently uploaded sequences.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        <button type="button" onClick={handleViewSequences}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm">
                                            <List className="w-4 h-4" /> View Sequences
                                        </button>
                                                     <a href="/api/admin/settings/receipt-sequences/template" download
                                           className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
                                            <Download className="w-4 h-4" /> Download Template
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ③ TERMS & CONDITIONS ────────────────────────── */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#63A6B2]" />
                                <h2 className="text-base font-bold text-gray-900">Terms & Conditions</h2>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Edit the terms shown to users across the platform.</p>
                        </div>
                        <div className="p-6">
                            <ReactQuill theme="snow" value={terms} onChange={setTerms} className="h-64 mb-12" />
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => handleSavePolicy('terms_and_conditions', terms, setIsSavingTerms, setSavedTerms)} disabled={isSavingTerms} className={saveBtnClass(savedTerms)}>
                                {isSavingTerms ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                                    : savedTerms ? <><CheckCircle className="w-4 h-4" /> Saved!</>
                                        : <><Save className="w-4 h-4" /> Save Terms</>}
                            </button>
                        </div>
                    </section>

                    {/* ③ PRIVACY POLICY ───────────────────────────── */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm pb-8">
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-[#63A6B2]" />
                                <h2 className="text-base font-bold text-gray-900">Privacy Policy</h2>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Edit the privacy policy detailing data practices.</p>
                        </div>
                        <div className="p-6">
                            <ReactQuill theme="snow" value={privacy} onChange={setPrivacy} className="h-64 mb-12" />
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => handleSavePolicy('privacy_policy', privacy, setIsSavingPrivacy, setSavedPrivacy)} disabled={isSavingPrivacy} className={saveBtnClass(savedPrivacy)}>
                                {isSavingPrivacy ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                                    : savedPrivacy ? <><CheckCircle className="w-4 h-4" /> Saved!</>
                                        : <><Save className="w-4 h-4" /> Save Privacy</>}
                            </button>
                        </div>
                    </section>
                </div>
            </main>

            {/* VIEW SEQUENCES MODAL */}
            {showViewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Receipt Sequences</h3>
                                <p className="text-sm text-slate-500 mt-1">Review your uploaded sequence numbers.</p>
                            </div>
                            <button onClick={() => setShowViewModal(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                            {isLoadingView ? (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw className="w-8 h-8 text-[#63A6B2] animate-spin" />
                                </div>
                            ) : sequences.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No sequences found</p>
                                    <p className="text-sm text-slate-400 mt-1">Upload a CSV file to add sequences.</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                                <th className="px-5 py-3">Sequence Number</th>
                                                <th className="px-5 py-3">Status</th>
                                                <th className="px-5 py-3">Added On</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {sequences.map(seq => (
                                                <tr key={seq.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3 font-mono font-medium text-slate-700">{seq.sequence_number}</td>
                                                    <td className="px-5 py-3">
                                                        {seq.is_used ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wide">
                                                                Used
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[11px] font-bold uppercase tracking-wide">
                                                                Available
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-500">
                                                        {new Date(seq.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex justify-end">
                             <button onClick={() => setShowViewModal(false)}
                                    className="px-5 py-2 min-w-[100px] bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                                Close
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
