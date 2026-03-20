import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Send, RefreshCw, FileText, CheckCircle, Server, List, History, Settings, Users, ArrowRight, Mail, Search, Clock, ShieldCheck, MailWarning, Eye, X } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

export default function AdminMailing() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('templates');

    // Test Email State
    const [testEmailForm, setTestEmailForm] = useState({ to: '', subject: '', message: '' });
    const [isSending, setIsSending] = useState(false);

    // Thank You Letters State
    const [thankYouLetters, setThankYouLetters] = useState([]);
    const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
    const [letterForm, setLetterForm] = useState({ id: null, title: '', message: '', status: 'active', associated_campaign_id: 'global' });
    const [isSavingLetter, setIsSavingLetter] = useState(false);

    // Send Modal State
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [selectedTemplateForSend, setSelectedTemplateForSend] = useState(null);
    const [mailingDonors, setMailingDonors] = useState([]);
    const [selectedDonors, setSelectedDonors] = useState([]);
    const [isSendingBatch, setIsSendingBatch] = useState(false);

    // Receipt Template State
    const [receiptTemplate, setReceiptTemplate] = useState({ title: '', message: '' });
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState('global');

    // Data lists
    const [emailLogs, setEmailLogs] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);

    // Selected Log Modal
    const [selectedLog, setSelectedLog] = useState(null);

    // SMTP Details State
    const [smtpSettings, setSmtpSettings] = useState({
        host: 'smtp.gmail.com',
        port: '465',
        user: 'svrtfi@gmail.com',
        encryption: 'SSL/TLS',
        status: 'Connected'
    });

    useEffect(() => {
        fetchCampaigns();
        fetchThankYouLetters();
    }, []);

    useEffect(() => {
        if (activeTab === 'templates') fetchReceiptTemplate();
        if (activeTab === 'logs') fetchEmailLogs();
        if (activeTab === 'list') fetchSubscribers();
    }, [activeTab, selectedCampaignId]);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/campaigns/all');
            const data = await res.json();
            if (res.ok && Array.isArray(data)) setCampaigns(data);
        } catch (err) { console.error('Error fetching campaigns:', err); }
    };

    const fetchReceiptTemplate = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/receipt-template?campaign_id=${selectedCampaignId}`);
            const data = await res.json();
            if (res.ok && data) setReceiptTemplate({ title: data.title || '', message: data.message || '' });
            else setReceiptTemplate({ title: '', message: '' });
        } catch (err) { console.error('Error fetching template:', err); }
    };

    const fetchEmailLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const res = await fetch('http://localhost:5000/api/admin/email-logs');
            const data = await res.json();
            if (res.ok) setEmailLogs(data);
        } catch (err) { console.error('Error fetching logs:', err); }
        finally { setIsLoadingLogs(false); }
    };

    const fetchSubscribers = async () => {
        setIsLoadingSubscribers(true);
        try {
            const res = await fetch('http://localhost:5000/api/admin/subscribers');
            const data = await res.json();
            if (res.ok) setSubscribers(data);
        } catch (err) { console.error('Error fetching subscribers:', err); }
        finally { setIsLoadingSubscribers(false); }
    };

    const handleSaveTemplate = async () => {
        if (!receiptTemplate.title || !receiptTemplate.message) {
            toast.error('Template fields cannot be empty.');
            return;
        }
        setIsSavingTemplate(true);
        try {
            const res = await fetch('http://localhost:5000/api/admin/receipt-template', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...receiptTemplate, campaign_id: selectedCampaignId })
            });
            if (res.ok) toast.success(`${selectedCampaignId === 'global' ? 'Global' : 'Campaign'} receipt template updated!`);
            else toast.error('Failed to update template.');
        } catch (err) { toast.error('Connection error.'); }
        finally { setIsSavingTemplate(false); }
    };

    const handleSendTestEmail = async () => {
        if (!testEmailForm.to || !testEmailForm.subject || !testEmailForm.message) {
            toast.error('Please fill in all fields.');
            return;
        }
        setIsSending(true);
        try {
            const response = await fetch('http://localhost:5000/api/admin/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testEmailForm)
            });
            if (response.ok) {
                toast.success('Email sent successfully!');
                setTestEmailForm({ to: '', subject: '', message: '' });
                if (activeTab === 'logs') fetchEmailLogs();
            } else {
                toast.error('Failed to send email.');
            }
        } catch (error) { toast.error('Failed to connect to mailing service.'); }
        finally { setIsSending(false); }
    };

    const tabs = [
        { id: 'smtp', label: 'SMTP Details', icon: Server },
        { id: 'templates', label: 'Edit Templates', icon: FileText },
        { id: 'logs', label: 'Email Logs', icon: History },
        { id: 'list', label: 'Mailing List', icon: Users },
    ];

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f6f8]">
            <AdminSidebar activePage="mailing" mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            <main className="flex-1 overflow-y-auto">
                <AdminHeader
                    title="Mailing Service"
                    subtitle="Configure SMTP, manage templates, and monitor email communications"
                    onMobileMenuClick={() => setMobileMenuOpen(true)}
                />

                <div className="px-6 lg:px-10 py-6 max-w-6xl mx-auto">
                    {/* Tab Navigation */}
                    <div className="flex flex-wrap gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                        ? 'bg-[#63A6B2] text-white shadow-md shadow-[#63A6B2]/20'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#63A6B2]'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {activeTab === 'templates' && (
                            <div className="max-w-4xl mx-auto space-y-6">
                                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-[#63A6B2]/5">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-[#63A6B2]" />
                                            <h2 className="text-base font-bold text-gray-900">Receipt Email Configuration</h2>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">Customize the email content sent to donors after a successful donation.</p>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <label className="block text-xs font-bold text-[#63A6B2] uppercase tracking-wider mb-2">Configure For:</label>
                                            <select
                                                value={selectedCampaignId}
                                                onChange={e => setSelectedCampaignId(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#63A6B2] shadow-sm bg-white"
                                            >
                                                <option value="global">🌍 Global Default (All Campaigns)</option>
                                                <optgroup label="Specific Campaigns">
                                                    {(campaigns || []).map(c => (
                                                        <option key={c.campaign_id} value={c.campaign_id}>🎁 {c.campaign_name}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                            <p className="text-[10px] text-gray-500 mt-2 italic font-medium">
                                                {selectedCampaignId === 'global'
                                                    ? "* Configuring the global fallback. This will be used if a campaign doesn't have its own setup."
                                                    : "* Configuring a unique receipt for this specific campaign."}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Email Subject Title</label>
                                            <input type="text" value={receiptTemplate.title}
                                                onChange={e => setReceiptTemplate(p => ({ ...p, title: e.target.value }))}
                                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] transition-all font-medium"
                                                placeholder="e.g. Official Donation Receipt" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Thank You Message (Inside Receipt)</label>
                                            <textarea
                                                value={receiptTemplate.message}
                                                onChange={e => setReceiptTemplate(p => ({ ...p, message: e.target.value }))}
                                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] transition-all resize-none h-32 leading-relaxed"
                                                placeholder="Thank you for your generous support! Your donation helps..."
                                            ></textarea>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold uppercase tracking-tighter cursor-default">Subject Only: {"${donation_id}"}</span>
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold uppercase tracking-tighter cursor-default">Subject Only: {"${campaign_name}"}</span>
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold uppercase tracking-tighter cursor-default">Subject Only: {"${donor_name}"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
                                        <button onClick={handleSaveTemplate} disabled={isSavingTemplate}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm bg-[#63A6B2] hover:bg-[#4a8a95] text-white disabled:opacity-50">
                                            {isSavingTemplate ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                                                : <><CheckCircle className="w-4 h-4" /> Save Configuration</>}
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'smtp' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Server className="w-4 h-4 text-[#63A6B2]" />
                                                <h2 className="text-base font-bold text-gray-900">Server SMTP Details</h2>
                                            </div>
                                            <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100">
                                                Active & Connected
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">Configure your outgoing mail server settings for the system.</p>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">SMTP Host</label>
                                                <input type="text" value={smtpSettings.host} readOnly className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">SMTP Port</label>
                                                <input type="text" value={smtpSettings.port} readOnly className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">User / Display Name</label>
                                                <input type="text" value={smtpSettings.user} readOnly className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600" />
                                            </div>
                                        </div>
                                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
                                                <ShieldCheck className="w-4 h-4" />
                                                Settings are currently read-only (Managed by Environment)
                                            </div>
                                            <button className="px-4 py-2 text-sm font-bold text-[#63A6B2] hover:bg-[#63A6B2]/5 rounded-lg transition-colors">
                                                Request Change
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                    <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Send className="w-4 h-4 text-[#63A6B2]" />
                                            <h2 className="text-base font-bold text-gray-900">Send Test Email</h2>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">Test your current SMTP configuration.</p>
                                    </div>
                                    <div className="p-6 space-y-4 flex-1">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Recipient Email</label>
                                            <input type="email" value={testEmailForm.to}
                                                onChange={e => setTestEmailForm(p => ({ ...p, to: e.target.value }))}
                                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] transition-all"
                                                placeholder="Enter recipient email" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject</label>
                                            <input type="text" value={testEmailForm.subject}
                                                onChange={e => setTestEmailForm(p => ({ ...p, subject: e.target.value }))}
                                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] transition-all"
                                                placeholder="Test Subject" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
                                            <textarea
                                                value={testEmailForm.message}
                                                onChange={e => setTestEmailForm(p => ({ ...p, message: e.target.value }))}
                                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] transition-all resize-none h-24"
                                                placeholder="Test Message..."
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                                        <button onClick={handleSendTestEmail} disabled={isSending || !testEmailForm.to}
                                            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm bg-[#63A6B2] hover:bg-[#4a8a95] text-white disabled:opacity-50">
                                            {isSending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                                                : <><Send className="w-4 h-4" /> Send Test Email</>}
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'logs' && (
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">Email History Logs</h2>
                                        <p className="text-xs text-gray-400 mt-0.5">Viewing recent system emails.</p>
                                    </div>
                                    <button onClick={fetchEmailLogs} disabled={isLoadingLogs} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                        <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recipient</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subject</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Sent Date</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {emailLogs.length > 0 ? emailLogs.map((log) => (
                                                <tr key={log.log_id} className="hover:bg-[#63A6B2]/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#63A6B2]">
                                                                <Mail className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="text-sm font-bold text-gray-900">{log.recipient_email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-600 font-medium truncate max-w-[200px]">{log.subject}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium whitespace-nowrap">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                            {formatDate(log.sent_at)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${log.status === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                                                            } border`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => setSelectedLog(log)}
                                                            className="p-1.5 hover:bg-[#63A6B2] hover:text-white text-gray-400 rounded-lg transition-all"
                                                            title="View Email Content"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-20 text-center">
                                                        {isLoadingLogs ? (
                                                            <RefreshCw className="w-8 h-8 animate-spin text-gray-200 mx-auto" />
                                                        ) : (
                                                            <div className="flex flex-col items-center text-gray-400">
                                                                <MailWarning className="w-10 h-10 mb-2 opacity-20" />
                                                                <p className="text-sm font-medium">No email logs found.</p>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {activeTab === 'list' && (
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">Mailing List Recipients</h2>
                                        <p className="text-xs text-gray-400 mt-0.5">Manage users who receive automated updates.</p>
                                    </div>
                                    <button onClick={fetchSubscribers} disabled={isLoadingSubscribers} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                        <RefreshCw className={`w-4 h-4 ${isLoadingSubscribers ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Subscriber</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center whitespace-nowrap">Receipts</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center whitespace-nowrap">Newsletters</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {subscribers.length > 0 ? subscribers.map((sub) => (
                                                <tr key={sub.subscriber_id} className="hover:bg-[#63A6B2]/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs uppercase">
                                                                {sub.full_name ? sub.full_name.charAt(0) : sub.email.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-900 leading-tight">{sub.full_name || 'Anonymous Subscriber'}</div>
                                                                <div className="text-[10px] text-gray-400">{sub.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center">
                                                            <div className={`w-3 h-3 rounded-full ${sub.receipts_opt_in ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center">
                                                            <div className={`w-3 h-3 rounded-full ${sub.newsletters_opt_in ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100`}>
                                                            {sub.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-xs font-bold text-[#63A6B2] hover:text-[#4a8a95]">Manage</button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-20 text-center">
                                                        {isLoadingSubscribers ? (
                                                            <RefreshCw className="w-8 h-8 animate-spin text-gray-200 mx-auto" />
                                                        ) : (
                                                            <div className="flex flex-col items-center text-gray-400">
                                                                <Users className="w-10 h-10 mb-2 opacity-20" />
                                                                <p className="text-sm font-medium">No subscribers found.</p>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>

            {/* Email Content Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Email Details</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sent To:</span>
                                    <span className="text-xs font-bold text-[#63A6B2]">{selectedLog.recipient_email}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 bg-gray-50 overflow-y-auto flex-1">
                            <div className="mb-6">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Subject</label>
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-800 shadow-sm">
                                    {selectedLog.subject}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Message Content (HTML)</label>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 text-sm text-gray-600 shadow-sm min-h-[200px] leading-relaxed overflow-hidden">
                                    {selectedLog.message ? (
                                        <div dangerouslySetInnerHTML={{ __html: selectedLog.message }} className="prose prose-sm max-w-none break-words" />
                                    ) : (
                                        <span className="italic text-gray-400">No message content available.</span>
                                    )}
                                </div>
                            </div>
                            {selectedLog.error_message && (
                                <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-4">
                                    <label className="block text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Error Information</label>
                                    <p className="text-xs text-red-600 font-medium">{selectedLog.error_message}</p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(selectedLog.sent_at)}
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-black/10"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
