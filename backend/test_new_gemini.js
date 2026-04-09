const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testKey(key) {
  console.log(`Testing Gemini Key: ...${key.slice(-4)}`);
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent("hi");
    console.log(`✅ Success for ...${key.slice(-4)}! Reply:`, result.response.text());
    return true;
  } catch (error) {
    console.log(`❌ Failed for ...${key.slice(-4)}:`, error.message);
    return false;
  }
}

async function run() {
  await testKey('AIzaSyDL_QboAqCw0sdyGAJ08GSkPPS4ZDzyWFI');
  await testKey('AIzaSyDL_QboAqCw0sdyGAJ08GSkPPS4ZDzyWFl');
}

run();
