# Document Analysis & Content Description Generation

This document describes the new AI-powered document analysis and content description generation features implemented in Vidya AI.

## Overview

The system now includes two core AI services that automatically analyze uploaded educational documents and generate comprehensive descriptions:

1. **Document Analysis & Topic Extraction** - Analyzes documents to extract key metadata
2. **Content Description Generation** - Creates compelling descriptions for learning materials

## Features

### 1. Document Analysis & Topic Extraction

**Purpose**: Automatically analyze uploaded documents to extract key information and metadata.

**What it analyzes**:
- Primary topic/subject identification
- Suggested document title (if not clear from filename)
- Subject classification
- Estimated academic level (elementary, middle school, high school, college)
- Chapter/section suggestions based on content structure
- Confidence score for the analysis

**Output Format**:
```json
{
  "topic": "Clear, concise topic heading",
  "subject": "Academic subject category",
  "level": "Educational level",
  "documentTitle": "Suggested title",
  "chapterSection": "Inferred from content structure",
  "confidenceScore": 8
}
```

**Constraints**:
- Topic headings kept under 10 words
- Uses standard academic subject classifications
- Level assessment based on vocabulary complexity and concepts
- Provides alternative suggestions if multiple interpretations exist

### 2. Content Description Generation

**Purpose**: Generate comprehensive, engaging descriptions for uploaded learning materials.

**What it generates**:
- Auto-completion of missing fields (subject, chapter, level, document name)
- Compelling descriptions (50-150 words) including:
  - What students will learn
  - Key concepts covered
  - Prerequisites (if any)
  - Learning outcomes

**Output Format**:
```json
{
  "subject": "subject_name",
  "chapter": "chapter_name_or_number",
  "level": "academic_level",
  "document_name": "clear_document_title",
  "description": "compelling_description",
  "auto_generated": ["field1", "field2"],
  "date_created": "auto_timestamp"
}
```

**Quality Standards**:
- Engaging, student-friendly language
- Highlights practical applications
- Avoids jargon without explanation
- Focuses on learning benefits

## API Endpoints

### 1. Document Analysis API

**Endpoint**: `POST /api/gemini/analyze-document`

**Request Body**:
```json
{
  "content": "Document text content",
  "filename": "optional_filename.pdf"
}
```

**Response**:
```json
{
  "analysis": {
    "topic": "Mathematics Fundamentals",
    "subject": "Mathematics",
    "level": "high school",
    "documentTitle": "Algebra Basics",
    "chapterSection": "Chapter 1: Introduction to Algebra",
    "confidenceScore": 8
  }
}
```

### 2. Content Description Generation API

**Endpoint**: `POST /api/gemini/generate-description`

**Request Body**:
```json
{
  "content": "Document text content",
  "userContext": {
    "subject": "optional_subject",
    "level": "optional_level",
    "chapterInfo": "optional_chapter_info"
  }
}
```

**Response**:
```json
{
  "description": {
    "subject": "Physics",
    "chapter": "Chapter 2: Mechanics",
    "level": "college",
    "document_name": "Introduction to Classical Mechanics",
    "description": "This chapter covers the fundamental principles...",
    "auto_generated": ["subject", "level"],
    "date_created": "2024-01-01T00:00:00.000Z"
  }
}
```

## Integration with Upload Process

The document analysis is automatically integrated into the file upload process:

1. **File Upload**: User uploads a document
2. **Text Extraction**: System extracts text from the uploaded file (PDF, text, etc.)
3. **Document Analysis**: AI analyzes the extracted text to identify topic, subject, level, etc.
4. **Content Description**: AI generates a compelling description of the learning material
5. **Library Storage**: Document is stored with analysis and description metadata
6. **UI Display**: Analysis and description are displayed in the library interface

## UI Components

### DocumentAnalysisCard

A new React component that displays the AI analysis and content description for uploaded documents.

**Features**:
- Shows both analysis and description data
- Displays confidence scores
- Highlights auto-generated fields
- Responsive grid layout
- Clean, professional design

**Usage**:
```jsx
<DocumentAnalysisCard doc={libraryDocument} />
```

## File Types Supported

The system currently supports text extraction from:
- **PDF files** - Using pdf-parse library
- **Text files** - Direct UTF-8 reading
- **Word documents** - Placeholder implementation (needs enhancement)
- **Images** - Placeholder implementation (needs OCR)

## Error Handling

The system includes comprehensive error handling:

- **Text Extraction Failures**: Upload continues even if text extraction fails
- **Analysis Failures**: Upload continues even if AI analysis fails
- **API Errors**: Proper error messages and status codes
- **Authentication**: All endpoints require valid user session

## Testing

Unit tests are included for both API endpoints:

- **Success cases**: Verify correct analysis and description generation
- **Error cases**: Verify proper error handling for missing content
- **Mocking**: Uses Jest mocks for external dependencies

Run tests with:
```bash
npm test src/app/api/__tests__/document-analysis.test.ts
```

## Future Enhancements

Potential improvements for future versions:

1. **Enhanced File Support**:
   - Full DOCX parsing for Word documents
   - OCR integration for image files
   - Support for more document formats

2. **Advanced Analysis**:
   - Difficulty level assessment
   - Prerequisites identification
   - Learning objectives extraction
   - Content quality scoring

3. **User Customization**:
   - Custom analysis prompts
   - User-defined subject categories
   - Personalized description styles

4. **Batch Processing**:
   - Multiple document analysis
   - Bulk description generation
   - Progress tracking for large uploads

## Configuration

The features use the existing Gemini API configuration:

- **API Key**: Uses `GOOGLE_GEMINI_API_KEY` environment variable
- **Model**: Uses `gemini-1.5-flash` model
- **Rate Limiting**: Includes retry logic with exponential backoff
- **Error Handling**: Comprehensive error messages and user feedback

## Security

- **Authentication**: All endpoints require valid user session
- **Input Validation**: Proper validation of request data
- **File Size Limits**: 15MB maximum file size
- **Content Sanitization**: Safe handling of user-uploaded content
