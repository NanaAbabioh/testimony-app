# AH Testimony Library - Firebase Functions

This directory contains Firebase Cloud Functions for the Alpha Hour Testimony Library analytics system.

## Functions

### `computeDailySummary` (Scheduled)
- **Schedule**: Runs every 60 minutes
- **Purpose**: Computes analytics for the last 7 days and stores results in `analytics/dailySummary`
- **Metrics Computed**:
  - Videos processed in last 7 days
  - Clips published in last 7 days  
  - Top 5 clips by saves
  - Top category by saves
  - Category breakdown by saves
  - Average time from video creation to going live
  - Open flags/reports count and median age

### `triggerDailySummary` (HTTP)
- **URL**: `https://region-project.cloudfunctions.net/triggerDailySummary`
- **Purpose**: Manual testing endpoint to verify function deployment
- **Method**: GET/POST

## Development

### Prerequisites
- Node.js 18+ (recommended)
- Firebase CLI installed globally: `npm install -g firebase-tools`

### Commands
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Test locally (requires Firebase emulator)
npm run serve

# Deploy to Firebase
npm run deploy
```

## Database Schema Requirements

The functions expect these Firestore collections:

- `videos` - with fields: `processedAt`, `wentLiveAt`, `createdAt`, `status`
- `clips` - with fields: `publishedAt`, `status`, `categoryId`, `title`, `videoId`
- `userSaves/{uid}/clips/{clipId}` - with fields: `savedAtMs`, `clipId`
- `reports` - with fields: `status`, `createdAt` (optional)

## Analytics Output

Results are stored in `analytics/dailySummary`:
```json
{
  "updatedAt": "2024-01-01T12:00:00Z",
  "last7d": {
    "videosProcessed": 5,
    "clipsPublished": 23,
    "topCategory": { "categoryId": "healing", "saves": 45 },
    "topClips": [...],
    "categorySplit": [...],
    "timeToPublishAvgHours": 2.5,
    "flagsOpen": 0,
    "flagsMedianAgeHours": 0,
    "highlight": "Top saves in \"healing\"",
    "nextAction": "All clear"
  }
}
```