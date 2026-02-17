
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMore() {
    console.log('🔍 Checking for pomodoros_completed...');
    const { error } = await supabase
        .from('tasks')
        .select('pomodoros_completed')
        .limit(1);

    if (error) {
        console.log('❌ pomodoros_completed is MISSING');
    } else {
        console.log('✅ pomodoros_completed exists');
    }
}

checkMore();
