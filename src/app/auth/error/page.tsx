'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Mail } from 'lucide-react';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-rose-500/30">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative z-10 space-y-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white tracking-tight">Access Restricted</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            This Project Collaboration Hub is private. Your Google account has not been invited to this workspace yet.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-left space-y-2">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            How to get access:
          </span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Contact the workspace administrator to request an invitation. Once your Google email is added to the collaborator list, you will be able to sign in immediately.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Try Another Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
