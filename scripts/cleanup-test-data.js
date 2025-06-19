#!/usr/bin/env node

/**
 * Cleanup Test Data Script
 * 
 * This script removes all test user data from the database to prepare
 * for admin UX flow development. It will:
 * 1. Delete all user documents
 * 2. Delete all chat sessions and messages
 * 3. Delete all keystroke recordings and events
 * 4. Delete all user roles
 * 5. Delete all auth users (except admin users)
 */

const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim())
    })
  })
}

async function cleanupTestData() {
  console.log('🧹 WordWise Test Data Cleanup')
  console.log('===============================')
  console.log()
  
  // Get confirmation
  const confirm = await askConfirmation(
    '⚠️  This will DELETE ALL user data (except admin users).\n' +
    'This action cannot be undone!\n\n' +
    'Type "DELETE ALL TEST DATA" to confirm: '
  )
  
  if (confirm !== 'delete all test data') {
    console.log('❌ Cleanup cancelled.')
    rl.close()
    return
  }
  
  console.log('\n🚀 Starting cleanup process...\n')
  
  try {
    // Step 1: Get all users (we'll preserve admin users)
    console.log('📋 Fetching all users...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }
    
    console.log(`Found ${users.users.length} users`)
    
    // Step 2: Identify admin users to preserve
    const { data: adminRoles, error: adminRolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
    
    if (adminRolesError) {
      console.warn('⚠️  Could not fetch admin roles, will preserve users with admin emails')
    }
    
    const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || [])
    
    // Also preserve users with admin-like emails
    const adminEmails = users.users
      .filter(user => 
        user.email && (
          user.email.includes('admin') || 
          user.email.includes('teacher') ||
          adminUserIds.has(user.id)
        )
      )
      .map(user => user.id)
    
    adminEmails.forEach(id => adminUserIds.add(id))
    
    const testUsers = users.users.filter(user => !adminUserIds.has(user.id))
    
    console.log(`Preserving ${adminUserIds.size} admin users`)
    console.log(`Will delete ${testUsers.length} test users`)
    
    if (testUsers.length === 0) {
      console.log('✅ No test users found to delete.')
      rl.close()
      return
    }
    
    // Step 3: Delete data for each test user
    let deletedCount = 0
    
    for (const user of testUsers) {
      console.log(`🗑️  Deleting data for user: ${user.email || user.id}`)
      
      try {
        // Delete user documents
        const { error: documentsError } = await supabase
          .from('documents')
          .delete()
          .eq('user_id', user.id)
        
        if (documentsError && documentsError.code !== '42P01') { // Ignore table doesn't exist
          console.warn(`   ⚠️  Documents deletion warning: ${documentsError.message}`)
        }
        
        // Delete chat sessions (messages will cascade)
        const { error: chatError } = await supabase
          .from('chat_sessions')
          .delete()
          .eq('user_id', user.id)
        
        if (chatError && chatError.code !== '42P01') {
          console.warn(`   ⚠️  Chat sessions deletion warning: ${chatError.message}`)
        }
        
        // Delete keystroke recordings (events will cascade)
        const { error: keystrokeError } = await supabase
          .from('keystroke_recordings')
          .delete()
          .eq('user_id', user.id)
        
        if (keystrokeError && keystrokeError.code !== '42P01') {
          console.warn(`   ⚠️  Keystroke recordings deletion warning: ${keystrokeError.message}`)
        }
        
        // Delete user roles
        const { error: rolesError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id)
        
        if (rolesError && rolesError.code !== '42P01') {
          console.warn(`   ⚠️  User roles deletion warning: ${rolesError.message}`)
        }
        
        // Delete the auth user
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id)
        
        if (deleteUserError) {
          console.error(`   ❌ Failed to delete user ${user.email}: ${deleteUserError.message}`)
        } else {
          deletedCount++
          console.log(`   ✅ Deleted user: ${user.email || user.id}`)
        }
        
      } catch (error) {
        console.error(`   ❌ Error deleting user ${user.email}: ${error.message}`)
      }
    }
    
    console.log('\n🎉 Cleanup completed!')
    console.log(`✅ Successfully deleted ${deletedCount} test users and their data`)
    console.log(`✅ Preserved ${adminUserIds.size} admin users`)
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message)
    console.error(error.stack)
  }
  
  rl.close()
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n❌ Cleanup cancelled by user')
  rl.close()
  process.exit(0)
})

// Run the cleanup
cleanupTestData().catch(error => {
  console.error('❌ Unexpected error:', error)
  rl.close()
  process.exit(1)
})