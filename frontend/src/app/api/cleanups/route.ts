import { NextRequest, NextResponse } from 'next/server';
import { CleanupRecord } from '@/types';

const IN_MEMORY_CLEANUPS: CleanupRecord[] = [
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

// GET /api/cleanups
export async function GET() {
  return NextResponse.json({
    success: true,
    data: IN_MEMORY_CLEANUPS,
    message: 'Cleanups retrieved successfully',
  });
}

// POST /api/cleanups
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { incidentId, hotspotId, notes, photoKey, photoUrl, status = 'COMPLETED' } = body;

    if (!incidentId || !hotspotId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'incidentId and hotspotId are required for cleanup records',
          },
        },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const performedBy = authHeader ? 'cleanup.operator@cleanloop.internal' : 'cleanup.staff@cleanloop.internal';

    const timestamp = new Date().toISOString();
    const cleanupId = `CLN-${Date.now().toString().slice(-6)}`;

    const newCleanup: CleanupRecord = {
      cleanupId,
      incidentId,
      hotspotId,
      performedBy,
      performedAt: timestamp,
      status,
      notes: notes || 'Standard site cleanup recorded',
      photoKey: photoKey || undefined,
      photoUrl: photoUrl || undefined,
      createdAt: timestamp,
    };

    IN_MEMORY_CLEANUPS.unshift(newCleanup);

    return NextResponse.json(
      {
        success: true,
        data: newCleanup,
        message: 'Cleanup recorded successfully and incident marked CLEANED',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Failed to parse cleanup request body' },
      },
      { status: 400 }
    );
  }
}
