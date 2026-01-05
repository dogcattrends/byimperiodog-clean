const url = 'http://127.0.0.1:3000/';

(async ()=>{
  for (let i=0;i<6;i++){
    try{
      const res = await fetch(url, {cache:'no-store'});
      console.log(new Date().toISOString(),'OK',res.status);
      const txt = await res.text();
      console.log('Length',txt.length);
      break;
    }catch(e){
      console.log(new Date().toISOString(),'ERR',e.message);
      await new Promise(r=>setTimeout(r,2000));
    }
  }
})();
