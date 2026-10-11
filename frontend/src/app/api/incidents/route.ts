import { NextRequest, NextResponse } from 'next/server';
import { Incident, WASTE_CATEGORIES } from '@/types';

const VALID_HOTSPOTS = ['HOTSPOT-001', 'HOTSPOT-002', 'HOTSPOT-003', 'HOTSPOT-004', 'HOTSPOT-005', 'HOTSPOT-006', 'HOTSPOT-007'];

// In-memory store for server runtime
const IN_MEMORY_INCIDENTS: Incident[] = [
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

// GET /api/incidents
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const hotspotId = searchParams.get('hotspotId');

  let filtered = [...IN_MEMORY_INCIDENTS];

  if (status && status !== 'ALL') {
    filtered = filtered.filter((i) => i.status === status);
  }
  if (hotspotId && hotspotId !== 'ALL') {
    filtered = filtered.filter((i) => i.hotspotId === hotspotId);
  }

  return NextResponse.json({
    success: true,
    data: filtered,
    message: 'Incidents retrieved successfully',
  });
}

// POST /api/incidents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotspotId, wasteCategory, description, photoKey, photoUrl } = body;

    // Server-side validation
    if (!hotspotId || !VALID_HOTSPOTS.includes(hotspotId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid hotspotId: ${hotspotId}. Must be one of ${VALID_HOTSPOTS.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    if (!wasteCategory || !WASTE_CATEGORIES.includes(wasteCategory)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid wasteCategory: ${wasteCategory}`,
          },
        },
        { status: 400 }
      );
    }

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Description must be at least 5 characters long',
          },
        },
        { status: 400 }
      );
    }

    // Extract auth header if present
    const authHeader = request.headers.get('authorization');
    let reportedBy = 'student.authenticated@university.edu';
    if (authHeader && authHeader.includes('Bearer ')) {
      reportedBy = 'student.cognito@cleanloop.internal';
    }

    const timestamp = new Date().toISOString();
    const incidentId = `INC-${Date.now().toString().slice(-6)}`;

    const newIncident: Incident = {
      incidentId,
      hotspotId,
      reportedBy,
      reportedAt: timestamp,
      wasteCategory,
      description: description.trim(),
      photoKey: photoKey || undefined,
      photoUrl: photoUrl || undefined,
      status: 'REPORTED',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    IN_MEMORY_INCIDENTS.unshift(newIncident);

    return NextResponse.json(
      {
        success: true,
        data: newIncident,
        message: 'Incident reported successfully',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Failed to parse incident request body' },
      },
      { status: 400 }
    );
  }
}
