import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Send, RefreshCw, FileText, CheckCircle, Plus, Edit, Trash2, X, Mail, Users } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

export default function AdminMailing() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Test Email State
    const [testEmailForm, setTestEmailForm] = useState({
        to: '',
        subject: '',
        message: ''
    });
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

    useEffect(() => {
        fetchCampaigns();
        fetchThankYouLetters();
    }, []);

    useEffect(() => {
        fetchReceiptTemplate();
    }, [selectedCampaignId]);

    const fetchThankYouLetters = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/thank-you-letters');
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setThankYouLetters(data);
            }
        } catch (err) {
            console.error('Error fetching letters:', err);
        }
    };

    const handleOpenLetterModal = (letter = null) => {
        if (letter) {
            setLetterForm({ 
                id: letter.campaign_id, 
                title: letter.title, 
                message: letter.message, 
                status: letter.status,
                associated_campaign_id: letter.associated_campaign_id || 'global'
            });
        } else {
            setLetterForm({ id: null, title: '', message: '', status: 'active', associated_campaign_id: 'global' });
        }
        setIsLetterModalOpen(true);
    };

    const handleSaveLetter = async () => {
        if (!letterForm.title || !letterForm.message) {
            toast.error('Please fill in all required fields.');
            return;
        }
        setIsSavingLetter(true);
        try {
            const url = letterForm.id 
                ? `http://localhost:5000/api/admin/thank-you-letters/${letterForm.id}`
                : 'http://localhost:5000/api/admin/thank-you-letters';
            const method = letterForm.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(letterForm)
            });

            if (res.ok) {
                toast.success(`Thank you letter ${letterForm.id ? 'updated' : 'created'} successfully!`);
                setIsLetterModalOpen(false);
                fetchThankYouLetters();
            } else {
                toast.error('Failed to save letter.');
            }
        } catch (err) {
            toast.error('Connection error.');
        } finally {
            setIsSavingLetter(false);
        }
    };

    const handleDeleteLetter = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/thank-you-letters/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (res.ok) {
                toast.success('Letter deleted successfully!');
                fetchThankYouLetters();
            } else {
                toast.error('Failed to delete letter.');
            }
        } catch (err) {
            toast.error('Connection error.');
        }
    };

    const handleUseTemplate = async (letter) => {
        setSelectedTemplateForSend(letter);
        setIsSendModalOpen(true);
        setSelectedDonors([]);
        setMailingDonors([]);
        try {
            const res = await fetch(`http://localhost:5000/api/admin/mailing-donors?campaign_id=${letter.associated_campaign_id || 'global'}`);
            if (res.ok) {
                const data = await res.json();
                setMailingDonors(data);
            }
        } catch (err) {
            console.error('Error fetching donors:', err);
        }
    };

    const handleSendBatchEmail = async () => {
        if (selectedDonors.length === 0) {
            return toast.error('Please select at least one donor.');
        }
        setIsSendingBatch(true);
        let successCount = 0;
        let failCount = 0;
        
        for (const email of selectedDonors) {
            try {
                const res = await fetch('http://localhost:5000/api/admin/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        to: email, 
                        subject: selectedTemplateForSend.title, 
                        message: selectedTemplateForSend.message 
                    })
                });
                if (res.ok) successCount++;
                else failCount++;
            } catch (err) {
                failCount++;
            }
        }
        
        setIsSendingBatch(false);
        setIsSendModalOpen(false);
        if (failCount === 0) toast.success(`Successfully sent ${successCount} emails!`);
        else toast.warning(`Sent ${successCount} emails, failed ${failCount}.`);
    };

    const handleSelectAllDonors = () => {
        if (selectedDonors.length === mailingDonors.length) {
            setSelectedDonors([]); // deselect all
        } else {
            setSelectedDonors(mailingDonors.map(d => d.email));
        }
    };

    const handleToggleDonor = (email) => {
        if (selectedDonors.includes(email)) {
            setSelectedDonors(selectedDonors.filter(e => e !== email));
        } else {
            setSelectedDonors([...selectedDonors, email]);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/campaigns/all');
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setCampaigns(data);
            } else {
                setCampaigns([]);
            }
        } catch (err) {
            console.error('Error fetching campaigns:', err);
            setCampaigns([]);
        }
    };

    const fetchReceiptTemplate = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/receipt-template?campaign_id=${selectedCampaignId}`);
            const data = await res.json();
            if (res.ok && data) {
                setReceiptTemplate({ 
                    title: data.title || '', 
                    message: data.message || '' 
                });
            } else {
                setReceiptTemplate({ title: '', message: '' });
            }
        } catch (err) {
            console.error('Error fetching template:', err);
            setReceiptTemplate({ title: '', message: '' });
        }
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
        } catch (err) {
            console.error('Save error:', err);
            toast.error('Connection error.');
        } finally {
            setIsSavingTemplate(false);
        }
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
            const data = await response.json();
            if (response.ok) {
                toast.success('Email sent successfully!');
                setTestEmailForm({ to: '', subject: '', message: '' });
            } else {
                toast.error(data.message || 'Failed to send email.');
            }
        } catch (error) {
            console.error('Email send error:', error);
            toast.error('Failed to connect to mailing service.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f6f8]">
            <AdminSidebar activePage="mailing" mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            <main className="flex-1 overflow-y-auto">
                <AdminHeader
                    title="Mailing"
                    subtitle="Manage email communications and test configurations"
                    onMobileMenuClick={() => setMobileMenuOpen(true)}
                />

                <div className="px-6 lg:px-10 py-8 max-w-4xl mx-auto space-y-6">
                    {/* Receipt Configuration Section */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
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

                    {/* Thank You Letters CRUD Section */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Mail className="w-5 h-5 text-[#63A6B2]" />
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Thank You Letter Templates</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Create and manage email templates for thanking donors manually.</p>
                                </div>
                            </div>
                            <button onClick={() => handleOpenLetterModal()} className="flex items-center gap-2 bg-[#63A6B2] hover:bg-[#4a8a95] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                                <Plus className="w-4 h-4" /> Add Template
                            </button>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Title / Subject</th>
                                        <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign</th>
                                        <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {thankYouLetters.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center text-sm text-gray-400 italic">No templates created yet.</td>
                                        </tr>
                                    ) : (
                                        thankYouLetters.map(letter => (
                                            <tr key={letter.campaign_id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <p className="font-bold text-gray-900 text-sm">{letter.title}</p>
                                                    <div className="text-xs text-gray-500 truncate max-w-xs" dangerouslySetInnerHTML={{ __html: letter.message.substring(0, 50) + '...' }}></div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                                        {letter.campaign_name || 'Global'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${letter.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {letter.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleUseTemplate(letter)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Use Template for Manual Sending">
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleOpenLetterModal(letter)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Edit Template">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteLetter(letter.campaign_id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Template">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Test Email Section */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Send className="w-4 h-4 text-[#63A6B2]" />
                                <h2 className="text-base font-bold text-gray-900">Send Test Email</h2>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Validate your SMTP settings by sending a test message.</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Recipient Email</label>
                                <input type="email" value={testEmailForm.to}
                                    onChange={e => setTestEmailForm(p => ({ ...p, to: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                    placeholder="Enter recipient email address" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject</label>
                                <input type="text" value={testEmailForm.subject}
                                    onChange={e => setTestEmailForm(p => ({ ...p, subject: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all"
                                    placeholder="Test Email Subject" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
                                <textarea
                                    value={testEmailForm.message}
                                    onChange={e => setTestEmailForm(p => ({ ...p, message: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/15 transition-all resize-none h-24"
                                    placeholder="Type your test message here..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={handleSendTestEmail} disabled={isSending || !testEmailForm.to} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm bg-[#63A6B2] hover:bg-[#4a8a95] text-white hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}>
                                {isSending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                                    : <><Send className="w-4 h-4" /> Send Email</>}
                            </button>
                        </div>
                    </section>
                </div>
            </main>

            {/* Modal for Creating/Editing Letter */}
            {isLetterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">{letterForm.id ? 'Edit Template' : 'Create New Template'}</h3>
                            <button onClick={() => setIsLetterModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Template Title (Subject)</label>
                                <input type="text" value={letterForm.title} onChange={e => setLetterForm(p => ({ ...p, title: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] transition-colors"
                                    placeholder="e.g. Thank you for your support!" />
                            </div>
                            <div>
                                        <label className="block text-xs font-bold text-[#63A6B2] uppercase tracking-wider mb-2">Associate with Campaign (Optional)</label>
                                        <select value={letterForm.associated_campaign_id} onChange={e => setLetterForm(p => ({ ...p, associated_campaign_id: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#63A6B2] bg-white transition-colors">
                                            <option value="global">🌍 Global / Any Campaign</option>
                                            <optgroup label="Specific Campaigns">
                                                {(campaigns || []).map(c => (
                                                    <option key={c.campaign_id} value={c.campaign_id}>🎁 {c.campaign_name}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message Content</label>
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <ReactQuill 
                                        theme="snow" 
                                        value={letterForm.message} 
                                        onChange={val => setLetterForm(p => ({ ...p, message: val }))}
                                        style={{ height: '200px', borderBottom: 'none' }}
                                    />
                                </div>
                            </div>
                            <div className="pt-10">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                                <select value={letterForm.status} onChange={e => setLetterForm(p => ({ ...p, status: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] transition-colors bg-white">
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button onClick={() => setIsLetterModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSaveLetter} disabled={isSavingLetter} className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white bg-[#63A6B2] hover:bg-[#4a8a95] shadow-sm disabled:opacity-50">
                                {isSavingLetter ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Selecting Users & Sending */}
            {isSendModalOpen && selectedTemplateForSend && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Send Thank You Letter</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Template: <span className="font-semibold">{selectedTemplateForSend.title}</span></p>
                            </div>
                            <button onClick={() => setIsSendModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold flex items-center gap-2 text-gray-700">
                                    <Users className="w-4 h-4 text-[#63A6B2]" /> 
                                    Select Donors ({selectedDonors.length} / {mailingDonors.length} selected)
                                </h4>
                                <button onClick={handleSelectAllDonors} className="text-xs font-semibold text-[#63A6B2] hover:underline">
                                    {selectedDonors.length === mailingDonors.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            
                            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                                {mailingDonors.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">No valid donor emails found for this campaign.</div>
                                ) : (
                                    <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                                        {mailingDonors.map(donor => (
                                            <label key={donor.donor_id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedDonors.includes(donor.email)} 
                                                    onChange={() => handleToggleDonor(donor.email)}
                                                    className="w-4 h-4 text-[#63A6B2] rounded border-gray-300 focus:ring-[#63A6B2]" 
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{donor.first_name} {donor.last_name}</p>
                                                    <p className="text-xs text-gray-500">{donor.email}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
                            <button onClick={() => setIsSendModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSendBatchEmail} disabled={isSendingBatch || selectedDonors.length === 0} className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white bg-[#63A6B2] hover:bg-[#4a8a95] shadow-sm disabled:opacity-50">
                                {isSendingBatch ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Email</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
