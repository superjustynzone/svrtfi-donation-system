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

    // New Subscriber Modal State
    const [isAddSubscriberModalOpen, setIsAddSubscriberModalOpen] = useState(false);
    const [subscriberForm, setSubscriberForm] = useState({ firstName: '', lastName: '', email: '', newsletter: true });
    const [isAddingSubscriber, setIsAddingSubscriber] = useState(false);

    // CSV Import State
    const [isImporting, setIsImporting] = useState(false);

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
        if (activeTab === 'letters') fetchThankYouLetters();
        if (activeTab === 'logs') fetchEmailLogs();
        if (activeTab === 'list') fetchSubscribers();
    }, [activeTab, selectedCampaignId]);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('http://127.0.0.1:5000/api/campaigns/all');
            const data = await res.json();
            if (res.ok && Array.isArray(data)) setCampaigns(data);
        } catch (err) { console.error('Error fetching campaigns:', err); }
    };

    const fetchReceiptTemplate = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/admin/receipt-template?campaign_id=${selectedCampaignId}`);
            const data = await res.json();
            if (res.ok && data) setReceiptTemplate({ title: data.title || '', message: data.message || '' });
            else setReceiptTemplate({ title: '', message: '' });
        } catch (err) { console.error('Error fetching template:', err); }
    };

    const fetchEmailLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const res = await fetch('http://127.0.0.1:5000/api/admin/email-logs');
            const data = await res.json();
            if (res.ok) setEmailLogs(data);
        } catch (err) { console.error('Error fetching logs:', err); }
        finally { setIsLoadingLogs(false); }
    };

    const fetchSubscribers = async () => {
        setIsLoadingSubscribers(true);
        try {
            const res = await fetch('http://127.0.0.1:5000/api/admin/subscribers');
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
            const res = await fetch('http://127.0.0.1:5000/api/admin/receipt-template', {
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
            const response = await fetch('http://127.0.0.1:5000/api/admin/send-email', {
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

    const fetchThankYouLetters = async () => {
        try {
            const res = await fetch('http://127.0.0.1:5000/api/admin/thank-you-letters');
            const data = await res.json();
            if (res.ok) setThankYouLetters(data);
        } catch (err) { console.error('Error fetching letters:', err); }
    };

    const handleSaveLetter = async () => {
        if (!letterForm.title || !letterForm.message) {
            toast.error('Title and message are required.');
            return;
        }
        setIsSavingLetter(true);
        try {
            const method = letterForm.id ? 'PUT' : 'POST';
            const url = letterForm.id ? `http://127.0.0.1:5000/api/admin/thank-you-letters/${letterForm.id}` : 'http://127.0.0.1:5000/api/admin/thank-you-letters';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(letterForm)
            });
            if (res.ok) {
                toast.success('Thank you letter template saved!');
                setIsLetterModalOpen(false);
                fetchThankYouLetters();
            } else { toast.error('Failed to save letter template.'); }
        } catch (err) { toast.error('Connection error.'); }
        finally { setIsSavingLetter(false); }
    };

    const handleDeleteLetter = async (id) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/admin/thank-you-letters/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Template deleted.');
                fetchThankYouLetters();
            } else toast.error('Deletion failed.');
        } catch (err) { toast.error('Connection error.'); }
    };

    const openSendModal = async (letter) => {
        setSelectedTemplateForSend(letter);
        setIsSendModalOpen(true);
        fetchMailingDonors(letter.associated_campaign_id);
    };

    const fetchMailingDonors = async (campaignId) => {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/admin/mailing-donors?campaign_id=${campaignId || 'global'}`);
            const data = await res.json();
            if (res.ok) {
                setMailingDonors(data);
                setSelectedDonors(data.map(d => d.email)); // Select all by default
            }
        } catch (err) { console.error('Error fetching donors:', err); }
    };

    const handleSendBatch = async () => {
        if (selectedDonors.length === 0) {
            toast.error('Please select at least one recipient.');
            return;
        }
        setIsSendingBatch(true);
        try {
            const res = await fetch('http://127.0.0.1:5000/api/admin/bulk-send-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients: selectedDonors,
                    subject: selectedTemplateForSend.title,
                    html: `<div style="font-family: sans-serif; line-height: 1.6;">${selectedTemplateForSend.message.replace(/\n/g, '<br>')}</div>`
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Bulk mailing completed!');
                setIsSendModalOpen(false);
                if (activeTab === 'logs') fetchEmailLogs();
            } else {
                toast.error(`Mailing failed: ${data.message}`);
            }
        } catch (err) { toast.error('Bulk sending error.'); }
        finally { setIsSendingBatch(false); }
    };


    const handleAddSubscriber = async (e) => {
        if (e) e.preventDefault();
        if (!subscriberForm.email || !subscriberForm.firstName || !subscriberForm.lastName) {
            toast.error('All fields are required.');
            return;
        }
        setIsAddingSubscriber(true);
        try {
            const res = await fetch('http://127.0.0.1:5000/api/admin/subscribers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: subscriberForm.email,
                    first_name: subscriberForm.firstName,
                    last_name: subscriberForm.lastName,
                    newsletter: subscriberForm.newsletter
                })
            });
            if (res.ok) {
                toast.success('Subscriber added successfully!');
                setIsAddSubscriberModalOpen(false);
                setSubscriberForm({ firstName: '', lastName: '', email: '', newsletter: true });
                fetchSubscribers();
            } else {
                const contentType = res.headers.get('content-type');
                let message = 'Failed to add subscriber.';
                if (contentType && contentType.includes('application/json')) {
                    const data = await res.json().catch(() => ({}));
                    message = data.message || message;
                } else {
                    const text = await res.text().catch(() => '');
                    console.error('Non-JSON response (100 chars):', text.substring(0, 100));
                    message = `Server error (${res.status}): ${res.statusText}. Check console.`;
                }
                toast.error(message);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error(`Connection error: ${err.message}. Check browser console.`);
        }
        finally { setIsAddingSubscriber(false); }
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsImporting(true);
        try {
            const res = await fetch('http://127.0.0.1:5000/api/admin/subscribers/import', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                fetchSubscribers();
            } else {
                toast.error(data.message || 'Import failed.');
            }
        } catch (err) {
            console.error('Import error:', err);
            toast.error('Connection error during import.');
        } finally {
            setIsImporting(false);
            e.target.value = ''; // Reset input
        }
    };

    const tabs = [
        { id: 'smtp', label: 'SMTP Details', icon: Server },
        { id: 'templates', label: 'Edit Templates', icon: FileText },
        { id: 'letters', label: 'Thank You Letters', icon: Mail },
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

                        {activeTab === 'letters' && (
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">Thank You Letter Templates</h2>
                                        <p className="text-xs text-gray-400 mt-0.5">Manage manual templates for donor mailing campaigns.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={fetchThankYouLetters} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setLetterForm({ id: null, title: '', message: '', status: 'active', associated_campaign_id: 'global' });
                                                setIsLetterModalOpen(true);
                                            }}
                                            className="px-4 py-2 bg-[#63A6B2] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#4a8a95] flex items-center gap-2"
                                        >
                                            <FileText className="w-4 h-4" /> New Template
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                    {thankYouLetters.length > 0 ? thankYouLetters.map((letter) => (
                                        <div key={letter.campaign_id} className="border border-gray-100 rounded-2xl p-5 hover:border-[#63A6B2] transition-colors group relative shadow-sm hover:shadow-md">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="bg-[#63A6B2]/10 p-2.5 rounded-xl text-[#63A6B2]">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => {
                                                        setLetterForm({
                                                            id: letter.campaign_id,
                                                            title: letter.title,
                                                            message: letter.message,
                                                            status: letter.status,
                                                            associated_campaign_id: letter.associated_campaign_id || 'global'
                                                        });
                                                        setIsLetterModalOpen(true);
                                                    }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"><Settings className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleDeleteLetter(letter.campaign_id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{letter.title}</h3>
                                            <p className="text-xs text-gray-400 line-clamp-2 mb-4 h-8 leading-relaxed">{letter.message}</p>
                                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                                <span>{letter.campaign_name || 'Global'}</span>
                                                <span className={`px-2 py-0.5 rounded-full ${letter.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{letter.status}</span>
                                            </div>
                                            <button
                                                onClick={() => openSendModal(letter)}
                                                className="w-full mt-5 py-2.5 bg-gray-50 hover:bg-[#63A6B2] group-hover:bg-[#63A6B2] text-gray-500 group-hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-100 group-hover:border-[#63A6B2]"
                                            >
                                                <Send className="w-3.5 h-3.5" /> Start Mailing
                                            </button>
                                        </div>
                                    )) : (
                                        <div className="col-span-full py-20 flex flex-col items-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                                            <MailWarning className="w-10 h-10 mb-2 opacity-20" />
                                            <p className="text-sm font-medium">No templates created yet.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
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
                                    <div className="flex items-center gap-3">
                                        <button onClick={fetchSubscribers} disabled={isLoadingSubscribers} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                            <RefreshCw className={`w-4 h-4 ${isLoadingSubscribers ? 'animate-spin' : ''}`} />
                                        </button>

                                        <button
                                            onClick={() => window.open('http://127.0.0.1:5000/api/admin/subscribers/template')}
                                            className="px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-100"
                                            title="Download CSV Template"
                                        >
                                            <FileText className="w-4 h-4" /> Template
                                        </button>

                                        <label className="px-4 py-2 bg-[#63A6B2]/10 text-[#63A6B2] rounded-xl text-sm font-bold cursor-pointer hover:bg-[#63A6B2]/20 flex items-center gap-2 transition-all">
                                            {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <List className="w-4 h-4" />}
                                            {isImporting ? 'Importing...' : 'Import CSV'}
                                            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} disabled={isImporting} />
                                        </label>

                                        <button
                                            onClick={() => setIsAddSubscriberModalOpen(true)}
                                            className="px-4 py-2 bg-[#63A6B2] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#4a8a95] flex items-center gap-2"
                                        >
                                            <Users className="w-4 h-4" /> Add User
                                        </button>
                                    </div>
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
            {/* Letter Edit Modal */}
            {isLetterModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">{letterForm.id ? 'Edit Template' : 'New Thank You Template'}</h3>
                            <button onClick={() => setIsLetterModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Template Title (Email Subject)</label>
                                <input type="text" value={letterForm.title} onChange={e => setLetterForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none" placeholder="e.g. Special Thank You for your Support" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Associated Campaign (Optional)</label>
                                <select value={letterForm.associated_campaign_id} onChange={e => setLetterForm(p => ({ ...p, associated_campaign_id: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none bg-white">
                                    <option value="global">Global Fallback</option>
                                    {campaigns.map(c => <option key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Message Body</label>
                                <textarea value={letterForm.message} onChange={e => setLetterForm(p => ({ ...p, message: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium h-48 resize-none focus:ring-2 focus:ring-[#63A6B2] outline-none leading-relaxed" placeholder="Write your template message here..."></textarea>
                            </div>
                        </div>
                        <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setIsLetterModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-bold text-sm hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
                            <button onClick={handleSaveLetter} disabled={isSavingLetter} className="px-8 py-2.5 bg-[#63A6B2] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#63A6B2]/20 hover:bg-[#4a8a95] disabled:opacity-50 flex items-center gap-2">
                                {isSavingLetter ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4" /> Save Template</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Send Modal */}
            {isSendModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Mailing Campaign</h3>
                                <p className="text-xs text-[#63A6B2] font-bold">Using: {selectedTemplateForSend?.title}</p>
                            </div>
                            <button onClick={() => setIsSendModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-6 bg-gray-50 flex flex-col flex-1 overflow-hidden">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Select Recipients ({selectedDonors.length} of {mailingDonors.length})</label>
                                <div className="bg-white rounded-2xl border border-gray-200 overflow-y-auto flex-1">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDonors.length === mailingDonors.length}
                                                        onChange={(e) => setSelectedDonors(e.target.checked ? mailingDonors.map(d => d.email) : [])}
                                                        className="accent-[#63A6B2]"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Donor Name</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Email Address</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {mailingDonors.map(donor => (
                                                <tr key={donor.donor_id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedDonors.includes(donor.email)}
                                                            onChange={() => {
                                                                if (selectedDonors.includes(donor.email)) setSelectedDonors(p => p.filter(e => e !== donor.email));
                                                                else setSelectedDonors(p => [...p, donor.email]);
                                                            }}
                                                            className="accent-[#63A6B2]"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-bold text-gray-700">{donor.first_name} {donor.last_name}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">{donor.email}</td>
                                                </tr>
                                            ))}
                                            {mailingDonors.length === 0 && (
                                                <tr><td colSpan="3" className="py-10 text-center text-gray-400 text-xs italic">No donors found for this campaign.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-5 border-t border-gray-100 flex justify-between items-center bg-white">
                            <div className="text-xs font-medium text-gray-400">Total: <span className="text-gray-900 font-bold">{selectedDonors.length} Recipients</span></div>
                            <div className="flex gap-3">
                                <button onClick={() => setIsSendModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-bold text-sm hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
                                <button
                                    onClick={handleSendBatch}
                                    disabled={isSendingBatch || selectedDonors.length === 0}
                                    className="px-8 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-black/10 hover:bg-black disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSendingBatch ? <><RefreshCw className="w-4 h-4 animate-spin" /> Mailing...</> : <><Send className="w-4 h-4" /> Blast {selectedDonors.length} Emails</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subscriber Modal */}
            {isAddSubscriberModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Add New Subscriber</h3>
                            <button onClick={() => setIsAddSubscriberModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddSubscriber} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={subscriberForm.firstName}
                                        onChange={e => setSubscriberForm(p => ({ ...p, firstName: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none"
                                        placeholder="First Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={subscriberForm.lastName}
                                        onChange={e => setSubscriberForm(p => ({ ...p, lastName: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none"
                                        placeholder="Last Name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={subscriberForm.email}
                                    onChange={e => setSubscriberForm(p => ({ ...p, email: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="newsletter_opt"
                                    checked={subscriberForm.newsletter}
                                    onChange={e => setSubscriberForm(p => ({ ...p, newsletter: e.target.checked }))}
                                    className="accent-[#63A6B2] w-4 h-4"
                                />
                                <label htmlFor="newsletter_opt" className="text-sm font-medium text-gray-600 cursor-pointer">Opt-in to Newsletters</label>
                            </div>

                            <div className="pt-6 flex gap-3">
                                <button type="button" onClick={() => setIsAddSubscriberModalOpen(false)} className="flex-1 px-6 py-2.5 text-gray-500 font-bold text-sm hover:bg-gray-50 rounded-xl transition-all border border-gray-100">Cancel</button>
                                <button type="submit" disabled={isAddingSubscriber} className="flex-1 px-8 py-2.5 bg-[#63A6B2] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#63A6B2]/20 hover:bg-[#4a8a95] disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isAddingSubscriber ? <><RefreshCw className="w-4 h-4 animate-spin" /> Adding...</> : <><CheckCircle className="w-4 h-4" /> Add User</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
