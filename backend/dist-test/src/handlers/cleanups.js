"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_1 = require("../services/dynamo");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
async function handler(event) {
    const method = event.httpMethod;
    const requestId = event.requestContext?.requestId;
    logger_1.logger.info('CLEANUPS_ROUTER', `${method} ${event.path}`, { pathParameters: event.pathParameters }, requestId);
    try {
        // POST /cleanups
        if (method === 'POST') {
            if (!event.body) {
                return (0, response_1.errorResponse)('INVALID_BODY', 'Request body is required', 400);
            }
            const body = JSON.parse(event.body);
            const { incidentId, hotspotId, notes, photoKey, status = 'COMPLETED' } = body;
            if (!incidentId || !hotspotId) {
                return (0, response_1.errorResponse)('VALIDATION_ERROR', 'incidentId and hotspotId are required', 400);
            }
            const claims = event.requestContext?.authorizer?.claims;
            const performedBy = claims?.email || body.performedBy || 'cleanup.staff@cleanloop.internal';
            const performedAt = new Date().toISOString();
            const cleanupId = `CLN-${Date.now().toString().slice(-6)}`;
            const cleanupItem = {
                PK: `HOTSPOT#${hotspotId}`,
                SK: `CLEANUP#${performedAt}#${cleanupId}`,
                type: 'CLEANUP',
                cleanupId,
                incidentId,
                hotspotId,
                performedBy,
                performedAt,
                status,
                notes: notes || 'Standard site cleanup completed',
                photoKey: photoKey || undefined,
                createdAt: performedAt,
            };
            // Also record direct lookup item
            const directItem = {
                ...cleanupItem,
                PK: `CLEANUP#${cleanupId}`,
                SK: 'METADATA',
            };
            const promises = [
                dynamo_1.docClient.send(new lib_dynamodb_1.PutCommand({ TableName: dynamo_1.TABLE_NAME, Item: cleanupItem })),
                dynamo_1.docClient.send(new lib_dynamodb_1.PutCommand({ TableName: dynamo_1.TABLE_NAME, Item: directItem })),
            ];
            // When cleanup is completed, update incident status to CLEANED (Section 11)
            if (status === 'COMPLETED') {
                promises.push(dynamo_1.docClient.send(new lib_dynamodb_1.UpdateCommand({
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
                        ':st': 'CLEANED',
                        ':ua': performedAt,
                        ':g1pk': 'CLEANED',
                    },
                })));
            }
            await Promise.all(promises);
            logger_1.logger.info('CLEANUP_RECORDED', `Cleanup ${cleanupId} recorded for incident ${incidentId}`, { cleanupId, incidentId }, requestId);
            return (0, response_1.successResponse)(cleanupItem, 'Cleanup recorded successfully', 201);
        }
        // GET /cleanups/{id}
        if (method === 'GET' && event.pathParameters?.id) {
            const cleanupId = event.pathParameters.id;
            const result = await dynamo_1.docClient.send(new lib_dynamodb_1.GetCommand({
                TableName: dynamo_1.TABLE_NAME,
                Key: {
                    PK: `CLEANUP#${cleanupId}`,
                    SK: 'METADATA',
                },
            }));
            if (!result.Item) {
                return (0, response_1.errorResponse)('NOT_FOUND', `Cleanup record ${cleanupId} not found`, 404);
            }
            return (0, response_1.successResponse)(result.Item, 'Cleanup retrieved');
        }
        return (0, response_1.errorResponse)('METHOD_NOT_ALLOWED', `Method ${method} not allowed`, 405);
    }
    catch (error) {
        logger_1.logger.error('CLEANUP_HANDLER_ERROR', 'Failed to process cleanup request', error, requestId);
        return (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'Database error processing cleanup', 500);
    }
}
