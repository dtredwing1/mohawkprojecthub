'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Shield, Sparkles, ArrowRight, Lock } from 'lucide-react';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-sky-500/30">
      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20 text-white font-bold text-lg">
            HUB
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Project Collaboration Hub</h1>
          <p className="text-xs text-slate-400">
            Private cockpit for strategy, backlog, Google Drive, Slack, and AI partners.
          </p>
        </div>

        {/* Access Notice Badge */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Restricted workspace. Access is limited to authenticated collaborators.</span>
        </div>

        {/* Sign In Button */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-medium text-sm transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
          >
            {/* Google "G" SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role-Based Access Control • Google Cloud Run</span>
          </div>
        </div>
      </div>
    </div>
  );
}
