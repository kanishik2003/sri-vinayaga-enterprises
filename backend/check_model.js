const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkModel() {
    const key = process.env.GEMINI_API_KEY;
    console.log("Key:", key.substring(0, 10) + "...");
    try {
        const genAI = new GoogleGenerativeAI(key);
        const models = await genAI.listModels();
        // console.log("Available models:", models.map(m => m.name));
        const has15Flash = models.find(m => m.name.includes('gemini-1.5-flash'));
        console.log("Has gemini-1.5-flash?", !!has15Flash);
        if (has15Flash) console.log("Full name:", has15Flash.name);
    } catch (err) {
        console.error("List failed:", err.message);
    }
}

checkModel();
