"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};
function successResponse(data, message = 'Operation completed successfully', statusCode = 200) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success: true,
            data,
            message,
        }),
    };
}
function errorResponse(code, message, statusCode = 400, details) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success: false,
            error: {
                code,
                message,
                ...(details ? { details } : {}),
            },
        }),
    };
}
