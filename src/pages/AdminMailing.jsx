import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Send, RefreshCw, FileText, CheckCircle, Server, List, History, Settings, Users, ArrowRight, Mail, Search, Clock, ShieldCheck, MailWarning, Eye, X, ChevronUp, ChevronDown, Code, Download, Upload } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function AdminMailing() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('templates');

    // Test Email State
    const [testEmailForm, setTestEmailForm] = useState({ to: '', subject: '', message: '' });
    const [isSending, setIsSending] = useState(false);

    // Thank You Letters State
    const [thankYouLetters, setThankYouLetters] = useState([]);
    const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
    const [letterForm, setLetterForm] = useState({ id: null, title: '', message: '', status: 'active', associated_campaign_id: '', from: '', cc: '', auto_send: false });
    const [isSavingLetter, setIsSavingLetter] = useState(false);

    // Email Blasts State
    const [emailBlasts, setEmailBlasts] = useState([]);
    const [isBlastModalOpen, setIsBlastModalOpen] = useState(false);
    const [blastForm, setBlastForm] = useState({ id: null, title: '', message: '', status: 'active', associated_campaign_id: '', from: '', cc: '' });
    const [isSavingBlast, setIsSavingBlast] = useState(false);
    const [isBlastDeleteModalOpen, setIsBlastDeleteModalOpen] = useState(false);
    const [blastToDelete, setBlastToDelete] = useState(null);

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
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    // Data lists
    const [emailLogs, setEmailLogs] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);

    // Donation Reminders State
    const [donationReminders, setDonationReminders] = useState([]);
    const [isLoadingReminders, setIsLoadingReminders] = useState(false);
    const [sendingReminderId, setSendingReminderId] = useState(null);

    // Selected Log Modal
    const [selectedLog, setSelectedLog] = useState(null);

    // New Subscriber Modal State
    const [isAddSubscriberModalOpen, setIsAddSubscriberModalOpen] = useState(false);
    const [subscriberForm, setSubscriberForm] = useState({ firstName: '', lastName: '', email: '', campaign_id: '' });
    const [isAddingSubscriber, setIsAddingSubscriber] = useState(false);
    const [manageMenuId, setManageMenuId] = useState(null); // Track which user's manage menu is open
    const [subscriberFilterCampaign, setSubscriberFilterCampaign] = useState('');
    const [isSubscriberDeleteModalOpen, setIsSubscriberDeleteModalOpen] = useState(false);
    const [subscriberToDelete, setSubscriberToDelete] = useState(null);
    const [isLetterDeleteModalOpen, setIsLetterDeleteModalOpen] = useState(false);
    const [letterToDelete, setLetterToDelete] = useState(null);

    // CSV Import State
    const [isImporting, setIsImporting] = useState(false);

    // Export State
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

    // Code View States
    const [isLetterCodeView, setIsLetterCodeView] = useState(false);
    const [isBlastCodeView, setIsBlastCodeView] = useState(false);
    const [isReceiptCodeView, setIsReceiptCodeView] = useState(false);

    // Search State
    const [subscriberSearchTerm, setSubscriberSearchTerm] = useState('');

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'subscribed_at', direction: 'desc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedSubscribers = [...subscribers].sort((a, b) => {
        if (!sortConfig.key) return 0;
        
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle specific columns
        if (sortConfig.key === 'subscriber') {
            aVal = `${a.first_name} ${a.last_name}`.toLowerCase();
            bVal = `${b.first_name} ${b.last_name}`.toLowerCase();
        } else if (sortConfig.key === 'campaign') {
            aVal = (a.campaign_name || '').toLowerCase();
            bVal = (b.campaign_name || '').toLowerCase();
        } else if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredAndSortedSubscribers = sortedSubscribers.filter(sub => {
        if (!subscriberSearchTerm) return true;
        const q = subscriberSearchTerm.toLowerCase();
        const fullName = `${sub.first_name} ${sub.last_name}`.toLowerCase();
        const email = (sub.email || '').toLowerCase();
        return fullName.includes(q) || email.includes(q);
    });

    // Export Functions
    const handleExportCSV = () => {
        try {
            const headers = ['First Name', 'Last Name', 'Email', 'Campaign', 'Status', 'Subscribed At'];
            const rows = filteredAndSortedSubscribers.map(s => [
                s.first_name,
                s.last_name,
                s.email,
                s.campaign_name || 'Global',
                s.status,
                new Date(s.subscribed_at).toLocaleDateString()
            ]);

            const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `mailing_list_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('CSV Exported successfully!');
        } catch (err) {
            toast.error('Failed to export CSV');
        } finally {
            setIsExportDropdownOpen(false);
        }
    };

    const handleExportExcel = () => {
        try {
            const data = filteredAndSortedSubscribers.map(s => ({
                'First Name': s.first_name,
                'Last Name': s.last_name,
                'Email': s.email,
                'Campaign': s.campaign_name || 'Global',
                'Status': s.status,
                'Subscribed At': new Date(s.subscribed_at).toLocaleDateString()
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Subscribers");
            XLSX.writeFile(workbook, `mailing_list_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Excel Exported successfully!');
        } catch (err) {
            toast.error('Failed to export Excel');
        } finally {
            setIsExportDropdownOpen(false);
        }
    };

    const handleExportPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.setTextColor(99, 166, 178);
            doc.text("Shepherd's Voice - Mailing List Report", 14, 20);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleString()} | Total: ${filteredAndSortedSubscribers.length} recipients`, 14, 28);

            autoTable(doc, {
                head: [["Name", "Email", "Campaign", "Status", "Joined"]],
                body: filteredAndSortedSubscribers.map(s => [
                    `${s.first_name} ${s.last_name}`,
                    s.email,
                    s.campaign_name || 'Global',
                    s.status.toUpperCase(),
                    new Date(s.subscribed_at).toLocaleDateString()
                ]),
                startY: 35,
                headStyles: { fillColor: [99, 166, 178], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [245, 250, 251] },
            });

            doc.save(`mailing_list_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('PDF Exported successfully!');
        } catch (err) {
            toast.error('Failed to export PDF');
        } finally {
            setIsExportDropdownOpen(false);
        }
    };

    // SMTP Details State
    const [smtpSettings, setSmtpSettings] = useState({
        provider: 'Gmail',
        host: 'smtp.gmail.com',
        port: '465',
        user: 'svrtfi@gmail.com',
        sender_email: '',
        password: '********', // Placeholder for existing password
        encryption: 'SSL/TLS',
        status: 'Connected'
    });
    const [isSavingSmtp, setIsSavingSmtp] = useState(false);

    const smtpProviders = [
        { name: 'Gmail', host: 'smtp.gmail.com', port: '465', encryption: 'SSL/TLS', defaultUser: '' },
        { name: 'SendGrid', host: 'smtp.sendgrid.net', port: '587', encryption: 'STARTTLS', defaultUser: 'apikey' },
        { name: 'Outlook', host: 'smtp.office365.com', port: '587', encryption: 'STARTTLS', defaultUser: '' },
        { name: 'Custom', host: '', port: '', encryption: 'SSL/TLS', defaultUser: '' }
    ];

    useEffect(() => {
        fetchCampaigns();
        fetchThankYouLetters();
        fetchEmailBlasts();
    }, []);

    useEffect(() => {
        if (tabFetchMap[activeTab]) tabFetchMap[activeTab]();
    }, [activeTab, selectedCampaignId, subscriberFilterCampaign]);

    const tabFetchMap = {
        'templates': () => { fetchReceiptTemplate(); fetchThankYouLetters(); fetchEmailBlasts(); },
        'letters': () => fetchThankYouLetters(),
        'logs': () => fetchEmailLogs(),
        'list': () => fetchSubscribers(),
        'smtp': () => fetchSmtpSettings(),
        'deadlines': () => fetchDonationReminders()
    };

    const fetchSmtpSettings = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/smtp-settings');
            const data = await res.json();
            if (res.ok && data) {
                setSmtpSettings({
                    provider: data.provider || 'Gmail',
                    host: data.host || 'smtp.gmail.com',
                    port: data.port || '465',
                    user: data.user_email || '',
                    sender_email: data.sender_email || '',
                    password: '********', // Don't show the real password
                    encryption: data.encryption || 'SSL/TLS',
                    status: 'Connected'
                });
            }
        } catch (err) { console.error('Error fetching SMTP settings:', err); }
    };

    const handleSaveSmtpSettings = async () => {
        setIsSavingSmtp(true);
        try {
            const res = await fetch('http://localhost:5000/api/admin/smtp-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: smtpSettings.provider,
                    host: smtpSettings.host,
                    port: smtpSettings.port,
                    user_email: smtpSettings.user,
                    sender_email: smtpSettings.sender_email,
                    password: smtpSettings.password === '********' ? '' : smtpSettings.password,
                    encryption: smtpSettings.encryption
                })
            });
            if (res.ok) {
                toast.success('SMTP settings updated successfully!');
                fetchSmtpSettings(); // Refresh (clears the password field placeholder if it was changed)
            } else {
                toast.error('Failed to update SMTP settings.');
            }
        } catch (err) { toast.error('Connection error.'); }
        finally { setIsSavingSmtp(false); }
    };


    const fetchCampaigns = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/campaigns/all');
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setCampaigns(data);
                if (data.length > 0) {
                    if (!selectedCampaignId) setSelectedCampaignId(data[0].campaign_id);
                    if (!subscriberFilterCampaign) setSubscriberFilterCampaign('all');
                }
            }
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
        if (!subscriberFilterCampaign) return; // Prevent empty fetch
        setIsLoadingSubscribers(true);
        try {
            const res = await fetch(`http://localhost:5000/api/admin/subscribers?campaign_id=${subscriberFilterCampaign}`);
            const data = await res.json();
            if (res.ok) setSubscribers(data);
        } catch (err) { console.error('Error fetching subscribers:', err); }
        finally { setIsLoadingSubscribers(false); }
    };

    const fetchDonationReminders = async () => {
        setIsLoadingReminders(true);
        try {
            const res = await fetch('http://localhost:5000/api/donations/admin/reminders');
            const data = await res.json();
            if (res.ok) setDonationReminders(data);
        } catch (err) { console.error('Error fetching reminders:', err); }
        finally { setIsLoadingReminders(false); }
    };

    const handleSendReminder = async (reminderId) => {
        setSendingReminderId(reminderId);
        try {
            const res = await fetch(`http://localhost:5000/api/donations/admin/reminders/${reminderId}/send`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Reminder email sent successfully!');
                if (activeTab === 'logs') fetchEmailLogs(); // Refresh logs if we are on that tab (not likely here but good practice)
            } else {
                toast.error(data.message || 'Failed to send reminder.');
            }
        } catch (err) {
            toast.error('Connection error.');
        } finally {
            setSendingReminderId(null);
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
            if (res.ok) {
                toast.success(`${selectedCampaignId === 'global' ? 'Global' : 'Campaign'} receipt template updated!`);
                setIsReceiptModalOpen(false);
            }
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

    const fetchThankYouLetters = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/thank-you-letters');
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
            const url = letterForm.id ? `http://localhost:5000/api/admin/thank-you-letters/${letterForm.id}` : 'http://localhost:5000/api/admin/thank-you-letters';
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

    const fetchEmailBlasts = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/email-blasts');
            const data = await res.json();
            if (res.ok) setEmailBlasts(data);
        } catch (err) { console.error('Error fetching blasts:', err); }
    };

    const handleSaveBlast = async () => {
        if (!blastForm.title || !blastForm.message) {
            toast.error('Title and message are required.');
            return;
        }
        setIsSavingBlast(true);
        try {
            const method = blastForm.id ? 'PUT' : 'POST';
            const url = blastForm.id ? `http://localhost:5000/api/admin/email-blasts/${blastForm.id}` : 'http://localhost:5000/api/admin/email-blasts';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blastForm)
            });
            if (res.ok) {
                toast.success('Email Blast template saved!');
                setIsBlastModalOpen(false);
                fetchEmailBlasts();
            } else { toast.error('Failed to save blast template.'); }
        } catch (err) { toast.error('Connection error.'); }
        finally { setIsSavingBlast(false); }
    };

    const handleDeleteBlast = (blast) => {
        setBlastToDelete(blast);
        setIsBlastDeleteModalOpen(true);
    };

    const confirmDeleteBlast = async () => {
        if (!blastToDelete) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/email-blasts/${blastToDelete.campaign_id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Blast template deleted.');
                setIsBlastDeleteModalOpen(false);
                setBlastToDelete(null);
                fetchEmailBlasts();
            } else toast.error('Deletion failed.');
        } catch (err) { toast.error('Connection error.'); }
    };

    const handleDeleteLetter = (letter) => {
        setLetterToDelete(letter);
        setIsLetterDeleteModalOpen(true);
    };

    const confirmDeleteLetter = async () => {
        if (!letterToDelete) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/thank-you-letters/${letterToDelete.campaign_id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Template deleted.');
                setIsLetterDeleteModalOpen(false);
                setLetterToDelete(null);
                fetchThankYouLetters();
            } else toast.error('Deletion failed.');
        } catch (err) { toast.error('Connection error.'); }
    };

    const openSendModal = async (letter) => {
        setSelectedTemplateForSend(letter);
        setIsSendModalOpen(true);
        if (letter.category === 'email_blast') {
            fetchMailingSubscribers('all');
        } else {
            fetchMailingDonors(letter.associated_campaign_id);
        }
    };

    const fetchMailingSubscribers = async (campaignId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/subscribers?campaign_id=${campaignId === 'all' ? '' : campaignId}`);
            const data = await res.json();
            if (res.ok) {
                // Normalize subscriber data to match donor structure for the modal table
                const normalized = data.map(sub => ({
                    id: sub.subscriber_id,
                    first_name: sub.first_name,
                    last_name: sub.last_name,
                    email: sub.email,
                    address: sub.address || ''
                }));
                setMailingDonors(normalized);
                setSelectedDonors(normalized);
            }
        } catch (err) { console.error('Error fetching subscribers:', err); }
    };

    const fetchMailingDonors = async (campaignId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/mailing-donors?campaign_id=${campaignId || 'global'}`);
            const data = await res.json();
            if (res.ok) {
                const normalized = data.map(donor => ({
                    id: donor.donor_id,
                    first_name: donor.first_name,
                    last_name: donor.last_name,
                    email: donor.email,
                    address: donor.address
                }));
                setMailingDonors(normalized);
                setSelectedDonors(normalized);
            }
        } catch (err) { console.error('Error fetching donors:', err); }
    };

    const handleSendBatch = async () => {
        if (selectedDonors.length === 0) {
            toast.error('Please select at least one recipient.');
            return;
        }
        setIsSendingBatch(true);
        const campaign = campaigns.find(c => c.campaign_id === selectedTemplateForSend.associated_campaign_id);
        const campaignName = campaign ? campaign.campaign_name : 'Our Campaign';

        try {
            const res = await fetch('http://localhost:5000/api/admin/bulk-send-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients: selectedDonors, // Objects with first_name, last_name, email, address
                    subject: selectedTemplateForSend.title,
                    html: selectedTemplateForSend.message, // Already HTML from Quill
                    campaign_name: campaignName,
                    from_email: selectedTemplateForSend.from || null,
                    cc: selectedTemplateForSend.cc || null
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
    const handleDeleteSubscriber = async (sub) => {
        setSubscriberToDelete(sub);
        setIsSubscriberDeleteModalOpen(true);
        setManageMenuId(null);
    };

    const confirmDeleteSubscriber = async () => {
        if (!subscriberToDelete) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/subscribers/${subscriberToDelete.subscriber_id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Subscriber removed.');
                setIsSubscriberDeleteModalOpen(false);
                setSubscriberToDelete(null);
                fetchSubscribers();
            }
        } catch (err) { toast.error('Error deleting subscriber.'); }
    };

    const handleToggleReceipts = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/admin/subscribers/${id}/toggle-receipts`, { method: 'PATCH' });
            if (res.ok) {
                toast.success('Preference updated.');
                fetchSubscribers();
                setManageMenuId(null);
            }
        } catch (err) { toast.error('Error updating preference.'); }
    };


    const handleAddSubscriber = async (e) => {
        if (e) e.preventDefault();
        if (!subscriberForm.email || !subscriberForm.firstName || !subscriberForm.lastName || !subscriberForm.campaign_id) {
            toast.error('All fields including campaign are required.');
            return;
        }
        setIsAddingSubscriber(true);
        try {
            const res = await fetch('http://localhost:5000/api/admin/subscribers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: subscriberForm.email,
                    first_name: subscriberForm.firstName,
                    last_name: subscriberForm.lastName,
                    campaign_id: subscriberForm.campaign_id
                })
            });
            if (res.ok) {
                toast.success('Subscriber added successfully!');
                setIsAddSubscriberModalOpen(false);
                setSubscriberForm({ firstName: '', lastName: '', email: '', campaign_id: '' });
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
        if (subscriberFilterCampaign) {
            formData.append('campaign_id', subscriberFilterCampaign);
        }

        setIsImporting(true);
        try {
            const res = await fetch('http://localhost:5000/api/admin/subscribers/import', {
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
        { id: 'logs', label: 'Email Logs', icon: History },
        { id: 'list', label: 'Mailing List', icon: Users },
        { id: 'deadlines', label: 'Donation Deadlines', icon: Clock },
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

                <div className="px-6 lg:px-10 py-6 w-full">
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
                            <>
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-[#63A6B2]" />
                                            <h2 className="text-base font-bold text-gray-900">Receipt Email Configuration</h2>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">Manage receipt content sent to donors after a successful donation per campaign.</p>
                                    </div>
                                    <button onClick={fetchCampaigns} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Campaign Name</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {/* Campaign-specific Rows */}
                                            {campaigns.length > 0 ? campaigns.map(c => (
                                                <tr key={c.campaign_id} className="hover:bg-[#63A6B2]/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-[#63A6B2]/10 flex items-center justify-center text-[#63A6B2]">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="text-sm font-bold text-gray-900 leading-tight truncate">{c.campaign_name}</div>
                                                                {(c.receipt_email_subject || c.receipt_email_message) && (
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <span className="px-1.5 py-0.5 bg-green-50 text-[9px] font-bold text-green-600 border border-green-100 rounded-md uppercase tracking-tighter">Custom Receipt Set</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={async () => {
                                                                setSelectedCampaignId(c.campaign_id);
                                                                try {
                                                                    const res = await fetch(`http://localhost:5000/api/admin/receipt-template?campaign_id=${c.campaign_id}`);
                                                                    const data = await res.json();
                                                                    if (res.ok && data) setReceiptTemplate({ title: data.title || '', message: data.message || '' });
                                                                    else setReceiptTemplate({ title: '', message: '' });
                                                                } catch { setReceiptTemplate({ title: '', message: '' }); }
                                                                setIsReceiptModalOpen(true);
                                                            }}
                                                            className="text-xs font-bold text-[#63A6B2] hover:text-white hover:bg-[#63A6B2] border border-[#63A6B2]/20 px-4 py-2 rounded-xl transition-all shadow-sm"
                                                        >
                                                            Configure Receipt
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="2" className="px-6 py-20 text-center">
                                                        <div className="flex flex-col items-center text-gray-400">
                                                            <FileText className="w-10 h-10 mb-2 opacity-20" />
                                                            <p className="text-sm font-medium">No campaigns found.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                            
                            {/* Thank You Letters Section - Now under Templates tab */}
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] mt-6">
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
                                                setLetterForm({ id: null, title: '', message: '', status: 'active', associated_campaign_id: '', from: '', cc: '', bcc: '', to: '' });
                                                setIsLetterModalOpen(true);
                                            }}
                                            className="px-4 py-2 bg-[#63A6B2] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#4a8a95] flex items-center gap-2"
                                        >
                                            <FileText className="w-4 h-4" /> New Template
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Template Details</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Campaign</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center whitespace-nowrap">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {thankYouLetters.length > 0 ? thankYouLetters.map((letter) => (
                                                <tr key={letter.campaign_id} className="hover:bg-[#63A6B2]/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-[#63A6B2]/10 flex items-center justify-center text-[#63A6B2] shrink-0">
                                                                <Mail className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[250px]">{letter.title}</div>
                                                                <div className="text-[10px] text-gray-400 line-clamp-1 max-w-[250px] mt-0.5" dangerouslySetInnerHTML={{ __html: letter.message || 'No content...' }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-tight">{letter.campaign_name || 'Unassigned'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${letter.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{letter.status}</span>
                                                            {letter.auto_send && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100">
                                                                    <Send className="w-2 h-2" /> Auto
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => openSendModal(letter)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-gray-900 hover:bg-black rounded-lg transition-all shadow-sm"
                                                            >
                                                                <Send className="w-3 h-3" /> Blast
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    setLetterForm({
                                                                        id: letter.campaign_id,
                                                                        title: letter.title,
                                                                        message: letter.message,
                                                                        status: letter.status,
                                                                        associated_campaign_id: letter.associated_campaign_id || '',
                                                                        from: letter.from || '',
                                                                        cc: letter.cc || '',
                                                                        auto_send: letter.auto_send || false
                                                                    });
                                                                    setIsLetterModalOpen(true);
                                                                }} 
                                                                className="p-1.5 hover:bg-blue-50 text-[#63A6B2] bg-[#63A6B2]/10 hover:text-[#4a8a95] rounded-lg transition-colors border border-transparent hover:border-[#63A6B2]/20"
                                                                title="Configure Template"
                                                            >
                                                                <Settings className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteLetter(letter)} 
                                                                className="p-1.5 hover:bg-red-50 text-red-500 bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                                title="Delete Template"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-20 text-center">
                                                        <div className="flex flex-col items-center text-gray-400">
                                                            <MailWarning className="w-10 h-10 mb-2 opacity-20" />
                                                            <p className="text-sm font-medium">No templates created yet.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                            
                            {/* Email Blast Templates Section */}
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] mt-6">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">Email Blast Templates</h2>
                                        <p className="text-xs text-gray-400 mt-0.5">Manage custom templates for mass email announcements and general blasts.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={fetchEmailBlasts} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setBlastForm({ id: null, title: '', message: '', status: 'active', associated_campaign_id: '', from: '', cc: '' });
                                                setIsBlastModalOpen(true);
                                            }}
                                            className="px-4 py-2 bg-[#63A6B2] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#4a8a95] flex items-center gap-2"
                                        >
                                            <Send className="w-4 h-4" /> New Blast Template
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Template Details</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center whitespace-nowrap">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {emailBlasts.length > 0 ? emailBlasts.map((blast) => (
                                                <tr key={blast.campaign_id} className="hover:bg-[#63A6B2]/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-[#63A6B2]/10 flex items-center justify-center text-[#63A6B2] shrink-0">
                                                                <Send className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[250px]">{blast.title}</div>
                                                                <div className="text-[10px] text-gray-400 line-clamp-1 max-w-[250px] mt-0.5" dangerouslySetInnerHTML={{ __html: blast.message || 'No content...' }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${blast.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{blast.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => openSendModal(blast)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-gray-900 hover:bg-black rounded-lg transition-all shadow-sm"
                                                            >
                                                                <Send className="w-3 h-3" /> Blast
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    setBlastForm({
                                                                        id: blast.campaign_id,
                                                                        title: blast.title,
                                                                        message: blast.message,
                                                                        status: blast.status,
                                                                        associated_campaign_id: blast.associated_campaign_id || '',
                                                                        from: blast.from_email || '',
                                                                        cc: blast.cc_email || ''
                                                                    });
                                                                    setIsBlastModalOpen(true);
                                                                }} 
                                                                className="p-1.5 hover:bg-blue-50 text-[#63A6B2] bg-[#63A6B2]/10 hover:text-[#4a8a95] rounded-lg transition-colors border border-transparent hover:border-[#63A6B2]/20"
                                                                title="Configure Template"
                                                            >
                                                                <Settings className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteBlast(blast)} 
                                                                className="p-1.5 hover:bg-red-50 text-red-500 bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                                title="Delete Template"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-20 text-center">
                                                        <div className="flex flex-col items-center text-gray-400">
                                                            <Send className="w-10 h-10 mb-2 opacity-20" />
                                                            <p className="text-sm font-medium">No blast templates created yet.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                            </>
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
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mailing Provider</label>
                                                <select
                                                    value={smtpSettings.provider}
                                                    onChange={(e) => {
                                                        const p = smtpProviders.find(provider => provider.name === e.target.value);
                                                        if (p) {
                                                            setSmtpSettings(prev => ({
                                                                ...prev,
                                                                provider: p.name,
                                                                host: p.name === 'Custom' ? prev.host : p.host,
                                                                port: p.name === 'Custom' ? prev.port : p.port,
                                                                encryption: p.name === 'Custom' ? prev.encryption : p.encryption,
                                                                 user: p.defaultUser !== undefined ? (p.defaultUser || prev.user) : prev.user,
                                                                 password: '' 
                                                             }));
                                                            if (p.name !== 'Custom') {
                                                                toast.info(`Switched to ${p.name} configuration`, { icon: '📧' });
                                                            }
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#63A6B2]/20 focus:border-[#63A6B2] shadow-sm bg-white transition-all cursor-pointer"
                                                >
                                                    {smtpProviders.map(p => (
                                                        <option key={p.name} value={p.name}>{p.name} SMTP</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">SMTP Host</label>
                                                    <input 
                                                        type="text" 
                                                        value={smtpSettings.host} 
                                                        onChange={e => setSmtpSettings(p => ({ ...p, host: e.target.value }))}
                                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#63A6B2]" 
                                                        placeholder="e.g. smtp.gmail.com"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">SMTP Port</label>
                                                    <input 
                                                        type="text" 
                                                        value={smtpSettings.port} 
                                                        onChange={e => setSmtpSettings(p => ({ ...p, port: e.target.value }))}
                                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#63A6B2]" 
                                                        placeholder="e.g. 465"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-2">
                                                        Verified Sender Email
                                                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">REQUIRED</span>
                                                    </label>
                                                    <input 
                                                        type="email" 
                                                        value={smtpSettings.sender_email} 
                                                        onChange={e => setSmtpSettings(p => ({ ...p, sender_email: e.target.value }))}
                                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#63A6B2]" 
                                                        placeholder="e.g. info@svrtf.org"
                                                    />
                                                    <p className="text-[10px] text-gray-400 mt-1 italic">Must be verified in your provider dashboard.</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-2">
                                                        API Username / Login Email
                                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">AUTH</span>
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        value={smtpSettings.user} 
                                                        onChange={e => setSmtpSettings(p => ({ ...p, user: e.target.value }))}
                                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#63A6B2]" 
                                                        placeholder="SendGrid: 'apikey' or Gmail: 'your@email.com'"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Password / Secret Key</label>
                                                    <input 
                                                        type="password" 
                                                        value={smtpSettings.password} 
                                                        onChange={e => setSmtpSettings(p => ({ ...p, password: e.target.value }))}
                                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#63A6B2]" 
                                                        placeholder="Enter password or key"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Encryption</label>
                                                    <select 
                                                        value={smtpSettings.encryption}
                                                        onChange={e => setSmtpSettings(p => ({ ...p, encryption: e.target.value }))}
                                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#63A6B2] bg-white"
                                                    >
                                                        <option value="SSL/TLS">SSL/TLS (Port 465)</option>
                                                        <option value="STARTTLS">STARTTLS (Port 587/2525)</option>
                                                        <option value="None">None</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
                                                <ShieldCheck className="w-4 h-4" />
                                                Updates affect all system-wide outgoing emails.
                                            </div>
                                            <button 
                                                onClick={handleSaveSmtpSettings}
                                                disabled={isSavingSmtp}
                                                className="px-6 py-2.5 bg-[#63A6B2] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#63A6B2]/20 hover:bg-[#4a8a95] transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isSavingSmtp ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><CheckCircle className="w-3.5 h-3.5" /> Save Configuration</>}
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
                                    <div className="flex items-center gap-3">
                                        <div className="relative group mr-2">
                                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#63A6B2] transition-colors" />
                                            <input 
                                                type="text"
                                                placeholder="Search names or email..."
                                                value={subscriberSearchTerm}
                                                onChange={(e) => setSubscriberSearchTerm(e.target.value)}
                                                className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium focus:bg-white focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/10 outline-none transition-all w-[240px]"
                                            />
                                            {subscriberSearchTerm && (
                                                <button 
                                                    onClick={() => setSubscriberSearchTerm('')}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mr-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Active Campaign:</span>
                                            <select 
                                                value={subscriberFilterCampaign} 
                                                onChange={e => setSubscriberFilterCampaign(e.target.value)}
                                                className="min-w-[180px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-[#63A6B2] shadow-sm outline-none focus:ring-1 focus:ring-[#63A6B2]"
                                            >
                                                <option value="all">All Campaigns</option>
                                                {campaigns.map(c => (
                                                    <option key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</option>
                                                ))}
                                                {campaigns.length === 0 && <option value="" disabled>No campaigns available</option>}
                                            </select>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mr-auto bg-gray-50/50 px-3 py-1.5 rounded-xl border border-dashed border-gray-200">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valid Campaigns:</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-100 text-gray-500 font-medium whitespace-nowrap">General Operations</span>
                                                {campaigns.filter(c => c.status === 'active').slice(0, 3).map(c => (
                                                    <span key={c.campaign_id} className="text-[10px] bg-[#63A6B2]/5 px-1.5 py-0.5 rounded border border-[#63A6B2]/10 text-[#63A6B2] font-semibold whitespace-nowrap">{c.campaign_name}</span>
                                                ))}
                                                {campaigns.filter(c => c.status === 'active').length > 3 && (
                                                    <span className="text-[10px] text-gray-400 italic">+{campaigns.filter(c => c.status === 'active').length - 3} more</span>
                                                )}
                                            </div>
                                        </div>

                                        <button onClick={fetchSubscribers} disabled={isLoadingSubscribers} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                            <RefreshCw className={`w-4 h-4 ${isLoadingSubscribers ? 'animate-spin' : ''}`} />
                                        </button>

                                        <button
                                            onClick={() => window.open('http://localhost:5000/api/admin/subscribers/template')}
                                            className="px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-100"
                                            title="Download CSV Template"
                                        >
                                            <FileText className="w-4 h-4" /> Template
                                        </button>

                                        <input 
                                            type="file" 
                                            id="subscriber-import-input" 
                                            className="hidden" 
                                            accept=".csv" 
                                            onChange={handleImportCSV} 
                                        />
                                        <button
                                            onClick={() => document.getElementById('subscriber-import-input').click()}
                                            disabled={isImporting}
                                            className="px-4 py-2 bg-white text-[#63A6B2] border border-[#63A6B2]/20 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#63A6B2]/5 transition-all shadow-sm"
                                            title="Import Subscribers from CSV"
                                        >
                                            {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            Import
                                        </button>

                                        

                                        <div className="relative">
                                            <button
                                                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                                                className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                                            >
                                                <Download className="w-4 h-4 text-[#63A6B2]" /> 
                                                Export
                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isExportDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setIsExportDropdownOpen(false)} />
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                                        <button onClick={handleExportCSV} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            CSV File
                                                        </button>
                                                        <button onClick={handleExportExcel} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                                <List className="w-4 h-4" />
                                                            </div>
                                                            Excel Sheet
                                                        </button>
                                                        <button onClick={handleExportPDF} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                                                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            PDF Report
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSubscriberForm(p => ({ ...p, campaign_id: subscriberFilterCampaign === 'all' ? '' : subscriberFilterCampaign }));
                                                setIsAddSubscriberModalOpen(true);
                                            }}
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
                                                <th 
                                                    className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                                                    onClick={() => handleSort('subscriber')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Subscriber
                                                        {sortConfig.key === 'subscriber' ? (
                                                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                                        ) : (
                                                            <div className="w-3 h-3 flex flex-col opacity-20">
                                                                <ChevronUp className="w-3 h-3 -mb-1" />
                                                                <ChevronDown className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </th>
                                                <th 
                                                    className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                                                    onClick={() => handleSort('campaign')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Campaign
                                                        {sortConfig.key === 'campaign' ? (
                                                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                                        ) : (
                                                            <div className="w-3 h-3 flex flex-col opacity-20">
                                                                <ChevronUp className="w-3 h-3 -mb-1" />
                                                                <ChevronDown className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </th>
                                                <th 
                                                    className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                                                    onClick={() => handleSort('receipts_opt_in')}
                                                >
                                                    <div className="flex items-center justify-center gap-1">
                                                        Receipt Pref
                                                        {sortConfig.key === 'receipts_opt_in' ? (
                                                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                                        ) : (
                                                            <div className="w-3 h-3 flex flex-col opacity-20">
                                                                <ChevronUp className="w-3 h-3 -mb-1" />
                                                                <ChevronDown className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </th>
                                                <th 
                                                    className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center cursor-pointer hover:bg-gray-100 transition-colors"
                                                    onClick={() => handleSort('status')}
                                                >
                                                    <div className="flex items-center justify-center gap-1">
                                                        Account Status
                                                        {sortConfig.key === 'status' ? (
                                                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                                        ) : (
                                                            <div className="w-3 h-3 flex flex-col opacity-20">
                                                                <ChevronUp className="w-3 h-3 -mb-1" />
                                                                <ChevronDown className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </th>
                                                <th 
                                                    className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center cursor-pointer hover:bg-gray-100 transition-colors"
                                                    onClick={() => handleSort('subscribed_at')}
                                                >
                                                    <div className="flex items-center justify-center gap-1">
                                                        Joined Date
                                                        {sortConfig.key === 'subscribed_at' ? (
                                                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                                        ) : (
                                                            <div className="w-3 h-3 flex flex-col opacity-20">
                                                                <ChevronUp className="w-3 h-3 -mb-1" />
                                                                <ChevronDown className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredAndSortedSubscribers.length > 0 ? filteredAndSortedSubscribers.map((sub) => (
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
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-tight">{sub.campaign_name || 'General Operations'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full ${sub.receipts_opt_in ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                                            <span className="text-[10px] font-bold text-gray-400">{sub.receipts_opt_in ? 'Active' : 'Unsubscribed'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sub.status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-100 text-gray-500 border-gray-200'} border`}>
                                                            {sub.status || 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="text-[10px] font-bold text-gray-500 whitespace-nowrap">
                                                            {formatDate(sub.subscribed_at)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right relative">
                                                        <button 
                                                            onClick={() => setManageMenuId(manageMenuId === sub.subscriber_id ? null : sub.subscriber_id)}
                                                            className="text-xs font-bold text-[#63A6B2] hover:text-[#4a8a95] bg-[#63A6B2]/5 px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            Manage
                                                        </button>
                                                        {manageMenuId === sub.subscriber_id && (
                                                            <div className="absolute right-6 top-14 z-20 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in zoom-in-95 duration-200">
                                                                <button 
                                                                    onClick={() => handleToggleReceipts(sub.subscriber_id)}
                                                                    className="w-full px-4 py-2 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                >
                                                                    {sub.receipts_opt_in ? <><Clock className="w-3.5 h-3.5" /> Stop Receipts</> : <><CheckCircle className="w-3.5 h-3.5" /> Start Receipts</>}
                                                                </button>
                                                                <div className="my-1 border-t border-gray-50"></div>
                                                                <button 
                                                                    onClick={() => handleDeleteSubscriber(sub)}
                                                                    className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                >
                                                                    <X className="w-3.5 h-3.5" /> Delete User
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-20 text-center">
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

                        {activeTab === 'deadlines' && (
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            Donation Deadlines
                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Auto-sends 5 days prior</span>
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">Subscribers who opted-in to donation reminders.</p>
                                    </div>
                                    <button onClick={fetchDonationReminders} disabled={isLoadingReminders} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                        <RefreshCw className={`w-4 h-4 ${isLoadingReminders ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Donor</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Campaign</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Started Date</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Next Payment</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {donationReminders.length > 0 ? donationReminders.map((reminder) => (
                                                <tr key={reminder.reminder_id} className="hover:bg-[#63A6B2]/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs uppercase shrink-0">
                                                                {reminder.first_name ? reminder.first_name.charAt(0) : (reminder.user_email ? reminder.user_email.charAt(0) : '?')}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-900 leading-tight truncate">{reminder.first_name ? `${reminder.first_name} ${reminder.last_name || ''}` : 'Anonymous'}</div>
                                                                <div className="text-[10px] text-gray-400">{reminder.user_email || 'No Email'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-bold text-gray-600 truncate max-w-[200px]">{reminder.campaign_name || 'General Operations'}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-medium text-gray-500">{new Date(reminder.started_date).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-bold text-[#63A6B2]">{reminder.next_payment ? new Date(reminder.next_payment).toLocaleDateString() : 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-600 border border-green-100">
                                                            Active
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => handleSendReminder(reminder.reminder_id)}
                                                            disabled={sendingReminderId === reminder.reminder_id}
                                                            className={`flex items-center gap-1.5 ml-auto px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all shadow-sm ${
                                                                sendingReminderId === reminder.reminder_id 
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                                : 'bg-[#63A6B2] text-white hover:bg-[#4a8a95]'
                                                            }`}
                                                        >
                                                            {sendingReminderId === reminder.reminder_id ? (
                                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <Send className="w-3 h-3" />
                                                            )}
                                                            {sendingReminderId === reminder.reminder_id ? 'Sending...' : 'Remind'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-20 text-center">
                                                        {isLoadingReminders ? (
                                                            <RefreshCw className="w-8 h-8 animate-spin text-gray-200 mx-auto" />
                                                        ) : (
                                                            <div className="flex flex-col items-center text-gray-400">
                                                                <Clock className="w-10 h-10 mb-2 opacity-20" />
                                                                <p className="text-sm font-medium">No active donation deadlines found.</p>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Sender Details (From Name/Email)</label>
                                    <input type="text" value={letterForm.from} onChange={e => setLetterForm(p => ({ ...p, from: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none" placeholder="e.g. SVRTFI Support <info@svrtfi.org>" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">CC (Visible Copy)</label>
                                    <input type="text" value={letterForm.cc} onChange={e => setLetterForm(p => ({ ...p, cc: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none" placeholder="e.g. admin@svrtfi.org" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Subject</label>
                                <input type="text" value={letterForm.title} onChange={e => setLetterForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none" placeholder="e.g. Special Thank You for your Support" />
                            </div>
                            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors cursor-pointer ${letterForm.auto_send ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}`} onClick={() => setLetterForm(p => ({ ...p, auto_send: !p.auto_send }))}>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Auto-Send After Donation</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">This template will be automatically sent when a donation is marked as completed.</p>
                                </div>
                                <div className={`w-11 h-6 rounded-full flex items-center transition-all ml-4 shrink-0 ${letterForm.auto_send ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                                    <div className="w-5 h-5 bg-white rounded-full shadow-sm mx-0.5" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Associated Campaign</label>
                                <select value={letterForm.associated_campaign_id} onChange={e => setLetterForm(p => ({ ...p, associated_campaign_id: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none bg-white">
                                    <option value="" disabled>Select a Campaign</option>
                                    {campaigns.map(c => <option key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Message Body ({isLetterCodeView ? 'Raw HTML Code' : 'Rich HTML Editor'})</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsLetterCodeView(!isLetterCodeView)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${isLetterCodeView ? 'bg-[#63A6B2] text-white border-[#63A6B2]' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        <Code className="w-3 h-3" />
                                        {isLetterCodeView ? 'Switch to Visual' : 'Switch to Code'}
                                    </button>
                                </div>
                                <div className="quill-editor-container bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                                    {isLetterCodeView ? (
                                        <textarea
                                            value={letterForm.message}
                                            onChange={e => setLetterForm(p => ({ ...p, message: e.target.value }))}
                                            className="w-full min-h-[300px] p-4 text-xs font-mono bg-[#1E1E1E] text-emerald-400 outline-none resize-y border-none"
                                            placeholder="Write your raw HTML code here..."
                                        />
                                    ) : (
                                        <ReactQuill 
                                            theme="snow"
                                            value={letterForm.message}
                                            onChange={content => setLetterForm(p => ({ ...p, message: content }))}
                                            className="min-h-[250px] text-sm"
                                            placeholder="Compose your professional thank you letter here..."
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, 3, false] }],
                                                    ['bold', 'italic', 'underline', 'strike'],
                                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                                    ['link', 'image', 'clean']
                                                ]
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="text-[10px] font-bold text-[#63A6B2] uppercase tracking-wider">Shortcuts:</span>
                                    {['{{firstname}}', '{{lastname}}', '{{campaign_name}}', '{{foundation_name}}', '{{donation_amount}}', '{{address}}'].map(v => (
                                        <button 
                                            key={v}
                                            onClick={() => setLetterForm(p => ({ ...p, message: p.message + ' ' + v }))}
                                            className="text-[10px] bg-[#63A6B2]/10 text-[#63A6B2] px-2 py-0.5 rounded-md font-bold border border-[#63A6B2]/20 hover:bg-[#63A6B2]/20 transition-all"
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
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
                            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Recipients ({selectedDonors.length} of {mailingDonors.length})</label>
                                    
                                    {selectedTemplateForSend?.category === 'email_blast' && (
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Filter By Category:</label>
                                            <select 
                                                onChange={(e) => fetchMailingSubscribers(e.target.value)}
                                                className="text-[10px] font-bold text-[#63A6B2] bg-white border border-[#63A6B2]/20 rounded-lg px-2 py-1 focus:ring-1 focus:ring-[#63A6B2] outline-none"
                                            >
                                                <option value="all">Whole Mailing List</option>
                                                {campaigns.map(c => (
                                                    <option key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex flex-col flex-1 overflow-hidden pt-2">
                                <div className="bg-white rounded-2xl border border-gray-200 overflow-y-auto flex-1">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDonors.length === mailingDonors.length && mailingDonors.length > 0}
                                                        onChange={(e) => setSelectedDonors(e.target.checked ? [...mailingDonors] : [])}
                                                        className="accent-[#63A6B2]"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Donor Name</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Email Address</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {mailingDonors.map(recipient => (
                                                <tr key={recipient.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedDonors.some(sd => sd.id === recipient.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedDonors(p => [...p, recipient]);
                                                                else setSelectedDonors(p => p.filter(sd => sd.id !== recipient.id));
                                                            }}
                                                            className="accent-[#63A6B2]"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-bold text-gray-700">{recipient.first_name} {recipient.last_name}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">{recipient.email}</td>
                                                </tr>
                                            ))}
                                            {mailingDonors.length === 0 && (
                                                <tr><td colSpan="3" className="py-10 text-center text-gray-400 text-xs italic">No recipients found for this category.</td></tr>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Add New User</h3>
                            <button onClick={() => setIsAddSubscriberModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddSubscriber} className="p-6 space-y-5">
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
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Campaign Association</label>
                                <select 
                                    value={subscriberForm.campaign_id} 
                                    required
                                    onChange={e => setSubscriberForm(p => ({ ...p, campaign_id: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none bg-white font-bold text-[#63A6B2]"
                                >
                                    <option value="" disabled>Select a Campaign</option>
                                    {campaigns.map(c => (
                                        <option key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</option>
                                    ))}
                                </select>
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

            {/* Email Blast Creation/Edit Modal */}
            {isBlastModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#63A6B2]/10 rounded-xl text-[#63A6B2]">
                                    <Send className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{blastForm.id ? 'Edit Blast Template' : 'Create Blast Template'}</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Define your general announcement or mass email message</p>
                                </div>
                            </div>
                            <button onClick={() => setIsBlastModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">From Name/Email (Optional)</label>
                                    <input type="text" value={blastForm.from} onChange={e => setBlastForm(p => ({ ...p, from: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none" placeholder="e.g. SVRTFI Team <info@svrtfi.org>" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">CC Email (Optional)</label>
                                    <input type="text" value={blastForm.cc} onChange={e => setBlastForm(p => ({ ...p, cc: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none" placeholder="e.g. admin@svrtfi.org" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Subject</label>
                                <input type="text" value={blastForm.title} onChange={e => setBlastForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#63A6B2] outline-none" placeholder="e.g. Monthly Newsletter - April 2026" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Message Body ({isBlastCodeView ? 'Raw HTML Code' : 'Rich HTML Editor'})</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsBlastCodeView(!isBlastCodeView)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${isBlastCodeView ? 'bg-[#63A6B2] text-white border-[#63A6B2]' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        <Code className="w-3 h-3" />
                                        {isBlastCodeView ? 'Switch to Visual' : 'Switch to Code'}
                                    </button>
                                </div>
                                <div className="quill-editor-container bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                                    {isBlastCodeView ? (
                                        <textarea
                                            value={blastForm.message}
                                            onChange={e => setBlastForm(p => ({ ...p, message: e.target.value }))}
                                            className="w-full min-h-[300px] p-4 text-xs font-mono bg-[#1E1E1E] text-emerald-400 outline-none resize-y border-none"
                                            placeholder="Write your raw HTML code here..."
                                        />
                                    ) : (
                                        <ReactQuill 
                                            theme="snow"
                                            value={blastForm.message}
                                            onChange={content => setBlastForm(p => ({ ...p, message: content }))}
                                            className="min-h-[250px] text-sm"
                                            placeholder="Compose your blast email content..."
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, 3, false] }],
                                                    ['bold', 'italic', 'underline', 'strike'],
                                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                                    ['link', 'image', 'clean']
                                                ]
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="text-[10px] font-bold text-[#63A6B2] uppercase tracking-wider">Shortcuts:</span>
                                    {['{{firstname}}', '{{lastname}}', '{{campaign_name}}', '{{foundation_name}}', '{{address}}'].map(v => (
                                        <button 
                                            key={v}
                                            type="button"
                                            onClick={() => setBlastForm(p => ({ ...p, message: p.message + ' ' + v }))}
                                            className="text-[10px] bg-[#63A6B2]/10 text-[#63A6B2] px-2 py-0.5 rounded-md font-bold border border-[#63A6B2]/20 hover:bg-[#63A6B2]/20 transition-all"
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button onClick={() => setIsBlastModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-bold text-sm hover:bg-gray-100 hover:text-gray-700 rounded-xl border border-gray-200 bg-white transition-all shadow-sm">Cancel</button>
                            <button onClick={handleSaveBlast} disabled={isSavingBlast} className="px-8 py-2.5 bg-[#63A6B2] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#63A6B2]/20 hover:bg-[#4a8a95] disabled:opacity-50 flex items-center justify-center gap-2">
                                {isSavingBlast ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4" /> {blastForm.id ? 'Update Template' : 'Create Template'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Subscriber Confirmation Modal */}
            {isSubscriberDeleteModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Subscriber?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to remove <span className="font-bold text-gray-900">{subscriberToDelete?.email}</span> from the mailing list? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsSubscriberDeleteModalOpen(false)} className="flex-1 px-6 py-3 bg-gray-50 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all border border-gray-100">Cancel</button>
                                <button onClick={confirmDeleteSubscriber} className="flex-1 px-6 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Letter Template Confirmation Modal */}
            {isLetterDeleteModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Template?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to delete the template <span className="font-bold text-gray-900">{letterToDelete?.title}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsLetterDeleteModalOpen(false)} className="flex-1 px-6 py-3 bg-gray-50 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all border border-gray-100">Cancel</button>
                                <button onClick={confirmDeleteLetter} className="flex-1 px-6 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Email Blast Confirmation Modal */}
            {isBlastDeleteModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-blue-50 text-[#63A6B2] rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Blast Template?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to delete <span className="font-bold text-gray-900">{blastToDelete?.title}</span>? This template will be permanently removed.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsBlastDeleteModalOpen(false)} className="flex-1 px-6 py-3 bg-gray-50 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all border border-gray-100">Cancel</button>
                                <button onClick={confirmDeleteBlast} className="flex-1 px-6 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Edit Modal */}
            {isReceiptModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Receipt Email Template</h3>
                                <p className="text-xs text-[#63A6B2] font-bold mt-0.5">Campaign: {campaigns.find(c => c.campaign_id === selectedCampaignId)?.campaign_name}</p>
                            </div>
                            <button onClick={() => setIsReceiptModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Email Subject Title</label>
                                <input type="text" value={receiptTemplate.title}
                                    onChange={e => setReceiptTemplate(p => ({ ...p, title: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 transition-all font-medium"
                                    placeholder="e.g. Official Donation Receipt" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Receipt Body ({isReceiptCodeView ? 'Raw HTML Code' : 'Rich HTML Editor'})</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsReceiptCodeView(!isReceiptCodeView)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${isReceiptCodeView ? 'bg-[#63A6B2] text-white border-[#63A6B2]' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        <Code className="w-3 h-3" />
                                        {isReceiptCodeView ? 'Switch to Visual' : 'Switch to Code'}
                                    </button>
                                </div>
                                <div className="quill-editor-container bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                                    {isReceiptCodeView ? (
                                        <textarea
                                            value={receiptTemplate.message}
                                            onChange={e => setReceiptTemplate(p => ({ ...p, message: e.target.value }))}
                                            className="w-full min-h-[300px] p-4 text-xs font-mono bg-[#1E1E1E] text-emerald-400 outline-none resize-y border-none"
                                            placeholder="Write your raw HTML code here..."
                                        />
                                    ) : (
                                        <ReactQuill 
                                            theme="snow"
                                            value={receiptTemplate.message}
                                            onChange={content => setReceiptTemplate(p => ({ ...p, message: content }))}
                                            className="min-h-[250px] text-sm"
                                            placeholder="Customize your receipt content..."
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, 3, false] }],
                                                    ['bold', 'italic', 'underline', 'strike'],
                                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                                    ['link', 'image', 'clean']
                                                ]
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="text-[10px] font-bold text-[#63A6B2] uppercase tracking-wider">Shortcuts:</span>
                                    {['{{firstname}}', '{{lastname}}', '{{campaign_name}}', '{{donation_amount}}', '{{address}}', '{{donation_id}}'].map(v => (
                                        <button 
                                            key={v}
                                            type="button"
                                            onClick={() => setReceiptTemplate(p => ({ ...p, message: (p.message || '') + ' ' + v }))}
                                            className="text-[10px] bg-[#63A6B2]/10 text-[#63A6B2] px-2 py-0.5 rounded-md font-bold border border-[#63A6B2]/20 hover:bg-[#63A6B2]/20 transition-all"
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button onClick={() => setIsReceiptModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-bold text-sm hover:bg-gray-100 hover:text-gray-700 rounded-xl border border-gray-200 bg-white transition-all shadow-sm">Cancel</button>
                            <button onClick={() => {
                                handleSaveTemplate();
                            }} disabled={isSavingTemplate}
                                className="px-8 py-2.5 bg-[#63A6B2] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#63A6B2]/20 hover:bg-[#4a8a95] disabled:opacity-50 flex items-center justify-center gap-2">
                                {isSavingTemplate ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4" /> Save Configuration</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
