const axios = require('axios');
require('dotenv').config();

async function testREST() {
  const key = process.env.GEMINI_API_KEY;
  console.log(`Using key: ${key.substring(0, 6)}...${key.substring(key.length-4)}`);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const payload = {
      contents: [{ parts: [{ text: "hi" }] }]
    };
    const res = await axios.post(url, payload);
    console.log('REST Response SUCCESS');
  } catch (err) {
    console.error('REST Error:', err.response ? JSON.stringify(err.response.data) : err.message);
  }
}

testREST();
