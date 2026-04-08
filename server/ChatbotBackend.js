// ChatbotBackend.js - SVRTV Assistant AI Chatbot Route
// Gemini AI with smart FAQ fallback when quota is exceeded
const express = require("express");
const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// REAL SVRTFI INFORMATION
// ─────────────────────────────────────────────────────────────────────────────
const SVRTFI_INFO = {
  name: "Shepherd's Voice Radio and Television Foundation Inc.",
  shortName: "SVRTFI / SVRTV",
  address: "60 Chicago St., Bgy. Pinagkaisahan, Cubao, Quezon City 1109",
  phone: "(+63) 02 725-9999",
  email: "contact@svrtv.com",
  hours: "Monday – Friday: 8:00 AM – 6:00 PM | Saturday & Sunday: Closed",
  bankName: "Banco De Oro",
  bankAccount: "Savings Account #16050612",
  bankAccountName: "Shepherd's Voice Radio and Television Foundation Inc.",
  vision: "To be the first choice in Catholic Print Media Evangelization.",
  mission: [
    "We will INSPIRE people to live a full life in Jesus Christ.",
    "We will LEAD people to the light of Jesus Family.",
    "We will PROVIDE financial, creative, and technical support to the various ministries of Bo Sanchez and the Light of Jesus Family.",
  ],
  about: "SVRTFI is an all-media organization that produces world-class inspirational and spiritually-enriching programs, while also providing support to the work of evangelization and poverty alleviation.",
};

// ─────────────────────────────────────────────────────────────────────────────
// SMART FAQ RESPONSES — Based on real SVRTFI info
// ─────────────────────────────────────────────────────────────────────────────
const FAQ_RESPONSES = [
  // ── Greeting ──────────────────────────────────────────────────────────────
  {
    keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings", "start", "sup", "kamusta"],
    answer: `Hi there! 👋 I'm the **SVRTV Assistant**.\n\nI can help you with donations, payment methods, receipts, and more.\n\nWhat do you need help with?`,
  },

  // ── Thank you ─────────────────────────────────────────────────────────────
  {
    keywords: ["thank", "thanks", "thank you", "appreciate", "salamat", "maraming salamat"],
    answer: `You're welcome! 🙏 Thank you for your support.\n\nIs there anything else I can help you with?`,
  },

  // ── About SVRTFI ──────────────────────────────────────────────────────────
  {
    keywords: ["what is svrtv", "what is svrtfi", "about svrtv", "about svrtfi", "who are you", "about shepherd", "what do you do", "tell me about", "mission", "vision", "purpose"],
    answer: `**SVRTFI** is a Catholic media foundation that produces inspirational programs and supports evangelization and poverty alleviation.\n\n• **Vision:** First choice in Catholic Print Media Evangelization\n• **Led by:** Bro. Bo Sanchez\n\nLearn more on our About Us page 😊`,
  },

  // ── How to Donate ─────────────────────────────────────────────────────────
  {
    keywords: ["how to donate", "how do i donate", "how can i donate", "donate", "donation", "give", "contribute", "start donating", "mag donate", "paano mag donate"],
    answer: `To donate:\n\n1. Go to the Campaigns page 😊 and pick a campaign\n2. Click **"Donate"**, enter your amount\n3. Choose payment method & complete checkout\n4. Receipt is sent to your email automatically ✅\n\nOr donate via bank transfer — ask me for bank details!`,
  },

  // ── Payment Methods ───────────────────────────────────────────────────────
  {
    keywords: ["payment", "pay", "gcash", "maya", "credit card", "debit card", "visa", "mastercard", "bank transfer", "method", "how to pay", "paraan ng bayad"],
    answer: `We accept:\n\n• 📱 GCash\n• 📱 Maya\n• 💳 Credit / Debit Card\n• 🏦 Bank Transfer (BDO)\n\nAll transactions are secure and encrypted. 🔒`,
  },

  // ── Bank Details ──────────────────────────────────────────────────────────
  {
    keywords: ["bank account", "bank details", "bdo", "banco de oro", "account number", "savings account", "bank info", "transfer details"],
    answer: `🏦 **Bank:** Banco De Oro (BDO)\n📋 **Name:** Shepherd's Voice Radio and Television Foundation Inc.\n💳 **Savings Account #16050612**\n\nSend proof of payment to **contact@svrtv.com** 📧`,
  },

  // ── Minimum Donation ──────────────────────────────────────────────────────
  {
    keywords: ["minimum", "maximum", "how much", "amount", "magkano", "php", "peso", "any amount"],
    answer: `There is **no minimum donation amount**. 💛\n\nEvery peso helps — give whatever you're comfortable with!`,
  },

  // ── Anonymous Donations ───────────────────────────────────────────────────
  {
    keywords: ["anonymous", "anonymously", "donate anonymously", "privacy", "hide name", "private", "confidential", "hide my name", "not show name"],
    answer: `Yes! 🙏\n\nJust tick **"Donate Anonymously"** on the donation form — your name won't appear publicly anywhere.`,
  },

  // ── Recurring Donations ───────────────────────────────────────────────────
  {
    keywords: ["recurring", "monthly", "regular", "repeat", "automatic", "scheduled", "every month", "subscription", "buwanan"],
    answer: `Yes, we support **recurring donations**! 🔄\n\nChoose your frequency at checkout:\n• Monthly • Quarterly • Annually\n\nManage or cancel anytime from your Profile page 😊`,
  },

  // ── Receipts ──────────────────────────────────────────────────────────────
  {
    keywords: ["receipt", "confirmation", "tax", "document", "proof", "official receipt", "email receipt", "bir", "resibo"],
    answer: `Your receipt is **emailed automatically** after each donation. 📧\n\n• View past receipts on your Profile page 😊\n• Usable for BIR tax exemption\n\nNot seeing it? Check your spam folder.`,
  },

  // ── Account / Login ───────────────────────────────────────────────────────
  {
    keywords: ["account", "login", "log in", "sign up", "register", "profile", "create account", "history", "mag login", "mag sign up"],
    answer: `Create a free account to track your donations!\n\n• Click **Sign Up** to register for free 😊\n• Click **Log In** to access your account\n• View your history & receipts on your Profile page 😊`,
  },

  // ── Campaigns ─────────────────────────────────────────────────────────────
  {
    keywords: ["campaign", "fundraising", "active campaign", "current campaign", "list of campaigns", "ano ang campaigns"],
    answer: `Browse all active campaigns on our Campaigns page 😊\n\nWe currently support causes like:\n• 🏠 Care for abandoned elderly (Anawim)\n• 📚 Scholarships for poor students\n• 🎗️ Cancer patient assistance`,
  },

  // ── Foundations ───────────────────────────────────────────────────────────
  {
    keywords: ["foundation", "foundations", "partner", "anawim", "jeremiah", "grace to be born", "pag-asa", "loj", "he cares", "cancer", "prison", "pastoral", "list of foundations"],
    answer: `We partner with **9 foundations**:\n\n1. 🏠 Anawim — Elderly home\n2. 💜 Jeremiah Foundation — Abused girls\n3. 👶 Grace to be Born — Unwed mothers\n4. 📚 Pag-Asa ng Pamilya — Scholarships\n5. 📺 SVRTV — Media evangelization\n6. ⛪ LOJ Prison Ministry — Women inmates\n7. 🧠 LOJ Pastoral Care — Counseling\n8. 🧒 He Cares Mission — Street children\n9. 🎗️ JCCFC — Cancer patients\n\nSee full details on our Foundations page 😊`,
  },

  // ── Contact ───────────────────────────────────────────────────────────────
  {
    keywords: ["contact", "reach", "phone", "call", "email", "support", "staff", "team", "office", "address", "location", "makipag-ugnayan"],
    answer: `📍 60 Chicago St., Cubao, Quezon City 1109\n📞 (+63) 02 725-9999\n📧 contact@svrtv.com\n🕐 Mon–Fri, 8:00 AM–6:00 PM\n\nOr send us a message on our Contact Us page 😊`,
  },

  // ── Security ──────────────────────────────────────────────────────────────
  {
    keywords: ["secure", "security", "safe", "legit", "legitimate", "scam", "trust", "verified", "registered"],
    answer: `SVRTFI is a **duly registered non-profit** in the Philippines. 🔒\n\n• All transactions are encrypted\n• We never share your data\n• Bank transfers go to our official BDO account`,
  },

  // ── Cancel / Refund ───────────────────────────────────────────────────────
  {
    keywords: ["cancel", "refund", "stop", "change", "unsubscribe", "pause", "i-cancel"],
    answer: `To cancel a recurring donation:\n\n1. Click **Log In** to access your account\n2. Go to your Profile page 😊\n3. Manage your recurring donations there\n\nFor refunds, email **contact@svrtv.com** or call **(+63) 02 725-9999**`,
  },

  // ── Bo Sanchez / LOJ ──────────────────────────────────────────────────────
  {
    keywords: ["bo sanchez", "light of jesus", "loj", "kerygma", "bro bo", "brother bo"],
    answer: `SVRTFI is under the ministry of **Bro. Bo Sanchez** 🕊️ and the Light of Jesus Family.\n\nPrograms include:\n• Kerygma TV (ANC & IBC13)\n• Gabay sa Bibliya sa Radyo (Veritas 846)\n• Annual Kerygma Conference`,
  },
];

// ── Default fallback when nothing matches ────────────────────────────────────
const DEFAULT_ANSWER = `I'm not sure about that. 😊\n\nTry asking about:\n• How to donate\n• Payment methods\n• Bank details\n• Our foundations\n• Contact info\n\nOr reach us at **contact@svrtv.com** / **(+63) 02 725-9999**`;

/**
 * Keyword scoring — longer/more specific phrases score higher
 */
function findFAQMatch(message) {
  const lower = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const faq of FAQ_RESPONSES) {
    let score = 0;
    for (const keyword of faq.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.split(" ").length * 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  return bestScore > 0 ? bestMatch.answer : DEFAULT_ANSWER;
}

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI SYSTEM PROMPT — Uses real SVRTFI info
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are "SVRTV Assistant", a friendly and helpful customer support chatbot for Shepherd's Voice Radio and Television Foundation Inc. (SVRTFI).

IMPORTANT RULES:
- Be warm, concise, and professional. Use short clear answers.
- DO NOT answer questions unrelated to SVRTFI — politely redirect.
- Never make up information — use only the details below.
- Always encourage users to donate when appropriate.
- Use simple, approachable language. Use bullet points (•) when listing items.
- Keep responses under 150 words unless necessary.

ABOUT SVRTFI:
- Full Name: Shepherd's Voice Radio and Television Foundation Inc. (SVRTFI / SVRTV)
- About: An all-media organization producing world-class inspirational and spiritually-enriching programs, while providing support to evangelization and poverty alleviation.
- Vision: To be the first choice in Catholic Print Media Evangelization.
- Mission: Inspire people to live a full life in Jesus Christ; Lead people to the Light of Jesus Family; Provide financial, creative, and technical support to ministries of Bo Sanchez and the Light of Jesus Family.
- Founded by: Bro. Bo Sanchez (Catholic lay preacher)

CONTACT:
- Address: 60 Chicago St., Bgy. Pinagkaisahan, Cubao, Quezon City 1109
- Phone: (+63) 02 725-9999
- Email: contact@svrtv.com
- Hours: Monday–Friday 8:00 AM–6:00 PM | Saturday & Sunday: Closed

HOW TO DONATE:
1. Visit /campaigns and choose a campaign
2. Click "Donate", enter amount and frequency
3. Select payment method and complete checkout
4. Receipt is emailed automatically

PAYMENT METHODS: GCash, Maya, Credit/Debit Card, Bank Transfer

BANK DONATIONS (General):
- Bank: Banco De Oro
- Account Name: Shepherd's Voice Radio and Television Foundation Inc.
- Savings Account #16050612
- Send proof of payment to contact@svrtv.com

DONATION FEATURES:
- No minimum donation amount
- One-time and recurring donations supported (monthly, quarterly, annually)
- Anonymous donations available
- Donor profile and history at /profile
- Receipts emailed automatically; usable for BIR tax exemption

FOUNDATIONS WE SUPPORT:
1. Anawim - Home for abandoned elderly (lolos & lolas), Rizal
2. Jeremiah Foundation - Shelter for abused young girls, Pasig City
3. Grace to be Born - Maternity home for unwed mothers, Pasig City
4. Pag-Asa ng Pamilya - Scholarships for poor students
5. Shepherd's Voice (SVRTV) - Media evangelization
6. LOJ Prison Ministry - Spiritual care for women inmates
7. LOJ Pastoral Care - Counseling for depression; Tel: Mon–Sat 6am–5pm
8. He Cares Mission - Street children, Quezon City
9. Jesus Christ Cares For Cancer - Aid for indigent cancer patients, founded 2015

If unsure about something, say: "Please contact us at contact@svrtv.com or call (+63) 02 725-9999 — we're available Mon–Fri, 8:00 AM–6:00 PM."
`;

// ─────────────────────────────────────────────────────────────────────────────
// Safely initialize Gemini (won't crash the server if key is missing/invalid)
// ─────────────────────────────────────────────────────────────────────────────
let genAI = null;
try {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("✅ Chatbot: Gemini AI initialized successfully");
  } else {
    console.log("ℹ️  Chatbot: No Gemini API key — using FAQ fallback mode");
  }
} catch (e) {
  console.error("⚠️  Chatbot: Failed to initialize Gemini —", e.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chatbot/message
// ─────────────────────────────────────────────────────────────────────────────
router.post("/message", async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "Message is required." });
  }

  const userMessage = message.trim();

  // ── Try Gemini AI first ────────────────────────────────────────────────────
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_PROMPT,
      });

      const formattedHistory = history
        .filter(h => h.role && h.text)
        .map(h => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        }));

      const chat = model.startChat({
        history: formattedHistory,
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        },
      });

      const result = await chat.sendMessage(userMessage);
      const text = result.response.text();

      return res.json({ reply: text, source: "gemini" });

    } catch (err) {
      console.warn(`⚠️  Gemini unavailable (${err?.status || "error"}) — using FAQ fallback`);
    }
  }

  // ── FAQ Fallback (always works) ────────────────────────────────────────────
  const faqReply = findFAQMatch(userMessage);
  return res.json({ reply: faqReply, source: "faq" });
});

module.exports = router;
