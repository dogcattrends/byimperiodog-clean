const fs = require('fs');
const path = require('path');

function walk(dir) {
 const entries = fs.readdirSync(dir, { withFileTypes: true });
 for (const entry of entries) {
 const full = path.join(dir, entry.name);
 if (entry.isDirectory()) {
 if (entry.name === 'node_modules' || entry.name === '.git') continue;
 walk(full);
 } else {
 // process many common source file types
 if (/\.(ts|tsx|js|jsx|json|md|html|css)$/.test(entry.name)) convert(full);
 }
 }
}

function convert(file) {
 const buf = fs.readFileSync(file);
 // Heuristic: presence of null bytes near start suggests UTF-16LE
 const hasNulls = buf.slice(0, 60).includes(0);
 if (!hasNulls) return;
 try {
 const text = buf.toString('utf16le');
 fs.writeFileSync(file, text, { encoding: 'utf8' });
 console.log('Converted', file);
 } catch (err) {
 console.error('Failed to convert', file, err.message);
 }
}

const base = path.join(__dirname, '..', 'tests');
if (!fs.existsSync(base)) {
 console.error('tests directory not found:', base);
 process.exit(1);
}
walk(base);
