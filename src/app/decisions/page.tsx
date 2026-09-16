'use client';

import { useState, useEffect } from 'react';
import { ADR, ADRStatus, ADRSubsystem } from '@/lib/types';
import { useModals } from '@/components/ModalContext';
import { useProject } from '@/components/ProjectContext';
import {
  FileCode2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Archive,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
  Calendar,
} from 'lucide-react';

export default function DecisionsPage() {
  const { openModal } = useModals();
  const { activeProject, activeProjectId } = useProject();
  const [adrs, setAdrs] = useState<ADR[]>([]);
  const [loading, setLoading] = useState(true);
  const [subsystemFilter, setSubsystemFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchADRs = () => {
    setLoading(true);
    const pid = activeProjectId || 'proj-mohawk';
    fetch(`/api/decisions?projectId=${pid}`)
      .then((res) => res.json())
      .then((data) => {
        setAdrs(data || []);
        if (data && data.length > 0) {
          setExpandedId(data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchADRs();
  }, [activeProjectId]);

  const handleStatusChange = async (adr: ADR, newStatus: ADRStatus) => {
    setUpdatingId(adr.id);
    try {
      const res = await fetch(`/api/decisions/${adr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAdrs((prev) =>
          prev.map((a) => (a.id === adr.id ? { ...a, status: newStatus } : a))
        );
      }
    } catch (err) {
      console.error('Failed to update ADR status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredADRs = adrs.filter((adr) => {
    if (subsystemFilter !== 'all' && adr.subsystem !== subsystemFilter) return false;
    if (statusFilter !== 'all' && adr.status !== statusFilter) return false;
    if (
      searchQuery &&
      !adr.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !adr.decision.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !adr.context.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: ADRStatus) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Accepted
          </span>
        );
      case 'proposed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Proposed
          </span>
        );
      case 'superseded':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            <Archive className="w-3 h-3" />
            Superseded
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3 h-3" />
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileCode2 className="w-6 h-6 text-indigo-400" />
            Architecture & Decision Records (ADRs)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable log of architectural decisions, trade-offs, and technical standards aligning human devs and AI partners.
          </p>
        </div>

        <button
          onClick={() => openModal('new-adr')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record New ADR</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search decisions, context, alternatives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto">
          {/* Subsystem filter */}
          <select
            value={subsystemFilter}
            onChange={(e) => setSubsystemFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden"
          >
            <option value="all">All Subsystems</option>
            <option value="devops">DevOps & Cloud</option>
            <option value="backend">Backend & DB</option>
            <option value="frontend">Frontend & UI</option>
            <option value="ai-agents">AI & Agents</option>
            <option value="strategy">Strategy</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="accepted">Accepted</option>
            <option value="proposed">Proposed</option>
            <option value="superseded">Superseded</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* ADRs List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      ) : filteredADRs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <FileCode2 className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No ADRs found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No architecture decision records match your query. Click "Record New ADR" to document your first decision.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredADRs.map((adr) => {
            const isExpanded = expandedId === adr.id;
            return (
              <div
                key={adr.id}
                className="rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all overflow-hidden"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : adr.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 shrink-0">
                      ADR #{String(adr.number).padStart(3, '0')}
                    </span>
                    {getStatusBadge(adr.status)}
                    <span className="text-xs font-mono uppercase text-slate-400 hidden sm:inline-block">
                      [{adr.subsystem}]
                    </span>
                    <h3 className="text-sm font-semibold text-white truncate">{adr.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400 hidden md:inline-block">
                      {adr.author}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/60 space-y-1">
                        <span className="font-semibold uppercase text-slate-400 text-[10px] tracking-wider">
                          1. Context & Problem
                        </span>
                        <p className="text-slate-300 leading-relaxed">{adr.context || 'None provided'}</p>
                      </div>

                      <div className="p-3.5 rounded-lg bg-slate-950/60 border border-indigo-500/20 space-y-1">
                        <span className="font-semibold uppercase text-indigo-400 text-[10px] tracking-wider">
                          2. Decision
                        </span>
                        <p className="text-slate-200 font-medium leading-relaxed">{adr.decision}</p>
                      </div>

                      <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/60 space-y-1">
                        <span className="font-semibold uppercase text-slate-400 text-[10px] tracking-wider">
                          3. Consequences & Trade-offs
                        </span>
                        <p className="text-slate-300 leading-relaxed">{adr.consequences || 'None documented'}</p>
                      </div>

                      <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/60 space-y-1">
                        <span className="font-semibold uppercase text-slate-400 text-[10px] tracking-wider">
                          4. Alternatives Considered
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {adr.alternativesConsidered || 'None documented'}
                        </p>
                      </div>
                    </div>

                    {/* Footer / Status change */}
                    <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span>Authored by: {adr.author}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Recorded: {new Date(adr.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">Update status:</span>
                        <select
                          value={adr.status}
                          disabled={updatingId === adr.id}
                          onChange={(e) => handleStatusChange(adr, e.target.value as ADRStatus)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                        >
                          <option value="proposed">Proposed</option>
                          <option value="accepted">Accepted</option>
                          <option value="superseded">Superseded</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
