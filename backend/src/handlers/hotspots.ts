import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../services/dynamo';
import { calculateHotspotRecurrence } from '../services/recurrence';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

const PREDEFINED_HOTSPOTS = [
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
];

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const path = event.path;
  const requestId = event.requestContext?.requestId;
  const hotspotId = event.pathParameters?.id;

  logger.info('HOTSPOTS_ROUTER', `GET ${path}`, { hotspotId }, requestId);

  try {
    // GET /hotspots (list)
    if (!hotspotId) {
      return successResponse(PREDEFINED_HOTSPOTS, 'Predefined hotspots retrieved');
    }

    const spot = PREDEFINED_HOTSPOTS.find((h) => h.hotspotId === hotspotId);
    if (!spot) {
      return errorResponse('NOT_FOUND', `Hotspot ${hotspotId} not recognized in predefined hotspots`, 404);
    }

    // GET /hotspots/{id}/recurrence
    if (path.endsWith('/recurrence')) {
      const queryResult = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `HOTSPOT#${hotspotId}`,
          },
        })
      );

      const items = (queryResult.Items || []) as any[];
      const recurrence = calculateHotspotRecurrence(hotspotId, items);

      return successResponse(recurrence, 'Recurrence calculated deterministically');
    }

    // GET /hotspots/{id}/history (Timeline)
    if (path.endsWith('/history')) {
      const queryResult = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `HOTSPOT#${hotspotId}`,
          },
          ScanIndexForward: true, // chronological order
        })
      );

      const items = queryResult.Items || [];
      return successResponse(items, 'Hotspot chronological timeline retrieved');
    }

    // GET /hotspots/{id}
    return successResponse(spot, 'Hotspot details retrieved');
  } catch (error) {
    logger.error('HOTSPOTS_HANDLER_ERROR', 'Failed to retrieve hotspot information', error, requestId);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Database error query on hotspot', 500);
  }
}
