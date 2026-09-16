'use client';

import { useState, useEffect } from 'react';
import { StrategyDoc } from '@/lib/types';
import { useProject } from '@/components/ProjectContext';
import {
  Compass,
  Sparkles,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  FolderGit2,
  Palette,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function StrategyPage() {
  const { activeProject, activeProjectId } = useProject();
  const [strategy, setStrategy] = useState<StrategyDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    const pid = activeProjectId || 'proj-mohawk';
    fetch(`/api/strategy?projectId=${pid}`)
      .then((res) => res.json())
      .then((data) => {
        setStrategy(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [activeProjectId]);

  const handleSave = async () => {
    if (!strategy) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const pid = activeProjectId || 'proj-mohawk';
      const res = await fetch(`/api/strategy?projectId=${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...strategy, projectId: pid }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update strategy', err);
    } finally {
      setSaving(false);
    }
  };

  const addPillar = () => {
    if (!strategy) return;
    const newPillar = {
      id: `pillar-${Date.now()}`,
      title: 'New Strategic Pillar',
      description: 'Define key objective, strategy, and expected outcomes.',
      metrics: 'Define success metrics.',
      targetDate: 'Q4 2026',
    };
    setStrategy({ ...strategy, pillars: [...strategy.pillars, newPillar] });
  };

  const removePillar = (id: string) => {
    if (!strategy) return;
    setStrategy({
      ...strategy,
      pillars: strategy.pillars.filter((p) => p.id !== id),
    });
  };

  if (loading || !strategy) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-sky-400" />
            Strategy & Brand Canvas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Single source of strategic intent, OKRs, and brand identity guiding human and AI agent decisions.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-600/30 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save Canvas'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Canvas updated and broadcast to team & Slack!</span>
        </div>
      )}

      {/* Mission & Vision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Core Mission
            </span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <textarea
            rows={3}
            value={strategy.mission}
            onChange={(e) => setStrategy({ ...strategy, mission: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-hidden focus:border-sky-500"
          />
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Vision & Value Proposition
            </span>
            <Compass className="w-4 h-4 text-indigo-400" />
          </div>
          <textarea
            rows={3}
            value={strategy.vision}
            onChange={(e) => setStrategy({ ...strategy, vision: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Strategic Pillars */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Strategic Execution Pillars</h2>
            <p className="text-xs text-slate-400">Core themes that guide sprint backlogs and agent priorities.</p>
          </div>
          <button
            onClick={addPillar}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Pillar</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategy.pillars.map((pillar, idx) => (
            <div
              key={pillar.id}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-400">
                    Pillar 0{idx + 1}
                  </span>
                  <button
                    onClick={() => removePillar(pillar.id)}
                    className="text-slate-400 hover:text-red-400 p-1 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={pillar.title}
                  onChange={(e) => {
                    const next = [...strategy.pillars];
                    next[idx].title = e.target.value;
                    setStrategy({ ...strategy, pillars: next });
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm font-semibold text-white focus:outline-hidden focus:border-sky-500"
                />
                <textarea
                  rows={3}
                  value={pillar.description}
                  onChange={(e) => {
                    const next = [...strategy.pillars];
                    next[idx].description = e.target.value;
                    setStrategy({ ...strategy, pillars: next });
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Target Metric:
                </span>
                <input
                  type="text"
                  value={pillar.metrics}
                  onChange={(e) => {
                    const next = [...strategy.pillars];
                    next[idx].metrics = e.target.value;
                    setStrategy({ ...strategy, pillars: next });
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-hidden"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand & Identity Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Color Palette & Font */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">Brand Design System</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Primary Accent</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={strategy.brandGuidelines.primaryColor}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      brandGuidelines: { ...strategy.brandGuidelines, primaryColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-slate-200">
                  {strategy.brandGuidelines.primaryColor}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Secondary Tone</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={strategy.brandGuidelines.secondaryColor}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      brandGuidelines: { ...strategy.brandGuidelines, secondaryColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-slate-200">
                  {strategy.brandGuidelines.secondaryColor}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Accent / Success</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={strategy.brandGuidelines.accentColor}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      brandGuidelines: { ...strategy.brandGuidelines, accentColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-slate-200">
                  {strategy.brandGuidelines.accentColor}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Typography Stack
              </label>
              <input
                type="text"
                value={strategy.brandGuidelines.fontFamily}
                onChange={(e) =>
                  setStrategy({
                    ...strategy,
                    brandGuidelines: { ...strategy.brandGuidelines, fontFamily: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Tone of Voice
              </label>
              <input
                type="text"
                value={strategy.brandGuidelines.toneOfVoice}
                onChange={(e) =>
                  setStrategy({
                    ...strategy,
                    brandGuidelines: { ...strategy.brandGuidelines, toneOfVoice: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Google Drive Brand Kit */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Drive Brand Kit</h2>
            </div>
            <p className="text-xs text-slate-400">
              Shared team Google Drive repository containing SVG wordmarks, icons, typography packages, and presentation decks.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Google Drive Folder URL
            </label>
            <input
              type="url"
              value={strategy.brandGuidelines.driveBrandKitUrl || ''}
              onChange={(e) =>
                setStrategy({
                  ...strategy,
                  brandGuidelines: { ...strategy.brandGuidelines, driveBrandKitUrl: e.target.value },
                })
              }
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
            />
          </div>

          {strategy.brandGuidelines.driveBrandKitUrl && (
            <a
              href={strategy.brandGuidelines.driveBrandKitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              <span>Open Brand Kit in Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
