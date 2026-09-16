'use client';

import { useState } from 'react';
import { useModals } from './ModalContext';
import { useProject } from './ProjectContext';
import { X, FileCode2, Loader2 } from 'lucide-react';
import { ADRStatus, ADRSubsystem } from '@/lib/types';

export function NewADRModal({ onCreated }: { onCreated?: () => void }) {
  const { activeModal, closeModal } = useModals();
  const { activeProjectId } = useProject();
  const [title, setTitle] = useState('');
  const [subsystem, setSubsystem] = useState<ADRSubsystem>('devops');
  const [status, setStatus] = useState<ADRStatus>('accepted');
  const [context, setContext] = useState('');
  const [decision, setDecision] = useState('');
  const [consequences, setConsequences] = useState('');
  const [alternativesConsidered, setAlternatives] = useState('');
  const [author, setAuthor] = useState('Architecture Lead');
  const [loading, setLoading] = useState(false);

  if (activeModal !== 'new-adr') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !decision.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProjectId || 'proj-mohawk',
          title,
          subsystem,
          status,
          context,
          decision,
          consequences,
          alternativesConsidered,
          author,
        }),
      });

      if (res.ok) {
        setTitle('');
        setContext('');
        setDecision('');
        setConsequences('');
        setAlternatives('');
        closeModal();
        if (onCreated) onCreated();
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to create ADR', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Record Architecture Decision (ADR)</h2>
              <p className="text-xs text-slate-400">Document technical context, decisions, and trade-offs for team & AI partners.</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto grow">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Decision Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Adopt Google Cloud Run with Standalone Next.js"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Subsystem
              </label>
              <select
                value={subsystem}
                onChange={(e) => setSubsystem(e.target.value as ADRSubsystem)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="devops">DevOps & Cloud</option>
                <option value="backend">Backend & DB</option>
                <option value="frontend">Frontend & UI</option>
                <option value="ai-agents">AI & Agents</option>
                <option value="strategy">Strategy</option>
                <option value="brand">Brand</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ADRStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="proposed">Proposed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="superseded">Superseded</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              1. Context & Problem Statement
            </label>
            <textarea
              rows={2}
              placeholder="What is the problem or circumstance prompting this technical choice?"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              2. Decision *
            </label>
            <textarea
              rows={2}
              required
              placeholder="What is the exact change or architectural rule we are committing to?"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              3. Consequences & Trade-offs
            </label>
            <textarea
              rows={2}
              placeholder="What benefits and costs does this decision introduce?"
              value={consequences}
              onChange={(e) => setConsequences(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              4. Alternatives Considered
            </label>
            <input
              type="text"
              placeholder="e.g. AWS App Runner, Cloud SQL, Supabase"
              value={alternativesConsidered}
              onChange={(e) => setAlternatives(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish ADR & Alert Slack
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
