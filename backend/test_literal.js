async function testLiteral() {
  const key = 'AIzaSyDyXdCh4XzKx55kT3F6WGNI7_2m8jnrhJc';
  console.log(`Using literal key: ${key.substring(0, 6)}...${key.substring(key.length-4)}`);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const payload = { contents: [{ parts: [{ text: "hi" }] }] };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Literal Response:', JSON.stringify(data));
  } catch (err) {
    console.error('LITERAL CATCH:', err.message);
  }
}

testLiteral();
