async function testChat() {
  try {
    console.log('Testing ChatBot endpoint...');
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, what are your best-selling granite?',
        history: [],
        systemPrompt: 'You are a helpful assistant for SRI VINAYAGA ENTERPRISES.'
      })
    });
    const data = await response.json();
    console.log('📦 Data received:', data);
    console.log('✅ Response content:', data.reply);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testChat();
