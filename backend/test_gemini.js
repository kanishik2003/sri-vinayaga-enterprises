const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  const keys = [
    'AIzaSyAj7OeJgHo3EDkgaqH1qd9pueF9YTVGkRc',
    'AIzaSyDyXdCh4XzKx55kT3F6WGNI7_2m8jnrhJc'
  ];

  for (const key of keys) {
    if (!key) continue;
    console.log(`Testing Gemini Key: ${key.substring(0, 8)}...`);
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent("hi");
      const text = result.response.text();
      console.log('✅ Success! Reply:', text);
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }
  }
}

testGemini();
