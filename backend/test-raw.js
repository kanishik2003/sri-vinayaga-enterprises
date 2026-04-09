const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testRawGemini() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=${key}`;
    
    console.log("Testing raw fetch...");
    
    const data = JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
    });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(url, options, (res) => {
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

    req.write(data);
    req.end();
}

testRawGemini();
