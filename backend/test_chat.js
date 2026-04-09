const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');

async function testChat() {
    try {
        const response = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "price",
                history: [],
                systemPrompt: "You are an AI assistant."
            })
        });

        const data = await response.json();
        fs.writeFileSync('error_log.txt', JSON.stringify(data, null, 2));
    } catch (err) {
        fs.writeFileSync('error_log.txt', "Fetch Error: " + err.message);
    }
}

testChat();
