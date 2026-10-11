import React from 'react';
import {
  IncidentStatus,
  CleanupStatus,
  FollowUpCondition,
  RecurrenceClassification,
} from '@/types';
import { AlertCircle, Clock, CheckCircle2, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

type BadgeType =
  | IncidentStatus
  | CleanupStatus
  | FollowUpCondition
  | RecurrenceClassification
  | string;

interface StatusBadgeProps {
  status: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export default function StatusBadge({
  status,
  size = 'md',
  showDot = true,
  className = '',
}: StatusBadgeProps) {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;
  let icon: React.ReactNode = null;

  switch (status) {
    // Incident Status
    case 'REPORTED':
      style = 'bg-amber-50 text-amber-800 border-amber-200';
      label = 'Reported';
      icon = <Clock className="w-3 h-3 text-amber-600" />;
      break;
    case 'IN_PROGRESS':
      style = 'bg-sky-50 text-sky-800 border-sky-200';
      label = 'In Progress';
      icon = <Clock className="w-3 h-3 text-sky-600 animate-spin" />;
      break;
    case 'CLEANED':
      style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      label = 'Cleaned';
      icon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
      break;
    case 'FOLLOW_UP_REQUIRED':
      style = 'bg-purple-50 text-purple-800 border-purple-200';
      label = 'Follow-up Needed';
      icon = <AlertTriangle className="w-3 h-3 text-purple-600" />;
      break;
    case 'RESOLVED':
      style = 'bg-teal-50 text-teal-800 border-teal-200';
      label = 'Resolved';
      icon = <ShieldCheck className="w-3 h-3 text-teal-600" />;
      break;

    // Follow-Up Conditions
    case 'CLEAN':
      style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      label = 'Verified Clean';
      icon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
      break;
    case 'WASTE_PRESENT':
      style = 'bg-rose-50 text-rose-800 border-rose-200';
      label = 'Waste Present';
      icon = <AlertCircle className="w-3 h-3 text-rose-600" />;
      break;
    case 'PARTIALLY_CLEAN':
      style = 'bg-amber-50 text-amber-800 border-amber-200';
      label = 'Partially Clean';
      icon = <AlertTriangle className="w-3 h-3 text-amber-600" />;
      break;
    case 'UNKNOWN':
      style = 'bg-slate-100 text-slate-700 border-slate-200';
      label = 'Condition Unknown';
      break;

    // Recurrence Classification
    case 'Normal':
      style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      label = 'Normal';
      icon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
      break;
    case 'Monitor':
      style = 'bg-amber-50 text-amber-800 border-amber-200';
      label = 'Monitoring (2 Incidents)';
      icon = <AlertTriangle className="w-3 h-3 text-amber-600" />;
      break;
    case 'Recurring':
      style = 'bg-purple-50 text-purple-800 border-purple-200 font-bold';
      label = 'Recurring Hotspot (≥ 3)';
      icon = <RefreshCw className="w-3 h-3 text-purple-600 animate-spin-slow" />;
      break;

    // Cleanup Status
    case 'PENDING':
      style = 'bg-amber-50 text-amber-800 border-amber-200';
      label = 'Pending';
      break;
    case 'COMPLETED':
      style = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      label = 'Completed';
      icon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
      break;

    default:
      label = status;
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2 py-0.5 gap-1'
      : size === 'lg'
      ? 'text-xs px-3 py-1 gap-1.5'
      : 'text-xs px-2.5 py-0.5 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs whitespace-nowrap ${sizeClasses} ${style} ${className}`}
    >
      {showDot && (icon || <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />)}
      <span>{label}</span>
    </span>
  );
}
