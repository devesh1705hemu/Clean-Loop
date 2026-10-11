'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Sparkles,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Layers,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface Slide {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  problemStatement?: string;
  solutionStatement: string;
  keyPoints: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }[];
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  renderInteractiveVisual: () => React.ReactNode;
}

export default function WorkflowSlideShow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeAuditTab, setActiveAuditTab] = useState<'clean' | 'waste'>('waste');
  const [simulatedIncidentCount, setSimulatedIncidentCount] = useState(3);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const SLIDE_DURATION = 7000; // 7 seconds per slide

  const slides: Slide[] = [
    {
      id: 'what-we-solve',
      badge: 'STEP 1 OF 4 • WHAT CLEANLOOP SOLVES',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      title: 'The "Clean & Forget" Illusion',
      subtitle: 'Why traditional waste management cleans the same spots endlessly without solving anything.',
      problemStatement:
        'Standard campus operations treat every report as an isolated ticket. Trash is swept and the ticket is closed, yet 24 hours later, the identical spot is littered again. Facilities teams stay trapped in an endless, expensive cleanup loop with zero visibility into chronic root causes.',
      solutionStatement:
        'CleanLoop fixes this by assigning immutable Hotspot IDs to campus locations and recording the post-cleanup lifecycle. Instead of closing tickets, CleanLoop tracks whether waste returns after cleaning.',
      keyPoints: [
        {
          icon: Clock,
          title: 'Eliminates Blind Cleanups',
          description:
            'A swept area is no longer treated as "case closed". It enters a monitored post-clean observation phase.',
        },
        {
          icon: Layers,
          title: 'Immutable Hotspot Memory',
          description:
            'All events at Library Gate, Cafeteria, etc. are bound to a single timeline to expose repeated dumping.',
        },
        {
          icon: TrendingUp,
          title: 'Distinguishes Outliers from Chronic Sites',
          description:
            'Separates one-off accidental litter from locations needing structural bins and schedule changes.',
        },
      ],
      ctaText: 'Report an Incident',
      ctaLink: '/report',
      secondaryCtaText: 'View Chronic Hotspots',
      secondaryCtaLink: '/hotspots',
      renderInteractiveVisual: () => (
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400">System Comparison</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Core Problem
              </span>
            </div>

            {/* Traditional Method */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-800/60 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Traditional Campus Ticketing</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono pt-1">
                <div className="bg-slate-900/80 p-2 rounded border border-slate-700">1. Report</div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-700">2. Sweep</div>
                <div className="bg-rose-900/40 text-rose-300 p-2 rounded border border-rose-700/60 font-semibold">
                  3. Ticket Closed ✕
                </div>
              </div>
              <p className="text-[11px] text-slate-400 italic pt-1">
                ⚠️ Trash returns 24h later unnoticed. Facilities records a &ldquo;successful job&rdquo; while the problem festers.
              </p>
            </div>

            {/* CleanLoop Method */}
            <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>CleanLoop Deterministic Loop</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[11px] font-mono pt-1">
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-700">Report</div>
                <div className="bg-slate-900/80 p-1.5 rounded border border-slate-700">Clean</div>
                <div className="bg-amber-950/60 text-amber-300 p-1.5 rounded border border-amber-600/60 font-semibold">
                  Audit
                </div>
                <div className="bg-emerald-900/60 text-emerald-300 p-1.5 rounded border border-emerald-500 font-semibold">
                  Recur Engine
                </div>
              </div>
              <p className="text-[11px] text-emerald-300/90 pt-1">
                ✓ Full persistence. When waste returns post-clean, recurrence is automatically logged.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Result: Root-cause transparency</span>
            <span className="text-emerald-400 font-semibold">100% Deterministic</span>
          </div>
        </div>
      ),
    },
    {
      id: 'how-after-clean-audit',
      badge: 'STEP 2 OF 4 • VERIFY AFTER CLEAN',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      title: 'Mandatory Follow-Up Verification',
      subtitle: 'What happens immediately after the cleanup team sweeps the area.',
      problemStatement:
        'Anyone can mark a work order complete. Without physical verification, incomplete jobs and immediate re-littering remain unaddressed.',
      solutionStatement:
        'After cleanup operations, CleanLoop requires an independent Follow-Up Inspection. Auditors visit the hotspot and record one of two deterministic conditions.',
      keyPoints: [
        {
          icon: Sparkles,
          title: '1. Cleanup Crew Marks "CLEANED"',
          description:
            'Field workers log notes, timestamp, and optional evidence photo upon clearing the site.',
        },
        {
          icon: Eye,
          title: '2. Site Inspector Re-Audits The Location',
          description:
            'A physical inspection logs condition: CLEAN (area remains pristine) or WASTE_PRESENT (trash returned).',
        },
        {
          icon: ShieldCheck,
          title: '3. Immediate Branching Logic',
          description:
            'CLEAN verifies cleanup efficacy. WASTE_PRESENT immediately activates the Recurrence Engine for that hotspot.',
        },
      ],
      ctaText: 'Record a Follow-Up',
      ctaLink: '/followup',
      secondaryCtaText: 'View Cleanup Queue',
      secondaryCtaLink: '/cleanup',
      renderInteractiveVisual: () => (
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400">Interactive Follow-Up Simulator</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Live Audit Test
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <span className="text-xs text-slate-300 font-medium">Toggle inspector observation condition:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAuditTab('clean')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    activeAuditTab === 'clean'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  CLEAN (No Litter)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAuditTab('waste')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    activeAuditTab === 'waste'
                      ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  WASTE_PRESENT (Returned)
                </button>
              </div>
            </div>

            {/* Condition outcome display */}
            <div className="mt-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700 transition">
              {activeAuditTab === 'clean' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Inspection Verdict: Verified Clean</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Hotspot remains in <strong>Normal</strong> standing. No post-cleanup recurrence incremented. Incident safely moves toward resolution.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-300">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700">
                      Recurrence Increment: +0
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                      State: Resolved
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Inspection Verdict: Waste Detected After Clean</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Recurrence engine immediately flags hotspot. Chronological timestamp compared against prior cleanup date.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-amber-300">
                    <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-700">
                      Post-Clean Recurrence: +1
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700">
                      Classification: Monitor / Recurring
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Audit Target: HOTSPOT-001 (Library Gate)</span>
            <span className="text-amber-400 font-medium">Audited & Verified</span>
          </div>
        </div>
      ),
    },
    {
      id: 'how-after-clean-engine',
      badge: 'STEP 3 OF 4 • RECURRENCE ENGINE',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      title: 'Deterministic Recurrence Math',
      subtitle: 'Pure algorithmic classification without black-box guessing or fuzzy heuristics.',
      problemStatement:
        'Heuristic scoring or AI guessing creates false alarms and lack of trust from facilities management.',
      solutionStatement:
        'CleanLoop uses a transparent, deterministic mathematical rule: when a new incident is created, we count all incidents created strictly after the earliest verified cleanup timestamp.',
      keyPoints: [
        {
          icon: RefreshCw,
          title: '1 Incident → Classification: Normal',
          description:
            'Baseline observation. Standard campus background waste. No special intervention required.',
        },
        {
          icon: AlertTriangle,
          title: '2 Incidents → Classification: Monitor',
          description:
            'Repeat occurrence detected. Location flagged on facility watchlists for frequent observation.',
        },
        {
          icon: XCircle,
          title: '3+ Incidents → Classification: Recurring',
          description:
            'Chronic hotspot verified deterministically. Elevated priority requiring structural bin or patrol changes.',
        },
      ],
      ctaText: 'Test Recurrence on Hotspots',
      ctaLink: '/hotspots',
      secondaryCtaText: 'View Dashboard Analytics',
      secondaryCtaLink: '/dashboard',
      renderInteractiveVisual: () => (
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400">Recurrence Threshold Engine</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Formula Engine
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Simulate Incident Count:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {simulatedIncidentCount} {simulatedIncidentCount === 1 ? 'incident' : 'incidents'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSimulatedIncidentCount(num)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                      simulatedIncidentCount === num
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {num} {num === 1 ? 'Report' : 'Reports'}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated State Card */}
            <div className="mt-4 p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Hotspot Status</span>
                <span
                  className={`text-xs font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${
                    simulatedIncidentCount === 1
                      ? 'bg-slate-700 text-slate-200'
                      : simulatedIncidentCount === 2
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  }`}
                >
                  {simulatedIncidentCount === 1
                    ? 'NORMAL'
                    : simulatedIncidentCount === 2
                    ? 'MONITOR'
                    : 'RECURRING HOTSPOT'}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Formula:</span>
                  <span>count(createdAt &gt; firstCleanup)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Post-Clean Recurrence:</span>
                  <span className="text-white font-bold">{simulatedIncidentCount - 1}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60 leading-relaxed">
                {simulatedIncidentCount === 1 && '✓ Single occurrence. Normal university operations.'}
                {simulatedIncidentCount === 2 && '⚠️ Repeat incident detected after cleanup. Escalated to Monitor.'}
                {simulatedIncidentCount >= 3 && '🚨 Chronic failure identified. Requires facility infrastructure upgrade.'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Rule: Normal ≤1, Monitor = 2, Recurring ≥3</span>
            <span className="text-emerald-400">Zero Heuristics</span>
          </div>
        </div>
      ),
    },
    {
      id: 'how-after-clean-action',
      badge: 'STEP 4 OF 4 • PERMANENT PREVENTION',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      title: 'From Sweeping to Permanent Prevention',
      subtitle: 'How campus facilities use recurrence intelligence to stop the trash from coming back.',
      problemStatement:
        'Without longitudinal data, facilities departments waste staff hours repeatedly sending cleaning crews to the same black holes without fixing the root cause.',
      solutionStatement:
        'With CleanLoop, facility managers have chronological audit timelines for every campus hotspot, providing empirical evidence to justify real infrastructure investments.',
      keyPoints: [
        {
          icon: MapPin,
          title: 'Infrastructure Upgrades',
          description:
            'Install double-capacity sorting stations at Library Gate (HOTSPOT-001) where plastic waste repeatedly returns.',
        },
        {
          icon: Clock,
          title: 'Optimized Cleaning Shifts',
          description:
            'Reschedule cleaning rounds to right after cafeteria lunch rush (HOTSPOT-003) rather than fixed static hours.',
        },
        {
          icon: ShieldCheck,
          title: 'End-to-End Accountability',
          description:
            'Complete audit trail from student report → cleanup crew → inspector audit → facility upgrade.',
        },
      ],
      ctaText: 'Explore Facilities Dashboard',
      ctaLink: '/dashboard',
      secondaryCtaText: 'Browse All Hotspots',
      secondaryCtaLink: '/hotspots',
      renderInteractiveVisual: () => (
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400">Campus Hotspot Audit Timeline</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                HOTSPOT-001
              </span>
            </div>

            {/* Timeline Stream Preview */}
            <div className="mt-4 space-y-2.5 relative pl-4 border-l-2 border-slate-700">
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-slate-900" />
                <div className="text-[11px] font-mono text-slate-400">09:15 AM • Student Report</div>
                <div className="text-xs font-medium text-slate-200">Plastic bottles & food wrappers near bike rack</div>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-slate-900" />
                <div className="text-[11px] font-mono text-slate-400">11:00 AM • Cleanup Completed</div>
                <div className="text-xs font-medium text-slate-200">Site swept & sanitized by Team Alpha</div>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-slate-900" />
                <div className="text-[11px] font-mono text-slate-400">03:30 PM • Follow-up Inspection</div>
                <div className="text-xs font-medium text-amber-300">WASTE_PRESENT returned at exact same hotspot</div>
              </div>

              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-slate-900" />
                <div className="text-[11px] font-mono text-slate-400">Facility Action Plan</div>
                <div className="text-xs font-bold text-emerald-300">Permanent dual recycling station installed</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Result: CleanLoop Closed</span>
            <span className="text-emerald-400 font-bold">Problem Resolved</span>
          </div>
        </div>
      ),
    },
  ];

  // Auto-play timer that strictly advances 0 -> 1 -> 2 -> 3 -> 0 (Steps 1 -> 2 -> 3 -> 4 -> 1)
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const startTime = Date.now();
    const intervalTime = 40; // Update progress smoothly every 40ms

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);

      if (pct >= 100) {
        clearInterval(intervalId);
        setProgress(0);
        setCurrentSlide((curr) => (curr + 1) % slides.length);
      } else {
        setProgress(pct);
      }
    }, intervalTime);

    return () => {
      clearInterval(intervalId);
    };
  }, [isPlaying, currentSlide, slides.length]);

  const handleNext = () => {
    setProgress(0);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setProgress(0);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleSelectSlide = (index: number) => {
    setProgress(0);
    setCurrentSlide(index);
  };

  const current = slides[currentSlide];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <RefreshCw className="w-3.5 h-3.5" />
              Interactive Workflow Showcase
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What CleanLoop Solves &amp; How It Works After Clean
            </h2>
            <p className="mt-2 text-base text-slate-600 max-w-2xl">
              Understand the core problem of blind cleanups and explore the deterministic verification loop step-by-step.
            </p>
          </div>

          {/* Player controls */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition"
              title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-600" />}
            </button>
            <button
              type="button"
              onClick={handlePrev}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition"
              title="Previous slide"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition"
              title="Next slide"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          {slides.map((slide, idx) => {
            const isActive = idx === currentSlide;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => handleSelectSlide(idx)}
                className={`relative p-3.5 rounded-xl text-left transition border ${
                  isActive
                    ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                    : 'bg-slate-100/70 border-slate-200 hover:bg-white/80 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    Step {idx + 1}
                  </span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {slide.title}
                </div>
                {/* Progress bar for active tab */}
                {isActive && isPlaying && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-xl overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Slide Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Badge & slide count */}
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border tracking-wide ${current.badgeColor}`}
                  >
                    {current.badge}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Step {currentSlide + 1} of 4
                    </span>
                    <div className="flex items-center gap-1" aria-hidden="true">
                      {slides.map((_, dotIdx) => (
                        <span
                          key={dotIdx}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            dotIdx === currentSlide
                              ? 'w-5 bg-emerald-600'
                              : 'w-2 bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {current.title}
                  </h3>
                  <p className="mt-1.5 text-sm sm:text-base text-slate-600 font-medium">
                    {current.subtitle}
                  </p>
                </div>

                {/* Narrative Statement */}
                <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  {current.problemStatement && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      <strong className="text-slate-900">The Problem: </strong>
                      {current.problemStatement}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    <strong className="text-emerald-700">How CleanLoop Solves It: </strong>
                    {current.solutionStatement}
                  </p>
                </div>

                {/* Key Points */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {current.keyPoints.map((pt, pIdx) => {
                    const IconComponent = pt.icon;
                    return (
                      <div
                        key={pIdx}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs space-y-1.5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{pt.title}</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {pt.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTAs & Navigation Footer */}
              <div className="pt-8 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={current.ctaLink}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
                  >
                    {current.ctaText}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  {current.secondaryCtaText && current.secondaryCtaLink && (
                    <Link
                      href={current.secondaryCtaLink}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm transition"
                    >
                      {current.secondaryCtaText}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {/* Indicator Dots */}
                <div className="flex items-center gap-1.5">
                  {slides.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => handleSelectSlide(dotIdx)}
                      className={`h-2 rounded-full transition-all ${
                        dotIdx === currentSlide ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                      }`}
                      aria-label={`Jump to slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Interactive Simulator Column (5 cols) */}
            <div className="lg:col-span-5 bg-slate-950 p-6 sm:p-8 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-800">
              {current.renderInteractiveVisual()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
