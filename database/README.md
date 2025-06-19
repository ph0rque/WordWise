# Database Migrations

This directory contains SQL migration files for the WordWise application.

## Applying Migrations

To fix the 403 Forbidden error when creating documents, you need to apply the migrations in order:

### 1. Create Documents Table (REQUIRED - fixes 403 error)

Run the following migration first in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of 000_create_documents_table.sql
```

### 2. Apply Other Migrations

Then apply the remaining migrations in order:

1. `001_add_user_roles.sql` - User roles and permissions
2. `002_add_chat_sessions.sql` - AI tutor chat functionality  
3. `003_add_keystroke_recordings.sql` - Keystroke recording features
4. `004_add_keystroke_consent.sql` - Consent management

## How to Apply

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of each migration file
4. Paste and run them in order
5. Verify the tables were created successfully

## Migration Order

The migrations should be applied in this order:

```
000_create_documents_table.sql (CRITICAL - fixes document creation)
001_add_user_roles.sql
002_add_chat_sessions.sql  
003_add_keystroke_recordings.sql
004_add_keystroke_consent.sql
```

## Troubleshooting

If you get a 403 Forbidden error when creating documents:
- Make sure `000_create_documents_table.sql` has been applied
- Check that RLS policies are enabled and configured correctly
- Verify that the `is_admin()` function exists

## Verifying Setup

After applying migrations, you should be able to:
- Create new documents
- View your own documents
- Update and delete your documents
- Admins can view all documents 