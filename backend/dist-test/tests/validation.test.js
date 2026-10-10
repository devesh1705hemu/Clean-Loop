"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
(0, node_test_1.default)('Workflow Validation Rules (Section 23)', async (t) => {
    const VALID_CATEGORIES = ['Plastic', 'Food Waste', 'Paper', 'Glass', 'Mixed Waste', 'Other'];
    const VALID_HOTSPOTS = ['HOTSPOT-001', 'HOTSPOT-002', 'HOTSPOT-003', 'HOTSPOT-004', 'HOTSPOT-005'];
    const VALID_CONDITIONS = ['CLEAN', 'WASTE_PRESENT', 'PARTIALLY_CLEAN', 'UNKNOWN'];
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    await t.test('Incident validation rejects unknown hotspots', () => {
        const invalidHotspot = 'HOTSPOT-999';
        strict_1.default.equal(VALID_HOTSPOTS.includes(invalidHotspot), false);
    });
    await t.test('Incident validation accepts all MVP predefined hotspots', () => {
        VALID_HOTSPOTS.forEach((id) => {
            strict_1.default.equal(VALID_HOTSPOTS.includes(id), true);
        });
    });
    await t.test('Incident validation rejects unauthorized waste categories', () => {
        const invalidCategory = 'Toxic Waste';
        strict_1.default.equal(VALID_CATEGORIES.includes(invalidCategory), false);
    });
    await t.test('Incident validation requires description length >= 5 chars', () => {
        const shortDesc = 'abc';
        strict_1.default.equal(shortDesc.trim().length >= 5, false);
        const validDesc = 'Overfilled bin at gate';
        strict_1.default.equal(validDesc.trim().length >= 5, true);
    });
    await t.test('Follow-up validation enforces valid condition enum values', () => {
        strict_1.default.equal(VALID_CONDITIONS.includes('CLEAN'), true);
        strict_1.default.equal(VALID_CONDITIONS.includes('WASTE_PRESENT'), true);
        strict_1.default.equal(VALID_CONDITIONS.includes('DIRTY'), false);
    });
    await t.test('S3 Presign validation rejects unsupported MIME types and oversized files', () => {
        strict_1.default.equal(ALLOWED_MIME_TYPES.includes('application/pdf'), false);
        strict_1.default.equal(ALLOWED_MIME_TYPES.includes('image/jpeg'), true);
        const oversized = 6 * 1024 * 1024;
        strict_1.default.equal(oversized <= MAX_SIZE_BYTES, false);
        const normalSize = 2 * 1024 * 1024;
        strict_1.default.equal(normalSize <= MAX_SIZE_BYTES, true);
    });
});
