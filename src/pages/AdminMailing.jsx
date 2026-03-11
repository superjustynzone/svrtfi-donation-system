import React, { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Save, Server, Send, RefreshCw, CheckCircle } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

export default function AdminMailing() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // SMTP Settings State
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
    
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Test Email State
    const [testEmailForm, setTestEmailForm] = useState({
        to: '',
        subject: '',
        message: ''
    });
    const [isSending, setIsSending] = useState(false);

    const handleSaveSmtp = () => {
        setIsSaving(true);
        try {
            localStorage.setItem('smtpSettings', JSON.stringify(smtpForm));
            setSaved(true);
            toast.success('SMTP Settings saved locally!');
            setTimeout(() => setSaved(false), 3000);
        } catch {
            toast.error('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendTestEmail = () => {
        if (!testEmailForm.to) {
            toast.error('Please provide a recipient email.');
            return;
        }
        setIsSending(true);
        // Simulate sending an email
        setTimeout(() => {
            setIsSending(false);
            toast.success('Test email sent successfully! (Simulated)');
            setTestEmailForm({ to: '', subject: '', message: '' });
        }, 1500);
    };

    const saveBtnClass = (active) =>
        `flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${active
            ? 'bg-green-500 text-white'
            : 'bg-[#63A6B2] hover:bg-[#4a8a95] text-white hover:shadow-md'
        } disabled:opacity-50 disabled:cursor-not-allowed`;

    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f6f8]">
            <AdminSidebar activePage="mailing" mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            <main className="flex-1 overflow-y-auto">
                <AdminHeader
                    title="Mailing"
                    subtitle="Configure SMTP and manage email templates"
                    onMobileMenuClick={() => setMobileMenuOpen(true)}
                />

                <div className="px-6 lg:px-10 py-8 max-w-4xl mx-auto space-y-6">
                    {/* SMTP Configuration */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Server className="w-4 h-4 text-[#63A6B2]" />
                                <h2 className="text-base font-bold text-gray-900">SMTP Configuration</h2>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Set up your mail server credentials to send emails from the system.</p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Server Details</h3>
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
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Authentication</h3>
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
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Sender Details</h3>
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
                            <button onClick={handleSaveSmtp} disabled={isSaving} className={saveBtnClass(saved)}>
                                {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                                    : saved ? <><CheckCircle className="w-4 h-4" /> Saved!</>
                                        : <><Save className="w-4 h-4" /> Save Configuration</>}
                            </button>
                        </div>
                    </section>

                    {/* Test Email */}
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
                            <button onClick={handleSendTestEmail} disabled={isSending || !testEmailForm.to} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm bg-gray-800 hover:bg-gray-900 text-white hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}>
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
