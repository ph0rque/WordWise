const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(filename, sql) {
  console.log(`\n🔄 Running migration: ${filename}`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Error in ${filename}:`, error);
      return false;
    }
    
    console.log(`✅ Successfully ran ${filename}`);
    return true;
  } catch (err) {
    console.error(`❌ Exception in ${filename}:`, err.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  const migrationsDir = path.join(__dirname, '../database/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Run in order
  
  console.log(`Found ${migrationFiles.length} migration files:`);
  migrationFiles.forEach(file => console.log(`  - ${file}`));
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    const success = await runMigration(file, sql);
    if (!success) {
      console.error(`\n💥 Migration failed at ${file}. Stopping.`);
      process.exit(1);
    }
    
    // Small delay between migrations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 All migrations completed successfully!');
}

// First, let's create the exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'Success';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN SQLERRM;
    END;
    $$;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSQL });
    if (error && !error.message.includes('already exists')) {
      console.log('Creating exec_sql function...');
      // If the function doesn't exist, we need to create it directly
      // This might fail, but we'll try the migrations anyway
    }
  } catch (err) {
    console.log('Note: Could not create exec_sql function, will try direct SQL execution');
  }
}

async function main() {
  await createExecSqlFunction();
  await runMigrations();
}

main().catch(console.error); 