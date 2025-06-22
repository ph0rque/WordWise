# RESTful Document-Centric Session Structure

This document outlines the new RESTful URL structure for document sessions, implemented to provide a more intuitive and REST-compliant navigation experience.

## New URL Structure

### Document Sessions
- **Route**: `/documents/[id]/sessions`
- **Purpose**: View all writing sessions for a specific document
- **Breadcrumb**: [Home Icon] / {Document Name} / Writing Sessions

### Individual Session
- **Route**: `/documents/[id]/sessions/[sessionId]`
- **Purpose**: View and playback a specific writing session
- **Breadcrumb**: [Home Icon] / {Document Name} / Writing Sessions / Session at {timestamp}

## File Structure

```
app/
├── documents/
│   └── [id]/
│       └── sessions/
│           ├── page.tsx                    # Document sessions list
│           ├── page.test.tsx              # Tests for sessions list
│           └── [sessionId]/
│               ├── page.tsx               # Individual session viewer
│               └── page.test.tsx          # Tests for session viewer
```

## Features

### Document Sessions Page (`/documents/[id]/sessions`)
- **Document Validation**: Validates document exists and user has access
- **Breadcrumb Navigation**: Clear hierarchy showing document > sessions
- **Session List**: Displays all sessions for the specific document
- **Session Analytics**: Shows overall statistics for the document
- **Navigation**: Back to document, direct links to individual sessions

### Individual Session Page (`/documents/[id]/sessions/[sessionId]`)
- **Session Playback**: Full-page playback viewer for completed sessions
- **Session Details**: Document title, timestamp, keystroke count
- **Breadcrumb Navigation**: Full hierarchy including session timestamp
- **Error Handling**: Graceful handling of missing sessions or incomplete sessions
- **Navigation**: Back to sessions list, back to document

## Navigation Integration

### Document Actions Menu
- **Updated Route**: Now navigates to `/documents/{documentId}/sessions`
- **Fallback**: Falls back to old `/sessions` route if no document ID

### Session Links
- **Direct Navigation**: Session items link directly to individual session pages
- **Context Preservation**: All navigation maintains document context

### MyRecordings Component
- **Smart Navigation**: Uses RESTful routes when document context is available
- **Modal Fallback**: Falls back to modal for non-document-specific views

## Benefits

1. **RESTful Design**: URLs follow REST conventions with clear resource hierarchy
2. **Bookmarkable**: Users can bookmark specific sessions and documents
3. **SEO Friendly**: Clean URLs that search engines can index
4. **Intuitive Navigation**: Clear breadcrumbs show exactly where users are
5. **Document-Centric**: Everything revolves around documents as the primary resource
6. **Scalable**: Easy to add additional nested resources (e.g., session comments)

## Migration Notes

- **Old Route**: `/sessions?documentId=123&documentTitle=My%20Document`
- **New Route**: `/documents/123/sessions`
- **Backwards Compatibility**: Old sessions page kept as fallback for edge cases
- **Tests**: Comprehensive test coverage for both new pages
- **Error Handling**: Proper 404 handling for missing documents/sessions

## API Integration

The new pages integrate with existing APIs:
- `getSupabaseClient()` for database access
- Existing session recording APIs
- Document validation and access control
- Real-time session updates

## Technical Implementation

### Key Components
- **Document Loading**: Fetches document details for context
- **Session Validation**: Ensures sessions belong to the correct document
- **Error Boundaries**: Graceful error handling throughout
- **Loading States**: Proper loading indicators during data fetching
- **Responsive Design**: Works well on all device sizes

### Security
- **Access Control**: Users can only view their own documents and sessions
- **Validation**: Document and session IDs are validated before access
- **Error Messages**: Informative but secure error messages

This new structure provides a much more professional and intuitive user experience while following modern web development best practices. 