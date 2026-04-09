const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'list-output.txt');
const content = fs.readFileSync(filePath, 'utf16le'); // PowerShell output is often utf16le
try {
    const json = JSON.parse(content.substring(content.indexOf('{')));
    const models = json.models.map(m => m.name);
    console.log("Found models:", JSON.stringify(models, null, 2));
} catch (e) {
    console.log("Content start:", content.substring(0, 500));
    console.error("JSON Parse failed:", e.message);
}
