"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_1 = require("../services/dynamo");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const VALID_CATEGORIES = ['Plastic', 'Food Waste', 'Paper', 'Glass', 'Mixed Waste', 'Other'];
const VALID_HOTSPOTS = ['HOTSPOT-001', 'HOTSPOT-002', 'HOTSPOT-003', 'HOTSPOT-004', 'HOTSPOT-005'];
async function handler(event) {
    const method = event.httpMethod;
    const path = event.path;
    const requestId = event.requestContext?.requestId;
    logger_1.logger.info('INCIDENTS_ROUTER', `${method} ${path}`, { pathParameters: event.pathParameters }, requestId);
    try {
        // POST /incidents
        if (method === 'POST') {
            if (!event.body) {
                return (0, response_1.errorResponse)('INVALID_BODY', 'Request body is required', 400);
            }
            const body = JSON.parse(event.body);
            const { hotspotId, wasteCategory, description, photoKey } = body;
            // Server-side validation
            if (!hotspotId || !VALID_HOTSPOTS.includes(hotspotId)) {
                return (0, response_1.errorResponse)('VALIDATION_ERROR', `Invalid or missing hotspotId: ${hotspotId}. Must be one of ${VALID_HOTSPOTS.join(', ')}`, 400);
            }
            if (!wasteCategory || !VALID_CATEGORIES.includes(wasteCategory)) {
                return (0, response_1.errorResponse)('VALIDATION_ERROR', `Invalid or missing wasteCategory: ${wasteCategory}`, 400);
            }
            if (!description || description.trim().length < 5) {
                return (0, response_1.errorResponse)('VALIDATION_ERROR', 'Description must be at least 5 characters long', 400);
            }
            // Extract user from Cognito authorizer context or fallback
            const claims = event.requestContext?.authorizer?.claims;
            const reportedBy = claims?.email || claims?.username || body.reportedBy || 'student.anonymous@cleanloop.internal';
            const timestamp = new Date().toISOString();
            const incidentId = `INC-${Date.now().toString().slice(-6)}`;
            const incidentItem = {
                PK: `INCIDENT#${incidentId}`,
                SK: 'METADATA',
                incidentId,
                hotspotId,
                reportedBy,
                reportedAt: timestamp,
                wasteCategory,
                description: description.trim(),
                photoKey: photoKey || undefined,
                status: 'REPORTED',
                createdAt: timestamp,
                updatedAt: timestamp,
                GSI1PK: 'REPORTED',
                GSI1SK: timestamp,
                GSI2PK: reportedBy,
                GSI2SK: timestamp,
            };
            // Dual write to Hotspot timeline
            const hotspotTimelineItem = {
                PK: `HOTSPOT#${hotspotId}`,
                SK: `INCIDENT#${timestamp}#${incidentId}`,
                type: 'INCIDENT',
                incidentId,
                hotspotId,
                reportedBy,
                reportedAt: timestamp,
                wasteCategory,
                description: description.trim(),
                photoKey: photoKey || undefined,
                status: 'REPORTED',
                createdAt: timestamp,
            };
            await Promise.all([
                dynamo_1.docClient.send(new lib_dynamodb_1.PutCommand({ TableName: dynamo_1.TABLE_NAME, Item: incidentItem })),
                dynamo_1.docClient.send(new lib_dynamodb_1.PutCommand({ TableName: dynamo_1.TABLE_NAME, Item: hotspotTimelineItem })),
            ]);
            logger_1.logger.info('INCIDENT_CREATED', `Incident ${incidentId} created`, { incidentId, hotspotId }, requestId);
            return (0, response_1.successResponse)(incidentItem, 'Incident created successfully', 201);
        }
        // GET /incidents/{id}
        if (method === 'GET' && event.pathParameters?.id) {
            const incidentId = event.pathParameters.id;
            const result = await dynamo_1.docClient.send(new lib_dynamodb_1.GetCommand({
                TableName: dynamo_1.TABLE_NAME,
                Key: {
                    PK: `INCIDENT#${incidentId}`,
                    SK: 'METADATA',
                },
            }));
            if (!result.Item) {
                return (0, response_1.errorResponse)('NOT_FOUND', `Incident ${incidentId} not found`, 404);
            }
            return (0, response_1.successResponse)(result.Item, 'Incident retrieved successfully');
        }
        // PUT /incidents/{id}
        if (method === 'PUT' && event.pathParameters?.id) {
            const incidentId = event.pathParameters.id;
            if (!event.body) {
                return (0, response_1.errorResponse)('INVALID_BODY', 'Request body is required', 400);
            }
            const body = JSON.parse(event.body);
            const { status } = body;
            const validStatuses = ['REPORTED', 'IN_PROGRESS', 'CLEANED', 'FOLLOW_UP_REQUIRED', 'RESOLVED'];
            if (!status || !validStatuses.includes(status)) {
                return (0, response_1.errorResponse)('VALIDATION_ERROR', `Status must be one of ${validStatuses.join(', ')}`, 400);
            }
            const updatedAt = new Date().toISOString();
            await dynamo_1.docClient.send(new lib_dynamodb_1.UpdateCommand({
                TableName: dynamo_1.TABLE_NAME,
                Key: {
                    PK: `INCIDENT#${incidentId}`,
                    SK: 'METADATA',
                },
                UpdateExpression: 'SET #st = :st, #ua = :ua, #g1pk = :g1pk',
                ExpressionAttributeNames: {
                    '#st': 'status',
                    '#ua': 'updatedAt',
                    '#g1pk': 'GSI1PK',
                },
                ExpressionAttributeValues: {
                    ':st': status,
                    ':ua': updatedAt,
                    ':g1pk': status,
                },
            }));
            return (0, response_1.successResponse)({ incidentId, status, updatedAt }, 'Incident status updated');
        }
        // GET /incidents (List)
        if (method === 'GET') {
            const statusFilter = event.queryStringParameters?.status;
            let items = [];
            if (statusFilter) {
                const queryRes = await dynamo_1.docClient.send(new lib_dynamodb_1.QueryCommand({
                    TableName: dynamo_1.TABLE_NAME,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :st',
                    ExpressionAttributeValues: {
                        ':st': statusFilter,
                    },
                    ScanIndexForward: false,
                }));
                items = queryRes.Items || [];
            }
            else {
                // Query open items or recent
                const queryRes = await dynamo_1.docClient.send(new lib_dynamodb_1.QueryCommand({
                    TableName: dynamo_1.TABLE_NAME,
                    IndexName: 'GSI1',
                    KeyConditionExpression: 'GSI1PK = :st',
                    ExpressionAttributeValues: {
                        ':st': 'REPORTED',
                    },
                    ScanIndexForward: false,
                }));
                items = queryRes.Items || [];
            }
            return (0, response_1.successResponse)(items, 'Incidents retrieved');
        }
        return (0, response_1.errorResponse)('METHOD_NOT_ALLOWED', `Method ${method} not allowed on /incidents`, 405);
    }
    catch (error) {
        logger_1.logger.error('INCIDENT_HANDLER_ERROR', 'Failed to process incident request', error, requestId);
        return (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'An internal database error occurred', 500);
    }
}
