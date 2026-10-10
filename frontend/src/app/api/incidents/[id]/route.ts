import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const resolvedParams = await params;
  const incidentId = resolvedParams.id;

  return NextResponse.json({
    success: true,
    data: {
      incidentId,
      hotspotId: 'HOTSPOT-001',
      reportedBy: 'student.dev@university.edu',
      reportedAt: '2026-10-06T09:15:00Z',
      wasteCategory: 'Plastic',
      description: 'Multiple plastic bottles and takeaway packaging piled near bike racks.',
      status: 'CLEANED',
      createdAt: '2026-10-06T09:15:00Z',
      updatedAt: '2026-10-06T11:00:00Z',
    },
    message: 'Incident details retrieved',
  });
}
