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
  const { user, isAuthenticated, isLoading } = useAuth();

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

  // If not authenticated, require login
  if (!isAuthenticated || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Authentication Required</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This page requires an active Amazon Cognito session. Please sign in to access this CleanLoop workflow.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="w-full inline-flex justify-center py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
            >
              Sign In with Cognito
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
          <h2 className="text-xl font-bold text-slate-900">Access Denied (403)</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your current Cognito group is <strong className="text-slate-900 font-mono">[{user.role}]</strong>.
            This action requires one of: <strong className="text-emerald-800 font-mono">[{allowedRoles.join(', ')}]</strong>.
          </p>
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-800 text-left">
            Backend authorization enforces these permissions at API Gateway and Lambda. Unauthorized requests will be rejected.
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
