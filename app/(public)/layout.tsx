import Link from 'next/link';
import NavHeader from '../components/NavHeader';
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><NavHeader /><main className="flex-1 flex flex-col pt-16">{children}</main><footer className="bg-surface-container-lowest border-t border-outline-variant/30 text-on-surface-variant"><div className="max-w-7xl mx-auto px-6 md:px-12 py-7 flex flex-wrap items-center justify-between gap-4"><Link href="/" className="font-semibold text-on-surface">AgentForge</Link><nav aria-label="Footer navigation" className="flex flex-wrap gap-5 text-sm"><Link href="/docs">Integration guide</Link><Link href="/security">Data & privacy</Link><Link href="/admin/login">Company admin</Link></nav><p className="text-xs">Hackathon prototype · Fictional company data</p></div></footer></>;
}
