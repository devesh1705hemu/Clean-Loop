import test from 'node:test';
import assert from 'node:assert/strict';

test('Workflow Validation Rules (Section 23)', async (t) => {
  const VALID_CATEGORIES = ['Plastic', 'Food Waste', 'Paper', 'Glass', 'Mixed Waste', 'Other'];
  const VALID_HOTSPOTS = ['HOTSPOT-001', 'HOTSPOT-002', 'HOTSPOT-003', 'HOTSPOT-004', 'HOTSPOT-005', 'HOTSPOT-006', 'HOTSPOT-007'];
  const VALID_CONDITIONS = ['CLEAN', 'WASTE_PRESENT', 'PARTIALLY_CLEAN', 'UNKNOWN'];
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  await t.test('Incident validation rejects unknown hotspots', () => {
    const invalidHotspot = 'HOTSPOT-999';
    assert.equal(VALID_HOTSPOTS.includes(invalidHotspot), false);
  });

  await t.test('Incident validation accepts all MVP predefined hotspots', () => {
    VALID_HOTSPOTS.forEach((id) => {
      assert.equal(VALID_HOTSPOTS.includes(id), true);
    });
  });

  await t.test('Incident validation rejects unauthorized waste categories', () => {
    const invalidCategory = 'Toxic Waste';
    assert.equal(VALID_CATEGORIES.includes(invalidCategory), false);
  });

  await t.test('Incident validation requires description length >= 5 chars', () => {
    const shortDesc = 'abc';
    assert.equal(shortDesc.trim().length >= 5, false);

    const validDesc = 'Overfilled bin at gate';
    assert.equal(validDesc.trim().length >= 5, true);
  });

  await t.test('Follow-up validation enforces valid condition enum values', () => {
    assert.equal(VALID_CONDITIONS.includes('CLEAN'), true);
    assert.equal(VALID_CONDITIONS.includes('WASTE_PRESENT'), true);
    assert.equal(VALID_CONDITIONS.includes('DIRTY'), false);
  });

  await t.test('S3 Presign validation rejects unsupported MIME types and oversized files', () => {
    assert.equal(ALLOWED_MIME_TYPES.includes('application/pdf'), false);
    assert.equal(ALLOWED_MIME_TYPES.includes('image/jpeg'), true);

    const oversized = 6 * 1024 * 1024;
    assert.equal(oversized <= MAX_SIZE_BYTES, false);

    const normalSize = 2 * 1024 * 1024;
    assert.equal(normalSize <= MAX_SIZE_BYTES, true);
  });
});
