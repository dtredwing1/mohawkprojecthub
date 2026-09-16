'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  CheckSquare,
  FileCode2,
  FolderGit2,
  Bot,
  Settings,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Strategy & Brand', href: '/strategy', icon: Compass },
  { name: 'Open Items', href: '/open-items', icon: CheckSquare, badge: 'Active' },
  { name: 'Architecture ADRs', href: '/decisions', icon: FileCode2 },
  { name: 'Deliverables & Drive', href: '/deliverables', icon: FolderGit2 },
  { name: 'AI Activity & Slack', href: '/activity', icon: Bot },
  { name: 'Settings & Integrations', href: '/settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none min-h-screen">
      {/* Brand & Team Header */}
      <div>
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
              ⚡
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm tracking-tight flex items-center gap-1.5">
                Project Hub
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  v1.0
                </span>
              </h1>
              <p className="text-slate-400 text-xs truncate max-w-[120px]">
                Small Team Cockpit
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspaces
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Status Beacon */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-300">Agent API Active</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            REST API & Slack webhooks listening for agent deliverables.
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>GCP Free Tier</span>
          <span className="text-emerald-400 font-mono text-[11px]">Cloud Run Ready</span>
        </div>
      </div>
    </aside>
  );
}
