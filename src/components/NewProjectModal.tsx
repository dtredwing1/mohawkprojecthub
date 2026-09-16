'use client';

import { useState } from 'react';
import { useModals } from './ModalContext';
import { useProject } from './ProjectContext';
import { X, FolderPlus, Loader2, Sparkles } from 'lucide-react';

export function NewProjectModal() {
  const { activeModal, closeModal } = useModals();
  const { refreshProjects, switchProject } = useProject();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState('#0284c7');
  const [loading, setLoading] = useState(false);

  if (activeModal !== 'new-project') return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key.length < 5) {
      // Auto generate 3-4 letter key
      const generated = val
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .substring(0, 4);
      if (generated) setKey(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          key: key.trim().toUpperCase(),
          description: description.trim(),
          accentColor,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setName('');
        setKey('');
        setDescription('');
        await refreshProjects();
        switchProject(created.id);
        closeModal();
      }
    } catch (err) {
      console.error('Failed to create project', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Create New Project Workspace</h2>
              <p className="text-xs text-slate-400">Initialize a clean strategic canvas, action backlog, and ADR records.</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AI Workflow Engine, Mobile Redesign"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Project Key (3-4 Chars) *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. AIW, MOB"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white font-mono uppercase focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Accent Theme Color
              </label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-slate-300">{accentColor}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Description & Objectives
            </label>
            <textarea
              rows={3}
              placeholder="What is the objective, scope, and target milestone of this project?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-sky-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/20 text-xs text-slate-400 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              Previous projects will remain preserved and accessible anytime from the Project Switcher dropdown.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
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
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm shadow-sky-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create & Launch Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
