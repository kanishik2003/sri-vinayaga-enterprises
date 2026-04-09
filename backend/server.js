const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// ─── SendGrid ────────────────────────────────────────────────────────────────
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_VERIFIED_SENDER = process.env.SENDGRID_VERIFIED_SENDER || '';
try {
    if (SENDGRID_API_KEY) {
        sgMail.setApiKey(SENDGRID_API_KEY);
        console.log("✅ SendGrid initialized");
    } else {
        console.warn("⚠️  SendGrid API key missing");
    }
} catch (e) {
    console.error("❌ SendGrid init failed:", e.message);
}

// ─── Gemini AI ───────────────────────────────────────────────────────────────
let genAI;
try {
    if (process.env.GEMINI_API_KEY) {
        const key = process.env.GEMINI_API_KEY;
        console.log(`✅ Gemini Key: ${key.substring(0, 6)}...${key.substring(key.length - 4)}`);
        genAI = new GoogleGenerativeAI(key);
        console.log("✅ Gemini AI initialized");
    } else {
        console.error("❌ Gemini API key missing!");
    }
} catch (e) {
    console.error("❌ Gemini AI init failed:", e.message);
}

// ─── OTP Storage (in-memory) ─────────────────────────────────────────────────
const otpStorage = {};

// ─── GEMINI CHAT ENDPOINT ────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    const { message, history, systemPrompt } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
        if (!genAI) throw new Error("Gemini AI not initialized. Check API key.");

        // Initializing the latest stable model
        const model = genAI.getGenerativeModel({
            model: 'gemini-flash-latest',
            systemInstruction: systemPrompt || 'You are the official AI expert for SRI VINAYAGA ENTERPRISES. Answer accurately about granite products.'
        });

        const chat = model.startChat({
            history: (history || [])
        });
        const result = await chat.sendMessage(message);
        const text = result.response.text();

        res.status(200).json({ reply: text });
    } catch (error) {
        console.error('Gemini FULL error:', error);

        const lowerMsg = (message || '').toLowerCase();
        if (lowerMsg.includes('price') || lowerMsg.includes('product') || lowerMsg.includes('available')) {
            return res.status(200).json({
                reply: "I'm having a brief technical connection issue with my AI brain. Please check our 'Products' section for the latest stone library and pricing, or contact us directly at appavum73@gmail.com for an immediate quote!"
            });
        }

        const errMsg = error.message || 'Gemini API error';
        res.status(500).json({ error: errMsg });
    }
});

// ─── OTP: SEND ───────────────────────────────────────────────────────────────
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStorage[email] = { otp, expiresAt, attempts: 0 };

    const msg = {
        to: email,
        from: SENDGRID_VERIFIED_SENDER,
        subject: 'Granite AI - Your Signup Code',
        text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
        html: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
    };

    try {
        await sgMail.send(msg);
        res.status(200).json({ message: 'OTP sent successfully!' });
    } catch (error) {
        console.error('SendGrid Error:', error.response ? error.response.body : error);
        res.status(500).json({ error: 'Failed to send OTP email.' });
    }
});

// ─── OTP: VERIFY ─────────────────────────────────────────────────────────────
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const record = otpStorage[email];
    if (!record) return res.status(400).json({ error: 'No OTP requested for this email.' });
    if (Date.now() > record.expiresAt) {
        delete otpStorage[email];
        return res.status(400).json({ error: 'OTP has expired.' });
    }
    if (record.attempts >= 3) {
        delete otpStorage[email];
        return res.status(400).json({ error: 'Too many incorrect attempts.' });
    }
    if (record.otp === otp) {
        delete otpStorage[email];
        return res.status(200).json({ message: 'OTP verified successfully' });
    } else {
        record.attempts += 1;
        return res.status(400).json({ error: 'Invalid OTP' });
    }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
    console.log(`✅ Gemini API ready`);
});
