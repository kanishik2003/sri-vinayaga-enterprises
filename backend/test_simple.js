const { GoogleGenerativeAI } = require('@google/generative-ai');
const key = 'AIzaSyDL_QboAqCw0sdyGAJ08GSkPPS4ZDzyWFI';
const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
model.generateContent("hi").then(r => console.log('OK')).catch(e => console.log('FAIL:', e.message));
