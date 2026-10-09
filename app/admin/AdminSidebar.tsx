'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthProvider';

const ADMIN_NAV = [
  {
    group: 'Operations',
    items: [
      { label: 'Dashboard',       href: '/admin/dashboard',   icon: 'dashboard',          desc: 'Tenant overview' },
      { label: 'Users & Access',  href: '/admin/users',       icon: 'group',              desc: 'Manage end users' },
      { label: 'Knowledge Base',  href: '/admin/documents',   icon: 'library_books',      desc: 'PDF policies & RAG' },
      { label: 'Agent Settings',  href: '/admin/settings',    icon: 'settings',           desc: 'Configure Database Agent' },
      { label: 'API Keys',        href: '/admin/api-keys',    icon: 'key',                desc: 'System integrations' },
    ],
  },
  {
    group: 'Observability',
    items: [
      { label: 'Escalations',     href: '/admin/escalations', icon: 'warning',            desc: 'Human review queue' },
      { label: 'Analytics',       href: '/admin/analytics',   icon: 'monitoring',         desc: 'Usage & costs' },
      { label: 'Agent Activity',  href: '/admin/agents',      icon: 'robot_2',            desc: 'Agent usage & logs' },
      { label: 'Export Reports',  href: '/admin/reports',     icon: 'download',           desc: 'Download CSV/PDF' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user?.name || 'Business Admin';
  const displayEmail = user?.email || 'admin@company.com';
  const displayInitial = displayName.charAt(0).toUpperCase();

  async function handleSignOut() {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  if (pathname === '/admin/login') {
    return null;
  }

  return (
    <aside
      className={`relative flex flex-col bg-surface-container-lowest border-r border-outline-variant/30 transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{ minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-outline-variant/20 h-16 shrink-0 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[16px]">domain</span>
            </div>
            <span className="font-headline-sm text-[14px] font-bold text-on-surface tracking-tight">
              Tenant Admin
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {ADMIN_NAV.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <p className="px-2 mb-2 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                {group.group}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <span className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${active ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <div className="min-w-0">
                          <span className={`block font-label-ui text-[13px] font-medium leading-tight ${active ? 'text-primary font-semibold' : ''}`}>
                            {item.label}
                          </span>
                          <span className="block font-body-sm text-[11px] text-on-surface-variant/70 truncate leading-tight mt-0.5">
                            {item.desc}
                          </span>
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / Sign Out */}
      <div className={`border-t border-outline-variant/20 p-4 shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-error hover:bg-error-container/40 transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-sm">{displayInitial}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-label-ui text-[12px] font-semibold text-on-surface truncate">{displayName}</p>
                <p className="font-body-sm text-[10px] text-on-surface-variant truncate">{displayEmail}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-all shrink-0"
            >
              {signingOut ? (
                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[16px]">logout</span>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
