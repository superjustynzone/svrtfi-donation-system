import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Send, RefreshCw, FileText, CheckCircle } from 'lucide-react';
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

    // Receipt Template State
    const [receiptTemplate, setReceiptTemplate] = useState({ title: '', message: '' });
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState('global');

    useEffect(() => {
        fetchCampaigns();
    }, []);

    useEffect(() => {
        fetchReceiptTemplate();
    }, [selectedCampaignId]);

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
        </div>
    );
}
