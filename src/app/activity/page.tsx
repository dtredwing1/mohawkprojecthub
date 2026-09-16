'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ActivityEvent } from '@/lib/types';
import { useProject } from '@/components/ProjectContext';
import {
  Bot,
  User,
  Sparkles,
  CheckSquare,
  FileCode2,
  FolderGit2,
  RefreshCw,
  Search,
  Loader2,
  Calendar,
  MessageSquare,
} from 'lucide-react';

export default function ActivityPage() {
  const { activeProject, activeProjectId } = useProject();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchActivities = () => {
    setLoading(true);
    const pid = activeProjectId || 'proj-mohawk';
    fetch(`/api/activity?projectId=${pid}`)
      .then((res) => res.json())
      .then((data) => {
        setActivities(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchActivities();
  }, [activeProjectId]);

  const filtered = activities.filter((act) => {
    if (actorFilter === 'agent' && act.actor.type !== 'agent') return false;
    if (actorFilter === 'user' && act.actor.type !== 'user') return false;
    if (
      searchQuery &&
      !act.action.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !act.details.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !act.actor.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'item':
        return <CheckSquare className="w-4 h-4 text-sky-400" />;
      case 'adr':
        return <FileCode2 className="w-4 h-4 text-indigo-400" />;
      case 'deliverable':
        return <FolderGit2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-amber-400" />
            AI Agent Inbox & Activity Stream
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time chronological timeline of autonomous AI partner deliverables, team updates, and Slack dispatches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchActivities}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Slack Bi-Directional Webhooks: </span>
            <span className="text-slate-400">
              Every status advancement, deliverable publication, and ADR creation emits an immediate Slack notification.
            </span>
          </div>
        </div>
        <Link
          href="/settings"
          className="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] shrink-0 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 rounded-md transition-colors"
        >
          Live Slack Channel Connected →
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search events, actions, actors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActorFilter('all')}
            className={`px-2.5 py-1 rounded transition-colors ${
              actorFilter === 'all'
                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Actors
          </button>
          <button
            onClick={() => setActorFilter('agent')}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              actorFilter === 'agent'
                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Agents Only</span>
          </button>
          <button
            onClick={() => setActorFilter('user')}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              actorFilter === 'user'
                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Team Members</span>
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <Bot className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No activity events found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Events will automatically appear here as team members make updates and AI partners execute deliverables.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {filtered.map((act) => (
            <div key={act.id} className="relative group">
              {/* Dot / Icon beacon on timeline */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                {act.actor.type === 'agent' ? (
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                )}
              </div>

              {/* Event Card */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-slate-950 border border-slate-800">
                      {getCategoryIcon(act.category)}
                    </div>
                    <span className="font-semibold text-white">{act.actor.name}</span>
                    <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-full ${
                      act.actor.type === 'agent'
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                    }`}>
                      {act.actor.type}
                    </span>
                    <span className="text-slate-400 font-medium">• {act.action}</span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(act.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-300 pl-6 leading-relaxed">{act.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
