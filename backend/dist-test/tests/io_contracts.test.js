"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const uploads_1 = require("../src/handlers/uploads");
const hotspots_1 = require("../src/handlers/hotspots");
const incidents_1 = require("../src/handlers/incidents");
const cleanups_1 = require("../src/handlers/cleanups");
const followups_1 = require("../src/handlers/followups");
function createMockEvent(options) {
    return {
        httpMethod: options.httpMethod,
        path: options.path,
        pathParameters: options.pathParameters || null,
        queryStringParameters: null,
        headers: {
            'Content-Type': 'application/json',
        },
        multiValueHeaders: {},
        isBase64Encoded: false,
        stageVariables: null,
        resource: options.path,
        requestContext: {
            accountId: '123456789012',
            apiId: 'test-api',
            protocol: 'HTTP/1.1',
            httpMethod: options.httpMethod,
            path: options.path,
            stage: 'test',
            requestId: 'test-request-id-001',
            requestTimeEpoch: Date.now(),
            resourceId: 'res-001',
            resourcePath: options.path,
            identity: {
                accessKey: null,
                accountId: null,
                apiKey: null,
                apiKeyId: null,
                caller: null,
                clientCert: null,
                cognitoAuthenticationProvider: null,
                cognitoAuthenticationType: null,
                cognitoIdentityId: null,
                cognitoIdentityPoolId: null,
                principalOrgId: null,
                sourceIp: '127.0.0.1',
                user: null,
                userAgent: 'test-agent',
                userArn: null,
            },
            authorizer: options.claims
                ? {
                    claims: options.claims,
                }
                : undefined,
        },
        body: options.body !== undefined ? options.body : null,
        multiValueQueryStringParameters: null,
    };
}
(0, node_test_1.default)('API Input / Output Contract Test Suite (Section 18 & 23)', async (t) => {
    // -------------------------------------------------------------
    // Test 1: S3 Presign Uploads - Valid Input -> HTTP 200 Success Output
    // -------------------------------------------------------------
    await t.test('POST /uploads/presign: Valid input returns 200 with presigned URL and unique S3 key', async () => {
        const inputEvent = createMockEvent({
            httpMethod: 'POST',
            path: '/uploads/presign',
            body: JSON.stringify({
                fileName: 'overflow_plastic.jpg',
                contentType: 'image/jpeg',
                sizeBytes: 1048576, // 1MB
            }),
            claims: {
                email: 'student.dev@university.edu',
                'cognito:groups': 'STUDENT',
            },
        });
        const output = await (0, uploads_1.handler)(inputEvent);
        strict_1.default.equal(output.statusCode, 200);
        const body = JSON.parse(output.body);
        strict_1.default.equal(body.success, true);
        strict_1.default.match(body.message, /Presigned.*URL generated successfully/i);
        strict_1.default.match(body.data.uploadUrl, /https:\/\/cleanloop-media-bucket\.s3/);
        strict_1.default.match(body.data.photoKey, /^evidence\/\d{4}-\d{2}-\d{2}\/.*\.jpg$/);
        strict_1.default.equal(body.data.bucket, 'cleanloop-media-bucket');
        strict_1.default.equal(body.data.expiresIn, 900);
    });
    // -------------------------------------------------------------
    // Test 2: S3 Presign Uploads - Unsupported MIME Input -> HTTP 400 Error Output
    // -------------------------------------------------------------
    await t.test('POST /uploads/presign: Unsupported MIME type returns 400 with INVALID_FILE_TYPE', async () => {
        const inputEvent = createMockEvent({
            httpMethod: 'POST',
            path: '/uploads/presign',
            body: JSON.stringify({
                fileName: 'malicious.pdf',
                contentType: 'application/pdf',
            }),
        });
        const output = await (0, uploads_1.handler)(inputEvent);
        strict_1.default.equal(output.statusCode, 400);
        const body = JSON.parse(output.body);
        strict_1.default.equal(body.success, false);
        strict_1.default.equal(body.error.code, 'INVALID_FILE_TYPE');
        strict_1.default.match(body.error.message, /Unsupported media type: application\/pdf/);
    });
    // -------------------------------------------------------------
    // Test 3: S3 Presign Uploads - Oversized File Input -> HTTP 400 Error Output
    // -------------------------------------------------------------
    await t.test('POST /uploads/presign: Oversized file (> 5MB) returns 400 with FILE_TOO_LARGE', async () => {
        const inputEvent = createMockEvent({
            httpMethod: 'POST',
            path: '/uploads/presign',
            body: JSON.stringify({
                fileName: 'huge_dump.png',
                contentType: 'image/png',
                sizeBytes: 6 * 1024 * 1024, // 6MB > 5MB
            }),
        });
        const output = await (0, uploads_1.handler)(inputEvent);
        strict_1.default.equal(output.statusCode, 400);
        const body = JSON.parse(output.body);
        strict_1.default.equal(body.success, false);
        strict_1.default.equal(body.error.code, 'FILE_TOO_LARGE');
        strict_1.default.match(body.error.message, /Max allowed size is 5MB/);
    });
    // -------------------------------------------------------------
    // Test 4: S3 Presign Uploads - Disallowed Extension Input -> HTTP 400 Error Output
    // -------------------------------------------------------------
    await t.test('POST /uploads/presign: Disallowed file extension returns 400 with INVALID_EXTENSION', async () => {
        const inputEvent = createMockEvent({
            httpMethod: 'POST',
            path: '/uploads/presign',
            body: JSON.stringify({
                fileName: 'exploit.sh',
                contentType: 'image/jpeg',
            }),
        });
        const output = await (0, uploads_1.handler)(inputEvent);
        strict_1.default.equal(output.statusCode, 400);
        const body = JSON.parse(output.body);
        strict_1.default.equal(body.success, false);
        strict_1.default.equal(body.error.code, 'INVALID_EXTENSION');
        strict_1.default.match(body.error.message, /File extension \.sh is not allowed/);
    });
    // -------------------------------------------------------------
    // Test 5: Hotspots API - GET /hotspots Input -> HTTP 200 List Output
    // -------------------------------------------------------------
    await t.test('GET /hotspots: Returns 200 with list of 5 predefined hotspots', async () => {
        const inputEvent = createMockEvent({
            httpMethod: 'GET',
            path: '/hotspots',
        });
        const output = await (0, hotspots_1.handler)(inputEvent);
        strict_1.default.equal(output.statusCode, 200);
        const body = JSON.parse(output.body);
        strict_1.default.equal(body.success, true);
        strict_1.default.equal(Array.isArray(body.data), true);
        strict_1.default.equal(body.data.length, 7);
        const hotspotIds = body.data.map((h) => h.hotspotId);
        strict_1.default.deepEqual(hotspotIds, [
            'HOTSPOT-001',
            'HOTSPOT-002',
            'HOTSPOT-003',
            'HOTSPOT-004',
            'HOTSPOT-005',
            'HOTSPOT-006',
            'HOTSPOT-007',
        ]);
    });
    // -------------------------------------------------------------
    // Test 6: Hotspots API - GET /hotspots/{id} Input -> HTTP 200 Single Hotspot Output
    // -------------------------------------------------------------
    await t.test('GET /hotspots/{id}: Valid hotspot ID returns 200 with hotspot metadata', async () => {
        const inputEvent = createMockEvent({
            httpMethod: 'GET',
            path: '/hotspots/HOTSPOT-001',
            pathParameters: {
                id: 'HOTSPOT-001',
            },
        });
        const output = await (0, hotspots_1.handler)(inputEvent);
        strict_1.default.equal(output.statusCode, 200);
        const body = JSON.parse(output.body);
        strict_1.default.equal(body.success, true);
        strict_1.default.equal(body.data.hotspotId, 'HOTSPOT-001');
        strict_1.default.equal(body.data.name, 'Library Gate');
        strict_1.default.equal(body.data.status, 'ACTIVE');
    });
    // -------------------------------------------------------------
    // Test 7: Hotspots API - GET /hotspots/UNKNOWN Input -> HTTP 404 Error Output
    // -------------------------------------------------------------
    await t.test('GET /hotspots/{id}: Unknown hotspot ID returns 404 with NOT_FOUND', async () => {
        const inputEvent = createMockEvent({
            httpMethod: 'GET',
            path: '/hotspots/HOTSPOT-999',
            pathParameters: {
                id: 'HOTSPOT-999',
            },
        });
        const output = await (0, hotspots_1.handler)(inputEvent);
        strict_1.default.equal(output.statusCode, 404);
        const body = JSON.parse(output.body);
        strict_1.default.equal(body.success, false);
        strict_1.default.equal(body.error.code, 'NOT_FOUND');
    });
    // -------------------------------------------------------------
    // Test 8: Incidents API - POST /incidents with Missing Body -> HTTP 400 Error Output
    // -------------------------------------------------------------
    await t.test('POST /incidents: Null body returns 400 with INVALID_BODY', async () => {
        const inputEvent = createMockEvent({
            httpMethod: 'POST',
            path: '/incidents',
            body: null,
        });
        const output = await (0, incidents_1.handler)(inputEvent);
        strict_1.default.equal(output.statusCode, 400);
        const body = JSON.parse(output.body);
        strict_1.default.equal(body.success, false);
        strict_1.default.equal(body.error.code, 'INVALID_BODY');
    });
    // -------------------------------------------------------------
    // Test 9: Incidents API - POST /incidents with Missing Hotspot -> HTTP 400 Error Output
    // -------------------------------------------------------------
    await t.test('POST /incidents: Missing or invalid hotspot returns 400 with VALIDATION_ERROR', async () => {
        const inputEvent = createMockEvent({
            httpMethod: 'POST',
            path: '/incidents',
            body: JSON.stringify({
                hotspotId: 'INVALID_ZONE',
                wasteCategory: 'Plastic',
                description: 'Piled up waste',
            }),
        });
        const output = await (0, incidents_1.handler)(inputEvent);
        strict_1.default.equal(output.statusCode, 400);
        const body = JSON.parse(output.body);
        strict_1.default.equal(body.success, false);
        strict_1.default.equal(body.error.code, 'VALIDATION_ERROR');
        strict_1.default.match(body.error.message, /Invalid or missing hotspotId/);
    });
    // -------------------------------------------------------------
    // Test 10: Incidents API - POST /incidents with Short Description -> HTTP 400 Error Output
    // -------------------------------------------------------------
    await t.test('POST /incidents: Description shorter than 5 chars returns 400 with VALIDATION_ERROR', async () => {
        const inputEvent = createMockEvent({
            httpMethod: 'POST',
            path: '/incidents',
            body: JSON.stringify({
                hotspotId: 'HOTSPOT-001',
                wasteCategory: 'Plastic',
                description: 'bad',
            }),
        });
        const output = await (0, incidents_1.handler)(inputEvent);
        strict_1.default.equal(output.statusCode, 400);
        const body = JSON.parse(output.body);
        strict_1.default.equal(body.success, false);
        strict_1.default.equal(body.error.code, 'VALIDATION_ERROR');
        strict_1.default.match(body.error.message, /Description must be at least 5 characters long/);
    });
    // -------------------------------------------------------------
    // Test 11: Cleanups API - POST /cleanups with Missing IDs -> HTTP 400 Error Output
    // -------------------------------------------------------------
    await t.test('POST /cleanups: Missing incidentId or hotspotId returns 400 with VALIDATION_ERROR', async () => {
        const inputEvent = createMockEvent({
            httpMethod: 'POST',
            path: '/cleanups',
            body: JSON.stringify({
                notes: 'Cleanup done',
            }),
        });
        const output = await (0, cleanups_1.handler)(inputEvent);
        strict_1.default.equal(output.statusCode, 400);
        const body = JSON.parse(output.body);
        strict_1.default.equal(body.success, false);
        strict_1.default.equal(body.error.code, 'VALIDATION_ERROR');
        strict_1.default.match(body.error.message, /incidentId and hotspotId are required/);
    });
    // -------------------------------------------------------------
    // Test 12: Followups API - POST /followups with Invalid Condition -> HTTP 400 Error Output
    // -------------------------------------------------------------
    await t.test('POST /followups: Invalid condition value returns 400 with VALIDATION_ERROR', async () => {
        const inputEvent = createMockEvent({
            httpMethod: 'POST',
            path: '/followups',
            body: JSON.stringify({
                incidentId: 'INC-100001',
                hotspotId: 'HOTSPOT-001',
                condition: 'UNSANITARY', // Not in ['CLEAN', 'WASTE_PRESENT', 'PARTIALLY_CLEAN', 'UNKNOWN']
            }),
        });
        const output = await (0, followups_1.handler)(inputEvent);
        strict_1.default.equal(output.statusCode, 400);
        const body = JSON.parse(output.body);
        strict_1.default.equal(body.success, false);
        strict_1.default.equal(body.error.code, 'VALIDATION_ERROR');
        strict_1.default.match(body.error.message, /condition must be one of/);
    });
});
