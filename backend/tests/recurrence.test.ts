import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHotspotRecurrence, HotspotTimelineItem } from '../src/services/recurrence';

test('Recurrence Engine Test Suite (Section 23)', async (t) => {
  await t.test('Scenario 1: 1 incident -> recurrence = 1, classification = Normal', () => {
    const items: HotspotTimelineItem[] = [
      {
        SK: 'INCIDENT#2026-10-01T10:00:00Z#INC-001',
        createdAt: '2026-10-01T10:00:00Z',
      },
    ];

    const result = calculateHotspotRecurrence('HOTSPOT-005', items);

    assert.equal(result.recurrenceCount, 1);
    assert.equal(result.totalIncidents, 1);
    assert.equal(result.totalCleanups, 0);
    assert.equal(result.totalFollowUps, 0);
    assert.equal(result.postCleanupRecurrenceCount, 0);
    assert.equal(result.classification, 'Normal');
    assert.match(result.disclaimer, /Recurrence indicates repeated observations/);
  });

  await t.test('Scenario 2: 2 incidents -> recurrence = 2, classification = Monitor', () => {
    const items: HotspotTimelineItem[] = [
      {
        SK: 'INCIDENT#2026-10-01T10:00:00Z#INC-001',
        createdAt: '2026-10-01T10:00:00Z',
      },
      {
        SK: 'INCIDENT#2026-10-02T10:00:00Z#INC-002',
        createdAt: '2026-10-02T10:00:00Z',
      },
    ];

    const result = calculateHotspotRecurrence('HOTSPOT-004', items);

    assert.equal(result.recurrenceCount, 2);
    assert.equal(result.totalIncidents, 2);
    assert.equal(result.classification, 'Monitor');
  });

  await t.test('Scenario 3: 3 incidents -> recurrence = 3, classification = Recurring', () => {
    const items: HotspotTimelineItem[] = [
      {
        SK: 'INCIDENT#2026-10-01T10:00:00Z#INC-001',
        createdAt: '2026-10-01T10:00:00Z',
      },
      {
        SK: 'INCIDENT#2026-10-02T10:00:00Z#INC-002',
        createdAt: '2026-10-02T10:00:00Z',
      },
      {
        SK: 'INCIDENT#2026-10-03T10:00:00Z#INC-003',
        createdAt: '2026-10-03T10:00:00Z',
      },
    ];

    const result = calculateHotspotRecurrence('HOTSPOT-002', items);

    assert.equal(result.recurrenceCount, 3);
    assert.equal(result.totalIncidents, 3);
    assert.equal(result.classification, 'Recurring');
  });

  await t.test('Scenario 4: Cleanup -> CLEAN follow-up -> no recurrence', () => {
    const items: HotspotTimelineItem[] = [
      {
        SK: 'INCIDENT#2026-10-01T09:00:00Z#INC-001',
        createdAt: '2026-10-01T09:00:00Z',
      },
      {
        SK: 'CLEANUP#2026-10-01T11:00:00Z#CLN-001',
        performedAt: '2026-10-01T11:00:00Z',
      },
      {
        SK: 'FOLLOWUP#2026-10-01T14:00:00Z#FOL-001',
        observedAt: '2026-10-01T14:00:00Z',
        condition: 'CLEAN',
      },
    ];

    const result = calculateHotspotRecurrence('HOTSPOT-001', items);

    assert.equal(result.totalIncidents, 1);
    assert.equal(result.totalCleanups, 1);
    assert.equal(result.totalFollowUps, 1);
    assert.equal(result.postCleanupRecurrenceCount, 0);
    assert.equal(result.classification, 'Normal');
  });

  await t.test('Scenario 5: MANDATORY CRITICAL MVP TEST SCENARIO (Section 14 & 23): Cleanup -> CLEAN -> subsequent incident detected at same hotspot', () => {
    const items: HotspotTimelineItem[] = [
      // Incident A
      {
        SK: 'INCIDENT#2026-10-06T09:15:00Z#INC-A',
        createdAt: '2026-10-06T09:15:00Z',
      },
      // Cleanup A
      {
        SK: 'CLEANUP#2026-10-06T11:00:00Z#CLN-A',
        performedAt: '2026-10-06T11:00:00Z',
      },
      // Follow-up A = CLEAN
      {
        SK: 'FOLLOWUP#2026-10-06T15:30:00Z#FOL-A',
        observedAt: '2026-10-06T15:30:00Z',
        condition: 'CLEAN',
      },
      // Incident B (Same hotspot after cleanup)
      {
        SK: 'INCIDENT#2026-10-07T08:30:00Z#INC-B',
        createdAt: '2026-10-07T08:30:00Z',
      },
    ];

    const result = calculateHotspotRecurrence('HOTSPOT-001', items);

    assert.equal(result.totalIncidents, 2);
    assert.equal(result.totalCleanups, 1);
    assert.equal(result.totalFollowUps, 1);
    // Post-cleanup recurrence is recognized!
    assert.equal(result.postCleanupRecurrenceCount, 1);
    // Status is elevated to Recurring as specified in Section 14
    assert.equal(result.classification, 'Recurring');
    assert.equal(result.lastIncidentDate, '2026-10-07T08:30:00Z');
    assert.equal(result.lastCleanupDate, '2026-10-06T11:00:00Z');
    assert.equal(result.lastFollowUpDate, '2026-10-06T15:30:00Z');
  });

  await t.test('Scenario 6: Cleanup -> WASTE_PRESENT -> subsequent incident detected', () => {
    const items: HotspotTimelineItem[] = [
      {
        SK: 'INCIDENT#2026-10-01T09:00:00Z#INC-1',
        createdAt: '2026-10-01T09:00:00Z',
      },
      {
        SK: 'CLEANUP#2026-10-01T11:00:00Z#CLN-1',
        performedAt: '2026-10-01T11:00:00Z',
      },
      {
        SK: 'FOLLOWUP#2026-10-01T14:00:00Z#FOL-1',
        observedAt: '2026-10-01T14:00:00Z',
        condition: 'WASTE_PRESENT',
      },
      {
        SK: 'INCIDENT#2026-10-02T10:00:00Z#INC-2',
        createdAt: '2026-10-02T10:00:00Z',
      },
    ];

    const result = calculateHotspotRecurrence('HOTSPOT-003', items);

    assert.equal(result.totalIncidents, 2);
    assert.equal(result.totalCleanups, 1);
    assert.equal(result.totalFollowUps, 1);
    assert.equal(result.postCleanupRecurrenceCount, 1);
    assert.equal(result.classification, 'Recurring');
  });
});
