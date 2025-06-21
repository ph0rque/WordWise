# Database Migrations

This directory contains SQL migration files for the WordWise application.

## Fixing 403 Forbidden Error (Document Creation)

If you're getting a 403 Forbidden error when creating documents, you need to apply the RLS policy fix:

### Apply RLS Policy Fix (REQUIRED - fixes 403 error)

Run the following migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of 005_fix_documents_rls_policies.sql
```

This migration will:
- Create the `is_admin()` helper function
- Drop any conflicting existing policies
- Create proper RLS policies for document CRUD operations
- Grant necessary permissions to authenticated users
- Ensure proper triggers are in place

## Other Available Migrations

Apply these migrations as needed for additional features:

1. `001_add_user_roles.sql` - User roles and permissions
2. `002_add_chat_sessions.sql` - AI tutor chat functionality  
3. `003_add_keystroke_recordings.sql` - Keystroke recording features
4. `004_add_keystroke_consent.sql` - Consent management
5. `005_fix_documents_rls_policies.sql` - **Fix document creation (CRITICAL)**

## How to Apply

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of the migration file
4. Paste and run it
5. Test document creation in the app

## Troubleshooting Document Creation

If you still get a 403 Forbidden error after applying the RLS fix:

1. **Check if RLS is enabled**: 
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'documents';
   ```

2. **Verify policies exist**:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'documents';
   ```

3. **Check user authentication**:
   ```sql
   SELECT auth.uid(); -- Should return your user ID, not null
   ```

4. **Test the is_admin() function**:
   ```sql
   SELECT is_admin(); -- Should return true/false
   ```

## Verifying Setup

After applying the RLS policy fix, you should be able to:
- ✅ Create new documents
- ✅ View your own documents
- ✅ Update and delete your documents
- ✅ Admins can view all documents 
