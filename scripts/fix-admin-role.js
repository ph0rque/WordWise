const { createClient } = require('@supabase/supabase-js')
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

async function fixAdminRole() {
  try {
    console.log('🔧 Migrating all user roles to database table...')
    
    // Get all users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`📋 Found ${users.length} users`)
    
    // Find users with any role in metadata (admin or student)
    const usersWithRoles = users.filter(user => 
      user.user_metadata?.role && ['admin', 'student'].includes(user.user_metadata.role)
    )
    
    console.log(`👤 Found ${usersWithRoles.length} users with roles in metadata`)
    
    for (const userWithRole of usersWithRoles) {
      const metadataRole = userWithRole.user_metadata.role
      console.log(`\n🔍 Processing user: ${userWithRole.email} (metadata role: ${metadataRole})`)
      
      // Check if they already have a role in user_roles table
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userWithRole.id)
        .single()
      
      if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error(`❌ Error checking existing role for ${userWithRole.email}:`, roleCheckError)
        continue
      }
      
      if (existingRole) {
        console.log(`✅ User ${userWithRole.email} already has role: ${existingRole.role}`)
        if (existingRole.role !== metadataRole) {
          console.log(`🔄 Updating role from ${existingRole.role} to ${metadataRole}`)
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ role: metadataRole })
            .eq('user_id', userWithRole.id)
          
          if (updateError) {
            console.error(`❌ Error updating role for ${userWithRole.email}:`, updateError)
          } else {
            console.log(`✅ Successfully updated role for ${userWithRole.email}`)
          }
        }
      } else {
        console.log(`📝 Inserting ${metadataRole} role for ${userWithRole.email}`)
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userWithRole.id,
            role: metadataRole
          })
        
        if (insertError) {
          console.error(`❌ Error inserting role for ${userWithRole.email}:`, insertError)
        } else {
          console.log(`✅ Successfully inserted ${metadataRole} role for ${userWithRole.email}`)
        }
      }
    }
    
    console.log('\n🎉 User role migration completed!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the fix
fixAdminRole()
  .then(() => {
    console.log('✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }) 