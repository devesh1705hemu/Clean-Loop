import {
  ApiResponse,
  Incident,
  WasteCategory,
  IncidentStatus,
  CleanupRecord,
  CleanupStatus,
  FollowUpRecord,
  FollowUpCondition,
  Hotspot,
  RecurrenceMetrics,
  TimelineEvent,
  PREDEFINED_HOTSPOTS,
} from '@/types';
import { cognitoAuth } from './cognito';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthHeaders(): HeadersInit {
  const session = cognitoAuth.getCurrentSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.idToken || session?.token) {
    headers['Authorization'] = `Bearer ${session.idToken || session.token}`;
  }
  return headers;
}

export interface CreateIncidentPayload {
  hotspotId: string;
  wasteCategory: WasteCategory;
  description: string;
  photoKey?: string;
  photoUrl?: string;
}

export interface CreateCleanupPayload {
  incidentId: string;
  hotspotId: string;
  notes: string;
  photoKey?: string;
  photoUrl?: string;
  status?: CleanupStatus;
}

export interface CreateFollowUpPayload {
  incidentId: string;
  hotspotId: string;
  condition: FollowUpCondition;
  notes?: string;
  photoKey?: string;
  photoUrl?: string;
}

export interface PresignedUploadRequest {
  fileName: string;
  contentType: string;
  sizeBytes?: number;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  photoKey: string;
  expiresIn: number;
  bucket: string;
}

// In-browser fallback store for local demo / development
const LOCAL_INCIDENTS_STORAGE_KEY = 'cleanloop_persisted_incidents';
const LOCAL_CLEANUPS_STORAGE_KEY = 'cleanloop_persisted_cleanups';
const LOCAL_FOLLOWUPS_STORAGE_KEY = 'cleanloop_persisted_followups';

export function getLocalIncidents(): Incident[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_INCIDENTS_STORAGE_KEY);
  if (!stored) {
    const seed: Incident[] = [
      {
        incidentId: 'INC-100001',
        hotspotId: 'HOTSPOT-001',
        reportedBy: 'student.dev@university.edu',
        reportedAt: '2026-10-06T09:15:00Z',
        wasteCategory: 'Plastic',
        description: 'Multiple plastic bottles and takeaway packaging piled near bike racks.',
        status: 'CLEANED',
        createdAt: '2026-10-06T09:15:00Z',
        updatedAt: '2026-10-06T11:00:00Z',
      },
      {
        incidentId: 'INC-100002',
        hotspotId: 'HOTSPOT-001',
        reportedBy: 'student.priya@university.edu',
        reportedAt: '2026-10-07T08:30:00Z',
        wasteCategory: 'Food Waste',
        description: 'Post-cleanup recurrence: food containers and beverage cups returned at same hotspot.',
        status: 'REPORTED',
        createdAt: '2026-10-07T08:30:00Z',
        updatedAt: '2026-10-07T08:30:00Z',
      },
      {
        incidentId: 'INC-100003',
        hotspotId: 'HOTSPOT-003',
        reportedBy: 'student.arjun@university.edu',
        reportedAt: '2026-10-07T10:00:00Z',
        wasteCategory: 'Mixed Waste',
        description: 'Overflowing bin perimeter during lunchtime peak.',
        status: 'IN_PROGRESS',
        createdAt: '2026-10-07T10:00:00Z',
        updatedAt: '2026-10-07T10:45:00Z',
      },
    ];
    localStorage.setItem(LOCAL_INCIDENTS_STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveLocalIncident(incident: Incident): void {
  if (typeof window === 'undefined') return;
  const current = getLocalIncidents();
  const updated = [incident, ...current];
  localStorage.setItem(LOCAL_INCIDENTS_STORAGE_KEY, JSON.stringify(updated));
}

export function updateLocalIncidentStatus(incidentId: string, status: IncidentStatus): Incident | null {
  if (typeof window === 'undefined') return null;
  const current = getLocalIncidents();
  let updatedItem: Incident | null = null;
  const updated = current.map((inc) => {
    if (inc.incidentId === incidentId) {
      updatedItem = {
        ...inc,
        status,
        updatedAt: new Date().toISOString(),
      };
      return updatedItem;
    }
    return inc;
  });
  localStorage.setItem(LOCAL_INCIDENTS_STORAGE_KEY, JSON.stringify(updated));
  return updatedItem;
}

export function getLocalCleanups(): CleanupRecord[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_CLEANUPS_STORAGE_KEY);
  if (!stored) {
    const seed: CleanupRecord[] = [
      {
        cleanupId: 'CLN-1001',
        incidentId: 'INC-100001',
        hotspotId: 'HOTSPOT-001',
        performedBy: 'cleanup.team1@cleanloop.internal',
        performedAt: '2026-10-06T11:00:00Z',
        status: 'COMPLETED',
        notes: 'Area cleared of plastic bottles and waste containers sanitized.',
        createdAt: '2026-10-06T11:00:00Z',
      },
    ];
    localStorage.setItem(LOCAL_CLEANUPS_STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveLocalCleanup(record: CleanupRecord): void {
  if (typeof window === 'undefined') return;
  const current = getLocalCleanups();
  const updated = [record, ...current];
  localStorage.setItem(LOCAL_CLEANUPS_STORAGE_KEY, JSON.stringify(updated));
}

export function getLocalFollowUps(): FollowUpRecord[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_FOLLOWUPS_STORAGE_KEY);
  if (!stored) {
    const seed: FollowUpRecord[] = [
      {
        followUpId: 'FOL-5001',
        incidentId: 'INC-100001',
        hotspotId: 'HOTSPOT-001',
        observedBy: 'inspector.sarah@university.edu',
        observedAt: '2026-10-06T15:30:00Z',
        condition: 'CLEAN',
        notes: 'Perimeter inspected. No visible litter remains after morning cleanup.',
        createdAt: '2026-10-06T15:30:00Z',
      },
      {
        followUpId: 'FOL-5002',
        incidentId: 'INC-100002',
        hotspotId: 'HOTSPOT-001',
        observedBy: 'inspector.sarah@university.edu',
        observedAt: '2026-10-07T12:00:00Z',
        condition: 'WASTE_PRESENT',
        notes: 'Waste returned at exact same hotspot after evening shift. Recurrence detected.',
        createdAt: '2026-10-07T12:00:00Z',
      },
    ];
    localStorage.setItem(LOCAL_FOLLOWUPS_STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveLocalFollowUp(record: FollowUpRecord): void {
  if (typeof window === 'undefined') return;
  const current = getLocalFollowUps();
  const updated = [record, ...current];
  localStorage.setItem(LOCAL_FOLLOWUPS_STORAGE_KEY, JSON.stringify(updated));
}

// Deterministic recurrence calculation helper matching backend services/recurrence.ts
export function calculateLocalRecurrence(hotspotId: string): RecurrenceMetrics {
  const incidents = getLocalIncidents().filter((i) => i.hotspotId === hotspotId);
  const cleanups = getLocalCleanups().filter((c) => c.hotspotId === hotspotId);
  const followups = getLocalFollowUps().filter((f) => f.hotspotId === hotspotId);

  const incidentTimestamps = incidents.map((i) => i.createdAt).sort();
  const cleanupTimestamps = cleanups.map((c) => c.performedAt).sort();
  const followUpTimestamps = followups.map((f) => f.observedAt).sort();

  let postCleanupRecurrenceCount = 0;
  if (cleanupTimestamps.length > 0) {
    const firstCleanupTime = cleanupTimestamps[0];
    postCleanupRecurrenceCount = incidentTimestamps.filter((ts) => ts > firstCleanupTime).length;
  }

  const recurrenceCount = incidents.length;
  let classification: 'Normal' | 'Monitor' | 'Recurring' = 'Normal';
  if (incidents.length >= 3) {
    classification = 'Recurring';
  } else if (incidents.length === 2) {
    classification = 'Monitor';
  }

  return {
    hotspotId,
    recurrenceCount,
    totalIncidents: incidents.length,
    totalCleanups: cleanups.length,
    totalFollowUps: followups.length,
    postCleanupRecurrenceCount,
    lastIncidentDate: incidentTimestamps[incidentTimestamps.length - 1],
    lastCleanupDate: cleanupTimestamps[cleanupTimestamps.length - 1],
    lastFollowUpDate: followUpTimestamps[followUpTimestamps.length - 1],
    classification,
    thresholdUsed: { normalMax: 1, monitorMax: 2, recurringMin: 3 },
    disclaimer: 'Recurrence indicates repeated observations. It does not establish the cause of the waste.',
  };
}

export const api = {
  // 1. INCIDENTS
  createIncident: async (payload: CreateIncidentPayload): Promise<ApiResponse<Incident>> => {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/incidents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return response.json();
    }

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const json = await response.json();
        saveLocalIncident(json.data);
        return json;
      }
    } catch {
      // Fallback
    }

    const session = cognitoAuth.getCurrentSession();
    const timestamp = new Date().toISOString();
    const newIncident: Incident = {
      incidentId: `INC-${Date.now().toString().slice(-6)}`,
      hotspotId: payload.hotspotId,
      reportedBy: session?.email || 'student.anonymous@cleanloop.internal',
      reportedAt: timestamp,
      wasteCategory: payload.wasteCategory,
      description: payload.description,
      photoKey: payload.photoKey,
      photoUrl: payload.photoUrl,
      status: 'REPORTED',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    saveLocalIncident(newIncident);
    return {
      success: true,
      data: newIncident,
      message: 'Incident created successfully',
    };
  },

  getIncidents: async (filter?: { status?: string; hotspotId?: string; reportedBy?: string }): Promise<ApiResponse<Incident[]>> => {
    if (API_BASE_URL) {
      const params = new URLSearchParams();
      if (filter?.status) params.append('status', filter.status);
      const url = `${API_BASE_URL}/incidents${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.json();
    }

    try {
      const response = await fetch('/api/incidents', {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Fallback
    }

    let items = getLocalIncidents();
    if (filter?.status && filter.status !== 'ALL') {
      items = items.filter((i) => i.status === filter.status);
    }
    if (filter?.hotspotId && filter.hotspotId !== 'ALL') {
      items = items.filter((i) => i.hotspotId === filter.hotspotId);
    }
    if (filter?.reportedBy) {
      items = items.filter((i) => i.reportedBy === filter.reportedBy);
    }

    return {
      success: true,
      data: items,
      message: 'Incidents retrieved successfully',
    };
  },

  getIncidentById: async (id: string): Promise<ApiResponse<Incident>> => {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/incidents/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.json();
    }

    const items = getLocalIncidents();
    const found = items.find((i) => i.incidentId === id);
    if (!found) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: `Incident ${id} not found` },
      };
    }

    return {
      success: true,
      data: found,
      message: 'Incident retrieved successfully',
    };
  },

  updateIncidentStatus: async (id: string, status: IncidentStatus): Promise<ApiResponse<Incident>> => {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/incidents/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      return response.json();
    }

    const updated = updateLocalIncidentStatus(id, status);
    if (!updated) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: `Incident ${id} not found` },
      };
    }

    return {
      success: true,
      data: updated,
      message: `Incident status updated to ${status}`,
    };
  },

  // 2. CLEANUPS (Section 11)
  createCleanup: async (payload: CreateCleanupPayload): Promise<ApiResponse<CleanupRecord>> => {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/cleanups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return response.json();
    }

    try {
      const response = await fetch('/api/cleanups', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const json = await response.json();
        saveLocalCleanup(json.data);
        updateLocalIncidentStatus(payload.incidentId, 'CLEANED');
        return json;
      }
    } catch {
      // Fallback
    }

    const session = cognitoAuth.getCurrentSession();
    const timestamp = new Date().toISOString();
    const cleanupRecord: CleanupRecord = {
      cleanupId: `CLN-${Date.now().toString().slice(-6)}`,
      incidentId: payload.incidentId,
      hotspotId: payload.hotspotId,
      performedBy: session?.email || 'cleanup.staff@cleanloop.internal',
      performedAt: timestamp,
      status: payload.status || 'COMPLETED',
      notes: payload.notes,
      photoKey: payload.photoKey,
      photoUrl: payload.photoUrl,
      createdAt: timestamp,
    };

    saveLocalCleanup(cleanupRecord);
    updateLocalIncidentStatus(payload.incidentId, 'CLEANED');

    return {
      success: true,
      data: cleanupRecord,
      message: 'Cleanup recorded successfully and incident updated to CLEANED',
    };
  },

  getCleanups: async (): Promise<ApiResponse<CleanupRecord[]>> => {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/cleanups`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.json();
    }

    try {
      const response = await fetch('/api/cleanups', {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Fallback
    }

    return {
      success: true,
      data: getLocalCleanups(),
      message: 'Cleanups retrieved',
    };
  },

  // 3. FOLLOW-UPS (Section 12)
  createFollowUp: async (payload: CreateFollowUpPayload): Promise<ApiResponse<FollowUpRecord>> => {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/followups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return response.json();
    }

    try {
      const response = await fetch('/api/followups', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const json = await response.json();
        saveLocalFollowUp(json.data);
        return json;
      }
    } catch {
      // Fallback
    }

    const session = cognitoAuth.getCurrentSession();
    const timestamp = new Date().toISOString();
    const newRecord: FollowUpRecord = {
      followUpId: `FOL-${Date.now().toString().slice(-6)}`,
      incidentId: payload.incidentId,
      hotspotId: payload.hotspotId,
      observedBy: session?.email || 'field.auditor@cleanloop.internal',
      observedAt: timestamp,
      condition: payload.condition,
      notes: payload.notes || 'Standard site audit conducted.',
      photoKey: payload.photoKey,
      photoUrl: payload.photoUrl,
      createdAt: timestamp,
    };

    saveLocalFollowUp(newRecord);
    return {
      success: true,
      data: newRecord,
      message: 'Follow-up observation recorded successfully',
    };
  },

  getFollowUps: async (hotspotId?: string): Promise<ApiResponse<FollowUpRecord[]>> => {
    if (API_BASE_URL) {
      const url = `${API_BASE_URL}/followups${hotspotId ? `?hotspotId=${hotspotId}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.json();
    }

    try {
      const response = await fetch('/api/followups', {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Fallback
    }

    let items = getLocalFollowUps();
    if (hotspotId && hotspotId !== 'ALL') {
      items = items.filter((f) => f.hotspotId === hotspotId);
    }

    return {
      success: true,
      data: items,
      message: 'Follow-ups retrieved',
    };
  },

  // 4. HOTSPOTS & TIMELINE (Sections 7, 13, 16)
  getHotspots: async (): Promise<ApiResponse<Hotspot[]>> => {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/hotspots`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.json();
    }

    return {
      success: true,
      data: PREDEFINED_HOTSPOTS,
      message: 'Hotspots retrieved',
    };
  },

  getHotspotById: async (id: string): Promise<ApiResponse<Hotspot>> => {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/hotspots/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.json();
    }

    const found = PREDEFINED_HOTSPOTS.find((h) => h.hotspotId === id);
    if (!found) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: `Hotspot ${id} not found` },
      };
    }

    return {
      success: true,
      data: found,
      message: 'Hotspot retrieved',
    };
  },

  getHotspotRecurrence: async (hotspotId: string): Promise<ApiResponse<RecurrenceMetrics>> => {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/hotspots/${hotspotId}/recurrence`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.json();
    }

    try {
      const response = await fetch(`/api/hotspots/${hotspotId}/recurrence`);
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Fallback
    }

    return {
      success: true,
      data: calculateLocalRecurrence(hotspotId),
      message: 'Recurrence metrics calculated',
    };
  },

  getHotspotHistory: async (hotspotId: string): Promise<ApiResponse<TimelineEvent[]>> => {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/hotspots/${hotspotId}/history`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.json();
    }

    // Build timeline from actual stored incidents, cleanups, and follow-ups
    const incidents = getLocalIncidents().filter((i) => i.hotspotId === hotspotId);
    const cleanups = getLocalCleanups().filter((c) => c.hotspotId === hotspotId);
    const followups = getLocalFollowUps().filter((f) => f.hotspotId === hotspotId);

    const timelineEvents: TimelineEvent[] = [];

    incidents.forEach((inc) => {
      timelineEvents.push({
        id: `ev-${inc.incidentId}`,
        type: 'INCIDENT',
        timestamp: inc.createdAt || inc.reportedAt,
        title: 'Waste reported',
        description: `${inc.wasteCategory}: ${inc.description}`,
        actor: inc.reportedBy,
        statusBadge: inc.status,
      });
    });

    cleanups.forEach((cln) => {
      timelineEvents.push({
        id: `ev-${cln.cleanupId}`,
        type: 'CLEANUP',
        timestamp: cln.performedAt,
        title: 'Cleanup completed',
        description: cln.notes || 'Site cleaned and sanitized',
        actor: cln.performedBy,
        statusBadge: cln.status,
      });
    });

    followups.forEach((fol) => {
      timelineEvents.push({
        id: `ev-${fol.followUpId}`,
        type: 'FOLLOWUP',
        timestamp: fol.observedAt,
        title: `Follow-up: ${fol.condition}`,
        description: fol.notes || `Post-cleanup audit logged condition: ${fol.condition}`,
        actor: fol.observedBy,
        statusBadge: fol.condition,
      });
    });

    // Check if recurrence detected (subsequent incident after cleanup)
    const cleanupTimes = cleanups.map((c) => c.performedAt).sort();
    if (cleanupTimes.length > 0) {
      const firstCleanup = cleanupTimes[0];
      const recurringIncidents = incidents.filter((i) => (i.createdAt || i.reportedAt) > firstCleanup);
      if (recurringIncidents.length > 0) {
        timelineEvents.push({
          id: `ev-rec-${hotspotId}`,
          type: 'RECURRENCE',
          timestamp: recurringIncidents[0].createdAt || recurringIncidents[0].reportedAt,
          title: 'Recurrence detected',
          description: `Repeated waste incident (${recurringIncidents.length} post-cleanup) observed at this hotspot.`,
          actor: 'CleanLoop Recurrence Engine',
          statusBadge: 'RECURRING',
        });
      }
    }

    // Sort chronologically ascending
    timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      success: true,
      data: timelineEvents,
      message: 'Hotspot timeline events retrieved',
    };
  },

  // 5. DASHBOARD & ANALYTICS OVERVIEW (Section 15)
  getAnalyticsOverview: async (): Promise<ApiResponse<{
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
  }>> => {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/analytics/overview`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return response.json();
    }

    try {
      const response = await fetch('/api/analytics/overview');
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Fallback
    }

    const incidents = getLocalIncidents();
    const cleanups = getLocalCleanups();
    const followups = getLocalFollowUps();

    const ranking = PREDEFINED_HOTSPOTS.map((spot) => {
      const spotRecurrence = calculateLocalRecurrence(spot.hotspotId);
      return {
        hotspotId: spot.hotspotId,
        name: spot.name,
        incidentCount: spotRecurrence.totalIncidents,
        cleanupCount: spotRecurrence.totalCleanups,
        followUpCount: spotRecurrence.totalFollowUps,
        postCleanupRecurrenceCount: spotRecurrence.postCleanupRecurrenceCount,
        classification: spotRecurrence.classification,
      };
    });

    ranking.sort((a, b) => b.incidentCount - a.incidentCount);

    const recurringHotspots = ranking.filter((r) => r.classification === 'Recurring').length;
    const pendingFollowUps = Math.max(0, cleanups.length - followups.length);

    return {
      success: true,
      data: {
        summary: {
          totalReports: incidents.length,
          totalCleanups: cleanups.length,
          pendingFollowUps,
          recurringHotspots,
        },
        ranking,
        recentIncidents: incidents.slice(0, 5),
      },
      message: 'Analytics overview generated',
    };
  },

  // 6. S3 PRESIGNED IMAGE UPLOADS (Section 10)
  requestPresignedUpload: async (payload: PresignedUploadRequest): Promise<ApiResponse<PresignedUploadResponse>> => {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/uploads/presign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return response.json();
    }

    try {
      const response = await fetch('/api/uploads/presign', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Fallback
    }

    // Local simulation fallback
    const ext = payload.fileName.split('.').pop() || 'jpg';
    const photoKey = `evidence/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    return {
      success: true,
      data: {
        uploadUrl: `https://cleanloop-media-bucket.s3.amazonaws.com/${photoKey}`,
        photoKey,
        expiresIn: 900,
        bucket: 'cleanloop-media-bucket',
      },
      message: 'Simulated presigned upload url',
    };
  },

  uploadToPresignedUrl: async (uploadUrl: string, file: File): Promise<boolean> => {
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
