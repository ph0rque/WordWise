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
    // Get admin email
    const adminEmail = await askQuestion('Enter the email address for the admin user: ')
    
    if (!adminEmail) {
      console.log('❌ Email is required.')
      rl.close()
      return
    }

    console.log('\n🔍 Looking for user...')
    
    // Find the user by email
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    const targetUser = authUsers.users.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase())
    
    if (!targetUser) {
      console.log(`❌ User not found with email "${adminEmail}"`)
      console.log('   The user needs to sign up to WordWise first.')
      rl.close()
      return
    }

    console.log(`✅ Found user: ${targetUser.email} (ID: ${targetUser.id})`)

    // Check if user already has a role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUser.id)
      .single()

    if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to check existing role: ${roleCheckError.message}`)
    }

    if (existingRole) {
      if (existingRole.role === 'admin') {
        console.log('✅ User already has admin role!')
        rl.close()
        return
      } else {
        console.log(`⚠️  User currently has role: ${existingRole.role}`)
        const confirm = await askQuestion('Do you want to change their role to admin? (y/N): ')
        
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
          console.log('❌ Setup cancelled.')
          rl.close()
          return
        }

        // Update existing role
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', targetUser.id)

        if (updateError) {
          throw new Error(`Failed to update role: ${updateError.message}`)
        }

        console.log('✅ Role updated to admin successfully!')
      }
    } else {
      // Insert new admin role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUser.id,
          role: 'admin'
        })

      if (insertError) {
        throw new Error(`Failed to assign admin role: ${insertError.message}`)
      }

      console.log('✅ Admin role assigned successfully!')
    }

    console.log('\n🎉 Admin setup completed!')
    console.log(`   User ${adminEmail} now has admin access to WordWise.`)
    console.log('   They can now access the admin dashboard at /admin')

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
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