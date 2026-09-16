'use client';

import { useModals } from './ModalContext';
import { Plus, CheckSquare, FileCode2, FolderGit2, Search, Bell, Sparkles } from 'lucide-react';

export function Header() {
  const { openModal } = useModals();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search / Command bar */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search open items, ADRs, deliverables..."
            className="w-full bg-slate-950/80 border border-slate-700/60 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Action Buttons & Integration Indicators */}
      <div className="flex items-center gap-3">
        {/* Quick Action Menus */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal('new-item')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>+ Open Item</span>
          </button>

          <button
            onClick={() => openModal('new-adr')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all cursor-pointer"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>+ ADR</span>
          </button>

          <button
            onClick={() => openModal('link-drive')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>+ Drive Doc</span>
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Integration pills */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Drive Hub
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Slack Sync
          </span>
        </div>

        {/* User profile avatar */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold border border-slate-700 shadow-sm">
            TM
          </div>
        </div>
      </div>
    </header>
  );
}
