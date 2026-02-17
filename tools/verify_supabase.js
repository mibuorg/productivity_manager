
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
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY; // Using anon key for list check

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Testing Supabase connection...');
    // Just check if we can connect. querying 'tasks' might fail if table doesn't exist yet, 
    // but let's try to query a non-existent table and see if we get a connection error or a 404/400.
    // Actually, let's just check the auth config or similar. 
    // Better: Try to select from a table we expect to exist or just check session.

    // Since we haven't created tables, we expect an error, but it should be a "relation not found" error,
    // NOT a "connection refused" or "invalid key" error.

    const { data, error } = await supabase.from('tasks').select('*').limit(1);

    if (error) {
        if (error.code === 'PGRST301' || error.message.includes('relation "public.tasks" does not exist')) {
            console.log('✅ Connection successful! (Table "tasks" does not exist yet, which is expected)');
        } else {
            console.error('❌ Connection failed/Error:', error.message);
            process.exit(1);
        }
    } else {
        console.log('✅ Connection successful! (Table "tasks" found)');
    }
}

verify();
