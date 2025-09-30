"use client";
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { HamburgerMenuIcon, Cross2Icon, DashboardIcon, FileTextIcon, GearIcon, BarChartIcon, MoonIcon, SunIcon, RocketIcon, ImageIcon, PersonIcon, ActivityLogIcon } from '@radix-ui/react-icons';
import * as Dialog from '@radix-ui/react-dialog';
import { useTheme } from '../../../design-system/theme-provider';

interface NavItem { href:string; label:string; icon:React.ComponentType<any>; disabled?:boolean; badge?:string }
interface NavGroup { title:string; items:NavItem[] }

const NAV_GROUPS:NavGroup[] = [
  { title:'Geral', items:[
    { href:'/admin/dashboard', label:'Dashboard', icon:DashboardIcon },
    { href:'/admin/analytics', label:'Analytics', icon:BarChartIcon },
  ]},
  { title:'Conteúdo', items:[
    { href:'/admin/content', label:'Conteúdo', icon:FileTextIcon },
    { href:'/admin/content/editor', label:'Editor', icon:FileTextIcon },
    { href:'/admin/content/calendar', label:'Calendário', icon:FileTextIcon, badge:'novo' },
    { href:'/admin/media', label:'Mídia', icon:ImageIcon },
    { href:'/admin/seo', label:'SEO Hub', icon:GearIcon },
    { href:'/admin/experiments', label:'Experimentos', icon:BarChartIcon, badge:'beta' },
  ]},
  { title:'Operações', items:[
    // Rotas ainda não implementadas marcadas como desabilitadas
    { href:'/admin/users', label:'Usuários', icon:PersonIcon, disabled:true },
    { href:'/admin/audit-log', label:'Audit Log', icon:ActivityLogIcon, disabled:true },
    { href:'/admin/system/health', label:'Saúde', icon:GearIcon },
    { href:'/admin/settings', label:'Config', icon:GearIcon },
  ]},
  { title:'Domínios', items:[
    { href:'/admin/blog', label:'Blog', icon:FileTextIcon },
    { href:'/admin/puppies', label:'Filhotes', icon:RocketIcon },
  ]},
];

export function Sidebar(){
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [open,setOpen] = React.useState(false);
  const prefersReducedMotion = React.useMemo(()=> typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  function NavList({ className='', onNavigate }:{className?:string; onNavigate?:()=>void}){
    return (
      <nav aria-label="Principal" className={className + ' flex flex-col gap-3'}>
        {NAV_GROUPS.map(group=> (
          <div key={group.title}>
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{group.title}</div>
            <div className="flex flex-col gap-1">
              {group.items.map(item=>{
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} aria-current={active? 'page':undefined} aria-disabled={item.disabled||undefined} onClick={()=>{ onNavigate?.(); }}
                    className={`group relative inline-flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition ${item.disabled? 'opacity-40 cursor-not-allowed':''} ${active? 'bg-[var(--surface-2)] text-[var(--text)] shadow-sm':'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'}`}>
                      {/* Indicador ativo à esquerda */}
                      <span aria-hidden className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full ${active? 'bg-[var(--accent)]':'bg-transparent'} transition-colors`} />
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                      {item.badge && <span className="ml-auto inline-flex items-center rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        <button onClick={toggle} className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]" aria-label="Alternar tema">
          {theme==='light'? <MoonIcon className="h-4 w-4" />:<SunIcon className="h-4 w-4" />}<span>{theme==='light'? 'Escuro':'Claro'}</span>
        </button>
      </nav>
    );
  }

  // Keyboard shortcuts: Alt+M or Ctrl+Shift+M to toggle menu (desktop), Esc handled by Radix.
  React.useEffect(()=>{
    function onKey(e:KeyboardEvent){
      if((e.altKey && e.key.toLowerCase()==='m') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='m')){
        e.preventDefault(); setOpen(o=> !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  },[]);

  return (
    <>
      {/* Mobile trigger */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]" aria-label="Abrir menu" aria-expanded={open} aria-controls="dash-sidebar-mobile">
            <HamburgerMenuIcon />
          </button>
        </Dialog.Trigger>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:prefersReducedMotion?0:0.18}} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.aside id="dash-sidebar-mobile" initial={{x:-280,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-280,opacity:0}} transition={{type:'tween', duration:prefersReducedMotion?0:0.22}} className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-[var(--border)] bg-[var(--surface)] px-4 pb-6 pt-5 shadow-xl" aria-label="Barra lateral móvel">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold tracking-tight">Navegação</h2>
                    <Dialog.Close asChild>
                      <button aria-label="Fechar" className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"><Cross2Icon /></button>
                    </Dialog.Close>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1">
                    <NavList onNavigate={()=> setOpen(false)} />
                  </div>
                  <p className="mt-4 text-[10px] text-[var(--text-muted)]">Atalho: Alt+M</p>
                </motion.aside>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 lg:border-r lg:border-[var(--border)] lg:bg-[var(--surface)] lg:px-4 lg:py-6 relative" role="complementary" aria-label="Barra lateral">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/5 to-transparent dark:from-white/5" aria-hidden />
        <NavList />
        <div className="mt-6">
          <h3 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Ações rápidas</h3>
          <div className="mt-2 flex flex-col gap-2">
            <Link href="/admin/blog/editor" className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Novo Post</Link>
            <Link href="/admin/puppies" className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Gerenciar Filhotes</Link>
            <Link href="/admin/blog/schedule" className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Agenda de Posts</Link>
            <Link href="/admin/analytics" className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Ver Analytics</Link>
          </div>
        </div>
        <div className="mt-auto pt-6 text-[10px] text-[var(--text-muted)]">© {new Date().getFullYear()}</div>
      </aside>
    </>
  );
}

