import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../services/dynamo';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const requestId = event.requestContext?.requestId;

  logger.info('CLEANUPS_ROUTER', `${method} ${event.path}`, { pathParameters: event.pathParameters }, requestId);

  try {
    // POST /cleanups
    if (method === 'POST') {
      if (!event.body) {
        return errorResponse('INVALID_BODY', 'Request body is required', 400);
      }

      const body = JSON.parse(event.body);
      const { incidentId, hotspotId, notes, photoKey, status = 'COMPLETED' } = body;

      if (!incidentId || !hotspotId) {
        return errorResponse('VALIDATION_ERROR', 'incidentId and hotspotId are required', 400);
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

      const promises: Promise<unknown>[] = [
        docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: cleanupItem })),
        docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: directItem })),
      ];

      // When cleanup is completed, update incident status to CLEANED (Section 11)
      if (status === 'COMPLETED') {
        promises.push(
          docClient.send(
            new UpdateCommand({
              TableName: TABLE_NAME,
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
            })
          )
        );
      }

      await Promise.all(promises);

      logger.info('CLEANUP_RECORDED', `Cleanup ${cleanupId} recorded for incident ${incidentId}`, { cleanupId, incidentId }, requestId);
      return successResponse(cleanupItem, 'Cleanup recorded successfully', 201);
    }

    // GET /cleanups/{id}
    if (method === 'GET' && event.pathParameters?.id) {
      const cleanupId = event.pathParameters.id;
      const result = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `CLEANUP#${cleanupId}`,
            SK: 'METADATA',
          },
        })
      );

      if (!result.Item) {
        return errorResponse('NOT_FOUND', `Cleanup record ${cleanupId} not found`, 404);
      }

      return successResponse(result.Item, 'Cleanup retrieved');
    }

    return errorResponse('METHOD_NOT_ALLOWED', `Method ${method} not allowed`, 405);
  } catch (error) {
    logger.error('CLEANUP_HANDLER_ERROR', 'Failed to process cleanup request', error, requestId);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Database error processing cleanup', 500);
  }
}
