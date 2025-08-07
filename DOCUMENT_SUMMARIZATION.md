# Document Summarization Feature

## Overview

The Document Summarization feature provides AI-powered educational summaries for uploaded documents and custom content. It generates comprehensive, structured summaries that are perfect for student learning and comprehension.

## Features

### 1. Educational Summary Generation

**Purpose**: Create comprehensive yet accessible summaries for student learning in exactly 10-12 sentences.

**Summary Structure**:

- **Sentence 1**: Hook that explains why the topic matters
- **Sentences 2-3**: Core concept introduction with context
- **Sentences 4-8**: Key points, theories, or processes explained
- **Sentences 9-10**: Real-world applications or examples
- **Sentences 11-12**: Conclusion with key takeaways

**Style Guidelines**:

- Uses active voice and clear transitions
- Adapts vocabulary to student level
- Includes specific examples from the document
- Maintains logical flow between concepts
- Ends with actionable insights

### 2. Multiple Input Sources

**From Library**: Generate summaries from previously uploaded documents

- Automatically detects academic level from document analysis
- Uses existing document content and metadata
- Seamless integration with library workflow

**Custom Content**: Generate summaries from pasted text

- Manual academic level selection
- Support for any educational content
- Real-time processing

### 3. Rich Output Format

**Summary Components**:

- **Complete Summary**: 10-12 sentence educational summary
- **Key Takeaways**: 3-5 main learning points
- **Academic Level**: Detected or specified level
- **Estimated Reading Time**: Time estimate for the summary

## API Endpoint

### Document Summarization API

**Endpoint**: `POST /api/gemini/summarize-document`

**Authentication**: Required (NextAuth session)

**Request Body**:

```json
{
  "content": "Document text content to summarize",
  "academicLevel": "optional_academic_level"
}
```

**Response**:

```json
{
  "summary": {
    "summary": "Complete 10-12 sentence educational summary...",
    "academicLevel": "high school",
    "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
    "estimatedReadingTime": "5 minutes"
  }
}
```

**Academic Levels**:

- `elementary`: Elementary School
- `middle`: Middle School
- `high`: High School
- `college`: College/University
- `general`: General (default)

## User Interface

### Summary Page (`/summary`)

**Features**:

- Tab-based interface for library vs custom content
- Document selection from user's library
- Custom content input with academic level selection
- Real-time summary generation
- Copy-to-clipboard functionality
- Responsive design for all devices

**Access Points**:

- Dashboard quick actions
- Library document actions
- Direct URL navigation

### Library Integration

**Summary Button**: Added to each document in the library table

- One-click summary generation
- Opens summary in new window/tab
- Formatted HTML output with styling
- Includes document metadata

## Technical Implementation

### Backend Components

1. **GeminiService.summarizeDocument()**

   - Core summarization logic
   - Educational prompt engineering
   - JSON response parsing
   - Error handling

2. **API Route** (`/api/gemini/summarize-document`)
   - Authentication validation
   - Input validation
   - Error handling
   - Response formatting

### Frontend Components

1. **Summary Page** (`/app/summary/page.tsx`)

   - React component with TypeScript
   - State management for UI interactions
   - API integration
   - Error handling and loading states

2. **Library Integration** (`/app/library/page.tsx`)
   - Summary button in document actions
   - Popup window generation
   - Styled HTML output

### Data Flow

1. **User Input**: Document selection or custom content
2. **API Call**: POST to `/api/gemini/summarize-document`
3. **AI Processing**: GeminiService processes content with educational prompt
4. **Response**: Structured summary with metadata
5. **Display**: Formatted output in UI or popup window

## Error Handling

**Common Error Scenarios**:

- Unauthenticated access (401)
- Missing content (400)
- API rate limiting (429)
- Invalid API key (401)
- Content processing errors (500)

**User Feedback**:

- Clear error messages
- Loading indicators
- Graceful fallbacks
- Retry mechanisms

## Testing

**Test Coverage**:

- API endpoint testing (`/api/__tests__/document-summarization.test.ts`)
- Authentication validation
- Input validation
- Error handling
- Success scenarios

**Test Commands**:

```bash
npm test -- document-summarization.test.ts
```

## Usage Examples

### From Library

1. Navigate to Library page
2. Click "Summary" button on any document
3. Summary opens in new window with formatting

### Custom Content

1. Navigate to Summary page
2. Select "Custom Content" tab
3. Choose academic level
4. Paste content in textarea
5. Click "Generate Summary"
6. View formatted summary with copy option

### Dashboard Access

1. Navigate to Dashboard
2. Click "Document Summary" quick action
3. Use either library or custom content options

## Future Enhancements

**Potential Improvements**:

- Summary history and storage
- Multiple summary formats (bullet points, mind maps)
- Export to PDF/Word
- Collaborative summaries
- Summary comparison tools
- Integration with learning management systems

## Dependencies

**Required Packages**:

- `@google/generative-ai`: Gemini AI integration
- `next-auth`: Authentication
- `react-icons`: UI icons
- `tailwindcss`: Styling

**Environment Variables**:

- `GOOGLE_GEMINI_API_KEY`: Gemini API key
- NextAuth configuration

## Security Considerations

- Authentication required for all API calls
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure API key handling
- User session validation

