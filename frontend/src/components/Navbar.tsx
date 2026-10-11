'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Recycle,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  Eye,
  MapPin,
  LayoutDashboard,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout, switchRole } = useAuth();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/report', label: 'Report Waste', icon: AlertTriangle },
    { href: '/incidents', label: 'Incidents', icon: ClipboardList },
    { href: '/cleanup', label: 'Cleanup Team', icon: Sparkles },
    { href: '/followups', label: 'Follow-ups', icon: Eye },
    { href: '/hotspots', label: 'Hotspots', icon: MapPin },
  ];

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'CLEANUP_TEAM':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'STUDENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm group-hover:border-emerald-500 transition p-1">
              <img
                src="/favicon.ico.png"
                alt="CleanLoop Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                CleanLoop
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  MVP
                </span>
              </span>
              <span className="text-xs text-slate-500 -mt-1 hidden sm:block">
                Waste Tracking & Recurrence Engine
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User Auth Section */}
          <div className="hidden sm:flex items-center gap-3">
            {mounted && isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {/* User & Role Badge with quick toggle */}
                <div className="relative">
                  <button
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span className="max-w-[120px] truncate">{user.email}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </button>

                  {/* Role Switcher Menu */}
                  {roleMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Cognito Role Switch
                      </div>
                      {(['STUDENT', 'CLEANUP_TEAM', 'ADMIN'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            switchRole(r);
                            setRoleMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between ${
                            user.role === r
                              ? 'bg-emerald-50 text-emerald-800 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{r}</span>
                          {user.role === r && <Shield className="w-3 h-3 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                >
                  Register
                </Link>
              </div>
            )}

            <Link
              href="/report"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              <AlertTriangle className="w-4 h-4" />
              Report Waste
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {mounted && isAuthenticated && user && (
            <div className="p-3 bg-slate-50 rounded-lg mb-2 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Logged in as:</span>
                <strong className="text-slate-900">{user.email}</strong>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadgeStyle(user.role)}`}>
                {user.role}
              </span>
            </div>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5 text-emerald-600" />
                {link.label}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {mounted && isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-red-700 font-medium text-sm hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
