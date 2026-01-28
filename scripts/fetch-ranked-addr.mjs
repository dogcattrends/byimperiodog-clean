import process from 'process';
const url = process.argv[2] || 'http://127.0.0.1:49386/api/catalog/ranked';

(async ()=>{
 try{
 const r = await fetch(url);
 console.log('STATUS', r.status);
 const t = await r.text();
 try{ console.log(JSON.stringify(JSON.parse(t), null, 2)); } catch(e){ console.log(t); }
 }catch(e){ console.error('ERROR', e.message); process.exit(1); }
})();
