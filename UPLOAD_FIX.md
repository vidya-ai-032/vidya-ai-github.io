# Upload Issue Fix

## Problem

The upload functionality was failing with a 500 error due to the `pdf-parse` library trying to access a test file during initialization:

```
ENOENT: no such file or directory, open 'C:\Users\HP\Desktop\vidya_ai\test\data\05-versions-space.pdf'
```

## Root Cause

The `pdf-parse` library was being imported statically at the top of the file, which caused it to try to access test files during module initialization, even when not needed.

## Solution

Changed from static imports to dynamic imports:

### Before (Problematic):

```typescript
import pdfParse from "pdf-parse";

async function extractTextFromFile(buffer: Buffer, fileType: string) {
  if (fileType === "application/pdf") {
    const data = await pdfParse(buffer); // This would fail during import
    return data.text || "";
  }
}
```

### After (Fixed):

```typescript
async function extractTextFromFile(buffer: Buffer, fileType: string) {
  if (fileType === "application/pdf") {
    // Dynamic import to avoid initialization issues
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text || "";
  }
}
```

## Files Modified

1. `src/app/api/upload/route.ts` - Main upload API
2. `pages/api/upload/extract-text.ts` - Legacy upload API
3. `src/app/api/upload/test-upload/route.ts` - Test endpoint
4. `src/app/api/test-pdf-parse/route.ts` - PDF parsing test endpoint
5. `src/app/test-upload/page.tsx` - Test interface

## Testing

1. **Visit the test page**: Go to `/test-upload` from your dashboard
2. **Test Basic Upload**: Tests file system operations
3. **Test PDF Parse**: Tests PDF parsing specifically
4. **Test Full Upload**: Tests the complete upload pipeline

## Benefits

- ✅ Upload functionality now works correctly
- ✅ No more 500 errors during startup
- ✅ PDF parsing only loads when needed
- ✅ Better error handling and logging
- ✅ Comprehensive testing tools

## Environment Variables Required

Make sure these are set in your `.env.local` file:

```
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

