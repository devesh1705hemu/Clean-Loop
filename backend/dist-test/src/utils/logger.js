"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (action, message, data, requestId) => {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            action,
            message,
            requestId,
            data,
        }));
    },
    warn: (action, message, data, requestId) => {
        console.warn(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'WARN',
            action,
            message,
            requestId,
            data,
        }));
    },
    error: (action, message, error, requestId) => {
        console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            action,
            message,
            requestId,
            error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
        }));
    },
};
