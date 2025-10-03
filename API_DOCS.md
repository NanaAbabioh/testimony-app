# Enhanced Clips API Documentation

## Overview
The `/api/clips` endpoint provides paginated access to testimony clips with advanced caching and cursor-based pagination for optimal performance.

## Endpoint
```
GET /api/clips
```

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `categoryId` | string | - | Filter clips by category ID |
| `month` | string | - | Filter by month (YYYY-MM format, recent sort only) |
| `sort` | string | `"recent"` | Sort order: `"recent"` or `"mostSaved"` |
| `limit` | number | `20` | Number of clips per page (max: 50) |
| `cursor` | string | - | Base64-encoded pagination cursor |

## Response Format

### Success Response (200)
```typescript
{
  items: ClipDTO[],
  nextCursor?: string,
  meta: {
    count: number,
    hasMore: boolean,
    queryTimeMs: number,
    query: {
      categoryId?: string,
      month?: string,
      sort: string,
      limit: number,
      hasCursor: boolean
    }
  }
}
```

### Error Response (4xx/5xx)
```typescript
{
  error: string,
  timestamp: string,
  requestId: string
}
```

## Pagination

### Cursor Structure
Cursors are base64url-encoded JSON objects containing the last item's sort fields:

**Recent Sort:**
```typescript
{
  serviceDate: "2025-01-15",  // YYYY-MM-DD
  createdAtMs: 1705315200000  // Unix timestamp in milliseconds
}
```

**Most Saved Sort:**
```typescript
{
  savedCount: 42,             // Number of saves
  createdAtMs: 1705315200000  // Unix timestamp in milliseconds
}
```

### Pagination Flow
1. **First Request:** `/api/clips?sort=recent&limit=20`
2. **Subsequent Requests:** `/api/clips?sort=recent&limit=20&cursor=eyJ...`
3. **End of Data:** Response has no `nextCursor` field

## Caching Headers

The API implements aggressive caching for optimal performance:

```http
Cache-Control: public, max-age=60, stale-while-revalidate=300, s-maxage=120
ETag: "clips-recent-all-all-20-150"
Vary: Accept-Encoding
```

- **max-age=60:** Browser cache for 1 minute
- **stale-while-revalidate=300:** Serve stale content for 5 minutes while revalidating
- **s-maxage=120:** CDN cache for 2 minutes

## Usage Examples

### Basic Request
```javascript
const response = await fetch('/api/clips?sort=recent&limit=10');
const data = await response.json();
console.log(data.items); // Array of ClipDTO
```

### Filtered Request
```javascript
const response = await fetch('/api/clips?categoryId=healing&month=2025-01&sort=recent');
const data = await response.json();
```

### Pagination
```javascript
let cursor = null;
const allClips = [];

while (true) {
  const params = new URLSearchParams({
    sort: 'mostSaved',
    limit: '20',
    ...(cursor && { cursor })
  });
  
  const response = await fetch(`/api/clips?${params}`);
  const data = await response.json();
  
  allClips.push(...data.items);
  
  if (!data.nextCursor) break;
  cursor = data.nextCursor;
}
```

### Using React Hook
```typescript
import { useClipsPagination } from '@/lib/hooks/useClipsPagination';

function ClipsList() {
  const {
    clips,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  } = useClipsPagination({
    categoryId: 'healing',
    sort: 'recent',
    limit: 20
  });

  if (loading && clips.length === 0) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {clips.map(clip => (
        <div key={clip.id}>{clip.title}</div>
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Error Handling

### Common Error Codes

| Code | Description | Example |
|------|-------------|---------|
| 400 | Bad Request | Invalid month format |
| 403 | Forbidden | Database permission denied |
| 429 | Too Many Requests | Rate limit exceeded |
| 503 | Service Unavailable | Database index missing |
| 500 | Internal Server Error | Unexpected server error |

### Error Response Example
```json
{
  "error": "Invalid month format: 2025-13. Expected YYYY-MM format.",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Performance Characteristics

### Query Performance
- **Recent Sort:** O(log n) with proper indexing
- **Most Saved Sort:** O(log n) with composite index
- **Month Filtering:** O(log n) with date range index
- **Category Filtering:** O(log n) with category index

### Caching Benefits
- **Browser Cache:** Eliminates duplicate requests within 1 minute
- **CDN Cache:** Reduces server load for popular queries
- **Stale-While-Revalidate:** Maintains fast response times

### Memory Usage
- **Cursor Overhead:** ~50-100 bytes per cursor
- **Response Size:** ~1-2KB per clip (varies by content)

## Best Practices

### Client-Side
1. **Implement Pagination:** Don't load all clips at once
2. **Cache Responses:** Respect cache headers
3. **Handle Errors:** Implement retry logic for transient errors
4. **Debounce Requests:** Avoid rapid consecutive requests

### Server-Side
1. **Monitor Query Times:** Alert on queries >500ms
2. **Index Coverage:** Ensure proper Firestore indexes
3. **Rate Limiting:** Implement per-client rate limits
4. **Error Logging:** Track error patterns

### Example Implementation
```typescript
// Robust client implementation
async function fetchClipsWithRetry(
  params: Record<string, string>,
  maxRetries = 3
): Promise<ClipsResponse> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`/api/clips?${new URLSearchParams(params)}`);
      
      if (response.ok) {
        return await response.json();
      }
      
      if (response.status >= 400 && response.status < 500) {
        // Client errors - don't retry
        throw new Error(`Client error: ${response.status}`);
      }
      
      // Server errors - retry with exponential backoff
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
        continue;
      }
      
      throw new Error(`Server error: ${response.status}`);
      
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

## Monitoring & Analytics

The API provides detailed logging for monitoring:

### Request Logs
```json
{
  "level": "info",
  "message": "[Clips API] Request",
  "categoryId": "healing",
  "sort": "recent",
  "limit": 20,
  "hasCursor": false,
  "userAgent": "Mozilla/5.0..."
}
```

### Response Logs
```json
{
  "level": "info", 
  "message": "[Clips API] Success",
  "itemCount": 20,
  "hasNextCursor": true,
  "queryTimeMs": 145,
  "sort": "recent",
  "categoryId": "healing"
}
```

### Key Metrics
- **Query Time:** Average time to execute Firestore query
- **Cache Hit Rate:** Percentage of requests served from cache
- **Error Rate:** Percentage of requests resulting in errors
- **Pagination Usage:** Distribution of cursor vs. non-cursor requests