(async ()=>{
  try {
    const res = await fetch('http://localhost:3000/api/admin/puppies/manage');
    console.log('status', res.status);
    const text = await res.text();
    console.log(text.slice(0,800));
  } catch (e) {
    console.error('error', e);
    process.exit(1);
  }
})();
