'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Lock, Mail, Shield, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleQuickDemo = (demoRole: UserRole, demoEmail: string) => {
    setRole(demoRole);
    setEmail(demoEmail);
    setPassword('CleanLoop@2026!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await login(email, password, role);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in. Please check credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-forest-800 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xs p-1">
            <img
              src="/favicon.ico.png"
              alt="CleanLoop"
              className="w-full h-full object-contain brightness-110"
            />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign In to CleanLoop
          </h1>
          <p className="text-xs text-slate-500">
            Authenticated via Amazon Cognito User Pool
          </p>
        </div>

        {/* Quick Demo Credentials Toolbar */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Hackathon Quick Login</span>
            <span className="text-emerald-700">Pre-set roles</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('STUDENT', 'student.dev@university.edu')}
              className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-600 text-[11px] font-bold text-slate-700 text-center transition"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('CLEANUP_TEAM', 'cleanup.staff@cleanloop.internal')}
              className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-600 text-[11px] font-bold text-slate-700 text-center transition"
            >
              Cleanup
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN', 'admin.facilities@university.edu')}
              className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-purple-600 text-[11px] font-bold text-slate-700 text-center transition"
            >
              Admin
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="email">
              Campus Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student.dev@university.edu"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="role">
              Cognito Group (Role)
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
              >
                <option value="STUDENT">STUDENT (Report Waste & View Personal Submissions)</option>
                <option value="CLEANUP_TEAM">CLEANUP_TEAM (Record Actions & Photographic Proof)</option>
                <option value="ADMIN">ADMIN (Full Operations Dashboard & Hotspot Intelligence)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In to Platform</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Need a test account?{' '}
          <Link href="/register" className="font-bold text-emerald-700 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
