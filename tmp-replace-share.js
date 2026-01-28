const fs = require('fs');
const path = 'src/components/PuppyCard.tsx';
const text = fs.readFileSync(path, 'utf8');
const start = text.indexOf(' <button\r\n type= button\r\n onClick={(event) => {');
if (start === -1) throw new Error('start not found');
const end = text.indexOf('</button>', start) + '</button>'.length;
const newBlock = String.raw
 <div class=absolute right-4 top-4 z-10 flex items-center gap-2>
 <button
 type=button
 onClick={(event) => {
 event.stopPropagation();
 event.preventDefault();
 handleShareClick(event);
 }}
 aria-label={
 Compartilhar o filhote 
 }
 className=flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-lg transition duration-200 hover:border-emerald-300 hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
 >
 <Share2 className=h-5 w-5 aria-hidden />
 </button>
 <button
 type=button
 onClick={(event) => {
 event.stopPropagation();
 const nextLiked = !liked;
 setLiked(nextLiked);
 setIsPopping(true);
 if (likeAnimationTimeout.current) clearTimeout(likeAnimationTimeout.current);
 likeAnimationTimeout.current = setTimeout(() => setIsPopping(false), 250);
 track.event?.(puppy_like_toggle, { puppy_id: p.id, liked: nextLiked, placement: grid });
 }}
 aria-label={liked ? Remover dos favoritos : Adicionar aos favoritos}
 aria-pressed={liked}
 className={lex h-11 w-11 items-center justify-center rounded-full bg-white text-rose-500 shadow-lg ring-1 ring-black/5 transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-emerald-500 }
 >
 <Heart className={h-5 w-5 } aria-hidden=true />
 </button>
 </div>
;
fs.writeFileSync(path, text.slice(0, start) + newBlock + text.slice(end), 'utf8');
