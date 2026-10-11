// CleanLoop Core Types & Enums

export type UserRole = 'STUDENT' | 'CLEANUP_TEAM' | 'ADMIN';

export type WasteCategory =
  | 'Plastic'
  | 'Food Waste'
  | 'Paper'
  | 'Glass'
  | 'Mixed Waste'
  | 'Other';

export const WASTE_CATEGORIES: WasteCategory[] = [
  'Plastic',
  'Food Waste',
  'Paper',
  'Glass',
  'Mixed Waste',
  'Other',
];

export type IncidentStatus =
  | 'REPORTED'
  | 'IN_PROGRESS'
  | 'CLEANED'
  | 'FOLLOW_UP_REQUIRED'
  | 'RESOLVED';

export type CleanupStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type FollowUpCondition =
  | 'CLEAN'
  | 'WASTE_PRESENT'
  | 'PARTIALLY_CLEAN'
  | 'UNKNOWN';

export type HotspotStatus = 'ACTIVE' | 'MONITORING' | 'RESOLVED';

export interface Hotspot {
  hotspotId: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  area: string;
  status: HotspotStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  incidentId: string;
  hotspotId: string;
  reportedBy: string;
  reportedAt: string;
  wasteCategory: WasteCategory;
  description: string;
  photoKey?: string;
  photoUrl?: string;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CleanupRecord {
  cleanupId: string;
  incidentId: string;
  hotspotId: string;
  performedBy: string;
  performedAt: string;
  status: CleanupStatus;
  notes: string;
  photoKey?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface FollowUpRecord {
  followUpId: string;
  incidentId: string;
  hotspotId: string;
  observedBy: string;
  observedAt: string;
  condition: FollowUpCondition;
  notes: string;
  photoKey?: string;
  photoUrl?: string;
  createdAt: string;
}

export type RecurrenceClassification = 'Normal' | 'Monitor' | 'Recurring';

export interface RecurrenceMetrics {
  hotspotId: string;
  recurrenceCount: number;
  totalIncidents: number;
  totalCleanups: number;
  totalFollowUps: number;
  postCleanupRecurrenceCount: number;
  lastIncidentDate?: string;
  lastCleanupDate?: string;
  lastFollowUpDate?: string;
  classification: RecurrenceClassification;
  thresholdUsed: {
    normalMax: number;
    monitorMax: number;
    recurringMin: number;
  };
  disclaimer: string;
}

export interface TimelineEvent {
  id: string;
  type: 'INCIDENT' | 'CLEANUP' | 'FOLLOWUP' | 'RECURRENCE';
  timestamp: string;
  title: string;
  description: string;
  actor?: string;
  statusBadge?: string;
  metadata?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// 5 Predefined Hotspots for the MVP
export const PREDEFINED_HOTSPOTS: Hotspot[] = [
  {
    hotspotId: 'HOTSPOT-001',
    name: 'Library Gate',
    description: 'Northern entrance pathway near academic library bike racks',
    latitude: 28.545,
    longitude: 77.1926,
    area: 'Academic Zone North',
    status: 'ACTIVE',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    hotspotId: 'HOTSPOT-002',
    name: 'Main Entrance',
    description: 'Primary institutional entry corridor and transit stop',
    latitude: 28.5435,
    longitude: 77.191,
    area: 'Central Plaza',
    status: 'ACTIVE',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    hotspotId: 'HOTSPOT-003',
    name: 'Cafeteria Area',
    description: 'Outdoor food court seating and dining perimeter',
    latitude: 28.5442,
    longitude: 77.1935,
    area: 'Student Life Hub',
    status: 'ACTIVE',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    hotspotId: 'HOTSPOT-004',
    name: 'Science Block',
    description: 'Courtyard between chemistry wing and research labs',
    latitude: 28.546,
    longitude: 77.1948,
    area: 'Science Quad',
    status: 'ACTIVE',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    hotspotId: 'HOTSPOT-005',
    name: 'Parking Area',
    description: 'South visitor parking lot border and waste receptacle zone',
    latitude: 28.542,
    longitude: 77.1895,
    area: 'South Perimeter',
    status: 'ACTIVE',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    hotspotId: 'HOTSPOT-006',
    name: 'Sports Complex Plaza',
    description: 'Outdoor bleachers and athletic arena pathway perimeter',
    latitude: 28.5472,
    longitude: 77.196,
    area: 'Athletics & Recreation',
    status: 'ACTIVE',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    hotspotId: 'HOTSPOT-007',
    name: 'Innovation Hub Lawn',
    description: 'Engineering and startup incubator lawn with solar charging benches',
    latitude: 28.5448,
    longitude: 77.1952,
    area: 'Innovation Precinct',
    status: 'ACTIVE',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
];
