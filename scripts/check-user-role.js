const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkUserRole() {
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

  try {
    // Get all users
    console.log('📋 Fetching all users...')
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }

    console.log(`Found ${authUsers.users.length} users:`)
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`)
    })

    // Get all user roles
    console.log('\n📋 Fetching user roles...')
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return
    }

    console.log(`Found ${userRoles.length} user roles:`)
    userRoles.forEach((role, index) => {
      const user = authUsers.users.find(u => u.id === role.user_id)
      console.log(`${index + 1}. ${user?.email || 'Unknown'} -> ${role.role} (User ID: ${role.user_id})`)
    })

    // Show which users are admins
    const adminRoles = userRoles.filter(r => r.role === 'admin')
    console.log(`\n👑 Admin users (${adminRoles.length}):`)
    adminRoles.forEach((role, index) => {
      const user = authUsers.users.find(u => u.id === role.user_id)
      console.log(`${index + 1}. ${user?.email || 'Unknown'} (ID: ${role.user_id})`)
    })

  } catch (error) {
    console.error('Script error:', error)
  }
}

checkUserRole() 