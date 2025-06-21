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
    console.log('🔧 Fixing admin role assignment...')
    
    // Get all users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`📋 Found ${users.length} users`)
    
    // Find users with admin role in metadata
    const adminUsers = users.filter(user => 
      user.user_metadata?.role === 'admin'
    )
    
    console.log(`👑 Found ${adminUsers.length} admin users in metadata`)
    
    for (const adminUser of adminUsers) {
      console.log(`\n🔍 Processing admin user: ${adminUser.email}`)
      
      // Check if they already have a role in user_roles table
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', adminUser.id)
        .single()
      
      if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error(`❌ Error checking existing role for ${adminUser.email}:`, roleCheckError)
        continue
      }
      
      if (existingRole) {
        console.log(`✅ User ${adminUser.email} already has role: ${existingRole.role}`)
        if (existingRole.role !== 'admin') {
          console.log(`🔄 Updating role from ${existingRole.role} to admin`)
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ role: 'admin' })
            .eq('user_id', adminUser.id)
          
          if (updateError) {
            console.error(`❌ Error updating role for ${adminUser.email}:`, updateError)
          } else {
            console.log(`✅ Successfully updated role for ${adminUser.email}`)
          }
        }
      } else {
        console.log(`📝 Inserting admin role for ${adminUser.email}`)
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: adminUser.id,
            role: 'admin'
          })
        
        if (insertError) {
          console.error(`❌ Error inserting role for ${adminUser.email}:`, insertError)
        } else {
          console.log(`✅ Successfully inserted admin role for ${adminUser.email}`)
        }
      }
    }
    
    // Also check for any users who might need their user_metadata updated
    console.log('\n🔍 Checking for users with role in user_roles table but missing in metadata...')
    
    const { data: roleRecords, error: roleRecordsError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin')
    
    if (roleRecordsError) {
      console.error('❌ Error fetching role records:', roleRecordsError)
    } else {
      for (const roleRecord of roleRecords) {
        const user = users.find(u => u.id === roleRecord.user_id)
        if (user && user.user_metadata?.role !== 'admin') {
          console.log(`🔄 Updating metadata for ${user.email}`)
          const { error: metadataError } = await supabase.auth.admin.updateUserById(
            user.id,
            {
              user_metadata: {
                ...user.user_metadata,
                role: 'admin'
              }
            }
          )
          
          if (metadataError) {
            console.error(`❌ Error updating metadata for ${user.email}:`, metadataError)
          } else {
            console.log(`✅ Successfully updated metadata for ${user.email}`)
          }
        }
      }
    }
    
    console.log('\n🎉 Admin role fix completed!')
    
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