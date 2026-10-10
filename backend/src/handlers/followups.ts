import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../services/dynamo';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

const VALID_CONDITIONS = ['CLEAN', 'WASTE_PRESENT', 'PARTIALLY_CLEAN', 'UNKNOWN'];

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const requestId = event.requestContext?.requestId;

  logger.info('FOLLOWUPS_ROUTER', `${method} ${event.path}`, { pathParameters: event.pathParameters }, requestId);

  try {
    // POST /followups
    if (method === 'POST') {
      if (!event.body) {
        return errorResponse('INVALID_BODY', 'Request body is required', 400);
      }

      const body = JSON.parse(event.body);
      const { incidentId, hotspotId, condition, notes, photoKey } = body;

      if (!incidentId || !hotspotId) {
        return errorResponse('VALIDATION_ERROR', 'incidentId and hotspotId are required', 400);
      }

      if (!condition || !VALID_CONDITIONS.includes(condition)) {
        return errorResponse('VALIDATION_ERROR', `condition must be one of ${VALID_CONDITIONS.join(', ')}`, 400);
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
        docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: followUpItem })),
        docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: directItem })),
      ]);

      logger.info('FOLLOWUP_RECORDED', `Follow-up ${followUpId} recorded. Condition: ${condition}`, { followUpId, condition, hotspotId }, requestId);
      return successResponse(followUpItem, 'Follow-up observation recorded successfully', 201);
    }

    // GET /followups/{id}
    if (method === 'GET' && event.pathParameters?.id) {
      const followUpId = event.pathParameters.id;
      const result = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `FOLLOWUP#${followUpId}`,
            SK: 'METADATA',
          },
        })
      );

      if (!result.Item) {
        return errorResponse('NOT_FOUND', `Follow-up ${followUpId} not found`, 404);
      }

      return successResponse(result.Item, 'Follow-up retrieved');
    }

    return errorResponse('METHOD_NOT_ALLOWED', `Method ${method} not allowed`, 405);
  } catch (error) {
    logger.error('FOLLOWUP_HANDLER_ERROR', 'Failed to process follow-up request', error, requestId);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Database error processing follow-up', 500);
  }
}
