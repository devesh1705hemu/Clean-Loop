export interface HotspotTimelineItem {
  SK: string;
  type?: 'INCIDENT' | 'CLEANUP' | 'FOLLOWUP';
  createdAt?: string;
  reportedAt?: string;
  performedAt?: string;
  observedAt?: string;
  condition?: string;
  [key: string]: unknown;
}

export interface ThresholdConfig {
  normalMax: number;
  monitorMax: number;
  recurringMin: number;
  elevateOnPostCleanupRecurrence?: boolean;
}

export interface RecurrenceResult {
  hotspotId: string;
  recurrenceCount: number;
  totalIncidents: number;
  totalCleanups: number;
  totalFollowUps: number;
  postCleanupRecurrenceCount: number;
  lastIncidentDate?: string;
  lastCleanupDate?: string;
  lastFollowUpDate?: string;
  classification: 'Normal' | 'Monitor' | 'Recurring';
  thresholdUsed: ThresholdConfig;
  disclaimer: string;
}

export function calculateHotspotRecurrence(
  hotspotId: string,
  items: HotspotTimelineItem[],
  thresholdConfig: ThresholdConfig = {
    normalMax: 1,
    monitorMax: 2,
    recurringMin: 3,
    elevateOnPostCleanupRecurrence: true,
  }
): RecurrenceResult {
  // Separate items by sort key prefix
  const incidents = items.filter((it) => it.SK && it.SK.startsWith('INCIDENT#'));
  const cleanups = items.filter((it) => it.SK && it.SK.startsWith('CLEANUP#'));
  const followups = items.filter((it) => it.SK && it.SK.startsWith('FOLLOWUP#'));

  const totalIncidents = incidents.length;
  const totalCleanups = cleanups.length;
  const totalFollowUps = followups.length;

  // Extract timestamps
  const incidentTimestamps = incidents
    .map((it) => (it.createdAt || it.reportedAt || it.SK.split('#')[1]) as string)
    .sort();

  const cleanupTimestamps = cleanups
    .map((it) => (it.performedAt || it.createdAt || it.SK.split('#')[1]) as string)
    .sort();

  const followUpTimestamps = followups
    .map((it) => (it.observedAt || it.createdAt || it.SK.split('#')[1]) as string)
    .sort();

  // Post-cleanup recurrence calculation:
  // Count incidents that occurred after at least one cleanup was performed
  let postCleanupRecurrenceCount = 0;
  if (cleanupTimestamps.length > 0) {
    const firstCleanupTime = cleanupTimestamps[0];
    postCleanupRecurrenceCount = incidentTimestamps.filter(
      (ts) => ts > firstCleanupTime
    ).length;
  }

  // Recurrence Count: total distinct incidents for this hotspot during period
  const recurrenceCount = totalIncidents;

  // Deterministic classification
  let classification: 'Normal' | 'Monitor' | 'Recurring' = 'Normal';

  if (totalIncidents >= thresholdConfig.recurringMin) {
    classification = 'Recurring';
  } else if (
    thresholdConfig.elevateOnPostCleanupRecurrence &&
    postCleanupRecurrenceCount > 0 &&
    totalIncidents >= thresholdConfig.monitorMax
  ) {
    // Section 14 critical MVP proof:
    // Repeated incident detected at hotspot after verified cleanup elevates hotspot to Recurring
    classification = 'Recurring';
  } else if (totalIncidents >= thresholdConfig.monitorMax) {
    classification = 'Monitor';
  }

  return {
    hotspotId,
    recurrenceCount,
    totalIncidents,
    totalCleanups,
    totalFollowUps,
    postCleanupRecurrenceCount,
    lastIncidentDate: incidentTimestamps[incidentTimestamps.length - 1],
    lastCleanupDate: cleanupTimestamps[cleanupTimestamps.length - 1],
    lastFollowUpDate: followUpTimestamps[followUpTimestamps.length - 1],
    classification,
    thresholdUsed: thresholdConfig,
    disclaimer: 'Recurrence indicates repeated observations. It does not establish the cause of the waste.',
  };
}
