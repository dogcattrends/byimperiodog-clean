import { readFileSync } from 'node:fs';
const file = process.argv[2];
if(!file){ console.error('Usage: node debug-content-guard.mjs <file>'); process.exit(2); }
const raw = readFileSync(file,'utf8');
const BREED_PATTERN = /spitz\s+alem[ãa]o(?:\s+an[ãa]o)?/gi;
function normalize(text){ return text.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase(); }
let i=0; for(const match of raw.matchAll(BREED_PATTERN)){
  i++;
  const index = match.index||0;
  const context = raw.slice(Math.max(0,index-140), index+match[0].length+140);
  const contextNormalized = normalize(context);
  const hasLulu = /lulu\s+da\s+pomerania/i.test(contextNormalized);
  console.log(`\n-- match #${i} --`);
  console.log('matchText:', match[0]);
  console.log('index:', index);
  console.log('hasLuluInContext:', hasLulu);
  console.log('contextExcerpt:');
  console.log(context.slice(0,300).replace(/\n/g,'\\n'));
}
if(i===0) console.log('no matches');
