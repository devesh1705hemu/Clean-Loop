'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, switchRole, login } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-medium">Validating Amazon Cognito Session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, offer quick demo login or full sign in
  if (!isAuthenticated || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This operational module requires an active session. Choose a 1-click hackathon role below or sign in with your credentials.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => login('student.dev@university.edu', 'CleanLoop2026!', 'STUDENT')}
              className="w-full py-2.5 px-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-xs transition"
            >
              Sign In as Student Observer
            </button>
            <button
              onClick={() => login('cleanup.team@university.edu', 'CleanLoop2026!', 'CLEANUP_TEAM')}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
            >
              Sign In as Cleanup Team
            </button>
            <button
              onClick={() => login('admin.lead@university.edu', 'CleanLoop2026!', 'ADMIN')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition"
            >
              Sign In as Administrator
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
            >
              Custom Login
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If role authorization is restricted and user does not match
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-700 rounded-xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Role Elevation Required</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your current active role is <strong className="text-slate-900 font-mono">[{user.role}]</strong>.
            This workflow requires: <strong className="text-emerald-800 font-mono">[{allowedRoles.join(', ')}]</strong>.
          </p>
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-800 text-left">
            CleanLoop allows 1-click role switching for hackathon evaluation:
          </div>

          <div className="space-y-2 pt-1">
            {allowedRoles.map((role) => (
              <button
                key={role}
                onClick={() => switchRole(role)}
                className="w-full py-2.5 px-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-xs transition"
              >
                Switch Role to {role} & Continue
              </button>
            ))}
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
