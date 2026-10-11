"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_1 = require("../services/dynamo");
const recurrence_1 = require("../services/recurrence");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
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
async function handler(event) {
    const path = event.path;
    const requestId = event.requestContext?.requestId;
    const hotspotId = event.pathParameters?.id;
    logger_1.logger.info('HOTSPOTS_ROUTER', `GET ${path}`, { hotspotId }, requestId);
    try {
        // GET /hotspots (list)
        if (!hotspotId) {
            return (0, response_1.successResponse)(PREDEFINED_HOTSPOTS, 'Predefined hotspots retrieved');
        }
        const spot = PREDEFINED_HOTSPOTS.find((h) => h.hotspotId === hotspotId);
        if (!spot) {
            return (0, response_1.errorResponse)('NOT_FOUND', `Hotspot ${hotspotId} not recognized in predefined hotspots`, 404);
        }
        // GET /hotspots/{id}/recurrence
        if (path.endsWith('/recurrence')) {
            const queryResult = await dynamo_1.docClient.send(new lib_dynamodb_1.QueryCommand({
                TableName: dynamo_1.TABLE_NAME,
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': `HOTSPOT#${hotspotId}`,
                },
            }));
            const items = (queryResult.Items || []);
            const recurrence = (0, recurrence_1.calculateHotspotRecurrence)(hotspotId, items);
            return (0, response_1.successResponse)(recurrence, 'Recurrence calculated deterministically');
        }
        // GET /hotspots/{id}/history (Timeline)
        if (path.endsWith('/history')) {
            const queryResult = await dynamo_1.docClient.send(new lib_dynamodb_1.QueryCommand({
                TableName: dynamo_1.TABLE_NAME,
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': `HOTSPOT#${hotspotId}`,
                },
                ScanIndexForward: true, // chronological order
            }));
            const items = queryResult.Items || [];
            return (0, response_1.successResponse)(items, 'Hotspot chronological timeline retrieved');
        }
        // GET /hotspots/{id}
        return (0, response_1.successResponse)(spot, 'Hotspot details retrieved');
    }
    catch (error) {
        logger_1.logger.error('HOTSPOTS_HANDLER_ERROR', 'Failed to retrieve hotspot information', error, requestId);
        return (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'Database error query on hotspot', 500);
    }
}
