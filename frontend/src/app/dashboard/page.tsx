'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Sparkles,
  Eye,
  RefreshCw,
  Clock,
  Shield,
  ChevronRight,
  Info,
  MapPin,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  Filter,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  UserRole,
  Incident,
  Hotspot,
  PREDEFINED_HOTSPOTS,
  FollowUpRecord,
  RecurrenceClassification,
} from '@/types';
import { useAuth } from '@/context/AuthContext';
import { api, getLocalIncidents, getLocalFollowUps } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

interface HotspotCardData {
  hotspotId: string;
  name: string;
  area: string;
  incidentCount: number;
  lastIncidentDate?: string;
  latestFollowUpCondition?: string;
  classification: RecurrenceClassification;
  postCleanupRecurrenceCount: number;
}

export default function DashboardPage() {
  const { user, switchRole } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [analytics, setAnalytics] = useState<{
    summary: {
      totalReports: number;
      totalCleanups: number;
      pendingFollowUps: number;
      recurringHotspots: number;
    };
    ranking: Array<{
      hotspotId: string;
      name: string;
      incidentCount: number;
      cleanupCount: number;
      followUpCount: number;
      postCleanupRecurrenceCount: number;
      classification: string;
    }>;
    recentIncidents: Incident[];
  } | null>(null);

  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [hotspotCards, setHotspotCards] = useState<HotspotCardData[]>([]);
  const [followups, setFollowups] = useState<FollowUpRecord[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentRole: UserRole = mounted && user?.role ? user.role : 'ADMIN';

  const loadDashboardData = async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const [overviewRes, incidentsRes, followUpsRes] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getIncidents(),
        api.getFollowUps(),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setAnalytics(overviewRes.data);
      }

      const incidentsList = incidentsRes.success && incidentsRes.data ? incidentsRes.data : getLocalIncidents();
      setAllIncidents(incidentsList);

      const followUpsList = followUpsRes.success && followUpsRes.data ? followUpsRes.data : getLocalFollowUps();
      setFollowups(followUpsList);

      // Build rich hotspot cards directly from real data
      const cards: HotspotCardData[] = await Promise.all(
        PREDEFINED_HOTSPOTS.map(async (spot) => {
          const recRes = await api.getHotspotRecurrence(spot.hotspotId);
          const spotIncidents = incidentsList
            .filter((i) => i.hotspotId === spot.hotspotId)
            .sort((a, b) => new Date(b.createdAt || b.reportedAt).getTime() - new Date(a.createdAt || a.reportedAt).getTime());

          const spotFollowUps = followUpsList
            .filter((f) => f.hotspotId === spot.hotspotId)
            .sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());

          const classification = (recRes.data?.classification ||
            (spotIncidents.length >= 3 ? 'Recurring' : spotIncidents.length === 2 ? 'Monitor' : 'Normal')) as RecurrenceClassification;

          return {
            hotspotId: spot.hotspotId,
            name: spot.name,
            area: spot.area,
            incidentCount: recRes.data?.totalIncidents ?? spotIncidents.length,
            lastIncidentDate: spotIncidents[0]?.createdAt || spotIncidents[0]?.reportedAt || recRes.data?.lastIncidentDate,
            latestFollowUpCondition: spotFollowUps[0]?.condition,
            classification,
            postCleanupRecurrenceCount: recRes.data?.postCleanupRecurrenceCount ?? 0,
          };
        })
      );

      // Sort by recurrence severity: Recurring first, then Monitor, then Normal
      cards.sort((a, b) => {
        const order: Record<string, number> = { Recurring: 3, Monitor: 2, Normal: 1 };
        return (order[b.classification] || 0) - (order[a.classification] || 0) || b.incidentCount - a.incidentCount;
      });

      setHotspotCards(cards);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.email, currentRole]);

  // Filtered incidents for the recent incidents table
  const displayedIncidents = allIncidents.filter((inc) => {
    if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const spot = PREDEFINED_HOTSPOTS.find((h) => h.hotspotId === inc.hotspotId);
      const matchesText =
        inc.incidentId.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.wasteCategory.toLowerCase().includes(q) ||
        (spot && spot.name.toLowerCase().includes(q));
      if (!matchesText) return false;
    }
    return true;
  });

  const getHotspotName = (hotspotId: string) => {
    return PREDEFINED_HOTSPOTS.find((h) => h.hotspotId === hotspotId)?.name || hotspotId;
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* ── Sidebar Navigation ── */}
      <aside className="w-full lg:w-64 bg-white border-r border-slate-200 lg:min-h-[calc(100vh-4rem)] flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Operations Workspace
          </div>
          <div className="mt-1 font-extrabold text-slate-900 text-base flex items-center gap-2">
            <span>CleanLoop Campus</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time AWS DynamoDB Sync</p>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="p-3 space-y-1 text-xs font-semibold flex-1">
          <Link
            href="/dashboard"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/60 shadow-2xs font-bold"
          >
            <span className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Operations Dashboard</span>
            </span>
            <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-1.5 py-0.2 rounded font-mono">
              Live
            </span>
          </Link>

          <Link
            href="/report"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <AlertTriangle className="w-4 h-4 text-slate-400" />
            <span>Report Waste</span>
          </Link>

          <Link
            href="/incidents"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <span className="flex items-center gap-2.5">
              <ClipboardList className="w-4 h-4 text-slate-400" />
              <span>Incident Backlog</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {allIncidents.length}
            </span>
          </Link>

          <Link
            href="/cleanup"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <Sparkles className="w-4 h-4 text-slate-400" />
            <span>Cleanup Crew Queue</span>
          </Link>

          <Link
            href="/followups"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            <span>Follow-up Audits</span>
          </Link>

          <Link
            href="/hotspots"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <span className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>Campus Hotspots</span>
            </span>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold">
              {analytics?.summary.recurringHotspots || 0} Recur
            </span>
          </Link>

          <Link
            href="/analytics"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span>Analytics & Metrics</span>
          </Link>
        </nav>

        {/* Sidebar Footer Role & Verification Box */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Persona
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
              Cognito Verified
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-slate-900">{currentRole}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {user?.email || 'cognito.session@cleanloop.internal'}
            </div>
          </div>

          <div className="text-[10px] text-slate-500">
            Switch role to test access boundaries:
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['STUDENT', 'CLEANUP_TEAM', 'ADMIN'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`px-1.5 py-1 rounded text-[10px] font-bold transition text-center truncate ${
                  currentRole === r
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {r === 'CLEANUP_TEAM' ? 'CLEANUP' : r}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full overflow-hidden">
        {/* Top Header with Page Title, Breadcrumbs, and Prominent CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                CleanLoop Platform
              </span>
              <span>/</span>
              <span className="text-slate-500">Operations Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Environmental Operations Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Deterministic tracking of campus waste reports, cleanup dispatch, post-cleanup verification audits, and recurring hotspot detection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs"
              title="Refresh DynamoDB data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs sm:text-sm font-bold shadow-xs transition duration-150"
            >
              <AlertTriangle className="w-4 h-4 text-emerald-200" />
              <span>Report Waste</span>
            </Link>
          </div>
        </div>

        {/* Error Notification */}
        {hasError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Failed to fetch some live metrics from backend. Displaying synchronized local storage snapshot.</span>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-2.5 py-1 bg-white border border-rose-300 rounded font-semibold text-rose-700 hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── KPI Summary Cards (Section 3 & 15) ── */}
        <section aria-label="Key Performance Indicators">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Incidents */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-100 rounded animate-pulse my-1" />
                ) : (
                  <div className="text-3xl font-black text-slate-900 tracking-tight">
                    {analytics?.summary.totalReports ?? allIncidents.length}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-1">Campus reports filed by students</p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="text-[11px] font-medium">Lifecycle active</span>
                <Link href="/incidents" className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5">
                  View feed <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 2. Completed Cleanups */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Cleanups Completed</span>
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-100 rounded animate-pulse my-1" />
                ) : (
                  <div className="text-3xl font-black text-slate-900 tracking-tight">
                    {analytics?.summary.totalCleanups ?? 0}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-1">Actioned by field maintenance teams</p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="text-[11px] font-medium">Photo verified</span>
                <Link href="/cleanup" className="text-sky-700 font-bold hover:underline inline-flex items-center gap-0.5">
                  Cleanup log <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 3. Pending Follow-ups */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending Follow-ups</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-100 rounded animate-pulse my-1" />
                ) : (
                  <div className="text-3xl font-black text-slate-900 tracking-tight text-amber-700">
                    {analytics?.summary.pendingFollowUps ?? 0}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-1">Awaiting post-cleanup audit</p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="text-[11px] font-medium">Quality assurance</span>
                <Link href="/followups" className="text-amber-700 font-bold hover:underline inline-flex items-center gap-0.5">
                  Audit queue <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 4. Recurring Hotspots (Signature Feature Metric) */}
            <div className="bg-gradient-to-br from-purple-50/50 via-white to-white p-5 rounded-2xl border-2 border-purple-200 shadow-xs hover:border-purple-300 transition flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-16 h-16 bg-purple-100/50 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between text-purple-900 mb-2">
                  <span className="text-xs font-black uppercase tracking-wider">Recurring Hotspots</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-8 w-16 bg-purple-100/50 rounded animate-pulse my-1" />
                ) : (
                  <div className="text-3xl font-black text-purple-900 tracking-tight">
                    {analytics?.summary.recurringHotspots ?? 0}
                  </div>
                )}
                <p className="text-[11px] text-purple-800 mt-1 font-medium">
                  Trigger condition: &ge; 3 incidents
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-purple-100 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded">
                  Signature Feature
                </span>
                <Link href="/hotspots" className="text-purple-800 font-bold hover:underline inline-flex items-center gap-0.5">
                  Inspect <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Signature Feature: Recurring Hotspot Tracking (Section 4) ── */}
        <section aria-labelledby="recurring-hotspots-heading" className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header with Explanation & Disclaimer */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-purple-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
                    <RefreshCw className="w-4 h-4" />
                  </span>
                  <h2 id="recurring-hotspots-heading" className="text-lg font-black text-slate-900">
                    Campus Hotspot Recurrence Intelligence
                  </h2>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full uppercase">
                    Signature System
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Deterministic detection of chronic waste zones based on distinct reports, verified cleanups, and post-cleanup observations.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <Link
                  href="/hotspots"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                >
                  <span>All Campus Hotspots</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Mandatory Recurrence Disclaimer Notice */}
            <div className="px-6 py-2.5 bg-amber-50/80 border-b border-amber-200/60 text-[11px] text-amber-900 flex items-start sm:items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                <strong>Operational Notice:</strong> Recurrence indicates repeated observations for the same geographic anchor. It does not establish the root cause of waste nor assert cleanup failure.
              </span>
            </div>

            {/* Hotspots Grid / Card List */}
            <div className="p-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="p-5 rounded-xl border border-slate-200 bg-slate-50 animate-pulse space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-6 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : hotspotCards.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No hotspot data available.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hotspotCards.map((spot) => {
                    const isRecurring = spot.classification === 'Recurring';
                    const isMonitor = spot.classification === 'Monitor';

                    return (
                      <div
                        key={spot.hotspotId}
                        className={`rounded-xl border p-5 transition flex flex-col justify-between ${
                          isRecurring
                            ? 'bg-purple-50/20 border-purple-200 shadow-2xs hover:border-purple-300'
                            : isMonitor
                            ? 'bg-amber-50/20 border-amber-200 shadow-2xs hover:border-amber-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Hotspot Identifier & Classification Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {spot.hotspotId}
                            </span>
                            <StatusBadge status={spot.classification} size="sm" />
                          </div>

                          {/* Hotspot Name & Area */}
                          <div>
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700">
                              {spot.name}
                            </h3>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              <span>{spot.area}</span>
                            </div>
                          </div>

                          {/* Metric Indicators */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                            <div className="bg-white/80 p-2 rounded-lg border border-slate-100">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                Distinct Reports
                              </span>
                              <div className="text-base font-extrabold text-slate-900 mt-0.5">
                                {spot.incidentCount} {spot.incidentCount === 1 ? 'incident' : 'incidents'}
                              </div>
                            </div>

                            <div className="bg-white/80 p-2 rounded-lg border border-slate-100">
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                Latest Condition
                              </span>
                              <div className="mt-0.5">
                                {spot.latestFollowUpCondition ? (
                                  <StatusBadge status={spot.latestFollowUpCondition} size="sm" />
                                ) : (
                                  <span className="text-slate-400 text-[11px] italic">Awaiting audit</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Most Recent Incident Date */}
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Last reported:{' '}
                              <strong className="text-slate-700 font-mono">
                                {spot.lastIncidentDate
                                  ? new Date(spot.lastIncidentDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })
                                  : 'None'}
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* Card Action: View Full History Button */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            Post-clean recurrence: <strong>{spot.postCleanupRecurrenceCount}</strong>
                          </span>
                          <Link
                            href={`/hotspots/${spot.hotspotId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-2xs"
                          >
                            <span>View Full History</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Recent Incidents Table (Section 3) ── */}
        <section aria-labelledby="recent-incidents-heading" className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Header and Search / Filter Toolbar */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-700" />
                  <h2 id="recent-incidents-heading" className="text-lg font-black text-slate-900">
                    Recent Waste Incidents
                  </h2>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {displayedIncidents.length} records
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit trail of waste reports across all campus monitoring locations
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search incidents or locations..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 w-44 sm:w-56"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="REPORTED">REPORTED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="CLEANED">CLEANED</option>
                  <option value="FOLLOW_UP_REQUIRED">FOLLOW_UP_REQUIRED</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>

                <Link
                  href="/report"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-2xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Report</span>
                </Link>
              </div>
            </div>

            {/* Responsive Table / Card View */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading incidents from DynamoDB...
                </div>
              ) : displayedIncidents.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="font-semibold text-sm text-slate-700">No incidents match the selected filter</div>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Submit a waste report or adjust your search filter to inspect real data.
                  </p>
                  <Link
                    href="/report"
                    className="mt-4 inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-forest-700 text-white text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Report
                  </Link>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                      <th className="py-3 px-4">Incident ID</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Reported Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedIncidents.slice(0, 10).map((inc) => (
                      <tr key={inc.incidentId} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          <Link
                            href={`/incidents/${inc.incidentId}`}
                            className="hover:text-emerald-700 hover:underline"
                          >
                            {inc.incidentId}
                          </Link>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{getHotspotName(inc.hotspotId)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                            {inc.wasteCategory}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {inc.description}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                          {new Date(inc.createdAt || inc.reportedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={inc.status} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/incidents/${inc.incidentId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition text-[11px]"
                          >
                            <span>Timeline</span>
                            <ChevronRight className="w-3 h-3 text-slate-500" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer with view all link */}
            {displayedIncidents.length > 10 && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                <Link
                  href="/incidents"
                  className="text-xs font-bold text-emerald-800 hover:underline inline-flex items-center gap-1"
                >
                  <span>View all {displayedIncidents.length} incidents in backlog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
