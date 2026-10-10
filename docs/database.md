# CleanLoop MVP: DynamoDB Single-Table Design & Access Patterns

## 1. Overview
The CleanLoop MVP utilizes a single-table Amazon DynamoDB design (`CleanLoopTable`) optimized strictly for the core workflow:
**Report Waste → Cleanup → Follow-up Audit → Recurrence Engine → Admin Dashboard**.

All operations are deterministic, predictable, and avoid expensive full-table scans.

---

## 2. Table Primary Key Definition

| Field | Type | Description |
|---|---|---|
| **PK** (Partition Key) | `String` | Identifies entity partition (e.g. `HOTSPOT#<hotspotId>`, `INCIDENT#<incidentId>`) |
| **SK** (Sort Key) | `String` | Identifies entity record or chronological event timestamp (e.g. `METADATA`, `EVENT#<ISO8601>`) |

---

## 3. Global Secondary Indexes (GSIs)

To satisfy reverse lookups and dashboard feeds without scans, CleanLoop defines two focused GSIs:

### GSI-1: Status & Chronology (`GSI1`)
- **GSI1PK**: `status` (e.g. `REPORTED`, `IN_PROGRESS`, `CLEANED`)
- **GSI1SK**: `createdAt` (ISO-8601 timestamp string)
- **Purpose**: Powers the incident backlog and cleanup queue ordered by creation time.
- **Why it exists**: The Cleanup team needs to fetch all open (`REPORTED` or `IN_PROGRESS`) incidents across campus chronologically without scanning every hotspot.

### GSI-2: Reporter / Actor Lookup (`GSI2`)
- **GSI2PK**: `reportedBy` (Cognito User ID / Email)
- **GSI2SK**: `createdAt` (ISO-8601 timestamp string)
- **Purpose**: Powers the Student view: "View own reports".
- **Why it exists**: Enables instant lookups of student-submitted incidents without scanning.

---

## 4. Entity Schemas & Key Mappings

### 4.1 Hotspot Entity
- **PK**: `HOTSPOT#<hotspotId>`
- **SK**: `METADATA`
- **Attributes**:
  - `hotspotId`: string (e.g. `HOTSPOT-001`)
  - `name`: string (e.g. `Library Gate`)
  - `description`: string
  - `latitude`: number
  - `longitude`: number
  - `area`: string
  - `status`: string (`ACTIVE` | `MONITORING` | `RESOLVED`)
  - `createdAt`: string
  - `updatedAt`: string

### 4.2 Incident Entity
- Primary Item:
  - **PK**: `INCIDENT#<incidentId>`
  - **SK**: `METADATA`
  - **GSI1PK**: `<status>` (e.g. `REPORTED`)
  - **GSI1SK**: `<createdAt>`
  - **GSI2PK**: `<reportedBy>`
  - **GSI2SK**: `<createdAt>`
- Hotspot Event Item (Dual Write / Hotspot Timeline Item):
  - **PK**: `HOTSPOT#<hotspotId>`
  - **SK**: `INCIDENT#<createdAt>#<incidentId>`
  - **Attributes**:
    - `incidentId`: string
    - `hotspotId`: string
    - `reportedBy`: string
    - `reportedAt`: string
    - `wasteCategory`: string (`Plastic` | `Food Waste` | etc.)
    - `description`: string
    - `photoKey`: optional string (S3 object key)
    - `status`: string (`REPORTED` | `IN_PROGRESS` | `CLEANED` | `RESOLVED`)

### 4.3 Cleanup Record
- **PK**: `HOTSPOT#<hotspotId>`
- **SK**: `CLEANUP#<performedAt>#<cleanupId>`
- **Attributes**:
  - `cleanupId`: string
  - `incidentId`: string
  - `hotspotId`: string
  - `performedBy`: string
  - `performedAt`: string
  - `status`: string (`PENDING` | `IN_PROGRESS` | `COMPLETED`)
  - `notes`: string
  - `photoKey`: optional string

### 4.4 Follow-Up Record
- **PK**: `HOTSPOT#<hotspotId>`
- **SK**: `FOLLOWUP#<observedAt>#<followUpId>`
- **Attributes**:
  - `followUpId`: string
  - `incidentId`: string
  - `hotspotId`: string
  - `observedBy`: string
  - `observedAt`: string
  - `condition`: string (`CLEAN` | `WASTE_PRESENT` | `PARTIALLY_CLEAN` | `UNKNOWN`)
  - `notes`: string
  - `photoKey`: optional string

---

## 5. Access Patterns Mapping

| ID | Access Pattern | Method | Key Condition / Query Expression |
|---|---|---|---|
| **AP-01** | Create incident | `PutItem` | Write to `INCIDENT#<id>` and `HOTSPOT#<id>` |
| **AP-02** | Get incident by ID | `GetItem` | `PK = INCIDENT#<id>` AND `SK = METADATA` |
| **AP-03** | List open incidents for Cleanup team | `Query` on GSI1 | `GSI1PK = REPORTED` OR `IN_PROGRESS` scanIndexForward=false |
| **AP-04** | Get incidents by Hotspot | `Query` on Table | `PK = HOTSPOT#<id>` AND `begins_with(SK, "INCIDENT#")` |
| **AP-05** | Create cleanup record | `PutItem` & `UpdateItem` | Write `CLEANUP#...` and update incident status to `CLEANED` |
| **AP-06** | Get cleanup history for Hotspot | `Query` on Table | `PK = HOTSPOT#<id>` AND `begins_with(SK, "CLEANUP#")` |
| **AP-07** | Create follow-up record | `PutItem` | Write `FOLLOWUP#...` |
| **AP-08** | Get follow-up history for Hotspot | `Query` on Table | `PK = HOTSPOT#<id>` AND `begins_with(SK, "FOLLOWUP#")` |
| **AP-09** | Hotspot complete timeline | `Query` on Table | `PK = HOTSPOT#<id>` (returns incidents, cleanups, follow-ups chronologically) |
| **AP-10** | Calculate recurrence count | `Query` on Table | Query all events for `HOTSPOT#<id>` and evaluate chronological sequence |
| **AP-11** | List own reports (Student) | `Query` on GSI2 | `GSI2PK = <student_email>` scanIndexForward=false |

---

## 6. Index Minimization Rationale
- **No unnecessary GSIs**: Only 2 GSIs are deployed. GSI1 handles status triage (field crew workflow) and GSI2 handles user audit history.
- **Hotspot timeline efficiency**: All events for a single hotspot share `PK = HOTSPOT#<hotspotId>`. A single partition query returns the entire chronological event stream for a location in one network round trip.
