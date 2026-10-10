import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHotspotRecurrence, HotspotTimelineItem, ThresholdConfig } from '../src/services/recurrence';

test('End-to-End Workflow Input / Output Scenarios (Section 1, 13, 14 & 23)', async (t) => {
  // =========================================================================
  // Workflow Scenario 1: Isolated Single Incident (Normal Hotspot)
  // Input: Single report at Parking Area
  // Expected Output: recurrenceCount=1, classification='Normal', postCleanup=0
  // =========================================================================
  await t.test('Scenario 1 Input -> Output: Isolated single incident yields Normal classification', () => {
    const inputTimelineItems: HotspotTimelineItem[] = [
      {
        SK: 'INCIDENT#2026-10-01T08:00:00Z#INC-101',
        type: 'INCIDENT',
        createdAt: '2026-10-01T08:00:00Z',
      },
    ];

    const outputMetrics = calculateHotspotRecurrence('HOTSPOT-005', inputTimelineItems);

    assert.equal(outputMetrics.hotspotId, 'HOTSPOT-005');
    assert.equal(outputMetrics.totalIncidents, 1);
    assert.equal(outputMetrics.totalCleanups, 0);
    assert.equal(outputMetrics.totalFollowUps, 0);
    assert.equal(outputMetrics.recurrenceCount, 1);
    assert.equal(outputMetrics.postCleanupRecurrenceCount, 0);
    assert.equal(outputMetrics.classification, 'Normal');
    assert.equal(outputMetrics.lastIncidentDate, '2026-10-01T08:00:00Z');
    assert.equal(outputMetrics.lastCleanupDate, undefined);
    assert.equal(outputMetrics.lastFollowUpDate, undefined);
  });

  // =========================================================================
  // Workflow Scenario 2: Two Incidents (Monitor Hotspot)
  // Input: 2 distinct reports at Science Block
  // Expected Output: recurrenceCount=2, classification='Monitor'
  // =========================================================================
  await t.test('Scenario 2 Input -> Output: Two distinct incidents yield Monitor classification', () => {
    const inputTimelineItems: HotspotTimelineItem[] = [
      {
        SK: 'INCIDENT#2026-10-01T08:00:00Z#INC-201',
        type: 'INCIDENT',
        createdAt: '2026-10-01T08:00:00Z',
      },
      {
        SK: 'INCIDENT#2026-10-03T11:30:00Z#INC-202',
        type: 'INCIDENT',
        createdAt: '2026-10-03T11:30:00Z',
      },
    ];

    const outputMetrics = calculateHotspotRecurrence('HOTSPOT-004', inputTimelineItems);

    assert.equal(outputMetrics.hotspotId, 'HOTSPOT-004');
    assert.equal(outputMetrics.totalIncidents, 2);
    assert.equal(outputMetrics.recurrenceCount, 2);
    assert.equal(outputMetrics.classification, 'Monitor');
    assert.equal(outputMetrics.lastIncidentDate, '2026-10-03T11:30:00Z');
  });

  // =========================================================================
  // Workflow Scenario 3: Three Incidents (Recurring Hotspot by Threshold)
  // Input: 3 reports at Main Entrance
  // Expected Output: recurrenceCount=3, classification='Recurring'
  // =========================================================================
  await t.test('Scenario 3 Input -> Output: Three incidents reach threshold and yield Recurring classification', () => {
    const inputTimelineItems: HotspotTimelineItem[] = [
      {
        SK: 'INCIDENT#2026-10-01T08:00:00Z#INC-301',
        type: 'INCIDENT',
        createdAt: '2026-10-01T08:00:00Z',
      },
      {
        SK: 'INCIDENT#2026-10-02T09:00:00Z#INC-302',
        type: 'INCIDENT',
        createdAt: '2026-10-02T09:00:00Z',
      },
      {
        SK: 'INCIDENT#2026-10-04T16:00:00Z#INC-303',
        type: 'INCIDENT',
        createdAt: '2026-10-04T16:00:00Z',
      },
    ];

    const outputMetrics = calculateHotspotRecurrence('HOTSPOT-002', inputTimelineItems);

    assert.equal(outputMetrics.hotspotId, 'HOTSPOT-002');
    assert.equal(outputMetrics.totalIncidents, 3);
    assert.equal(outputMetrics.recurrenceCount, 3);
    assert.equal(outputMetrics.classification, 'Recurring');
    assert.equal(outputMetrics.lastIncidentDate, '2026-10-04T16:00:00Z');
  });

  // =========================================================================
  // Workflow Scenario 4: Successful Remediation (Clean Follow-up, No Recurrence)
  // Input: Incident -> Cleanup -> Follow-up (CLEAN)
  // Expected Output: postCleanupRecurrenceCount=0, classification='Normal'
  // =========================================================================
  await t.test('Scenario 4 Input -> Output: Incident -> Cleanup -> CLEAN follow-up yields 0 post-cleanup recurrence', () => {
    const inputTimelineItems: HotspotTimelineItem[] = [
      {
        SK: 'INCIDENT#2026-10-01T09:00:00Z#INC-401',
        type: 'INCIDENT',
        createdAt: '2026-10-01T09:00:00Z',
      },
      {
        SK: 'CLEANUP#2026-10-01T12:00:00Z#CLN-401',
        type: 'CLEANUP',
        performedAt: '2026-10-01T12:00:00Z',
        createdAt: '2026-10-01T12:00:00Z',
      },
      {
        SK: 'FOLLOWUP#2026-10-02T10:00:00Z#FOL-401',
        type: 'FOLLOWUP',
        observedAt: '2026-10-02T10:00:00Z',
        condition: 'CLEAN',
        createdAt: '2026-10-02T10:00:00Z',
      },
    ];

    const outputMetrics = calculateHotspotRecurrence('HOTSPOT-003', inputTimelineItems);

    assert.equal(outputMetrics.totalIncidents, 1);
    assert.equal(outputMetrics.totalCleanups, 1);
    assert.equal(outputMetrics.totalFollowUps, 1);
    assert.equal(outputMetrics.postCleanupRecurrenceCount, 0);
    assert.equal(outputMetrics.classification, 'Normal');
    assert.equal(outputMetrics.lastCleanupDate, '2026-10-01T12:00:00Z');
    assert.equal(outputMetrics.lastFollowUpDate, '2026-10-02T10:00:00Z');
  });

  // =========================================================================
  // Workflow Scenario 5: MANDATORY CRITICAL MVP TEST SCENARIO (Section 14 & 23)
  // Input Sequence:
  //   1. Incident A: Library Gate (2026-10-06T09:15:00Z)
  //   2. Cleanup A: Performed & marked CLEANED (2026-10-06T11:00:00Z)
  //   3. Follow-up A: Observed CLEAN (2026-10-06T14:30:00Z)
  //   4. Incident B: Same Hotspot reported again (2026-10-07T08:30:00Z)
  // Expected Output:
  //   - totalIncidents = 2
  //   - totalCleanups = 1
  //   - totalFollowUps = 1
  //   - postCleanupRecurrenceCount = 1
  //   - recurrenceCount = 2
  //   - classification = 'Recurring'
  // =========================================================================
  await t.test('Scenario 5 Input -> Output: MANDATORY PROOF OF CONCEPT (Incident A -> Cleanup A -> CLEAN -> Incident B)', () => {
    const inputSequence: HotspotTimelineItem[] = [
      {
        SK: 'INCIDENT#2026-10-06T09:15:00Z#INC-900001',
        type: 'INCIDENT',
        createdAt: '2026-10-06T09:15:00Z',
      },
      {
        SK: 'CLEANUP#2026-10-06T11:00:00Z#CLN-900001',
        type: 'CLEANUP',
        performedAt: '2026-10-06T11:00:00Z',
        createdAt: '2026-10-06T11:00:00Z',
      },
      {
        SK: 'FOLLOWUP#2026-10-06T14:30:00Z#FOL-900001',
        type: 'FOLLOWUP',
        observedAt: '2026-10-06T14:30:00Z',
        condition: 'CLEAN',
        createdAt: '2026-10-06T14:30:00Z',
      },
      {
        SK: 'INCIDENT#2026-10-07T08:30:00Z#INC-900002',
        type: 'INCIDENT',
        createdAt: '2026-10-07T08:30:00Z',
      },
    ];

    const outputMetrics = calculateHotspotRecurrence('HOTSPOT-001', inputSequence);

    assert.equal(outputMetrics.hotspotId, 'HOTSPOT-001');
    assert.equal(outputMetrics.totalIncidents, 2);
    assert.equal(outputMetrics.totalCleanups, 1);
    assert.equal(outputMetrics.totalFollowUps, 1);
    assert.equal(outputMetrics.recurrenceCount, 2);
    assert.equal(outputMetrics.postCleanupRecurrenceCount, 1);
    assert.equal(outputMetrics.classification, 'Recurring');
    assert.equal(outputMetrics.lastIncidentDate, '2026-10-07T08:30:00Z');
    assert.equal(outputMetrics.lastCleanupDate, '2026-10-06T11:00:00Z');
    assert.equal(outputMetrics.lastFollowUpDate, '2026-10-06T14:30:00Z');
    assert.match(outputMetrics.disclaimer, /Recurrence indicates repeated observations/);
  });

  // =========================================================================
  // Workflow Scenario 6: Configurable Recurrence Threshold (Section 13)
  // Input: 3 incidents with default threshold (recurringMin=3) vs custom threshold (recurringMin=5, monitorMax=3)
  // Expected Output:
  //   - default threshold -> classification='Recurring'
  //   - custom threshold -> classification='Monitor'
  // =========================================================================
  await t.test('Scenario 6 Input -> Output: Configurable recurrence threshold correctly adjusts classification', () => {
    const inputItems: HotspotTimelineItem[] = [
      { SK: 'INCIDENT#2026-10-01T10:00:00Z#1', createdAt: '2026-10-01T10:00:00Z' },
      { SK: 'INCIDENT#2026-10-02T10:00:00Z#2', createdAt: '2026-10-02T10:00:00Z' },
      { SK: 'INCIDENT#2026-10-03T10:00:00Z#3', createdAt: '2026-10-03T10:00:00Z' },
    ];

    // Default threshold where recurring begins at 3 incidents
    const outputDefault = calculateHotspotRecurrence('HOTSPOT-001', inputItems);
    assert.equal(outputDefault.classification, 'Recurring');

    // Custom threshold where recurring requires 5 incidents, and monitor is 3
    const customThreshold: ThresholdConfig = {
      normalMax: 2,
      monitorMax: 3,
      recurringMin: 5,
      elevateOnPostCleanupRecurrence: false,
    };
    const outputCustom = calculateHotspotRecurrence('HOTSPOT-001', inputItems, customThreshold);
    assert.equal(outputCustom.classification, 'Monitor');
  });
});
