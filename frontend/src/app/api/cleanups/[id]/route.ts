import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const resolvedParams = await params;
  const cleanupId = resolvedParams.id;

  return NextResponse.json({
    success: true,
    data: {
      cleanupId,
      incidentId: 'INC-100001',
      hotspotId: 'HOTSPOT-001',
      performedBy: 'cleanup.team1@cleanloop.internal',
      performedAt: '2026-10-06T11:00:00Z',
      status: 'COMPLETED',
      notes: 'Area cleared of plastic bottles and waste containers sanitized.',
      createdAt: '2026-10-06T11:00:00Z',
    },
    message: 'Cleanup details retrieved',
  });
}
