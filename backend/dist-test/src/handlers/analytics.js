"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_1 = require("../services/dynamo");
const recurrence_1 = require("../services/recurrence");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const HOTSPOT_IDS = ['HOTSPOT-001', 'HOTSPOT-002', 'HOTSPOT-003', 'HOTSPOT-004', 'HOTSPOT-005'];
const HOTSPOT_NAMES = {
    'HOTSPOT-001': 'Library Gate',
    'HOTSPOT-002': 'Main Entrance',
    'HOTSPOT-003': 'Cafeteria Area',
    'HOTSPOT-004': 'Science Block',
    'HOTSPOT-005': 'Parking Area',
};
async function handler(event) {
    const requestId = event.requestContext?.requestId;
    logger_1.logger.info('ANALYTICS_OVERVIEW', 'Generating dashboard metrics', {}, requestId);
    try {
        let grandTotalIncidents = 0;
        let grandTotalCleanups = 0;
        let grandTotalFollowUps = 0;
        let recurringHotspotCount = 0;
        const ranking = [];
        // Query each predefined hotspot's partition
        for (const spotId of HOTSPOT_IDS) {
            const queryRes = await dynamo_1.docClient.send(new lib_dynamodb_1.QueryCommand({
                TableName: dynamo_1.TABLE_NAME,
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': `HOTSPOT#${spotId}`,
                },
            }));
            const items = (queryRes.Items || []);
            const metrics = (0, recurrence_1.calculateHotspotRecurrence)(spotId, items);
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
        return (0, response_1.successResponse)(overviewData, 'Dashboard analytics generated');
    }
    catch (error) {
        logger_1.logger.error('ANALYTICS_HANDLER_ERROR', 'Failed to generate overview metrics', error, requestId);
        return (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'Error aggregating dashboard metrics', 500);
    }
}
