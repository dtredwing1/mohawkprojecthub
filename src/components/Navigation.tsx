'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useProject } from './ProjectContext';
import { useModals } from './ModalContext';
import {
  LayoutDashboard,
  Compass,
  CheckSquare,
  FileCode2,
  FolderGit2,
  Bot,
  Settings,
  Sparkles,
  ChevronDown,
  FolderPlus,
  Check,
  Briefcase,
  Trash2,
  Star,
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
  const { data: session } = useSession();
  const { projects, activeProject, switchProject, deleteProject, setUserDefaultPreference } = useProject();
  const { openModal } = useModals();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = session?.user as any;
  const isAdmin = user?.role === 'admin';

  const handleDeleteProject = async (p: { id: string; name: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete workspace "${p.name}"?\n\nThis will permanently remove its open items, strategy canvas, and architecture decisions.`)) {
      const res = await deleteProject(p.id);
      if (!res.success) {
        alert(res.error || 'Failed to delete workspace');
      }
    }
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none min-h-screen">
      <div>
        {/* Project Switcher Selector */}
        <div className="p-3.5 border-b border-slate-800/80 relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0"
                style={{ backgroundColor: activeProject?.accentColor || '#0284c7' }}
              >
                {activeProject?.key || 'MHK'}
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold text-xs truncate">
                  {activeProject?.name || 'Project Workspace'}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span>Workspace</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono text-[9px] uppercase">
                    {activeProject?.status || 'active'}
                  </span>
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-transform shrink-0" />
          </button>

          {/* Project Switcher Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute left-3 right-3 top-16 z-50 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Switch Project
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {projects.map((p) => {
                  const isCurrent = p.id === activeProject?.id;
                  const isUserDefault = user?.defaultProjectId === p.id || (!user?.defaultProjectId && p.isDefault);
                  const canDelete = isAdmin && !p.isDefault && projects.length > 1;

                  return (
                    <div
                      key={p.id}
                      className={`w-full group/proj flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isCurrent
                          ? 'bg-sky-500/20 text-sky-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <button
                        onClick={() => {
                          switchProject(p.id);
                          setDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 truncate flex-1 text-left cursor-pointer mr-1"
                      >
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ backgroundColor: p.accentColor || '#0284c7' }}
                        >
                          {p.key}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Default Star Preference */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserDefaultPreference(p.id);
                          }}
                          className={`p-1 rounded transition-all cursor-pointer ${
                            isUserDefault
                              ? 'text-amber-400'
                              : 'text-slate-600 hover:text-amber-400 opacity-0 group-hover/proj:opacity-100'
                          }`}
                          title={isUserDefault ? 'Your default workspace' : 'Set as my default workspace'}
                        >
                          <Star className={`w-3 h-3 ${isUserDefault ? 'fill-amber-400' : ''}`} />
                        </button>

                        {isCurrent && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}

                        {canDelete && (
                          <button
                            onClick={(e) => handleDeleteProject(p, e)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover/proj:opacity-100 transition-all cursor-pointer"
                            title={`Delete "${p.name}" workspace`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isAdmin && (
                <div className="pt-1.5 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      openModal('new-project');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-sky-400 hover:bg-sky-500/10 font-medium transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Create New Project</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Project Views
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
            Multi-project routing enabled for agents & Slack.
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Active: {activeProject?.key || 'MHK'}</span>
          <span className="text-emerald-400 font-mono text-[11px]">Cloud Run</span>
        </div>
      </div>
    </aside>
  );
}
