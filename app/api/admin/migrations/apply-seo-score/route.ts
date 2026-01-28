import { NextResponse } from 'next/server';

// Endpoint ad-hoc para aplicar migration de seo_score se ainda não existir.
// Segurança: ideal proteger via auth admin; assumimos já estar sob /api/admin/* protegido por middleware existente.
export async function POST(){
 try {
 return NextResponse.json({ ok:true, skipped:true, reason:'migração desnecessária: Sanity é a fonte editorial canônica' });
 } catch(e:any){
 return NextResponse.json({ ok:false, error:e?.message||'erro' }, { status:500 });
 }
}
