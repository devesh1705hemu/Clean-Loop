import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.BUCKET_NAME || 'cleanloop-media-bucket';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext?.requestId;
  logger.info('UPLOADS_PRESIGN', 'Presign request received', {}, requestId);

  try {
    if (!event.body) {
      return errorResponse('INVALID_BODY', 'Request body is required', 400);
    }

    const { fileName, contentType, sizeBytes } = JSON.parse(event.body);

    if (!fileName || !contentType) {
      return errorResponse('VALIDATION_ERROR', 'fileName and contentType are required', 400);
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return errorResponse(
        'INVALID_FILE_TYPE',
        `Unsupported media type: ${contentType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        400
      );
    }

    // Validate size if provided
    if (sizeBytes && sizeBytes > MAX_SIZE_BYTES) {
      return errorResponse('FILE_TOO_LARGE', `Max allowed size is 5MB. Provided: ${(sizeBytes / (1024 * 1024)).toFixed(2)}MB`, 400);
    }

    // Extract & validate extension
    const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return errorResponse('INVALID_EXTENSION', `File extension .${ext} is not allowed`, 400);
    }

    // Generate unique private S3 object key
    const uniqueKey = `evidence/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 mins

    logger.info('PRESIGNED_URL_GENERATED', `Key: ${uniqueKey}`, { key: uniqueKey }, requestId);

    return successResponse(
      {
        uploadUrl: presignedUrl,
        photoKey: uniqueKey,
        expiresIn: 900,
        bucket: BUCKET_NAME,
      },
      'Presigned upload URL generated successfully',
      200
    );
  } catch (error) {
    logger.error('UPLOADS_HANDLER_ERROR', 'Failed to generate presigned S3 URL', error, requestId);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to generate presigned URL', 500);
  }
}
