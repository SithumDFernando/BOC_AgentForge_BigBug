import Link from 'next/link';
import NavHeader from '../components/NavHeader';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavHeader />
      <main className="flex-1 flex flex-col pt-16">
        {children}
      </main>
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 py-space-xl mt-auto">
        <div className="max-w-7xl mx-auto px-margin-sm md:px-margin flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[14px]">hub</span>
              </div>
              <Link href="/" className="font-headline-sm text-headline-sm text-on-surface font-semibold hover:text-primary transition-colors">AgentForge</Link>
              <span className="font-code-base text-code-base text-on-surface-variant ml-space-xs">v2.4.0-rc</span>
            </div>
            <div className="flex items-center gap-space-sm font-code-base text-code-base text-on-surface-variant bg-surface-container-low px-space-sm py-1 rounded-md border border-outline-variant/20">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
              <span>Hybrid Cloud Services: Operational</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-space-md border-t border-outline-variant/20 pt-space-lg">
            <div className="flex flex-wrap items-center gap-space-md font-body-sm text-body-sm text-on-surface-variant">
              <a className="hover:text-on-surface transition-colors" href="/docs">Platform Specs</a>
              <a className="hover:text-on-surface transition-colors" href="/architecture">Autonomic Topology</a>
              <a className="hover:text-on-surface transition-colors" href="/docs#telemetry">Telemetry API</a>
              <a className="hover:text-on-surface transition-colors" href="/security">Compliance &amp; Privacy</a>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Crafted for BOC 2.0 Challenge — Autonomous Agent Infrastructure.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
