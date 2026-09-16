'use client';

import { useState, useEffect } from 'react';
import { Deliverable, DeliverableType } from '@/lib/types';
import { useModals } from '@/components/ModalContext';
import { useProject } from '@/components/ProjectContext';
import { parseGoogleDriveUrl } from '@/lib/gdrive-client';
import {
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
  FileText,
  Table,
  Presentation,
  Folder,
  Bot,
  User,
  Trash2,
  Eye,
  Loader2,
  Tag,
  X,
} from 'lucide-react';

export default function DeliverablesPage() {
  const { openModal } = useModals();
  const { activeProject, activeProjectId } = useProject();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<Deliverable | null>(null);

  const fetchDeliverables = () => {
    setLoading(true);
    const pid = activeProjectId || 'proj-mohawk';
    fetch(`/api/deliverables?projectId=${pid}`)
      .then((res) => res.json())
      .then((data) => {
        setDeliverables(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDeliverables();
    const handleRefresh = () => fetchDeliverables();
    window.addEventListener('hub:refresh', handleRefresh);
    return () => window.removeEventListener('hub:refresh', handleRefresh);
  }, [activeProjectId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this deliverable?')) return;
    try {
      const res = await fetch(`/api/deliverables/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeliverables((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete deliverable', err);
    }
  };

  const getDeliverableIcon = (type: DeliverableType) => {
    switch (type) {
      case 'google-doc':
        return <FileText className="w-5 h-5 text-sky-400" />;
      case 'google-sheet':
        return <Table className="w-5 h-5 text-emerald-400" />;
      case 'google-slide':
        return <Presentation className="w-5 h-5 text-amber-400" />;
      case 'drive-folder':
        return <Folder className="w-5 h-5 text-indigo-400" />;
      case 'agent-report':
      case 'spec':
        return <Bot className="w-5 h-5 text-purple-400" />;
    }
  };

  const filteredDeliverables = deliverables.filter((del) => {
    if (typeFilter !== 'all' && del.type !== typeFilter) return false;
    if (
      searchQuery &&
      !del.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !del.summary.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !del.author.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !del.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FolderGit2 className="w-6 h-6 text-emerald-400" />
            Deliverables & Drive Asset Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Centralized registry of team Google Drive docs, spreadsheets, slide decks, and AI agent living specifications.
          </p>
        </div>

        <button
          onClick={() => openModal('link-drive')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Link Drive Doc / Spec</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search deliverables, specs, authors, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-hidden"
          >
            <option value="all">All File Types</option>
            <option value="google-doc">Google Docs</option>
            <option value="google-sheet">Google Sheets</option>
            <option value="google-slide">Google Slides</option>
            <option value="drive-folder">Drive Folders</option>
            <option value="agent-report">Agent Specs & Reports</option>
          </select>
        </div>
      </div>

      {/* Deliverables Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      ) : filteredDeliverables.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <FolderGit2 className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No deliverables found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "+ Link Drive Doc / Spec" to add your team's Google Drive documents or agent specifications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDeliverables.map((del) => (
            <div
              key={del.id}
              className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                    {getDeliverableIcon(del.type)}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {del.type.replace('google-', '').replace('drive-', '')}
                    </span>
                    <button
                      onClick={() => handleDelete(del.id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white leading-snug">{del.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {del.summary}
                  </p>
                </div>

                {del.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {del.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800/80"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 truncate">
                  {del.authorType === 'agent' ? (
                    <Bot className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate text-slate-300">{del.author}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPreviewItem(del)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Preview spec / embed"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {del.driveUrl && (
                    <a
                      href={del.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                      title="Open in Google Drive"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal / Drawer */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  {getDeliverableIcon(previewItem.type)}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">{previewItem.title}</h2>
                  <p className="text-xs text-slate-400">
                    By {previewItem.author} • {previewItem.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Summary
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">{previewItem.summary}</p>
              </div>

              {previewItem.markdownContent && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-semibold text-purple-400 tracking-wider">
                    Specification & Deliverable Content
                  </span>
                  <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {previewItem.markdownContent}
                  </pre>
                </div>
              )}

              {previewItem.driveUrl && (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white">Google Drive Document</span>
                    <p className="text-[11px] text-slate-400">
                      Collaborate, edit, or comment directly on Google Drive.
                    </p>
                  </div>
                  <a
                    href={previewItem.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    <span>Launch in Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
