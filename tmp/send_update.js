(async function(){
 try{
 const res = await fetch('http://localhost:3000/api/admin/puppies/manage', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', 'x-admin-pass': process.env.ADMIN_PASS || process.env.NEXT_PUBLIC_ADMIN_PASS },
 body: JSON.stringify({ id: 'c315fbff-3a52-49b8-b2cd-5c6cc2f75746', name: 'TesteAtualizado', priceCents: 12345, status: 'disponivel' })
 });
 const text = await res.text();
 console.log('STATUS', res.status);
 console.log(text);
 }catch(e){
 console.error('ERR', e);
 process.exitCode = 2;
 }
})();
