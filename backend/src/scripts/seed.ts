/**
 * CleanLoop MVP: Synthetic Data Seed Script (Section 22)
 *
 * NOTE: SYNTHETIC DATA FOR DEVELOPMENT/DEMO ONLY.
 * NEVER PRESENT SYNTHETIC RECORDS AS REAL ENVIRONMENTAL RESULTS.
 *
 * Scenarios Included:
 * 1. One-time hotspot (HOTSPOT-005: 1 incident -> Normal)
 * 2. Repeated hotspot (HOTSPOT-001: Incident A -> Cleanup A -> Follow-up A (CLEAN) -> Incident B -> Recurrence detected)
 * 3. Cleanup followed by WASTE_PRESENT (HOTSPOT-003)
 * 4. Multiple incidents exceeding threshold (HOTSPOT-002: 3 incidents -> Recurring)
 */

import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../services/dynamo';
import { logger } from '../utils/logger';

export const SYNTHETIC_SEED_ITEMS = [
  // ========================================================
  // Scenario 1: One-time hotspot (HOTSPOT-005: Parking Area)
  // Classification: Normal (1 incident)
  // ========================================================
  {
    PK: 'INCIDENT#INC-900005',
    SK: 'METADATA',
    incidentId: 'INC-900005',
    hotspotId: 'HOTSPOT-005',
    reportedBy: 'student.visitor@cleanloop.internal',
    reportedAt: '2026-10-05T14:00:00Z',
    wasteCategory: 'Glass',
    description: '[SYNTHETIC] Single bottle near parking kerb. Isolated deposit.',
    status: 'REPORTED',
    createdAt: '2026-10-05T14:00:00Z',
    updatedAt: '2026-10-05T14:00:00Z',
    GSI1PK: 'REPORTED',
    GSI1SK: '2026-10-05T14:00:00Z',
    GSI2PK: 'student.visitor@cleanloop.internal',
    GSI2SK: '2026-10-05T14:00:00Z',
    isSynthetic: true,
  },
  {
    PK: 'HOTSPOT#HOTSPOT-005',
    SK: 'INCIDENT#2026-10-05T14:00:00Z#INC-900005',
    type: 'INCIDENT',
    incidentId: 'INC-900005',
    hotspotId: 'HOTSPOT-005',
    reportedBy: 'student.visitor@cleanloop.internal',
    reportedAt: '2026-10-05T14:00:00Z',
    wasteCategory: 'Glass',
    description: '[SYNTHETIC] Single bottle near parking kerb.',
    status: 'REPORTED',
    createdAt: '2026-10-05T14:00:00Z',
    isSynthetic: true,
  },

  // =========================================================================
  // Scenario 2: CRITICAL MVP TEST SCENARIO (HOTSPOT-001: Library Gate)
  // Incident A -> Cleanup A -> Follow-up A (CLEAN) -> Incident B (Same hotspot)
  // Recurrence Count: 2, Post-cleanup: 1 -> Status: Recurring
  // =========================================================================
  // Incident A
  {
    PK: 'INCIDENT#INC-900001',
    SK: 'METADATA',
    incidentId: 'INC-900001',
    hotspotId: 'HOTSPOT-001',
    reportedBy: 'student.dev@university.edu',
    reportedAt: '2026-10-06T09:15:00Z',
    wasteCategory: 'Plastic',
    description: '[SYNTHETIC] Incident A: Discarded water bottles near library bike racks.',
    status: 'CLEANED',
    createdAt: '2026-10-06T09:15:00Z',
    updatedAt: '2026-10-06T11:00:00Z',
    GSI1PK: 'CLEANED',
    GSI1SK: '2026-10-06T11:00:00Z',
    GSI2PK: 'student.dev@university.edu',
    GSI2SK: '2026-10-06T09:15:00Z',
    isSynthetic: true,
  },
  {
    PK: 'HOTSPOT#HOTSPOT-001',
    SK: 'INCIDENT#2026-10-06T09:15:00Z#INC-900001',
    type: 'INCIDENT',
    incidentId: 'INC-900001',
    hotspotId: 'HOTSPOT-001',
    reportedBy: 'student.dev@university.edu',
    reportedAt: '2026-10-06T09:15:00Z',
    wasteCategory: 'Plastic',
    description: '[SYNTHETIC] Incident A: Discarded water bottles near library bike racks.',
    status: 'CLEANED',
    createdAt: '2026-10-06T09:15:00Z',
    isSynthetic: true,
  },
  // Cleanup A
  {
    PK: 'HOTSPOT#HOTSPOT-001',
    SK: 'CLEANUP#2026-10-06T11:00:00Z#CLN-900001',
    type: 'CLEANUP',
    cleanupId: 'CLN-900001',
    incidentId: 'INC-900001',
    hotspotId: 'HOTSPOT-001',
    performedBy: 'cleanup.crew@cleanloop.internal',
    performedAt: '2026-10-06T11:00:00Z',
    status: 'COMPLETED',
    notes: '[SYNTHETIC] Cleanup A: Cleared all plastic bottles, sanitized bike rack perimeter.',
    createdAt: '2026-10-06T11:00:00Z',
    isSynthetic: true,
  },
  // Follow-up A = CLEAN
  {
    PK: 'HOTSPOT#HOTSPOT-001',
    SK: 'FOLLOWUP#2026-10-06T15:30:00Z#FOL-900001',
    type: 'FOLLOWUP',
    followUpId: 'FOL-900001',
    incidentId: 'INC-900001',
    hotspotId: 'HOTSPOT-001',
    observedBy: 'inspector.sarah@cleanloop.internal',
    observedAt: '2026-10-06T15:30:00Z',
    condition: 'CLEAN',
    notes: '[SYNTHETIC] Follow-up A: Perimeter inspected. Verified 100% clean.',
    createdAt: '2026-10-06T15:30:00Z',
    isSynthetic: true,
  },
  // Incident B (Same hotspot after cleanup)
  {
    PK: 'INCIDENT#INC-900002',
    SK: 'METADATA',
    incidentId: 'INC-900002',
    hotspotId: 'HOTSPOT-001',
    reportedBy: 'student.priya@university.edu',
    reportedAt: '2026-10-07T08:30:00Z',
    wasteCategory: 'Food Waste',
    description: '[SYNTHETIC] Incident B: Post-cleanup recurrence. Takeaway boxes returned at same library gate.',
    status: 'REPORTED',
    createdAt: '2026-10-07T08:30:00Z',
    updatedAt: '2026-10-07T08:30:00Z',
    GSI1PK: 'REPORTED',
    GSI1SK: '2026-10-07T08:30:00Z',
    GSI2PK: 'student.priya@university.edu',
    GSI2SK: '2026-10-07T08:30:00Z',
    isSynthetic: true,
  },
  {
    PK: 'HOTSPOT#HOTSPOT-001',
    SK: 'INCIDENT#2026-10-07T08:30:00Z#INC-900002',
    type: 'INCIDENT',
    incidentId: 'INC-900002',
    hotspotId: 'HOTSPOT-001',
    reportedBy: 'student.priya@university.edu',
    reportedAt: '2026-10-07T08:30:00Z',
    wasteCategory: 'Food Waste',
    description: '[SYNTHETIC] Incident B: Post-cleanup recurrence. Takeaway boxes returned.',
    status: 'REPORTED',
    createdAt: '2026-10-07T08:30:00Z',
    isSynthetic: true,
  },

  // =========================================================================
  // Scenario 3: Cleanup followed by WASTE_PRESENT (HOTSPOT-003: Cafeteria Area)
  // =========================================================================
  {
    PK: 'INCIDENT#INC-900003',
    SK: 'METADATA',
    incidentId: 'INC-900003',
    hotspotId: 'HOTSPOT-003',
    reportedBy: 'student.arjun@university.edu',
    reportedAt: '2026-10-06T12:00:00Z',
    wasteCategory: 'Mixed Waste',
    description: '[SYNTHETIC] Lunchtime perimeter overflow.',
    status: 'CLEANED',
    createdAt: '2026-10-06T12:00:00Z',
    updatedAt: '2026-10-06T13:30:00Z',
    GSI1PK: 'CLEANED',
    GSI1SK: '2026-10-06T13:30:00Z',
    GSI2PK: 'student.arjun@university.edu',
    GSI2SK: '2026-10-06T12:00:00Z',
    isSynthetic: true,
  },
  {
    PK: 'HOTSPOT#HOTSPOT-003',
    SK: 'INCIDENT#2026-10-06T12:00:00Z#INC-900003',
    type: 'INCIDENT',
    incidentId: 'INC-900003',
    hotspotId: 'HOTSPOT-003',
    reportedBy: 'student.arjun@university.edu',
    reportedAt: '2026-10-06T12:00:00Z',
    wasteCategory: 'Mixed Waste',
    description: '[SYNTHETIC] Lunchtime perimeter overflow.',
    status: 'CLEANED',
    createdAt: '2026-10-06T12:00:00Z',
    isSynthetic: true,
  },
  {
    PK: 'HOTSPOT#HOTSPOT-003',
    SK: 'CLEANUP#2026-10-06T13:30:00Z#CLN-900003',
    type: 'CLEANUP',
    cleanupId: 'CLN-900003',
    incidentId: 'INC-900003',
    hotspotId: 'HOTSPOT-003',
    performedBy: 'cleanup.operator@cleanloop.internal',
    performedAt: '2026-10-06T13:30:00Z',
    status: 'COMPLETED',
    notes: '[SYNTHETIC] Cafeteria area swept and bins emptied.',
    createdAt: '2026-10-06T13:30:00Z',
    isSynthetic: true,
  },
  {
    PK: 'HOTSPOT#HOTSPOT-003',
    SK: 'FOLLOWUP#2026-10-06T16:00:00Z#FOL-900003',
    type: 'FOLLOWUP',
    followUpId: 'FOL-900003',
    incidentId: 'INC-900003',
    hotspotId: 'HOTSPOT-003',
    observedBy: 'inspector.sarah@cleanloop.internal',
    observedAt: '2026-10-06T16:00:00Z',
    condition: 'WASTE_PRESENT',
    notes: '[SYNTHETIC] Audit finding: New packaging deposited immediately after afternoon shift. WASTE_PRESENT.',
    createdAt: '2026-10-06T16:00:00Z',
    isSynthetic: true,
  },

  // =========================================================================
  // Scenario 4: Multiple Incidents (HOTSPOT-002: Main Entrance)
  // 3 distinct incidents -> Classification: Recurring (>= 3 threshold)
  // =========================================================================
  {
    PK: 'INCIDENT#INC-900010',
    SK: 'METADATA',
    incidentId: 'INC-900010',
    hotspotId: 'HOTSPOT-002',
    reportedBy: 'student.commuter1@cleanloop.internal',
    reportedAt: '2026-10-04T08:00:00Z',
    wasteCategory: 'Paper',
    description: '[SYNTHETIC] Bus stop paper flyers littered across gate path.',
    status: 'CLEANED',
    createdAt: '2026-10-04T08:00:00Z',
    updatedAt: '2026-10-04T09:00:00Z',
    GSI1PK: 'CLEANED',
    GSI1SK: '2026-10-04T09:00:00Z',
    GSI2PK: 'student.commuter1@cleanloop.internal',
    GSI2SK: '2026-10-04T08:00:00Z',
    isSynthetic: true,
  },
  {
    PK: 'HOTSPOT#HOTSPOT-002',
    SK: 'INCIDENT#2026-10-04T08:00:00Z#INC-900010',
    type: 'INCIDENT',
    incidentId: 'INC-900010',
    hotspotId: 'HOTSPOT-002',
    reportedBy: 'student.commuter1@cleanloop.internal',
    reportedAt: '2026-10-04T08:00:00Z',
    wasteCategory: 'Paper',
    description: '[SYNTHETIC] Bus stop paper flyers littered across gate path.',
    status: 'CLEANED',
    createdAt: '2026-10-04T08:00:00Z',
    isSynthetic: true,
  },
  {
    PK: 'INCIDENT#INC-900011',
    SK: 'METADATA',
    incidentId: 'INC-900011',
    hotspotId: 'HOTSPOT-002',
    reportedBy: 'student.commuter2@cleanloop.internal',
    reportedAt: '2026-10-05T08:00:00Z',
    wasteCategory: 'Plastic',
    description: '[SYNTHETIC] Beverage cups along transit queue.',
    status: 'CLEANED',
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
    GSI1PK: 'CLEANED',
    GSI1SK: '2026-10-05T09:00:00Z',
    GSI2PK: 'student.commuter2@cleanloop.internal',
    GSI2SK: '2026-10-05T08:00:00Z',
    isSynthetic: true,
  },
  {
    PK: 'HOTSPOT#HOTSPOT-002',
    SK: 'INCIDENT#2026-10-05T08:00:00Z#INC-900011',
    type: 'INCIDENT',
    incidentId: 'INC-900011',
    hotspotId: 'HOTSPOT-002',
    reportedBy: 'student.commuter2@cleanloop.internal',
    reportedAt: '2026-10-05T08:00:00Z',
    wasteCategory: 'Plastic',
    description: '[SYNTHETIC] Beverage cups along transit queue.',
    status: 'CLEANED',
    createdAt: '2026-10-05T08:00:00Z',
    isSynthetic: true,
  },
  {
    PK: 'INCIDENT#INC-900012',
    SK: 'METADATA',
    incidentId: 'INC-900012',
    hotspotId: 'HOTSPOT-002',
    reportedBy: 'student.commuter3@cleanloop.internal',
    reportedAt: '2026-10-06T08:00:00Z',
    wasteCategory: 'Food Waste',
    description: '[SYNTHETIC] Third incident at Main Entrance. Wrappers and bags.',
    status: 'REPORTED',
    createdAt: '2026-10-06T08:00:00Z',
    updatedAt: '2026-10-06T08:00:00Z',
    GSI1PK: 'REPORTED',
    GSI1SK: '2026-10-06T08:00:00Z',
    GSI2PK: 'student.commuter3@cleanloop.internal',
    GSI2SK: '2026-10-06T08:00:00Z',
    isSynthetic: true,
  },
  {
    PK: 'HOTSPOT#HOTSPOT-002',
    SK: 'INCIDENT#2026-10-06T08:00:00Z#INC-900012',
    type: 'INCIDENT',
    incidentId: 'INC-900012',
    hotspotId: 'HOTSPOT-002',
    reportedBy: 'student.commuter3@cleanloop.internal',
    reportedAt: '2026-10-06T08:00:00Z',
    wasteCategory: 'Food Waste',
    description: '[SYNTHETIC] Third incident at Main Entrance. Wrappers and bags.',
    status: 'REPORTED',
    createdAt: '2026-10-06T08:00:00Z',
    isSynthetic: true,
  },
];

export async function seedDynamoDB(): Promise<void> {
  console.log('===========================================================');
  console.log('🌱 CLEANLOOP MVP SYNTHETIC DATA SEED SCRIPT');
  console.log('⚠️  SYNTHETIC DATA FOR DEVELOPMENT/DEMO ONLY');
  console.log('   Never present synthetic records as real environmental results');
  console.log('===========================================================');

  for (const item of SYNTHETIC_SEED_ITEMS) {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );
    console.log(`[SEED] Written PK=${item.PK} | SK=${item.SK}`);
  }

  console.log(`\n✅ Successfully seeded ${SYNTHETIC_SEED_ITEMS.length} synthetic items to DynamoDB.`);
}

if (require.main === module) {
  seedDynamoDB().catch((err) => {
    logger.error('SEED_SCRIPT_ERROR', 'Failed to seed synthetic data', err);
    process.exit(1);
  });
}
