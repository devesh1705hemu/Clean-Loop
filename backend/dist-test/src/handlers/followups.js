"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_1 = require("../services/dynamo");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const VALID_CONDITIONS = ['CLEAN', 'WASTE_PRESENT', 'PARTIALLY_CLEAN', 'UNKNOWN'];
async function handler(event) {
    const method = event.httpMethod;
    const requestId = event.requestContext?.requestId;
    logger_1.logger.info('FOLLOWUPS_ROUTER', `${method} ${event.path}`, { pathParameters: event.pathParameters }, requestId);
    try {
        // POST /followups
        if (method === 'POST') {
            if (!event.body) {
                return (0, response_1.errorResponse)('INVALID_BODY', 'Request body is required', 400);
            }
            const body = JSON.parse(event.body);
            const { incidentId, hotspotId, condition, notes, photoKey } = body;
            if (!incidentId || !hotspotId) {
                return (0, response_1.errorResponse)('VALIDATION_ERROR', 'incidentId and hotspotId are required', 400);
            }
            if (!condition || !VALID_CONDITIONS.includes(condition)) {
                return (0, response_1.errorResponse)('VALIDATION_ERROR', `condition must be one of ${VALID_CONDITIONS.join(', ')}`, 400);
            }
            const claims = event.requestContext?.authorizer?.claims;
            const observedBy = claims?.email || body.observedBy || 'inspector@cleanloop.internal';
            const observedAt = new Date().toISOString();
            const followUpId = `FOL-${Date.now().toString().slice(-6)}`;
            const followUpItem = {
                PK: `HOTSPOT#${hotspotId}`,
                SK: `FOLLOWUP#${observedAt}#${followUpId}`,
                type: 'FOLLOWUP',
                followUpId,
                incidentId,
                hotspotId,
                observedBy,
                observedAt,
                condition,
                notes: notes || 'Site inspection audit recorded',
                photoKey: photoKey || undefined,
                createdAt: observedAt,
            };
            const directItem = {
                ...followUpItem,
                PK: `FOLLOWUP#${followUpId}`,
                SK: 'METADATA',
            };
            await Promise.all([
                dynamo_1.docClient.send(new lib_dynamodb_1.PutCommand({ TableName: dynamo_1.TABLE_NAME, Item: followUpItem })),
                dynamo_1.docClient.send(new lib_dynamodb_1.PutCommand({ TableName: dynamo_1.TABLE_NAME, Item: directItem })),
            ]);
            logger_1.logger.info('FOLLOWUP_RECORDED', `Follow-up ${followUpId} recorded. Condition: ${condition}`, { followUpId, condition, hotspotId }, requestId);
            return (0, response_1.successResponse)(followUpItem, 'Follow-up observation recorded successfully', 201);
        }
        // GET /followups/{id}
        if (method === 'GET' && event.pathParameters?.id) {
            const followUpId = event.pathParameters.id;
            const result = await dynamo_1.docClient.send(new lib_dynamodb_1.GetCommand({
                TableName: dynamo_1.TABLE_NAME,
                Key: {
                    PK: `FOLLOWUP#${followUpId}`,
                    SK: 'METADATA',
                },
            }));
            if (!result.Item) {
                return (0, response_1.errorResponse)('NOT_FOUND', `Follow-up ${followUpId} not found`, 404);
            }
            return (0, response_1.successResponse)(result.Item, 'Follow-up retrieved');
        }
        return (0, response_1.errorResponse)('METHOD_NOT_ALLOWED', `Method ${method} not allowed`, 405);
    }
    catch (error) {
        logger_1.logger.error('FOLLOWUP_HANDLER_ERROR', 'Failed to process follow-up request', error, requestId);
        return (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'Database error processing follow-up', 500);
    }
}
