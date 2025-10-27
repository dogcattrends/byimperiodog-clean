// import { randomUUID } from 'crypto';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { z } from 'zod';

import { requireAdmin } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/limiter';
import { safeAction } from '@/lib/safeAction';
import { supabaseAdmin, hasServiceRoleKey } from '@/lib/supabaseAdmin';
import { 
  ALLOWED_IMAGE_MIME, 
  ALLOWED_VIDEO_MIME,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  inferExtFromMime, 
  sanitizeFilename 
} from '@/lib/uploadValidation';

// Upload simples (base64 ou multipart futura). Por hora aceita JSON { filename, dataBase64 }
const bodySchema = z.object({
  dataBase64: z.string().min(1, 'dataBase64 requerido'),
  filename: z.string().min(1).optional(),
  upsert: z.boolean().optional(),
});

const execute = safeAction({
  schema: bodySchema,
  handler: async (body, { req }) => {
    const urlObj = new URL(req.url);
    const wantUpsert = urlObj.searchParams.get('upsert') === '1' || body.upsert === true;
    const b64 = body.dataBase64;
    const match = /^data:(.*?);base64,(.*)$/.exec(b64) || [null, null, b64];
    const mime = match[1] || 'image/png';
    const buf = Buffer.from(match[2]!, 'base64');
    
    // Determinar se é imagem ou vídeo
    const isVideo = ALLOWED_VIDEO_MIME.has(mime);
    const isImage = ALLOWED_IMAGE_MIME.has(mime);
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    
    // Basic security validation
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'mime-nao-suportado', supported: 'images (jpg,png,webp,avif,gif) e videos (mp4,webm,mov)' }, { status: 415 });
    }
    if (buf.byteLength <= 0 || buf.byteLength > maxBytes) {
      return NextResponse.json({ error: 'arquivo-muito-grande', maxBytes, tipo: isVideo ? 'video' : 'imagem' }, { status: 413 });
    }
    const ext = inferExtFromMime(mime);
    const originalBase = sanitizeFilename(body.filename || 'upload');
    const original = originalBase.includes('.') ? originalBase : `${originalBase}.${ext}`;
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
    
    // Preparar thumbnail apenas para imagens (não para vídeos)
    let thumbBuf: Buffer | null = null;
    const thumbName = fileName.replace(/\.[^.]+$/, '') + '-thumb.webp';
    const thumbPath = `${folder}/thumbs/${thumbName}`;
    
    if (isImage && !mime.includes('gif')) {
      // Gerar thumbnail apenas para imagens estáticas (não GIF animado)
      try {
        thumbBuf = await sharp(buf).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
      } catch(err){
        // se falhar, ignora thumbnail
        thumbBuf = null;
      }
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
  },
});

export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  // Limit uploads to prevent abuse: 6/min per IP
  try { await rateLimit(req as unknown as Request, { identifier: 'admin-puppies-upload', limit: 6, windowMs: 60_000 }); } catch {
    return NextResponse.json({ error:'rate-limit' },{ status:429 });
  }
  return execute(req as unknown as Request);
}
