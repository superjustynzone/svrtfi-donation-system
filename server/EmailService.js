const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password here
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"SVRTV Donation System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        return { success: true, message: "Email sent successfully" };
    } catch (error) {
        console.error("Email send error:", error);
        return { success: false, error: error.message };
    }
};

const sendDonationReceipt = async (donationData) => {
    const { donor_name, donor_email, amount, campaign_name, donation_id, payment_method, date, frequency, donor_phone, message } = donationData;

    const formatCurrency = (amount) => {
        return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getPaymentMethodName = (method) => {
        const methods = {
            'gcash': 'GCash',
            'paymaya': 'PayMaya',
            'bank': 'Bank Transfer',
            'card': 'Credit/Debit Card'
        };
        return methods[method] || method;
    };

    const receiptHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 20px auto; background-color: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #eef2f6;">
            <!-- Header Gradient -->
            <div style="background: linear-gradient(135deg, #63A6B2 0%, #4a8a95 100%); padding: 35px 30px; color: white;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="70%">
                            <div style="display: flex; align-items: center;">
                                <div style="background: white; width: 70px; height: 70px; border-radius: 50%; padding: 5px; display: inline-block; vertical-align: middle;">
                                    <img src="https://svrtf.org/images/logo.png" alt="SVRTV Logo" style="width: 100%; height: 100%; border-radius: 50%; object-fit: contain;">
                                </div>
                                <div style="display: inline-block; vertical-align: middle; margin-left: 20px;">
                                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">OFFICIAL RECEIPT</h1>
                                    <p style="margin: 4px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500;">Tax Deductible Donation</p>
                                </div>
                            </div>
                        </td>
                        <td width="30%" align="right">
                            <div style="background: rgba(255,255,255,0.15); padding: 12px 18px; border-radius: 12px; backdrop-filter: blur(5px);">
                                <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.8); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Receipt No.</p>
                                <p style="margin: 2px 0 0 0; font-size: 18px; font-weight: 800;">RCP-2026-${String(donation_id).padStart(6, '0')}</p>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>

            <div style="padding: 35px;">
                <!-- Org Info -->
                <div style="margin-bottom: 30px; border-bottom: 2px solid #f0f4f8; padding-bottom: 20px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700;">Organization Information</h2>
                    <p style="margin: 0; font-size: 17px; color: #63A6B2; font-weight: 800;">Shepherd's Voice Radio and Television Foundation, Inc.</p>
                    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b; line-height: 1.5;">456 Faith Avenue, Manila, Metro Manila 1003<br>
                    Phone: (02) 8123-4567 | Website: <a href="https://svrtf.org" style="color: #63A6B2; text-decoration: none; font-weight: 600;">www.svrtf.org</a></p>
                </div>

                <!-- Donor Info -->
                <div style="margin-bottom: 30px; border-bottom: 2px solid #f0f4f8; padding-bottom: 20px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700;">Donor Information</h2>
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td width="50%">
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Full Name</p>
                                <p style="margin: 4px 0 0 0; font-size: 15px; color: #1e293b; font-weight: 700;">${donor_name || 'Anonymous Donor'}</p>
                            </td>
                            <td width="50%">
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Email Address</p>
                                <p style="margin: 4px 0 0 0; font-size: 15px; color: #1e293b; font-weight: 700;">${donor_email || '—'}</p>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Donation Details -->
                <div style="margin-bottom: 35px; border-bottom: 2px solid #f0f4f8; padding-bottom: 25px;">
                    <h2 style="margin: 0 0 15px 0; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700;">Donation Details</h2>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding-bottom: 20px;" width="50%">
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Date & Time</p>
                                <p style="margin: 4px 0 0 0; font-size: 14px; color: #1e293b; font-weight: 700;">${formatDateTime(date)}</p>
                            </td>
                            <td style="padding-bottom: 20px;" width="50%">
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Reference Number</p>
                                <p style="margin: 4px 0 0 0; font-size: 14px; color: #1e293b; font-weight: 700; font-family: monospace;">DON-2026-${String(donation_id).padStart(6, '0')}</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Campaign</p>
                                <p style="margin: 4px 0 0 0; font-size: 14px; color: #63A6B2; font-weight: 700;">${campaign_name}</p>
                            </td>
                            <td style="padding-bottom: 20px;">
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Payment Method</p>
                                <p style="margin: 4px 0 0 0; font-size: 14px; color: #1e293b; font-weight: 700;">${getPaymentMethodName(payment_method)}</p>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Donation Type</p>
                                <p style="margin: 4px 0 0 0; font-size: 14px; color: #1e293b; font-weight: 700;">${frequency === 'monthly' ? 'Monthly (Recurring)' : 'One-Time'}</p>
                            </td>
                            <td>
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Status</p>
                                <p style="margin: 4px 0 0 0; font-size: 14px; color: #059669; font-weight: 700;">● COMPLETED</p>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Total Amount Card -->
                <div style="background-color: #f0f9fa; border: 2px solid #63A6B2; border-radius: 16px; padding: 25px; margin-bottom: 30px; text-align: center;">
                    <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 1px;">Total Amount Received</p>
                    <p style="margin: 0; font-size: 42px; font-weight: 900; color: #63A6B2;">${formatCurrency(amount)}</p>
                </div>

                <!-- Tax Info -->
                <div style="background-color: #fffaf0; border: 1px solid #feebc8; border-radius: 12px; padding: 15px; margin-bottom: 30px;">
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #9a6324; margin-bottom: 4px;">Tax Deductible Information</p>
                    <p style="margin: 0; font-size: 12px; color: #c05621; line-height: 1.5;">This donation is tax deductible under Philippine law. Please retain this receipt for your records. SVRTFI is a BIR-accredited organization.</p>
                </div>

                ${message ? `
                <div style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #64748b;">MESSAGE FROM DONOR:</h3>
                    <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #63A6B2; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; color: #334155; font-style: italic;">"${message}"</p>
                    </div>
                </div>
                ` : ''}

                <!-- Footer Signatures -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 40px; border-top: 2px solid #f0f4f8; padding-top: 30px;">
                    <tr>
                        <td width="50%" style="padding-right: 20px;">
                            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Prepared by</p>
                            <div style="height: 1px; background-color: #e2e8f0; margin: 40px 0 10px 0;"></div>
                            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">Finance Department</p>
                        </td>
                        <td width="50%" style="padding-left: 20px;">
                            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Authorized Signatory</p>
                            <div style="height: 1px; background-color: #e2e8f0; margin: 40px 0 10px 0;"></div>
                            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">SVRTF Management</p>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Bottom Footer -->
            <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #63A6B2;">Thank you for your generous support!</p>
                <p style="margin: 0; font-size: 11px; color: #94a3b8;">This is a computer-generated receipt and is valid without signature.<br>
                © 2026 Shepherd's Voice Radio and Television Foundation, Inc.</p>
            </div>
        </div>
    `;

    return await sendEmail(donor_email, `Official Donation Receipt - RCP-${donation_id}`, receiptHtml);
};

module.exports = { sendEmail, sendDonationReceipt };
