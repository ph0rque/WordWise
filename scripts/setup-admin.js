#!/usr/bin/env node

/**
 * Setup Admin Role Script
 * 
 * This script assigns admin role to a user in the database.
 * Run this to set up the first admin user.
 */

const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  return
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

async function setupAdmin() {
  console.log('🔧 WordWise Admin Setup')
  console.log('========================')
  console.log()
  
  try {
    // Get all users to show options
    console.log('📋 Available users:')
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }

    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`)
    })

    // Set the admin email - change this to your email
    const adminEmail = 'andrei.shindyapin+admin@gmail.com' // Change this to your email
    
    const adminUser = authUsers.users.find(u => u.email === adminEmail)
    
    if (!adminUser) {
      console.error(`❌ User with email ${adminEmail} not found`)
      console.log('Available emails:', authUsers.users.map(u => u.email))
      return
    }

    console.log(`\n🎯 Setting up admin role for: ${adminUser.email}`)
    
    // Insert admin role
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: adminUser.id,
        role: 'admin'
      })
      .select()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log('✅ User already has a role, updating to admin...')
        const { data: updateData, error: updateError } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', adminUser.id)
          .select()
        
        if (updateError) {
          console.error('❌ Error updating role:', updateError)
          return
        }
        console.log('✅ Role updated successfully!')
      } else {
        console.error('❌ Error inserting role:', error)
        return
      }
    } else {
      console.log('✅ Admin role assigned successfully!')
    }

    // Verify the role was set
    const { data: roleCheck, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .single()

    if (roleError) {
      console.error('❌ Error verifying role:', roleError)
    } else {
      console.log(`🔍 Verified role: ${roleCheck.role}`)
    }

    console.log('\n🎉 Admin setup completed!')
    console.log(`   User ${adminEmail} now has admin access to WordWise.`)
    console.log('   They can now access the admin dashboard at /admin')

  } catch (error) {
    console.error('Script error:', error)
  }
  
  rl.close()
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n❌ Setup cancelled by user')
  rl.close()
  process.exit(0)
})

// Run the setup
setupAdmin().catch(error => {
  console.error('❌ Unexpected error:', error)
  rl.close()
  process.exit(1)
}) 