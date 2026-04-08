const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});


const getTransporter = async () => {
    try {
        const res = await pool.query("SELECT * FROM smtp_settings ORDER BY id DESC LIMIT 1");
        if (res.rows.length > 0) {
            const s = res.rows[0];
            return nodemailer.createTransport({
                host: s.host,
                port: s.port,
                secure: s.port === 465, // true for 465, false for other ports
                auth: {
                    user: s.user_email,
                    pass: s.password,
                },
                tls: {
                    rejectUnauthorized: false // Helps with some shared hosting
                },
                connectionTimeout: 60000,
                socketTimeout: 60000,
                greetingTimeout: 30000
            });
        }
    } catch (err) {
        console.error("Error getting SMTP settings from DB, falling back to ENV:", err);
    }

    // Fallback to ENV settings
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 60000,
        socketTimeout: 60000,
        greetingTimeout: 30000
    });
};

const sendEmail = async (to, subject, html, customFrom = null, ccEmail = null, attachments = []) => {
    let result = { success: false };
    try {
        const transporter = await getTransporter();
        const res = await pool.query("SELECT user_email FROM smtp_settings LIMIT 1");
        const fromEmail = res.rows.length > 0 && res.rows[0].user_email ? res.rows[0].user_email : process.env.EMAIL_USER;

        let processedHtml = html || "";
        let finalAttachments = attachments ? [...attachments] : [];
        let cidCounter = 1;

        processedHtml = processedHtml.replace(/<img([^>]*)src=["']data:image\/([^;]+);base64,([^"']+)["']([^>]*)>/gi, (match, pre, ext, base64Data, post) => {
            const cid = `img_${Date.now()}_${cidCounter++}@svrtfi`;
            finalAttachments.push({
                filename: `image_${cidCounter}.${ext}`,
                content: Buffer.from(base64Data, 'base64'),
                contentType: `image/${ext}`,
                cid: cid
            });
            return `<img${pre}src="cid:${cid}"${post}>`;
        });

        const mailOptions = {
            from: customFrom || `"SVRTV Donation System" <${fromEmail}>`,
            to,
            subject,
            html: processedHtml,
        };
        
        if (ccEmail) {
            mailOptions.cc = ccEmail;
        }

        if (finalAttachments.length > 0) {
            mailOptions.attachments = finalAttachments;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        result = { success: true, message: "Email sent successfully" };
    } catch (error) {
        console.error("Email send error:", error);
        result = { success: false, error: error.message };
    }

    // DB Logging
    try {
        await pool.query(
            "INSERT INTO email_logs (recipient_email, subject, message, status, error_message) VALUES ($1, $2, $3, $4, $5)",
            [to, subject, html, result.success ? 'success' : 'failed', result.error || null]
        );
    } catch (logErr) {
        console.error("Critical: Failed to log email to DB:", logErr);
    }

    return result;
};



const sendDonationReceipt = async (donationData) => {
    if (!donationData) {
        console.error("❌ No donation data provided to sendDonationReceipt");
        return { success: false, error: "Missing donation data" };
    }
    const { donor_name, donor_email, amount, campaign_name, donation_id, payment_method, date, frequency, donor_phone, message, receipt_upload, address, foundation_name, foundation_logo } = donationData;

    // Fetch user-configured template from DB
    let templateTitle = `Official Donation Receipt - RCP-${donation_id}`;
    let thankYouMsg = "Thank you for your generous support! Your donation helps us make a difference.";
    let customMessagePrefix = null; // If set, prepended above the standard receipt

    try {
        const { campaign_id: campaignId } = donationData;
        // Check campaign-specific template
        const campRes = await pool.query("SELECT receipt_email_subject as title, receipt_email_message as message FROM campaigns WHERE campaign_id = $1", [campaignId]);
        
        let config = null;
        if (campRes.rows.length > 0 && (campRes.rows[0].title || campRes.rows[0].message)) {
            config = campRes.rows[0];
        }

        if (config) {
            const replacements = {
                '{{firstname}}':       (donor_name || '').split(' ')[0],
                '{{lastname}}':        (donor_name || '').split(' ').slice(1).join(' '),
                '{{campaign_name}}':   campaign_name || '',
                '{{donation_amount}}': `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
                '{{donation_id}}':     String(donation_id),
                '{{address}}':         address || '',
                '{{foundation_name}}': foundation_name || '',
                '${donation_id}':      String(donation_id),
                '${campaign_name}':    campaign_name || '',
                '${donor_name}':       donor_name || '',
            };

            let subject = config.title || '';
            Object.entries(replacements).forEach(([key, val]) => {
                const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                subject = subject.replace(regex, val);
            });
            templateTitle = subject;

            // Personalise message body and store as prefix to be shown above the receipt
            if (config.message && config.message.trim() && config.message.trim() !== '<p><br></p>') {
                let body = config.message;
                Object.entries(replacements).forEach(([key, val]) => {
                    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                    body = body.replace(regex, val);
                });
                customMessagePrefix = body;
            } else {
                thankYouMsg = config.message || thankYouMsg;
            }
        }
    } catch (err) {
        console.error("Error fetching receipt template from DB:", err);
    }

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

    const messageCard = customMessagePrefix ? `
        <!-- Message Card Section -->
        <div style="max-width: 650px; margin: 0 auto 25px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eef2f6; border-top: 4px solid #63A6B2;">
            <div style="padding: 40px; color: #334155; line-height: 1.8; font-size: 15px; text-align: left; overflow-wrap: break-word;">
                <h3 style="margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #63A6B2; font-weight: 700;">A Message From Us</h3>
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    ${customMessagePrefix}
                </div>
            </div>
        </div>
    ` : '';

    const receiptHtml = `
        <!-- Official Receipt Section -->
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #eef2f6;">
            <!-- Header Gradient -->
            <div style="background: linear-gradient(135deg, #63A6B2 0%, #4a8a95 100%); padding: 35px 30px; color: white;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="70%">
                            <div style="display: flex; align-items: center;">
                                <!-- SVRTV Logo -->
                                <div style="background: white; width: 70px; height: 70px; border-radius: 50%; padding: 5px; display: inline-block; vertical-align: middle;">
                                    <img src="https://svrtf.org/images/logo.png" alt="SVRTV Logo" style="width: 100%; height: 100%; border-radius: 50%; object-fit: contain;">
                                </div>
                                
                                <!-- Divider -->
                                <div style="display: inline-block; height: 40px; width: 1px; background-color: rgba(255,255,255,0.3); vertical-align: middle; margin: 0 15px;"></div>

                                <!-- Foundation Logo -->
                                ${foundation_logo ? `
                                <div style="background: white; width: 70px; height: 70px; border-radius: 50%; padding: 5px; display: inline-block; vertical-align: middle;">
                                    <img src="http://localhost:5000${foundation_logo}" alt="Foundation Logo" style="width: 100%; height: 100%; border-radius: 50%; object-fit: contain;">
                                </div>
                                ` : ''}

                                <div style="display: inline-block; vertical-align: middle; margin-left: ${foundation_logo ? '15px' : '0px'};">
                                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">OFFICIAL RECEIPT</h1>
                                    <p style="margin: 2px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.85); font-weight: 500;">Tax Deductible Donation</p>
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
                    <p style="margin: 0; font-size: 17px; color: #63A6B2; font-weight: 800;">${foundation_name || "Shepherd's Voice Radio and Television Foundation, Inc."}</p>
                    <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748b; line-height: 1.5;">456 Faith Avenue, Manila, Metro Manila 1003<br>
                    Phone: (02) 8123-4567 | Website: <a href="https://svrtf.org" style="color: #63A6B2; text-decoration: none; font-weight: 600;">www.svrtf.org</a></p>
                </div>

                <!-- Donor Info -->
                <div style="margin-bottom: 30px; border-bottom: 2px solid #f0f4f8; padding-bottom: 20px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700;">Donor Information</h2>
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td width="50%" style="padding-bottom: 15px;">
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Full Name</p>
                                <p style="margin: 4px 0 0 0; font-size: 15px; color: #1e293b; font-weight: 700;">${donor_name || 'Anonymous Donor'}</p>
                            </td>
                            <td width="50%" style="padding-bottom: 15px;">
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Email Address</p>
                                <p style="margin: 4px 0 0 0; font-size: 15px; color: #1e293b; font-weight: 700;">${donor_email || '—'}</p>
                            </td>
                        </tr>
                        <tr>
                            <td width="50%" style="padding-bottom: 15px;">
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Contact Number</p>
                                <p style="margin: 4px 0 0 0; font-size: 15px; color: #1e293b; font-weight: 700;">${donor_phone || '—'}</p>
                            </td>
                            <td width="50%" style="padding-bottom: 15px;">
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Tax ID / TIN</p>
                                <p style="margin: 4px 0 0 0; font-size: 15px; color: #1e293b; font-weight: 700;">${tin_number || '—'}</p>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Address</p>
                                <p style="margin: 4px 0 0 0; font-size: 15px; color: #1e293b; font-weight: 700;">${address || '—'}</p>
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
                ${customMessagePrefix ? '' : `<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #63A6B2;">${thankYouMsg}</p>`}
                <p style="margin: 0; font-size: 11px; color: #94a3b8;">This is a computer-generated receipt and is valid without signature.<br>
                © 2026 Shepherd's Voice Radio and Television Foundation, Inc.</p>
            </div>
        </div>
    `;

    const finalBody = `
        <div style="background-color: #f4f6f8; padding: 40px 20px;">
            ${messageCard}
            ${receiptHtml}
        </div>
    `;

    return await sendEmail(donor_email, templateTitle, finalBody);

};

module.exports = { sendEmail, sendDonationReceipt };
