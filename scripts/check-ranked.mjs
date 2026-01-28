import http from 'http';

const url = process.env.URL || 'http://localhost:3000/api/catalog/ranked';

http.get(url, (res) => {
 console.log('Status', res.statusCode);
 let body = '';
 res.on('data', (c) => (body += c));
 res.on('end', () => {
 try {
 console.log('Body:', JSON.stringify(JSON.parse(body), null, 2));
 } catch (e) {
 console.log('Raw body:', body);
 }
 });
}).on('error', (e) => {
 console.error('Request error', e.message);
});
