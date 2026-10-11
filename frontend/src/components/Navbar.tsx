'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  BarChart3,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout, switchRole } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/incidents', label: 'Incidents', icon: ClipboardList },
    { href: '/cleanup', label: 'Cleanup Team', icon: Sparkles },
    { href: '/followups', label: 'Follow-ups', icon: Eye },
    { href: '/hotspots', label: 'Hotspots', icon: MapPin },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'CLEANUP_TEAM':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'STUDENT':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-forest-800 text-white flex items-center justify-center shadow-xs group-hover:bg-forest-900 transition p-1">
              <img
                src="/favicon.ico.png"
                alt="CleanLoop"
                className="w-full h-full object-contain brightness-110"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                CleanLoop
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  Ops
                </span>
              </span>
              <span className="text-[11px] text-slate-500 -mt-0.5 hidden sm:block">
                Campus Environmental Waste Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (pathname.startsWith(link.href + '/') && link.href !== '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions & User Auth Section */}
          <div className="flex items-center gap-2.5">
            {/* Quick Report Waste Button */}
            <Link
              href="/report"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Waste</span>
            </Link>

            {mounted && isAuthenticated && user ? (
              <div className="hidden sm:flex items-center gap-2">
                {/* User & Role Badge with dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
                    title="Click to switch active role"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="max-w-[110px] truncate text-[11px] font-mono">{user.email}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </button>

                  {/* Role Switcher Menu */}
                  {roleMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                        Cognito User Role
                      </div>
                      {(['STUDENT', 'CLEANUP_TEAM', 'ADMIN'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            switchRole(r);
                            setRoleMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition ${
                            user.role === r
                              ? 'bg-emerald-50 text-emerald-800 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                            {r}
                          </span>
                          {user.role === r && <span className="text-[10px] font-bold text-emerald-700">ACTIVE</span>}
                        </button>
                      ))}
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setRoleMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : mounted ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Register
                </Link>
              </div>
            ) : null}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-700" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {mounted && isAuthenticated && user && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cognito Active Role
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(['STUDENT', 'CLEANUP_TEAM', 'ADMIN'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      user.role === r
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
