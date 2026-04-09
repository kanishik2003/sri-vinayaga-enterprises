const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    
    console.log("Listing models via raw fetch...");
    
    const req = https.get(url, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
            console.log("Status Code:", res.statusCode);
            console.log("Response Body:", responseBody);
        });
    });

    req.on('error', (error) => {
        console.error("Request Error:", error.message);
    });
}

listModels();
