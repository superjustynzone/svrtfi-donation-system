import React, { useState } from 'react';
import { toast } from 'sonner';
import { Send, RefreshCw } from 'lucide-react';
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
