import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv, loadEnvFromFile } from './supabase_env.mjs';

function parseArgs(argv) {
  const args = { out: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--out') {
      args.out = argv[i + 1] || '';
      i += 1;
    }
  }
  return args;
}

function defaultOutputPath() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join('.private-data', `public-data-backup-${timestamp}.json`);
}

async function run() {
  loadEnvFromFile();
  const { url, anonKey } = getSupabaseEnv();
  const supabase = createClient(url, anonKey);

  const args = parseArgs(process.argv.slice(2));
  const outputPath = args.out || defaultOutputPath();

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (boardError) {
    throw new Error(`Failed to read board: ${boardError.message}`);
  }
  if (!board) {
    throw new Error('No board found to export.');
  }

  const [tasksResult, fieldsResult, aiResult] = await Promise.all([
    supabase.from('tasks').select('*').eq('board_id', board.id).order('position', { ascending: true }),
    supabase.from('custom_field_definitions').select('*').eq('board_id', board.id).order('position', { ascending: true }),
    supabase.from('ai_conversations').select('*').eq('board_id', board.id).order('created_at', { ascending: true }),
  ]);

  if (tasksResult.error) throw new Error(`Failed to read tasks: ${tasksResult.error.message}`);
  if (fieldsResult.error) throw new Error(`Failed to read custom fields: ${fieldsResult.error.message}`);
  if (aiResult.error) throw new Error(`Failed to read AI conversations: ${aiResult.error.message}`);

  const payload = {
    exported_at: new Date().toISOString(),
    board,
    custom_fields: fieldsResult.data || [],
    tasks: tasksResult.data || [],
    ai_conversations: aiResult.data || [],
  };

  const absoluteOutput = path.resolve(process.cwd(), outputPath);
  fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
  fs.writeFileSync(absoluteOutput, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Backup written to ${absoluteOutput}`);
  console.log(`Rows: ${payload.custom_fields.length} fields, ${payload.tasks.length} tasks, ${payload.ai_conversations.length} AI messages`);
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
