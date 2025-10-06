# Status History Documentation

## Overview
The status history system automatically tracks all changes to lead statuses in Firestore, storing comprehensive information about each status transition.

## Data Structure

### Status History Document Structure
Each status change is stored in the subcollection `/leads/{lead_id}/status_history/{event_id}` with the following structure:

```json
{
  "auto_triggered": false,
  "changed_at": "Sun Oct 05 2025 18:28:14 GMT-0500 (Central Daylight Time)",
  "changed_by": "system",
  "comments": "",
  "lead_email": "sophia.martinez@example.com",
  "lead_id": "p5CiurH0vPeFCiU7BZpY",
  "lead_name": "Sophia Martinez",
  "new_data": {
    "status": "negotiation"
  },
  "notes": "he is considering the proposal but wana check on the price",
  "previous_data": {
    "status": "proposal"
  },
  "previous_status": "proposal",
  "reason": "he is considering the proposal but wana check on the price",
  "search_keywords": ["proposal", "negotiation", ...],
  "to_status": "negotiation"
}
```

## Field Explanations

### Core Status Fields
- **`previous_status`** (string): The lead's status before the change
- **`to_status`** (string): The lead's new status after the change
- **`reason`** (string): Brief explanation for the status change

### Tracking Fields
- **`changed_by`** (string): User or system that initiated the change
- **`changed_at`** (timestamp): When the status change occurred
- **`auto_triggered`** (boolean): Whether the change was automatic or manual

### Lead Context Fields
- **`lead_id`** (string): Document ID of the lead
- **`lead_name`** (string): Full name of the lead
- **`lead_email`** (string): Email address of the lead

### Additional Information Fields
- **`comments`** (string): Additional context about the status change
- **`notes`** (string): Detailed notes about the status change
- **`previous_data`** (map): Complete data snapshot before the change
- **`new_data`** (map): Complete data snapshot after the change

### Search Optimization Fields
- **`search_keywords`** (array): Keywords for searching and filtering status history

## Usage Examples

### Manual Status Change
```json
{
  "auto_triggered": false,
  "changed_by": "sales_rep_01",
  "reason": "Client confirmed budget and timeline"
}
```

### Automatic Status Change
```json
{
  "auto_triggered": true,
  "changed_by": "system",
  "reason": "Contract signed automatically"
}
```

### Status Change with Comments
```json
{
  "auto_triggered": false,
  "changed_by": "manager_02",
  "reason": "Budget approved",
  "comments": "Client has full decision-making authority",
  "notes": "Additional context about the approval process"
}
```

## Implementation Details

### Automatic Recording
- Status changes are automatically recorded when `LeadManagementService.updateLead()` is called
- No manual intervention required
- Every status change creates a new document in the status_history subcollection

### Event ID Generation
- Each status change gets a unique event ID in format: `EVT-YYYYMMDD-XXX`
- Example: `EVT-20251005-001`

### Search Keywords Generation
- Automatically generated from status names, reasons, and comments
- Enables fast searching across status history
- Includes partial matches for better search results

### Data Integrity
- Previous and new data snapshots preserve complete state
- Immutable records - no updates to existing status history
- Full audit trail for compliance and debugging
