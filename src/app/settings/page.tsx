'use client';

import { useState } from 'react';
import { useProject } from '@/components/ProjectContext';
import { useModals } from '@/components/ModalContext';
import {
  Settings,
  Cloud,
  Database,
  FolderGit2,
  MessageSquare,
  Bot,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  ExternalLink,
  Briefcase,
  Trash2,
  FolderPlus,
} from 'lucide-react';

export default function SettingsPage() {
  const { projects, activeProjectId, switchProject, deleteProject } = useProject();
  const { openModal } = useModals();
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);
  const [slackTesting, setSlackTesting] = useState(false);
  const [slackStatus, setSlackStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const testSlack = async () => {
    setSlackTesting(true);
    setSlackStatus(null);
    try {
      const res = await fetch('/api/slack/test', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSlackStatus({ success: true, message: 'Test message delivered to Slack successfully!' });
      } else {
        setSlackStatus({ success: false, message: data.error || 'Failed to send test message.' });
      }
    } catch (e: any) {
      setSlackStatus({ success: false, message: e.message || 'Network error' });
    } finally {
      setSlackTesting(false);
    }
  };

  const sampleApiKey = 'hub-agent-dev-key-12345';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    if (id === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCurl(id);
      setTimeout(() => setCopiedCurl(null), 2000);
    }
  };

  const curlGetContext = `curl -X GET "http://localhost:3000/api/v1/agent/context" \\
  -H "x-api-key: ${sampleApiKey}"`;

  const curlPostItem = `curl -X POST "http://localhost:3000/api/v1/agent/open-items" \\
  -H "x-api-key: ${sampleApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Analyze User Feedback & Update Product Strategy",
    "description": "Evaluate latest user transcripts and recommend 3 tactical roadmap adjustments.",
    "priority": "high",
    "owner": "AI Agent: Analyst",
    "dueDate": "2026-09-28",
    "tags": ["strategy", "feedback"]
  }'`;

  const curlPostDeliverable = `curl -X POST "http://localhost:3000/api/v1/agent/deliverables" \\
  -H "x-api-key: ${sampleApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Q4 Growth Strategy Analysis",
    "summary": "Agentic synthesis of Q3 experiments and Q4 high-leverage growth bets.",
    "type": "agent-report",
    "author": "AI Partner: Growth-Agent",
    "tags": ["growth", "spec"],
    "markdownContent": "### Growth Synthesis\\n1. Double down on agentic automation\\n2. Streamline Drive file sharing."
  }'`;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-slate-400" />
          Settings, Integrations & Agent API
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Infrastructure configurations, GCP Free Tier deployment status, and REST API access for Agentic AI partners.
        </p>
      </div>

      {/* Project Workspaces Management */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Project Workspaces</h3>
              <p className="text-xs text-slate-400">
                Manage, switch, or permanently clean up project environments.
              </p>
            </div>
          </div>
          <button
            onClick={() => openModal('new-project')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Create New Project</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800/60 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          {projects.map((p) => {
            const isProtected = p.id === 'proj-mohawk' || projects.length <= 1;
            const isActive = p.id === activeProjectId;
            return (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: p.accentColor || '#0284c7' }}
                  >
                    {p.key}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                          Active
                        </span>
                      )}
                      {p.id === 'proj-mohawk' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                          Primary Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-lg mt-0.5">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {!isActive && (
                    <button
                      onClick={() => switchProject(p.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Switch To
                    </button>
                  )}
                  {!isProtected && (
                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete workspace "${p.name}"?\n\nThis will permanently remove its open items, strategy canvas, and architecture decisions.`
                          )
                        ) {
                          const res = await deleteProject(p.id);
                          if (!res.success) {
                            alert(res.error || 'Failed to delete workspace');
                          }
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cloud & Free Tier Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Cloud Run Box */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Google Cloud Run Hosting</h3>
                <span className="text-[11px] text-emerald-400 font-medium">Free Tier Eligible</span>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Cloud Run runs your containerized Next.js hub with automatic scaling to zero when idle. 
            Includes <strong>2M requests/month</strong> and generous vCPU/RAM seconds without recurring server costs.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400">Deploy Command:</span>
            <div className="flex items-center justify-between text-xs font-mono text-slate-200">
              <code>gcloud run deploy project-hub --source .</code>
              <button
                onClick={() =>
                  copyToClipboard('gcloud run deploy project-hub --source .', 'deploy')
                }
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                {copiedCurl === 'deploy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Google Cloud Firestore Box */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Google Cloud Firestore (Native)</h3>
                <span className="text-[11px] text-emerald-400 font-medium">1GB Free + 50k Reads/Day</span>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Ready
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Persistent document database storing open items, ADRs, strategy pillars, and activity history.
            Seamlessly uses GCP Application Default Credentials on Cloud Run or local file storage in development.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Environment Variable:</span>
              <code className="text-indigo-300">GOOGLE_CLOUD_PROJECT</code>
            </div>
            <div className="flex justify-between">
              <span>Local Dev Mode:</span>
              <span className="text-emerald-400">Self-contained local JSON fallback</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Drive & Slack Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Drive */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Google Drive Integration</h3>
              <span className="text-xs text-slate-400">Hybrid Picker & Service Account</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Users link Docs, Sheets, and Slides via Drive URLs or Drive Picker. AI agents can upload deliverables directly using a Google Cloud Service Account shared to your team folder.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 flex justify-between">
              <span>GOOGLE_CLIENT_ID</span>
              <span className="text-slate-400 font-mono">Drive Picker Web OAuth</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 flex justify-between">
              <span>GOOGLE_APPLICATION_CREDENTIALS</span>
              <span className="text-slate-400 font-mono">Service Account JSON (Optional)</span>
            </div>
          </div>
        </div>

        {/* Slack Webhook */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Slack Bi-Directional Webhooks</h3>
                <span className="text-xs text-slate-400">Instant Team Notifications</span>
              </div>
            </div>
            <button
              onClick={testSlack}
              disabled={slackTesting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{slackTesting ? 'Sending...' : 'Send Test Ping to Slack'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Dispatches rich Block Kit notifications to your Slack channel when open items are assigned or completed, ADRs are recorded, or AI agents submit deliverables.
          </p>

          {slackStatus && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                slackStatus.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              <span>{slackStatus.success ? '✅' : '⚠️'}</span>
              <span>{slackStatus.message}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <span className="text-slate-400 font-mono text-[10px]">Active Status:</span>
            <p className="text-slate-300">
              Webhook mapped via <code className="text-sky-400 font-mono">SLACK_WEBHOOK_URL</code> secret. Click <strong>Send Test Ping to Slack</strong> above to verify instant delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Agentic AI API Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Agentic AI REST API</h3>
              <p className="text-xs text-slate-400">
                Secure endpoints for external agents (Python, LangChain, AGY, AutoGen) to inspect backlog and publish deliverables.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Dev API Key:</span>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-amber-300">
              <span>{sampleApiKey}</span>
              <button
                onClick={() => copyToClipboard(sampleApiKey, 'key')}
                className="text-slate-400 hover:text-white"
                title="Copy API Key"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Interactive curl samples */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-sky-400">
                1. GET /api/v1/agent/context (Agent Project Digest)
              </span>
              <button
                onClick={() => copyToClipboard(curlGetContext, 'c1')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedCurl === 'c1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy curl</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-2 rounded bg-slate-900/60">
              {curlGetContext}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-emerald-400">
                2. POST /api/v1/agent/open-items (Agent Backlog Creation)
              </span>
              <button
                onClick={() => copyToClipboard(curlPostItem, 'c2')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedCurl === 'c2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy curl</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-2 rounded bg-slate-900/60">
              {curlPostItem}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-purple-400">
                3. POST /api/v1/agent/deliverables (Agent Specs & Reports Submission)
              </span>
              <button
                onClick={() => copyToClipboard(curlPostDeliverable, 'c3')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedCurl === 'c3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy curl</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-2 rounded bg-slate-900/60">
              {curlPostDeliverable}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
