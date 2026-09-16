'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  Star,
  Users,
  UserPlus,
  ShieldAlert,
  Lock,
  Mail,
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const {
    projects,
    activeProjectId,
    switchProject,
    deleteProject,
    setDefaultProject,
    setUserDefaultPreference,
  } = useProject();
  const { openModal } = useModals();

  const user = session?.user as any;
  const isAdmin = user?.role === 'admin';

  // Secret & Copy states
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);
  const [slackTesting, setSlackTesting] = useState(false);
  const [slackStatus, setSlackStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Collaborators management state
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member');
  const [inviteProjects, setInviteProjects] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ success?: boolean; text?: string } | null>(null);

  const fetchCollaborators = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/admin/collaborators');
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.users || []);
        setInvites(data.invites || []);
      }
    } catch (err) {
      console.error('Failed to load collaborators', err);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, [isAdmin]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetch('/api/admin/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          assignedProjectIds: inviteProjects.length > 0 ? inviteProjects : projects.map((p) => p.id),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteMsg({ success: true, text: `Invitation recorded for ${inviteEmail}!` });
        setInviteEmail('');
        setInviteProjects([]);
        fetchCollaborators();
      } else {
        setInviteMsg({ success: false, text: data.error || 'Failed to invite collaborator' });
      }
    } catch (err: any) {
      setInviteMsg({ success: false, text: err.message });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveCollaborator = async (email: string) => {
    if (!window.confirm(`Revoke access for ${email}?`)) return;
    try {
      const res = await fetch(`/api/admin/collaborators?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCollaborators();
      }
    } catch (err) {
      console.error('Failed to remove collaborator', err);
    }
  };

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

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-slate-400" />
          Settings, Workspaces & Collaborators
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage project workspaces, team collaborator invitations, and system preferences.
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
                Manage, switch, promote to default, or permanently clean up project environments.
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => openModal('new-project')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Create New Project</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-800/60 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          {projects.map((p) => {
            const isGlobalDefault = p.isDefault;
            const isUserDefault = user?.defaultProjectId === p.id || (!user?.defaultProjectId && p.isDefault);
            const isActive = p.id === activeProjectId;
            const canDelete = isAdmin && !isGlobalDefault && projects.length > 1;

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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                          Viewing Now
                        </span>
                      )}
                      {isGlobalDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-300" />
                          Global Default
                        </span>
                      )}
                      {isUserDefault && !isGlobalDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                          My Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-lg mt-0.5">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                  {/* Switch button */}
                  {!isActive && (
                    <button
                      onClick={() => switchProject(p.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Switch
                    </button>
                  )}

                  {/* Set as My Default button */}
                  {!isUserDefault && (
                    <button
                      onClick={() => setUserDefaultPreference(p.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-amber-300 bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Make this workspace your personal default on login"
                    >
                      Set as My Default
                    </button>
                  )}

                  {/* Make Global Default (Admin Only) */}
                  {isAdmin && !isGlobalDefault && (
                    <button
                      onClick={async () => {
                        const res = await setDefaultProject(p.id);
                        if (!res.success) {
                          alert(res.error || 'Failed to set default workspace');
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors cursor-pointer"
                      title="Make this the primary default workspace for all new users"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Make Global Default</span>
                    </button>
                  )}

                  {/* Delete Workspace */}
                  {canDelete && (
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
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
                      title="Permanently delete workspace"
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

      {/* Team Collaborators Administration (Admin Only) */}
      {isAdmin ? (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Team & Collaborator Access</h3>
                <p className="text-xs text-slate-400">
                  Invite collaborators by Google email, assign roles, and grant access to specific workspaces.
                </p>
              </div>
            </div>
          </div>

          {/* Invite Form */}
          <form onSubmit={handleInvite} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-sky-400" />
              <span>Invite New Collaborator</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="email"
                placeholder="collaborator@gmail.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-sky-500"
              />

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-sky-500"
              >
                <option value="member">Member (Can edit tasks, ADRs, strategy)</option>
                <option value="viewer">Viewer (Read-only access)</option>
              </select>

              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors font-semibold cursor-pointer disabled:opacity-50"
              >
                {inviting ? 'Inviting...' : 'Send Workspace Invite'}
              </button>
            </div>

            {/* Workspaces checkboxes */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Assign Workspaces:</span>
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => {
                  const selected = inviteProjects.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border cursor-pointer transition-colors ${
                        selected
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-medium'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setInviteProjects([...inviteProjects, p.id]);
                          } else {
                            setInviteProjects(inviteProjects.filter((id) => id !== p.id));
                          }
                        }}
                        className="hidden"
                      />
                      <span>{p.name}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500">Leave unselected to grant access to all current workspaces.</p>
            </div>

            {inviteMsg && (
              <div
                className={`p-2.5 rounded-lg text-xs ${
                  inviteMsg.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                }`}
              >
                {inviteMsg.text}
              </div>
            )}
          </form>

          {/* Collaborator List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-white">Active Collaborators & Invitations</span>
            <div className="divide-y divide-slate-800/60 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden text-xs">
              {/* Root Owner Row */}
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-[10px]">
                    AD
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{user?.email || 'Administrator'}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase font-mono">
                        Root Admin
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">All Workspaces • Full System Control</span>
                  </div>
                </div>
              </div>

              {/* Invited / Registered Collaborators */}
              {invites.map((inv) => (
                <div key={inv.email} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center font-bold text-[10px]">
                      {inv.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">{inv.email}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 uppercase font-mono">
                          {inv.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span>Workspaces:</span>
                        {inv.assignedProjectIds?.map((pid: string) => {
                          const match = projects.find((p) => p.id === pid);
                          return (
                            <span key={pid} className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">
                              {match?.name || pid}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveCollaborator(inv.email)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Revoke access"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Non-admin notice */
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-3 text-xs text-slate-400">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Team collaborator administration and user assignments are managed by the Root Administrator.</span>
        </div>
      )}

      {/* Cloud & Infrastructure Configuration (Admin Only) */}
      {isAdmin && (
        <>
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
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">Deploy Command:</span>
                <div className="flex items-center justify-between text-xs font-mono text-slate-200">
                  <code>gcloud run deploy project-hub --source .</code>
                  <button
                    onClick={() => copyToClipboard('gcloud run deploy project-hub --source .', 'deploy')}
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
                Persistent document database storing workspaces, users, items, ADRs, strategy pillars, and activity.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Environment Variable:</span>
                  <code className="text-indigo-300">GOOGLE_CLOUD_PROJECT</code>
                </div>
                <div className="flex justify-between">
                  <span>Project ID:</span>
                  <span className="text-emerald-400 font-mono">mohawkprojecthub</span>
                </div>
              </div>
            </div>

            {/* Google Drive Integration */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Google Drive Integration</h3>
                  <span className="text-xs text-slate-400">Zero-Friction Document Bridge</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Teams paste Google Docs, Sheets, Slides, and folder links. The hub automatically parses IDs and previews.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <span className="text-slate-400 font-mono text-[10px]">Service Account:</span>
                <p className="text-slate-300 font-mono text-[11px] truncate">
                  357738328075-compute@developer.gserviceaccount.com
                </p>
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
                    <span className="text-xs text-slate-400">Live Team Notifications</span>
                  </div>
                </div>
                <button
                  onClick={testSlack}
                  disabled={slackTesting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{slackTesting ? 'Sending...' : 'Send Test Ping'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Dispatches Block Kit notifications to your Slack channel on updates, ADRs, or deliverables.
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
                <span className="text-slate-400 font-mono text-[10px]">Active Webhook:</span>
                <p className="text-emerald-400 font-mono text-[11px]">
                  Configured via SLACK_WEBHOOK_URL secret • Active
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
                    className="text-slate-400 hover:text-white cursor-pointer"
                    title="Copy API Key"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
