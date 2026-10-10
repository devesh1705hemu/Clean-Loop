"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
});
const BUCKET_NAME = process.env.BUCKET_NAME || 'cleanloop-media-bucket';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
async function handler(event) {
    const requestId = event.requestContext?.requestId;
    logger_1.logger.info('UPLOADS_PRESIGN', 'Presign request received', {}, requestId);
    try {
        if (!event.body) {
            return (0, response_1.errorResponse)('INVALID_BODY', 'Request body is required', 400);
        }
        const { fileName, contentType, sizeBytes } = JSON.parse(event.body);
        if (!fileName || !contentType) {
            return (0, response_1.errorResponse)('VALIDATION_ERROR', 'fileName and contentType are required', 400);
        }
        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(contentType)) {
            return (0, response_1.errorResponse)('INVALID_FILE_TYPE', `Unsupported media type: ${contentType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`, 400);
        }
        // Validate size if provided
        if (sizeBytes && sizeBytes > MAX_SIZE_BYTES) {
            return (0, response_1.errorResponse)('FILE_TOO_LARGE', `Max allowed size is 5MB. Provided: ${(sizeBytes / (1024 * 1024)).toFixed(2)}MB`, 400);
        }
        // Extract & validate extension
        const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
        if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
            return (0, response_1.errorResponse)('INVALID_EXTENSION', `File extension .${ext} is not allowed`, 400);
        }
        // Generate unique private S3 object key
        const uniqueKey = `evidence/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: uniqueKey,
            ContentType: contentType,
        });
        const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 900 }); // 15 mins
        logger_1.logger.info('PRESIGNED_URL_GENERATED', `Key: ${uniqueKey}`, { key: uniqueKey }, requestId);
        return (0, response_1.successResponse)({
            uploadUrl: presignedUrl,
            photoKey: uniqueKey,
            expiresIn: 900,
            bucket: BUCKET_NAME,
        }, 'Presigned upload URL generated successfully', 200);
    }
    catch (error) {
        logger_1.logger.error('UPLOADS_HANDLER_ERROR', 'Failed to generate presigned S3 URL', error, requestId);
        return (0, response_1.errorResponse)('INTERNAL_SERVER_ERROR', 'Failed to generate presigned URL', 500);
    }
}
