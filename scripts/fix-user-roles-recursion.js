#!/usr/bin/env node

/**
 * Script to fix the infinite recursion issue in user_roles RLS policies
 * 
 * This script applies the fix for the circular dependency that causes
 * the "infinite recursion detected in policy for relation user_roles" error.
 * 
 * Usage: node scripts/fix-user-roles-recursion.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function runFix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in environment variables')
    process.exit(1)
  }
  
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
    console.log('ℹ️  You need the service role key to run database migrations')
    console.log('ℹ️  You can find this in your Supabase dashboard under Settings > API')
    process.exit(1)
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('🔧 Fixing user_roles RLS policy recursion...')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240101000006_fix_user_roles_recursion.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath)
      process.exit(1)
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Running migration...')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')
    console.log('🎉 The infinite recursion issue in user_roles policies has been fixed.')
    console.log('')
    console.log('What was fixed:')
    console.log('- Removed circular RLS policies that caused infinite recursion')
    console.log('- Simplified policies to avoid self-referencing queries')
    console.log('- Updated admin check functions to use direct queries')
    console.log('')
    console.log('You can now restart your application and test the keystroke recordings feature.')

  } catch (error) {
    console.error('❌ Error running migration:', error)
    process.exit(1)
  }
}

// Run the fix
runFix().catch(console.error) 