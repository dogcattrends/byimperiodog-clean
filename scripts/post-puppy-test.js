import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

async function main(){
  const url = 'http://localhost:3000/api/admin/puppies/manage';
  const form = new FormData();
  form.append('name', 'Teste Automacao Node');
  form.append('priceCents', '150000');
  form.append('description', 'Criado via teste automatizado (node)');
  const imgPath = path.resolve(process.cwd(), 'public', '1.png');
  form.append('photos', fs.createReadStream(imgPath), { filename: '1.png' });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Cookie': 'admin_auth=1; adm=true',
      // form.getHeaders will include correct content-type
      ...form.getHeaders(),
    },
    body: form,
  });
  const text = await res.text();
  console.log('status', res.status);
  console.log(text);
}

main().catch(err=>{ console.error(err); process.exit(1); });
