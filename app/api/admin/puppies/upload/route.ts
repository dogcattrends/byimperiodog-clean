import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin, hasServiceRoleKey } from '@/lib/supabaseAdmin';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

// Upload simples (base64 ou multipart futura). Por hora aceita JSON { filename, dataBase64 }
export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  try {
    const body = await req.json();
    const urlObj = new URL(req.url);
    const wantUpsert = urlObj.searchParams.get('upsert') === '1' || body.upsert === true;
    const b64:string|undefined = body.dataBase64;
    if(!b64) return NextResponse.json({ error:'dataBase64 requerido' },{ status:400 });
    const match = /^data:(.*?);base64,(.*)$/.exec(b64) || [null,null,b64];
    const mime = match[1]||'image/png';
  const buf = Buffer.from(match[2], 'base64');
    const ext = mime.split('/')[1]||'bin';
  const original = body.filename?.replace(/[^a-z0-9._-]/gi,'_') || `${randomUUID()}.${ext}`;
    let fileName: string;
    if(wantUpsert){
      // mantém nome original para overwrite explícito
      fileName = original.endsWith(`.${ext}`)? original : `${original}.${ext}`;
    } else {
      // nome único para evitar conflito
      const stamp = Date.now().toString(36);
      const rand = Math.random().toString(36).slice(2,8);
      const base = original.replace(/\.[^.]+$/,'');
      fileName = `${base}-${stamp}-${rand}.${ext}`;
    }
    const folder = new Date().toISOString().slice(0,10);
    const path = `${folder}/${fileName}`;
    // Preparar thumbnail (largura máxima 480 px) em WebP
    let thumbBuf: Buffer | null = null;
    let thumbName = fileName.replace(/\.[^.]+$/, '') + '-thumb.webp';
    const thumbPath = `${folder}/thumbs/${thumbName}`;
    try {
      thumbBuf = await sharp(buf).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
    } catch(err){
      // se falhar, ignora thumbnail
      thumbBuf = null;
    }
    if(!hasServiceRoleKey()){
      // modo offline: devolve a própria data URL (aceitável em dev)
      let thumbDataUrl = b64;
      if(thumbBuf){
        const b64thumb = `data:image/webp;base64,${thumbBuf.toString('base64')}`;
        thumbDataUrl = b64thumb;
      }
      return NextResponse.json({ ok:true, url: b64, thumb: thumbDataUrl, offline:true, upsert: wantUpsert });
    }
    const s = supabaseAdmin();
    // @ts-ignore bucket assumed existing
    const { error } = await s.storage.from('puppies').upload(path, buf, { contentType: mime, upsert: wantUpsert });
    if(error){
      const msg = (error.message||'').toLowerCase();
      if(msg.includes('supabase_offline_stub')){
        return NextResponse.json({ ok:true, url: b64, thumb: b64, offline:true, upsert: wantUpsert });
      }
      return NextResponse.json({ error: error.message },{ status:500 });
    }
    let thumbUrl: string | null = null;
    if(thumbBuf){
      // cria pasta thumbs/ se necessário (Supabase cria automaticamente ao upload do arquivo)
      const { error:thumbErr } = await s.storage.from('puppies').upload(thumbPath, thumbBuf, { contentType: 'image/webp', upsert: wantUpsert });
      if(!thumbErr){
        const { data:thumbPub } = s.storage.from('puppies').getPublicUrl(thumbPath);
        thumbUrl = thumbPub.publicUrl;
      }
    }
    const { data:pub } = s.storage.from('puppies').getPublicUrl(path);
    return NextResponse.json({ ok:true, url: pub.publicUrl, thumb: thumbUrl, upsert: wantUpsert });
  } catch(e:any){
    return NextResponse.json({ error: e?.message||'erro' },{ status:500 });
  }
}
