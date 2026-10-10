import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../services/dynamo';
import { calculateHotspotRecurrence } from '../services/recurrence';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

const HOTSPOT_IDS = ['HOTSPOT-001', 'HOTSPOT-002', 'HOTSPOT-003', 'HOTSPOT-004', 'HOTSPOT-005'];
const HOTSPOT_NAMES: Record<string, string> = {
  'HOTSPOT-001': 'Library Gate',
  'HOTSPOT-002': 'Main Entrance',
  'HOTSPOT-003': 'Cafeteria Area',
  'HOTSPOT-004': 'Science Block',
  'HOTSPOT-005': 'Parking Area',
};

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext?.requestId;
  logger.info('ANALYTICS_OVERVIEW', 'Generating dashboard metrics', {}, requestId);

  try {
    let grandTotalIncidents = 0;
    let grandTotalCleanups = 0;
    let grandTotalFollowUps = 0;
    let recurringHotspotCount = 0;

    const ranking = [];

    // Query each predefined hotspot's partition
    for (const spotId of HOTSPOT_IDS) {
      const queryRes = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `HOTSPOT#${spotId}`,
          },
        })
      );

      const items = (queryRes.Items || []) as any[];
      const metrics = calculateHotspotRecurrence(spotId, items);

      grandTotalIncidents += metrics.totalIncidents;
      grandTotalCleanups += metrics.totalCleanups;
      grandTotalFollowUps += metrics.totalFollowUps;

      if (metrics.classification === 'Recurring') {
        recurringHotspotCount += 1;
      }

      ranking.push({
        hotspotId: spotId,
        name: HOTSPOT_NAMES[spotId] || spotId,
        incidentCount: metrics.totalIncidents,
        cleanupCount: metrics.totalCleanups,
        followUpCount: metrics.totalFollowUps,
        postCleanupRecurrenceCount: metrics.postCleanupRecurrenceCount,
        classification: metrics.classification,
      });
    }

    // Sort ranking descending by incident count
    ranking.sort((a, b) => b.incidentCount - a.incidentCount);

    const pendingFollowUps = Math.max(0, grandTotalCleanups - grandTotalFollowUps);

    const overviewData = {
      summary: {
        totalReports: grandTotalIncidents,
        totalCleanups: grandTotalCleanups,
        pendingFollowUps,
        recurringHotspots: recurringHotspotCount,
      },
      ranking,
      disclaimer: 'Recurrence indicates repeated observations. It does not establish the cause of the waste.',
      generatedAt: new Date().toISOString(),
    };

    return successResponse(overviewData, 'Dashboard analytics generated');
  } catch (error) {
    logger.error('ANALYTICS_HANDLER_ERROR', 'Failed to generate overview metrics', error, requestId);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Error aggregating dashboard metrics', 500);
  }
}
