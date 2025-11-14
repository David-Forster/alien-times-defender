const fs = require('fs');
const path = require('path');

function findTSFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            findTSFiles(fullPath, files);
        } else if (item.endsWith('.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}

const tsFiles = findTSFiles('../');
let output = '';

for (const file of tsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative('.', file);
    const stats = fs.statSync(file);
    output += `=== FILE: ${relativePath} ===\n`;
    output += `Size: ${stats.size} bytes\n`;
    output += `Last Modified: ${stats.mtime.toISOString()}\n`;
    output += `--- CONTENT ---\n`;
    output += content + '\n\n';
}

fs.writeFileSync('collated-code.txt', output);
console.log('Collated code written to collated-code.txt');