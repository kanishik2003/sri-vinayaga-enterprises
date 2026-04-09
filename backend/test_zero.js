const { GoogleGenerativeAI } = require('@google/generative-ai');
const keys = [
    'AIzaSyDL_Qb0AqCw0sdyGAJ08GSkPPS4ZDzyWFI', // Zero
    'AIzaSyDL_Qb0AqCw0sdyGAJ08GSkPPS4ZDzyWFl'  // Zero + l
];
async function check() {
  for (const key of keys) {
    console.log(`Testing: ...${key.slice(-4)} with Zero`);
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent("hi");
      console.log('✅ SUCCESS for', key);
    } catch (e) {
      console.log('❌ FAIL:', e.message);
    }
  }
}
check();
