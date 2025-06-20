const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function assignMissingRoles() {
  try {
    console.log('🔍 Checking for users without roles...')
    
    // Get all users
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`📊 Found ${authUsers.users.length} total users`)
    
    // Get all user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
    
    if (rolesError) {
      console.error('❌ Error fetching user roles:', rolesError)
      return
    }
    
    console.log(`📊 Found ${userRoles.length} users with roles`)
    
    // Find users without roles
    const userIdsWithRoles = new Set(userRoles.map(r => r.user_id))
    const usersWithoutRoles = authUsers.users.filter(user => !userIdsWithRoles.has(user.id))
    
    console.log(`📊 Found ${usersWithoutRoles.length} users without roles`)
    
    if (usersWithoutRoles.length === 0) {
      console.log('✅ All users already have roles assigned')
      return
    }
    
    // Assign student role to users without roles
    const rolesToInsert = usersWithoutRoles.map(user => {
      // Check if user has admin email patterns
      const isAdmin = user.email?.includes('+admin') || user.email?.includes('admin@')
      
      return {
        user_id: user.id,
        role: isAdmin ? 'admin' : 'student'
      }
    })
    
    console.log('🚀 Assigning roles:')
    rolesToInsert.forEach(r => {
      const user = usersWithoutRoles.find(u => u.id === r.user_id)
      console.log(`  - ${user.email}: ${r.role}`)
    })
    
    const { data: insertedRoles, error: insertError } = await supabase
      .from('user_roles')
      .insert(rolesToInsert)
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting roles:', insertError)
      return
    }
    
    console.log(`✅ Successfully assigned roles to ${rolesToInsert.length} users`)
    
    // Verify the assignments
    const { data: updatedRoles, error: verifyError } = await supabase
      .from('user_roles')
      .select('user_id, role')
    
    if (verifyError) {
      console.error('❌ Error verifying roles:', verifyError)
      return
    }
    
    console.log(`✅ Total users with roles now: ${updatedRoles.length}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
assignMissingRoles()
  .then(() => {
    console.log('🏁 Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }) 