const { GoogleGenerativeAI } = require('@google/generative-ai');

const keys = [
    'AIzaSyCzuGB9fSTHPIIr9_HrYIJy8jtDua1QJ-sY381cqPII',
    'AIzaSyAj7OeJgHo3EDkgaqH1qd9pueF9YTVGkRc',
    'AIzaSyDyXdCh4XzKx55kT3F6WGNI7_2m8jnrhJc'
];

const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro-latest', 'gemini-flash-latest'];

async function testKeys() {
    for (const key of keys) {
        console.log(`\n--- Testing Key: ${key.substring(0, 10)}... ---`);
        const genAI = new GoogleGenerativeAI(key);
        
        for (const modelName of models) {
            process.stdout.write(`  Model: ${modelName} `);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("hi");
                console.log("✅ Working!");
                return; // Found a working combo! 
            } catch (err) {
                console.log(`❌ Failed: ${err.message.substring(0, 50)}...`);
            }
        }
    }
}

testKeys();
