# Active Context

## Current Project State
WordWise is a functional grammar-checking application with core features implemented. The application is currently operational with both AI-powered and rule-based grammar checking capabilities. **Recent authentication issues have been resolved**, and the admin functionality is now working properly. **Tab switching performance has been optimized** to prevent unnecessary reloads.

## Recent Work & Changes
**December 2024 - Fixed Admin Access to Student Keystroke Recordings ✅ JUST COMPLETED**

### Admin Recording Access Permission Fix
**Issue Resolved**: Fixed a critical permission issue where administrators could not view student keystroke recordings through the "View Playback" button due to user ID mismatch in the API.

**Problem Identified**:
- When admins clicked "View Playback", the `KeystrokePlaybackEngine.loadRecording()` method failed with "Failed to fetch recording"
- The API endpoint `/api/keystroke/recordings?recordingId=${recordingId}` was checking for `user_id` equality
- Admin's user ID didn't match the student's user ID who created the recording
- This caused the `getSingleRecordingWithEvents` function to return "Recording not found" for admin users

**Root Cause**:
- The `getSingleRecordingWithEvents` function was filtering recordings by `user_id` for all users
- This worked for students viewing their own recordings but blocked admin access to student recordings
- No role-based access control was implemented for single recording retrieval

**Solution Implemented**:
1. **Admin Role Detection**: Added role checking in the main GET handler for single recording requests
2. **Conditional User Filtering**: Modified `getSingleRecordingWithEvents` to accept `userId` as nullable
3. **Permission-Based Access**: 
   - **Admin users**: Can access any recording (no user ID filter)
   - **Student users**: Can only access their own recordings (user ID filter applied)

**Technical Changes**:
1. **API Route Enhancement** (`/api/keystroke/recordings`):
   - Added role checking for single recording requests
   - Pass `null` as userId for admin users to bypass user filtering
   - Pass actual userId for student users to maintain security

2. **Function Signature Update**:
   - Changed `getSingleRecordingWithEvents(supabase, userId: string, recordingId)` 
   - To `getSingleRecordingWithEvents(supabase, userId: string | null, recordingId)`

3. **Query Logic Update**:
   - Conditional user ID filtering based on role
   - Maintains security for students while enabling admin access

**Security Considerations**:
- ✅ **Student Privacy Maintained**: Students can still only access their own recordings
- ✅ **Admin Oversight Enabled**: Administrators can now access any student's recordings for educational purposes
- ✅ **Role-Based Security**: Access control based on authenticated user roles
- ✅ **No Data Exposure**: No additional data is exposed, only access permissions are adjusted

**Benefits**:
- **Full Admin Functionality**: Administrators can now successfully view keystroke playback for any student
- **Educational Oversight**: Enables proper monitoring and analysis of student writing processes
- **Consistent Experience**: Admin and student UIs now work identically for playback viewing
- **Maintained Security**: Student data remains protected while enabling appropriate admin access

This fix ensures that the DocumentViewer's "View Playback" functionality works correctly for administrators viewing student keystroke recordings.

**December 2024 - Implemented Functional View Playback and View Chat Buttons ✅ COMPLETED**

### Interactive DocumentViewer Enhancement
**Enhancement Implemented**: Added fully functional "View Playback" and "View Chat" buttons to the DocumentViewer component, integrating the same UI components used by students for viewing keystroke recordings and chat sessions.

**Major Functionality Added**:
1. **Functional View Playback Button**: 
   - Integrated `PlaybackViewer` component from student UI
   - Opens keystroke recordings in a full-featured playback interface
   - Shows recording controls, content playback, and analytics
   - Uses the same UI that students see when viewing their own recordings

2. **Functional View Chat Button**:
   - Integrated `ChatMessageComponent` for displaying chat history
   - Fetches and displays complete chat message history for sessions
   - Shows formatted messages with proper user/assistant distinction
   - Uses the same UI components that students see when viewing past chats

**Technical Implementation**:
1. **Component Integration**:
   - Added imports for `PlaybackViewer` and `ChatMessageComponent`
   - Added `ChatMessage` type for proper message formatting
   - Integrated existing student UI components seamlessly

2. **State Management**:
   - Added dialog states: `showPlaybackViewer`, `showChatViewer`
   - Added selection states: `selectedRecording`, `selectedChatSession`
   - Added chat message state: `chatMessages`, `loadingChatMessages`

3. **Handler Functions**:
   - `handleViewPlayback()`: Opens playback viewer with selected recording
   - `handleViewChat()`: Fetches chat messages and opens chat viewer
   - Proper error handling and loading states for both functions

4. **UI Integration**:
   - Connected buttons to handler functions with `onClick` events
   - Added responsive dialog components for both playback and chat viewing
   - Maintained consistent styling and user experience

**Data Flow**:
- **Playback**: Uses recording ID to load full playback interface via `PlaybackViewer`
- **Chat**: Fetches messages from `chat_messages` table filtered by session ID
- **Message Formatting**: Converts database records to `ChatMessage` format with proper metadata handling

**Benefits for Administrators**:
- **Complete Recording Analysis**: Full playback controls and analytics for keystroke recordings
- **Chat History Review**: Complete conversation history with proper formatting
- **Consistent Experience**: Same UI as students see, ensuring familiarity
- **Rich Functionality**: All features available to students are now available to admins

This enhancement transforms the DocumentViewer from a static information display into a fully interactive tool for comprehensive student work analysis.

**December 2024 - Fixed Keystroke Recordings API Database Relationship Issue ✅ COMPLETED**

### Database Relationship Bug Fix
**Issue Resolved**: Fixed a critical database relationship error in the keystroke recordings API that was preventing the Writing Sessions tab from loading recordings for documents.

**Problem Identified**:
- API was failing with error: `Could not find a relationship between 'keystroke_recordings' and 'user_id' in the schema cache`
- The issue occurred when trying to join `keystroke_recordings` with `profiles:user_id` table
- Supabase couldn't find the proper foreign key relationship for the profiles join

**Solution Implemented**:
1. **Removed Problematic Join**: Eliminated the `profiles:user_id` join that was causing the foreign key relationship error
2. **Simplified Query**: Modified the admin query to use basic `select('*')` without complex joins
3. **Added Document Filtering**: Enhanced the query to properly filter by `documentId` when provided
4. **Maintained Functionality**: Kept all essential recording data while removing dependency on profile information

**Technical Changes**:
- Updated `/api/keystroke/recordings` route for admin access
- Replaced complex join query with simple select and filter approach
- Added proper document ID filtering for the admin view
- Simplified user information to avoid database relationship dependencies

**Benefits**:
- **Immediate Fix**: Writing Sessions tab now loads recordings successfully
- **Better Performance**: Simpler queries are faster and more reliable
- **Reduced Complexity**: Eliminated unnecessary database joins
- **Maintained Security**: Still respects user permissions and document filtering

This fix ensures that administrators can now properly view keystroke recordings for specific documents in the DocumentViewer's Writing Sessions tab.

**December 2024 - Added Writing Sessions Tab to Document Viewer ✅ COMPLETED**

### Writing Sessions Tab Enhancement
**Enhancement Implemented**: Added a comprehensive "Writing Sessions" tab to the admin DocumentViewer component that shows keystroke recordings for specific documents, providing detailed insights into student writing behavior.

**Major Improvements Made**:
1. **New Tab Structure**: Expanded DocumentViewer from 3 to 4 tabs
   - Document Content
   - Text Analysis  
   - **Writing Sessions** (NEW)
   - AI Chats

2. **Keystroke Recording Display**: Comprehensive keystroke recording visualization
   - **Recording Statistics**: Total keystrokes, characters, WPM, duration
   - **Session Status**: Visual indicators for recording status (completed, active, etc.)
   - **Timeline Information**: Start/end times with formatted dates
   - **Session Analytics**: Focus score, productivity score, time on task, edit ratio

3. **Data Integration**: 
   - **API Integration**: Uses `/api/keystroke/recordings` with document filtering
   - **Real-time Data**: Fetches recordings filtered by document ID and user ID
   - **Analytics Enhancement**: Calculates derived metrics like editing ratios and productivity scores

4. **User Experience Features**:
   - **Action Buttons**: "View Playback" and "Analytics" buttons for each recording
   - **Empty State**: Helpful message when no recordings exist
   - **Responsive Design**: Grid layouts that adapt to different screen sizes
   - **Visual Hierarchy**: Color-coded metrics and clear data presentation

**Technical Implementation**:
- Added `KeystrokeRecording` interface with comprehensive recording data structure
- Implemented `fetchKeystrokeRecordings()` function with proper error handling
- Enhanced tab structure with dynamic count display for writing sessions
- Created detailed recording cards with analytics and action capabilities

**Benefits for Educators**:
- **Writing Behavior Insights**: Understand how students write and edit their work
- **Performance Analytics**: View productivity metrics and engagement levels
- **Session Tracking**: Monitor writing session frequency and duration
- **Progress Monitoring**: Track improvements in writing speed and editing patterns

This enhancement significantly expands the DocumentViewer's capability to provide comprehensive insights into student writing processes beyond just the final document content.

**December 2024 - Enhanced Document Viewer with Analysis & Sessions ✅ COMPLETED**

### Comprehensive Document Viewer Improvement
**Enhancement Implemented**: Completely redesigned the admin DocumentViewer component to provide comprehensive document analysis and related information instead of just showing raw HTML markup.

**Major Improvements Made**:
1. **Fixed HTML Rendering**: Document content now properly renders HTML instead of showing markup
   - Added safe HTML rendering with `dangerouslySetInnerHTML`
   - Implemented HTML tag detection to choose between HTML and plain text rendering
   - Added security by stripping inline styles
   - Created fallback for server-side rendering

2. **Added Comprehensive Text Analysis**: Real-time analysis using existing analysis functions
   - **Overall Writing Score**: Combined assessment of writing quality
   - **Grade Level Analysis**: Appropriate reading level for the text
   - **Readability Metrics**: Flesch Reading Ease, sentence complexity, word difficulty
   - **Vocabulary Analysis**: Academic vocabulary usage, diversity metrics
   - **AI-Powered Insights**: Strengths and improvement recommendations
   - **Detailed Metrics**: Comprehensive breakdown of writing statistics

3. **Related Sessions & Chats Integration**: Contextual information display
   - **AI Chat History**: Shows related tutor conversations for the document
   - **Session Timeline**: When conversations occurred and message counts
   - **Last Message Preview**: Quick view of recent interactions
   - **Chat Navigation**: Easy access to view full conversation history

**Technical Excellence**:
- **Tabbed Interface**: Clean organization with Document Content, Text Analysis, and AI Chats tabs
- **Real-time Analysis**: Performs text analysis on document load
- **API Integration**: Uses multiple analysis endpoints for comprehensive insights
- **Error Handling**: Graceful fallbacks when analysis services are unavailable
- **Performance**: Efficient text processing with HTML parsing and cleanup

**December 2024 - Admin Profile UI Improvement ✅ COMPLETED**

### Removed Writing Sessions Tab from Admin Student Profile
**Improvement Implemented**: Simplified the admin student profile interface by removing the "Writing Sessions" horizontal tab when viewing individual student profiles.

**Changes Made**:
1. **Tab Structure Simplified**: Reduced admin student profile from 4 tabs to 3 tabs
   - Removed: "Writing Sessions" tab
   - Kept: "Overview", "Documents", and "Progress Tracking" tabs
   - Updated TabsList grid from `grid-cols-4` to `grid-cols-3`

2. **Code Cleanup**: Removed all unused Writing Sessions related code
   - Removed `WritingSession` interface definition
   - Removed `writingSessions` state variable
   - Removed `loadWritingSessions()` function
   - Removed `handleViewWritingSession()` function
   - Removed entire Writing Sessions TabsContent section
   - Cleaned up references in Progress Summary

**Benefits**:
- **Simplified Interface**: Cleaner, more focused admin experience
- **Reduced Cognitive Load**: Fewer tabs means easier navigation
- **Better Performance**: Eliminated unnecessary data fetching and processing
- **Maintainability**: Less code to maintain and fewer potential bugs

## Current Work Focus
**Layout Improvements - Document Manager Integration** ✅ **COMPLETED**
- **COMPLETED**: Removed the "My Documents" panel from the right sidebar
- **COMPLETED**: Added document list to main panel when no document is selected
- **COMPLETED**: Added X button to close/unselect documents
- **COMPLETED**: Right-justified Save button and three dots menu
- **COMPLETED**: Expanded document list to full container height
- **COMPLETED**: Committed and merged to main branch

## Recent Changes Made
1. **Layout Restructuring**:
   - Removed `DocumentManager` component from right sidebar (both desktop and mobile versions)
   - Modified main panel to show `DocumentManager` when no document is selected
   - Added proper header with "My Documents" title and "New Document" button
   - Added `onUnselect` prop to `TextEditor` component

2. **Document Selection UX**:
   - Added X button in document header to close/unselect document
   - Implemented `handleUnselectDocument` function to return to document list
   - Created cleaner document selection flow

3. **UI Polish**:
   - Right-justified Save button and three dots menu in document header
   - Removed duplicate "My Documents" header and "New" button from DocumentManager
   - Made document list expand to full container height with proper scrolling
   - Cleaned up unused imports and dialog functionality

4. **Code Changes**:
   - Updated `TextEditorProps` interface to include `onUnselect` callback
   - Modified main page layout to conditionally show document list or editor
   - Removed document manager from sidebar components
   - Improved flex layout structure for better responsiveness

## Git History
- **Commit**: `e99924b` - "Layout improvements: Remove duplicate My Documents panel and improve document list"
- **Merged**: Successfully merged stage → main and pushed to remote
- **Files Changed**: 4 files (105 insertions, 108 deletions)

## Success Criteria - All Complete! ✅
- ✅ No "My Documents" panel in sidebar
- ✅ Document list appears in main panel when no document selected  
- ✅ X button closes document and returns to list
- ✅ Save button and menu right-justified
- ✅ Document list expands to full height
- ✅ Application builds and runs successfully
- ✅ Changes committed and merged to main

## Technical Notes
- The layout change creates a more focused, single-panel experience
- User workflow: Document List → Select Document → Edit Document → Close Document → Back to List
- This eliminates the need for a separate document management panel
- Full-height document list provides better UX for users with many documents
- Right-justified controls follow standard UI patterns

## Current Work Focus
**Production Admin Access Issue** ✅ **RESOLVED**
- **ISSUE**: Admin dashboard shows 403 "Admin access required" errors in production
- **ROOT CAUSE**: Missing `SUPABASE_SERVICE_ROLE_KEY` environment variable in production
- **STATUS**: ✅ Fixed - Environment variable added to production
- **RESULT**: Admin dashboard now works correctly in production

## Production vs Development Issue Analysis

### Problem Description
- **Production**: Admin login fails with 403 errors, no students load
- **Development**: Same admin user works perfectly with same database
- **Error Pattern**: "Admin access required" and "Service client not available"

### Root Cause Identified
The issue is in `/lib/supabase/server.ts` where `supabaseAdmin` is created:

```typescript
export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null
```

When `SUPABASE_SERVICE_ROLE_KEY` is missing, `supabaseAdmin` becomes `null`, causing all admin API calls to fail.

### Console Errors Explained
1. **"Admin client not available"** - `supabaseAdmin` is null
2. **"Service client not available"** - Admin operations can't proceed
3. **403 "Admin access required"** - Role verification fails without service client

## Solution Steps

### 1. **IMMEDIATE**: Set Missing Environment Variable
The production deployment is missing `SUPABASE_SERVICE_ROLE_KEY`. This needs to be added to the production environment with the Supabase service role key.

**Environment Variables Required:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (present in both)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (present in both)  
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (missing in production)

### 2. **Verification**: Debug Endpoint Created
Created `/api/debug/env` to safely check environment variables:
- Shows which env vars are SET/MISSING without exposing values
- Only accessible in development or with debug key
- Can be used to verify the fix

### 3. **How Admin Authentication Works**
1. User authenticates with Supabase Auth
2. API checks user role using `getUserRoleFromDB()`
3. `getUserRoleFromDB()` requires `supabaseAdmin` to bypass RLS
4. Without service key, `supabaseAdmin` is null → role check fails
5. All admin operations return 403 errors

## Files Affected by Missing Service Key
- `/app/api/admin/students/route.ts`
- `/app/api/admin/students/[id]/route.ts` 
- `/app/api/admin/stats/route.ts`
- `/app/api/admin/students/assign-role/route.ts`
- `/app/api/student/coaches/route.ts`
- `/app/api/student/coaches/[id]/route.ts`

## Next Steps
1. **CRITICAL**: Add `SUPABASE_SERVICE_ROLE_KEY` to production environment
2. **Verify**: Test admin login after environment variable is set
3. **Monitor**: Check that all admin API endpoints work correctly
4. **Cleanup**: Remove debug endpoint after verification (optional)

## Technical Notes
- The service role key is required for admin operations that bypass Row Level Security (RLS)
- Development environment has this key set, production does not
- This is a deployment/DevOps issue, not a code issue
- Same database works fine because the issue is server-side authentication, not data access