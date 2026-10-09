'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Problem',      href: '/#problem',    exact: false },
  { label: 'Personas',     href: '/#personas',   exact: false },
  { label: 'Architecture', href: '/architecture', exact: true  },
  { label: 'Pillars',      href: '/#pillars',    exact: false },
  { label: 'Tech Stack',   href: '/#tech-stack', exact: false },
  { label: 'Demo',         href: '/demo',         exact: true  },
  { label: 'Pricing',      href: '/pricing',      exact: true  },
];

export default function NavHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll for shadow enhancement
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // (Removed problematic pathname useEffect, closing handled by onClick on mobile links)

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    // For anchor links on home page
    return pathname === '/' && href.startsWith('/#');
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_2px_16px_rgba(15,23,42,0.08)]' : 'shadow-[0_1px_8px_rgba(15,23,42,0.04)]'
        }`}
      >
        <div className="h-16 w-full px-margin-sm md:px-margin flex items-center justify-between gap-gutter">

          {/* Logo */}
          <div className="flex items-center gap-space-md shrink-0">
            <Link href="/" className="flex items-center gap-space-sm group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                <span className="material-symbols-outlined text-[18px]">hub</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight group-hover:text-primary transition-colors">
                AgentForge
              </span>
            </Link>
            <div className="hidden xl:flex items-center gap-space-xs py-space-xs px-space-sm rounded-full bg-surface-container border border-outline-variant/40">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              <span className="font-label-caps text-label-caps text-on-surface-variant font-medium">BOC 2.0 SCENARIO 5</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-label-ui text-label-ui px-space-sm py-space-xs rounded-lg transition-all duration-150 ${
                  isActive(link.href, link.exact)
                    ? 'bg-surface-container text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-space-sm shrink-0">
            <Link
              href="/docs"
              className={`hidden sm:inline-flex items-center font-label-ui text-label-ui px-space-sm py-2 rounded-lg transition-all duration-150 ${
                pathname === '/docs'
                  ? 'text-primary font-semibold bg-surface-container'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Explore Docs
            </Link>
            <a
              className="hidden md:inline-flex items-center px-3 py-1.5 rounded-lg border border-outline-variant/50 bg-surface-container-lowest font-label-ui text-label-ui text-on-surface hover:bg-surface-container-low transition-all"
              href="https://github.com"
              rel="noreferrer"
              target="_blank"
            >
              View on GitHub
            </a>
            <Link
              href="/login"
              className={`inline-flex items-center px-3.5 py-1.5 rounded-lg font-label-ui text-label-ui font-medium shadow-sm transition-all ${
                pathname === '/login'
                  ? 'bg-primary text-on-primary shadow-primary/30'
                  : 'bg-gradient-to-r from-primary to-secondary text-on-primary hover:opacity-95 hover:shadow-primary/25'
              }`}
            >
              Login
            </Link>

            {/* Mobile Hamburger */}
            <button
              aria-label="Toggle mobile menu"
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-outline-variant/30 bg-surface/95 backdrop-blur-xl px-margin-sm py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`font-label-ui text-label-ui px-4 py-2.5 rounded-xl transition-all ${
                  isActive(link.href, link.exact)
                    ? 'bg-surface-container text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-outline-variant/20 mt-2 pt-2 flex flex-col gap-1">
              <Link
                href="/docs"
                onClick={() => setMobileOpen(false)}
                className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface px-4 py-2.5 rounded-xl hover:bg-surface-container-low transition-all"
              >
                Explore Docs
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-on-primary font-label-ui text-label-ui font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                Login
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
