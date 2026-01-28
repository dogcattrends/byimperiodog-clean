const url = process.env.URL || 'http://localhost:3000/';

(async () => {
 try {
 const res = await fetch(url);
 console.log('Status', res.status);
 const text = await res.text();
 console.log('Length', text.length);
 } catch (e) {
 console.error('Fetch error', e.message);
 }
})();
