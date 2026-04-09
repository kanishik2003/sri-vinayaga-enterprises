const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("❌ No API key found in backend/.env");
        return;
    }
    console.log(`Using key: ${key.substring(0, 6)}...${key.substring(key.length - 4)}`);
    
    try {
        const genAI = new GoogleGenerativeAI(key);
        
        // Try gemini-2.0-flash (from ListModels)
        const modelName = "gemini-2.0-flash"; 
        console.log(`Testing with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent("Say hello!");
        console.log("✅ Success! Response:", result.response.text());
    } catch (error) {
        console.error("❌ Gemini Test Failed!");
        console.error("Status:", error.status);
        console.error("Message:", error.message);
        if (error.response) {
            console.error("Response data:", JSON.stringify(error.response, null, 2));
        }
    }
}

testGemini();
