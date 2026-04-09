import fs from 'fs';
const lines = fs.readFileSync('src/components/Admin/AttendanceManager.jsx', 'utf8').split('\n');
let depth = 0;
let output = '';
for(let i = 397; i < 497; i++) {
    const l = lines[i];
    const opens = (l.match(/<div/g) || []).length + (l.match(/<motion\.div/g) || []).length;
    const closes = (l.match(/<\/div/g) || []).length + (l.match(/<\/motion\.div/g) || []).length;
    depth += opens;
    depth -= closes;
    output += `[${depth}] ${i+1}: ${l.trim()}\n`;
}
fs.writeFileSync('depth3.txt', output, 'utf8');
