const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");

const deepUnescape = (str) => {
    if (typeof str !== 'string') return "";
    let unescaped = str
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");
        
    // Simple loop to handle deep/double escaping
    let prev = "";
    let limit = 3;
    while (unescaped !== prev && limit > 0) {
        prev = unescaped;
        unescaped = unescaped
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, "&");
        limit--;
    }
    return unescaped;
};

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

let transporterCache = null;

const clearTransporterCache = () => {
    if (transporterCache) {
        try {
            // Close the current transporter pool before clearing
            transporterCache.close();
            console.log("🛑 Closed existing SMTP connection pool.");
        } catch (err) {
            console.error("Error closing SMTP pool:", err);
        }
    }
    transporterCache = null;
    console.log("♻️ SMTP Transporter cache cleared.");
};

const getTransporter = async () => {
    if (transporterCache) return transporterCache;
    try {
        const res = await pool.query("SELECT * FROM smtp_settings ORDER BY id DESC LIMIT 1");
        if (res.rows.length > 0) {
            const s = res.rows[0];
            const isGmail = s.host && s.host.toLowerCase().includes('gmail');
            
            transporterCache = nodemailer.createTransport({
                pool: true,
                host: s.host,
                port: s.port,
                secure: parseInt(s.port) === 465,
                auth: {
                    user: s.user_email,
                    pass: s.password,
                },
                tls: {
                    rejectUnauthorized: false
                },
                // Gmail is extremely sensitive to multiple login attempts.
                // Limit to 1 connection and higher delay for Gmail.
                maxConnections: isGmail ? 1 : 5,
                maxMessages: 100,
                rateDelta: isGmail ? 2000 : 1000,
                rateLimit: isGmail ? 1 : 5,
                connectionTimeout: 60000,
                socketTimeout: 60000,
                greetingTimeout: 30000
            });
            console.log(`🔌 Created ${isGmail ? 'conservative ' : ''}pooled transporter for ${s.provider} (${s.host}) as user: ${s.user_email}`);
            return transporterCache;
        }
    } catch (err) {
        console.error("Error getting SMTP settings from DB, falling back to ENV:", err);
    }

    // Fallback to ENV settings (Usually Gmail)
    transporterCache = nodemailer.createTransport({
        service: "gmail",
        pool: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        maxConnections: 1,
        maxMessages: 100,
        rateLimit: 1,
        connectionTimeout: 60000,
        socketTimeout: 60000,
        greetingTimeout: 30000
    });
    console.log(`🔌 Created conservative pooled transporter for Gmail (Fallback) as user: ${process.env.EMAIL_USER}`);
    return transporterCache;
};


const sendEmail = async (to, subject, html, customFrom = null, ccEmail = null, attachments = []) => {
    let result = { success: false };
    try {
        const transporter = await getTransporter();
        const res = await pool.query("SELECT user_email, sender_email FROM smtp_settings LIMIT 1");
        const fromEmail = res.rows.length > 0 ? (res.rows[0].sender_email || res.rows[0].user_email) : process.env.EMAIL_USER;

        let processedHtml = deepUnescape(html || "");
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
    const { 
        donor_name, donor_email, amount, campaign_name, donation_id, 
        payment_method, date, frequency, donor_phone, message, 
        receipt_upload, address, address2, barangay, province, city, 
        zip_code, country, tin_number, foundation_name, foundation_logo,
        receipt_number
    } = donationData;

    // Build a full address string
    const fullAddress = [address, address2, barangay, city, province, zip_code, country]
        .filter(part => part && String(part).trim() !== '')
        .join(', ') || '—';

    // Fetch user-configured template from DB
    let templateTitle = receipt_number ? `Official Donation Receipt - ${receipt_number}` : 'Official Donation Receipt';
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
                            ${receipt_number ? `
                            <div style="">
                                <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.8); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Receipt</p>
                                <p style="margin: 2px 0 0 0; font-size: 18px; font-weight: 800;">${receipt_number}</p>
                            </div>
                            ` : ''}
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
                                <p style="margin: 4px 0 0 0; font-size: 15px; color: #1e293b; font-weight: 700;">${fullAddress}</p>
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

const sendVerificationCode = async (email, username, code) => {
    const subject = "Email Verification - Shepherd's Voice";
    const html = `
    <div style="background-color: #f4f7f6; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #63A6B2; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to SVRTV!</h1>
            </div>
            <div style="padding: 40px; text-align: center;">
                <p style="color: #333333; font-size: 16px; margin-bottom: 25px;">Hi <strong>${username}</strong>,</p>
                <p style="color: #666666; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">Thank you for joining Shepherd's Voice. To complete your registration, please use the 4-digit verification code below:</p>
                
                <div style="background-color: #f8f9fa; border: 2px dashed #63A6B2; border-radius: 8px; padding: 20px; display: inline-block; margin-bottom: 30px;">
                    <span style="font-size: 42px; font-weight: 800; color: #63A6B2; letter-spacing: 10px;">${code}</span>
                </div>
                
                <p style="color: #999999; font-size: 13px;">This code will expire in 15 minutes.</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #666666; font-size: 12px; margin: 0;">© 2026 Shepherd's Voice Radio and Television Foundation, Inc.</p>
            </div>
        </div>
    </div>
    `;
    return await sendEmail(email, subject, html);
};

const sendPasswordResetCode = async (email, username, code) => {
    const subject = "Password Reset Request - Shepherd's Voice";
    const html = `
    <div style="background-color: #f4f7f6; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #63A6B2; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Password Reset</h1>
            </div>
            <div style="padding: 40px; text-align: center;">
                <p style="color: #333333; font-size: 16px; margin-bottom: 25px;">Hi <strong>${username}</strong>,</p>
                <p style="color: #666666; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">We received a request to reset your password. Please use the 4-digit code below to securely change it:</p>
                
                <div style="background-color: #f0f9fa; border: 2px dashed #63A6B2; border-radius: 8px; padding: 20px; display: inline-block; margin-bottom: 30px;">
                    <span style="font-size: 42px; font-weight: 800; color: #63A6B2; letter-spacing: 10px;">${code}</span>
                </div>
                
                <p style="color: #999999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #666666; font-size: 12px; margin: 0;">© 2026 Shepherd's Voice Radio and Television Foundation, Inc.</p>
            </div>
        </div>
    </div>
    `;
    return await sendEmail(email, subject, html);
};


/**
 * processDonationCompletion
 * Fetches data for a donation and triggers both the Official Receipt AND (optionally) the auto Thank You Letter.
 */
const processDonationCompletion = async (donationId) => {
    console.log(`📧 Processing donation completion for ID: ${donationId}`);
    try {
        const details = await pool.query(
            `SELECT 
                d.*, 
                c.campaign_name, 
                dn.email, 
                dn.first_name, 
                dn.last_name, 
                dn.contact_number AS donor_phone,
                dn.address, dn.address2, dn.barangay, dn.province, dn.city, dn.zip_code, dn.country,
                dn.tin_number,
                pt.receipt_upload,
                f.foundation_name,
                f.image_logo AS foundation_logo
             FROM donations d
             JOIN campaigns c ON d.campaign_id = c.campaign_id
             LEFT JOIN donors dn ON d.donor_id = dn.donor_id
             LEFT JOIN payment_transactions pt ON d.donation_id = pt.donation_id
             LEFT JOIN foundation_campaigns fc ON c.campaign_id = fc.campaign_id
             LEFT JOIN foundations f ON fc.foundation_id = f.foundation_id
             WHERE d.donation_id = $1
             LIMIT 1`,
            [donationId]
        );

        if (details.rows.length === 0) return { success: false, error: "Donation details not found" };

        const data = details.rows[0];
        console.log(`🔍 Fetched donation data: donor_email=${data.email}, campaign=${data.campaign_name}`);
        
        // 1. Send Official Receipt
        await sendDonationReceipt({
            donor_name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Anonymous Donor',
            donor_email: data.email,
            amount: data.amount,
            campaign_name: data.campaign_name,
            campaign_id: data.campaign_id,
            donation_id: data.donation_id,
            payment_method: data.payment_method || 'N/A',
            date: new Date(),
            frequency: data.frequency,
            message: data.message,
            receipt_upload: data.receipt_upload || null,
            donor_phone: data.donor_phone,
            address: data.address,
            address2: data.address2,
            barangay: data.barangay,
            province: data.province,
            city: data.city,
            zip_code: data.zip_code,
            country: data.country,
            tin_number: data.tin_number,
            foundation_name: data.foundation_name,
            foundation_logo: data.foundation_logo
        });

        // 2. Send Auto Thank You Letter (if configured)
        try {
            const tplRes = await pool.query(
                `SELECT * FROM email_campaigns 
                 WHERE category = 'thank_you_letter' 
                   AND auto_send = TRUE 
                   AND status = 'active'
                   AND (associated_campaign_id = $1 OR associated_campaign_id IS NULL)
                 ORDER BY associated_campaign_id DESC NULLS LAST
                 LIMIT 1`,
                [data.campaign_id]
            );
            
            if (tplRes.rows.length > 0) {
                const tpl = tplRes.rows[0];
                const donor_email = data.email;
                if (donor_email) {
                    
                    const replacements = {
                        '{{firstname}}':       data.first_name || '',
                        '{{lastname}}':        data.last_name  || '',
                        '{{campaign_name}}':   data.campaign_name || '',
                        '{{donation_amount}}': `₱${parseFloat(data.amount).toLocaleString('en-PH', {minimumFractionDigits: 2})}`,
                        '{{address}}':         data.address || '',
                        '{{foundation_name}}': data.foundation_name || '',
                    };
                    
                    let personalizedSubject = tpl.title;
                    let personalizedHtml    = tpl.message;
                    
                    Object.entries(replacements).forEach(([key, val]) => {
                        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                        personalizedSubject = personalizedSubject.replace(regex, val);
                        personalizedHtml    = personalizedHtml.replace(regex, val);
                    });

                    const finalHtml = `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; padding: 40px 20px; text-align: center;">
                        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: left; border: 1px solid #eef2f6;">
                            <div style="background: linear-gradient(135deg, #63A6B2 0%, #4a8a95 100%); padding: 30px; text-align: center;">
                                <img src="https://svrtf.org/images/logo.png" alt="SVRTV Logo" style="width: 70px; height: 70px; border-radius: 50%; background: white; padding: 5px; object-fit: contain;">
                            </div>
                            <div style="padding: 40px; color: #334155; line-height: 1.8; font-size: 15px; overflow-wrap: break-word;">
                                ${personalizedHtml}
                            </div>
                            <div style="background-color: #f8fafc; padding: 25px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #63A6B2;">Shepherd's Voice Radio and Television Foundation, Inc.</p>
                                <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">456 Faith Avenue, Manila, Metro Manila 1003<br>
                                © 2026 SVRTF. All rights reserved.</p>
                            </div>
                        </div>
                    </div>`;

                    await sendEmail(donor_email, personalizedSubject, finalHtml, tpl.from_email || null, tpl.cc_email || null);
                    console.log(`✅ Auto Thank You Letter sent to ${donor_email}`);
                }
            }
        } catch (tplErr) {
            console.error("FAILED TO SEND AUTO THANK YOU LETTER:", tplErr);
        }

        return { success: true };
    } catch (err) {
        console.error("processDonationCompletion ERROR:", err);
        return { success: false, error: err.message };
    }
};

module.exports = { sendEmail, sendVerificationCode, sendPasswordResetCode, clearTransporterCache, processDonationCompletion };
