
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/"/g, '');
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('🔍 Checking Supabase Schema...');

    // We can't query information_schema directly with supabase-js unless exposed via RLS, which is rare.
    // Instead, we can try to RPC if available, or just infer from error.

    // Actually, we can try to select 'column_id' and see if it errors.
    const { data, error } = await supabase
        .from('tasks')
        .select('column_id')
        .limit(1);

    if (error) {
        console.error('❌ Error selecting column_id:', error.message);
        if (error.message.includes('column "column_id" does not exist') || error.message.includes('Could not find the') || error.code === 'PGRST301') {
            console.log('⚠️ DIAGNOSIS: The "column_id" column is missing from the database or the schema cache is stale.');
            console.log('👉 SUGGESTION: Run the SQL migration again or reload the Supabase Schema Cache.');
        }
    } else {
        console.log('✅ "column_id" exists and is queryable.');
        console.log('❓ If you still get the error on INSERT, it is definitely a stale Schema Cache issue.');
    }
}

checkSchema();
