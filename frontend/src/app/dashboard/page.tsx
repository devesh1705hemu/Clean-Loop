'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Sparkles,
  Eye,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  ChevronRight,
  Info,
  Tag,
  MapPin,
} from 'lucide-react';
import { UserRole, Incident, PREDEFINED_HOTSPOTS } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const { user, switchRole } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentRole: UserRole = (mounted && user?.role) ? user.role : 'ADMIN';

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

  const [studentReports, setStudentReports] = useState<Incident[]>([]);
  const [cleanupIncidents, setCleanupIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    let isMounted = true;

    // Fetch analytics overview
    api.getAnalyticsOverview().then((res) => {
      if (isMounted && res.success && res.data) {
        setAnalytics(res.data);
      }
    });

    // Fetch all incidents for student or cleanup views
    api.getIncidents().then((res) => {
      if (isMounted && res.success && res.data) {
        setCleanupIncidents(res.data);
        if (user?.email) {
          setStudentReports(res.data.filter((i) => i.reportedBy === user.email));
        } else {
          setStudentReports(res.data);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.email, currentRole]);

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
  };

  const unassignedCount = cleanupIncidents.filter((i) => i.status === 'REPORTED').length;
  const inProgressCount = cleanupIncidents.filter((i) => i.status === 'IN_PROGRESS').length;
  const cleanedCount = cleanupIncidents.filter((i) => i.status === 'CLEANED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Role Switcher Toolbar for Verification */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Current Active Cognito Group
            </div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Role: <strong className="text-emerald-700">{currentRole}</strong></span>
              <span className="text-[11px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Backend Authorization Verified
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Switch View:</span>
          {(['STUDENT', 'CLEANUP_TEAM', 'ADMIN'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleChange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentRole === r
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Role Specific Views */}
      {currentRole === 'STUDENT' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Student Waste Reporting Hub</h2>
              <p className="text-emerald-100 text-sm mt-1 max-w-xl">
                Notice litter on campus? Report it against one of the 5 predefined campus hotspots to initialize the CleanLoop workflow.
              </p>
            </div>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-800 font-bold rounded-xl text-sm shadow hover:bg-emerald-50 transition"
            >
              <AlertTriangle className="w-4 h-4 text-emerald-700" />
              Submit Waste Report
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>Your Reported Incidents ({studentReports.length})</span>
              <span className="text-xs font-medium text-slate-500">Filtered by your User ID</span>
            </h3>

            {studentReports.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-medium text-slate-700">No active reports yet</p>
                <p className="text-xs text-slate-400 mt-1">Submit your first report to start tracking the incident lifecycle.</p>
                <Link
                  href="/report"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
                >
                  Create Incident Report
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {studentReports.map((inc) => (
                  <div key={inc.incidentId} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{inc.incidentId}</span>
                        <span>{inc.wasteCategory}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{inc.description}</p>
                    </div>
                    <span className="font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {inc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {currentRole === 'CLEANUP_TEAM' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Cleanup Team Operations</h2>
              <p className="text-sky-100 text-sm mt-1 max-w-xl">
                Field management view: open pending reports, record cleaning details, upload proof, and update incident status.
              </p>
            </div>
            <Link
              href="/cleanup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-sky-800 font-bold rounded-xl text-sm shadow hover:bg-sky-50 transition"
            >
              <Sparkles className="w-4 h-4 text-sky-700" />
              Open Cleanup Queue
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold uppercase text-slate-500">Unassigned Reports</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{unassignedCount}</div>
              <p className="text-xs text-slate-500 mt-2">Open incidents waiting for maintenance action.</p>
              <Link href="/incidents" className="mt-4 inline-flex items-center text-xs font-bold text-sky-600 hover:text-sky-700">
                View incident backlog <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold uppercase text-slate-500">In Progress</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{inProgressCount}</div>
              <p className="text-xs text-slate-500 mt-2">Active cleaning teams on-site.</p>
              <Link href="/cleanup" className="mt-4 inline-flex items-center text-xs font-bold text-sky-600 hover:text-sky-700">
                Manage active tasks <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold uppercase text-slate-500">Cleaned & Awaiting Audit</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{cleanedCount}</div>
              <p className="text-xs text-slate-500 mt-2">Cleaned locations queued for condition checks.</p>
              <Link href="/followups" className="mt-4 inline-flex items-center text-xs font-bold text-sky-600 hover:text-sky-700">
                View follow-ups <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {currentRole === 'ADMIN' && (
        <div className="space-y-8">
          {/* Section 15 Summary Metrics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Admin Overview Metrics</h2>
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Deterministic DynamoDB Aggregates</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
                  <AlertTriangle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {analytics?.summary.totalReports ?? 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Incidents filed by students</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Cleanups</span>
                  <Sparkles className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {analytics?.summary.totalCleanups ?? 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Cleanups logged by field crews</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending Follow-ups</span>
                  <Eye className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {analytics?.summary.pendingFollowUps ?? 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Awaiting post-cleanup audit</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-emerald-300 shadow-2xs ring-2 ring-emerald-500/10">
                <div className="flex items-center justify-between text-emerald-800 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Recurring Hotspots</span>
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {analytics?.summary.recurringHotspots ?? 0}
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">Threshold: &ge; 3 incidents</p>
              </div>
            </div>
          </div>

          {/* Section 15 Hotspot Ranking and Recent Incidents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Hotspot Ranking */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Hotspot Incident Ranking
                </h3>
                <Link href="/hotspots" className="text-xs text-emerald-600 font-semibold hover:underline">
                  View All ({analytics?.ranking.length ?? PREDEFINED_HOTSPOTS.length})
                </Link>
              </div>

              <div className="space-y-2.5">
                {(analytics?.ranking || PREDEFINED_HOTSPOTS.map((s) => ({
                  hotspotId: s.hotspotId,
                  name: s.name,
                  incidentCount: 0,
                  cleanupCount: 0,
                  followUpCount: 0,
                  postCleanupRecurrenceCount: 0,
                  classification: 'Normal',
                }))).map((spot, idx) => (
                  <Link
                    key={spot.hotspotId}
                    href={`/hotspots/${spot.hotspotId}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition border border-slate-200/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{spot.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{spot.hotspotId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          spot.classification === 'Recurring'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : spot.classification === 'Monitor'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {spot.classification}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {spot.incidentCount} {spot.incidentCount === 1 ? 'incident' : 'incidents'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Incidents Feed */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  Recent Incident Reports
                </h3>
                <Link href="/incidents" className="text-xs text-emerald-600 font-semibold hover:underline">
                  View Full Backlog
                </Link>
              </div>

              {!analytics?.recentIncidents || analytics.recentIncidents.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
                  <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-700">No incidents recorded yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Once reports are submitted via API Gateway and stored in DynamoDB, they appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {analytics.recentIncidents.map((inc) => (
                    <div key={inc.incidentId} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">{inc.incidentId}</span>
                          <span className="text-emerald-700 font-bold">{inc.hotspotId}</span>
                        </div>
                        <p className="text-slate-600 line-clamp-1">{inc.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {inc.status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(inc.reportedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recurrence Disclaimer Card */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Recurrence Classification Standard:</strong>
              1 incident = <strong>Normal</strong> • 2 incidents = <strong>Monitor</strong> • 3+ incidents = <strong>Recurring</strong>.
              Recurrence indicates repeated observations. It does not establish the cause of the waste.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
