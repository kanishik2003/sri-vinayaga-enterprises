async function testFetch() {
  require('dotenv').config();
  const key = process.env.GEMINI_API_KEY;
  if (!key) { console.error('No key'); return; }
  console.log(`Using key: ${key.substring(0, 6)}...${key.substring(key.length-4)}`);
  try {
    // Try v1 and gemini-pro
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${key}`;
    const payload = { contents: [{ parts: [{ text: "hi" }] }] };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
        console.log('Fetch SUCCESS (gemini-pro)');
    } else {
        console.error('Fetch ERROR:', JSON.stringify(data));
    }
  } catch (err) {
    console.error('FETCH CATCH:', err.message);
  }
}

testFetch();
