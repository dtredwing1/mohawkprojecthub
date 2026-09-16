'use client';

import { useState } from 'react';
import { useModals } from './ModalContext';
import { useProject } from './ProjectContext';
import { X, FolderGit2, Loader2, Sparkles } from 'lucide-react';
import { DeliverableType } from '@/lib/types';
import { parseGoogleDriveUrl } from '@/lib/gdrive-client';

export function LinkDriveModal({ onCreated }: { onCreated?: () => void }) {
  const { activeModal, closeModal } = useModals();
  const { activeProjectId } = useProject();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [type, setType] = useState<DeliverableType>('google-doc');
  const [author, setAuthor] = useState('Team Member');
  const [authorType, setAuthorType] = useState<'user' | 'agent'>('user');
  const [tags, setTags] = useState('drive, deliverable');
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(false);

  if (activeModal !== 'link-drive') return null;

  const handleUrlChange = (url: string) => {
    setDriveUrl(url);
    const parsed = parseGoogleDriveUrl(url);
    if (parsed.type === 'google-doc') setType('google-doc');
    else if (parsed.type === 'google-sheet') setType('google-sheet');
    else if (parsed.type === 'google-slide') setType('google-slide');
    else if (parsed.type === 'drive-folder') setType('drive-folder');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    setLoading(true);
    try {
      const parsed = parseGoogleDriveUrl(driveUrl);
      const res = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProjectId || 'proj-mohawk',
          title,
          summary,
          type,
          driveUrl: driveUrl || undefined,
          driveFileId: parsed.fileId || undefined,
          author,
          authorType,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          markdownContent: markdownContent || undefined,
        }),
      });

      if (res.ok) {
        setTitle('');
        setSummary('');
        setDriveUrl('');
        setMarkdownContent('');
        closeModal();
        if (onCreated) onCreated();
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to link deliverable', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Link Deliverable or Drive Doc</h2>
              <p className="text-xs text-slate-400">Connect Google Docs, Sheets, Slides, or Agentic AI specs.</p>
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
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Google Drive URL
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/document/d/... or https://drive.google.com/..."
              value={driveUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Deliverable Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Brand Guidelines & Moodboard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Summary *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Brief description of what this document or deliverable covers..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DeliverableType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
              >
                <option value="google-doc">Google Doc</option>
                <option value="google-sheet">Google Sheet</option>
                <option value="google-slide">Google Slide</option>
                <option value="drive-folder">Drive Folder</option>
                <option value="agent-report">Agent Deliverable / Spec</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Author / Owner
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="design, strategy, sprint-1"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Inline Markdown Content (Optional)</span>
              <span className="text-slate-400 font-normal normal-case text-[11px]">For agent memos & living specs</span>
            </label>
            <textarea
              rows={3}
              placeholder="### Deliverable Details&#10;Paste markdown notes, bullet points, or specifications..."
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-emerald-500"
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
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Deliverable
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
