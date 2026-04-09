const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function listNames() {
    const key = process.env.GEMINI_API_KEY;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        const names = data.models.map(m => m.name);
        fs.writeFileSync('model_names.json', JSON.stringify(names, null, 2));
        console.log("Done");
    } catch (err) {
        console.error("List failed:", err.message);
    }
}

listNames();
