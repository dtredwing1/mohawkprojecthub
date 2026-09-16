'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProject } from '@/components/ProjectContext';
import { OpenItem, ADR, Deliverable, ActivityEvent, StrategyDoc } from '@/lib/types';
import {
  CheckSquare,
  FileCode2,
  FolderGit2,
  Bot,
  ArrowRight,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  Compass,
  Loader2,
  Briefcase,
} from 'lucide-react';

export default function DashboardPage() {
  const { activeProject, activeProjectId } = useProject();
  const [items, setItems] = useState<OpenItem[]>([]);
  const [adrs, setAdrs] = useState<ADR[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [strategy, setStrategy] = useState<StrategyDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const pid = activeProjectId || 'proj-mohawk';
    Promise.all([
      fetch(`/api/items?projectId=${pid}`).then(r => r.json()),
      fetch(`/api/decisions?projectId=${pid}`).then(r => r.json()),
      fetch(`/api/deliverables?projectId=${pid}`).then(r => r.json()),
      fetch(`/api/activity?projectId=${pid}`).then(r => r.json()),
      fetch(`/api/strategy?projectId=${pid}`).then(r => r.json()),
    ])
      .then(([itemsData, adrsData, delivData, actData, stratData]) => {
        setItems(itemsData || []);
        setAdrs(adrsData || []);
        setDeliverables(delivData || []);
        setActivities(actData || []);
        setStrategy(stratData || null);
      })
      .catch(err => console.error('Failed to load project dashboard', err))
      .finally(() => setLoading(false));
  }, [activeProjectId]);

  const activeItems = items.filter(i => i.status !== 'done');
  const urgentItems = items.filter(i => i.priority === 'urgent' && i.status !== 'done');
  const acceptedADRs = adrs.filter(a => a.status === 'accepted');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero / Strategic Alignment Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 border border-slate-800 p-6 lg:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace: {activeProject?.name || 'Project Workspace'} [{activeProject?.key || 'KEY'}]</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            {activeProject?.name || 'Team Mission & Strategic Horizon'}
          </h1>
          <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
            {strategy?.mission || activeProject?.description || 'Strategic intent and active backlog for this project workspace.'}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Google Cloud Run (Free Tier)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Cloud Firestore Scoped
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Multi-Project Isolation
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/open-items"
          className="group p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all hover:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Open Items
            </span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{activeItems.length}</span>
            <span className="text-xs text-slate-400">active</span>
          </div>
          {urgentItems.length > 0 ? (
            <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{urgentItems.length} urgent item requires attention</span>
            </div>
          ) : (
            <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{activeItems.length === 0 ? 'No active tasks in this project' : 'All priority queues on track'}</span>
            </div>
          )}
        </Link>

        <Link
          href="/decisions"
          className="group p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all hover:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Architecture ADRs
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
              <FileCode2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{acceptedADRs.length}</span>
            <span className="text-xs text-slate-400">accepted of {adrs.length} total</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            System architectural record
          </div>
        </Link>

        <Link
          href="/deliverables"
          className="group p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all hover:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Drive Deliverables
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{deliverables.length}</span>
            <span className="text-xs text-slate-400">linked assets</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Docs, sheets & agent specs
          </div>
        </Link>

        <Link
          href="/activity"
          className="group p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all hover:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Agent & Slack Pulse
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{activities.length}</span>
            <span className="text-xs text-slate-400">project events</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>REST API active</span>
          </div>
        </Link>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Open Items & Recent ADRs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Open Items */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-semibold text-white">Priority Action Items</h2>
              </div>
              <Link
                href="/open-items"
                className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                View all items
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeItems.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                <p className="text-xs text-slate-400">No open items yet in this project workspace.</p>
                <Link
                  href="/open-items"
                  className="text-xs text-sky-400 hover:underline inline-block"
                >
                  + Add first action item
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {activeItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          item.priority === 'urgent'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : item.priority === 'high'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {item.priority}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800/60 text-slate-300">
                          {item.status}
                        </span>
                        <h3 className="text-sm font-medium text-white">{item.title}</h3>
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Owner: <strong className="text-slate-300">{item.owner}</strong></span>
                        <span>•</span>
                        <span>Due: {item.dueDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      {item.tags.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Architecture Decision Records */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-semibold text-white">Architecture Decisions (ADRs)</h2>
              </div>
              <Link
                href="/decisions"
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View all ADRs
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {adrs.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                <p className="text-xs text-slate-400">No architecture decisions recorded yet for this project.</p>
                <Link
                  href="/decisions"
                  className="text-xs text-indigo-400 hover:underline inline-block"
                >
                  + Record first ADR
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {adrs.slice(0, 3).map((adr) => (
                  <div
                    key={adr.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          ADR #{adr.number}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {adr.status}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">{adr.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 uppercase">{adr.subsystem}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      <strong className="text-slate-300">Decision:</strong> {adr.decision}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pillars, Drive Deliverables & Activity */}
        <div className="space-y-8">
          {/* Strategic Pillars */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-semibold text-white">Strategic Pillars</h2>
              </div>
              <Link
                href="/strategy"
                className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                Canvas
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {strategy?.pillars?.map((pillar, idx) => (
                <div key={pillar.id} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      Pillar {idx + 1}: {pillar.title}
                    </span>
                    {pillar.targetDate && (
                      <span className="text-[10px] font-mono text-slate-400">{pillar.targetDate}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{pillar.description}</p>
                </div>
              )) || (
                <p className="text-xs text-slate-500">No pillars defined.</p>
              )}
            </div>
          </div>

          {/* Drive Deliverables */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Google Drive Hub</h2>
              </div>
              <Link
                href="/deliverables"
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                All files
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {deliverables.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1">
                <p className="text-xs text-slate-400">No Drive assets linked yet.</p>
                <Link href="/deliverables" className="text-xs text-emerald-400 hover:underline">
                  + Link Drive document
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {deliverables.map((del) => (
                  <div
                    key={del.id}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <h4 className="text-xs font-medium text-white truncate">{del.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {del.author} • {del.type}
                      </p>
                    </div>
                    {del.driveUrl && (
                      <a
                        href={del.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Stream */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-semibold text-white">Recent Activity & Slack</h2>
              </div>
              <Link
                href="/activity"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Full stream
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activities.length === 0 ? (
              <p className="text-xs text-slate-500">No recent activity events in this project.</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 4).map((act) => (
                  <div key={act.id} className="text-xs space-y-1 border-l-2 border-slate-800 pl-3 py-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">
                        {act.actor.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-400">{act.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
