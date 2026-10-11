'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  RefreshCw,
  PieChart,
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Info,
  Layers,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { api, getLocalIncidents, getLocalCleanups, getLocalFollowUps } from '@/lib/api';
import { PREDEFINED_HOTSPOTS, Incident, WasteCategory, WASTE_CATEGORIES } from '@/types';
import StatusBadge from '@/components/StatusBadge';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<{
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

  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      api.getAnalyticsOverview(),
      api.getIncidents(),
    ]).then(([res, incRes]) => {
      if (!isMounted) return;

      if (res.success && res.data) {
        setOverview(res.data);
      }

      const incidents = incRes.success && incRes.data ? incRes.data : getLocalIncidents();
      const catMap: Record<string, number> = {};
      WASTE_CATEGORIES.forEach((c) => (catMap[c] = 0));
      incidents.forEach((i) => {
        catMap[i.wasteCategory] = (catMap[i.wasteCategory] || 0) + 1;
      });
      setCategoryCounts(catMap);

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalIncidents = overview?.summary.totalReports || 1;
  const totalCleanups = overview?.summary.totalCleanups || 0;
  const cleanupRate = totalIncidents > 0 ? Math.round((totalCleanups / totalIncidents) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Campus Environmental Analytics
            </h1>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
              DynamoDB Aggregates
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Deterministic recurrence tracking metrics, waste category distributions, and cleanup turnaround across campus anchors.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <span>Operations Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Recurrence Disclaimer */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Deterministic Analytics Notice:</strong> Recurrence indicates repeated observations for the same geographic anchor. It does not establish the root cause of the waste.
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Waste Reports</span>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {overview?.summary.totalReports ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Submitted by university members</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cleanups Executed</span>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {overview?.summary.totalCleanups ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Physical actions logged with proof</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cleanup Resolution Rate</span>
          <div className="text-3xl font-black text-emerald-700 mt-1">
            {cleanupRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ratio of cleanups to total incidents</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-purple-200 shadow-xs bg-purple-50/20">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-900">Recurring Hotspots</span>
          <div className="text-3xl font-black text-purple-950 mt-1">
            {overview?.summary.recurringHotspots ?? 0}
          </div>
          <p className="text-[11px] text-purple-700 mt-1">Exceeding threshold (&ge; 3 incidents)</p>
        </div>
      </div>

      {/* Hotspots Ranking & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Hotspot Recurrence Ranking Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Campus Hotspot Severity Ranking</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sorted by incident frequency and post-cleanup recurrence
              </p>
            </div>
            <Link
              href="/hotspots"
              className="text-xs font-bold text-forest-700 hover:underline inline-flex items-center gap-1"
            >
              <span>View Hotspots Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Hotspot</th>
                  <th className="py-2.5 px-3 text-center">Incidents</th>
                  <th className="py-2.5 px-3 text-center">Cleanups</th>
                  <th className="py-2.5 px-3 text-center">Post-Clean Recurrence</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview?.ranking.map((spot, index) => (
                  <tr key={spot.hotspotId} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-400">
                      #{index + 1}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div>{spot.name}</div>
                      <span className="font-mono text-[10px] text-slate-400">{spot.hotspotId}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {spot.incidentCount}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {spot.cleanupCount}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-purple-900">
                      {spot.postCleanupRecurrenceCount}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={spot.classification} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/hotspots/${spot.hotspotId}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition inline-flex items-center gap-1"
                      >
                        <span>History</span>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Waste Category Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-700" />
              <span>Waste by Category</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Material composition breakdown
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {WASTE_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const total = overview?.summary.totalReports || 1;
              const pct = Math.round((count / total) * 100);

              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center font-semibold text-slate-700">
                    <span>{cat}</span>
                    <span className="font-mono text-slate-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700">Recycling Target Insight</div>
            <p>
              Plastic & food packaging make up the highest proportion of campus recurrence reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
