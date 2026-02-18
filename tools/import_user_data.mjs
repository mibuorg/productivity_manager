import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv, loadEnvFromFile } from './supabase_env.mjs';

function parseArgs(argv) {
  const args = {
    file: '',
    email: process.env.IMPORT_EMAIL || '',
    password: process.env.IMPORT_PASSWORD || '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--file') {
      args.file = argv[i + 1] || '';
      i += 1;
    } else if (token === '--email') {
      args.email = argv[i + 1] || '';
      i += 1;
    } else if (token === '--password') {
      args.password = argv[i + 1] || '';
      i += 1;
    }
  }

  return args;
}

function mapCustomFieldValues(values, fieldIdMap) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return values || {};
  }

  const mapped = {};
  for (const [key, value] of Object.entries(values)) {
    mapped[fieldIdMap.get(key) || key] = value;
  }
  return mapped;
}

async function run() {
  loadEnvFromFile();
  const { url, anonKey } = getSupabaseEnv();
  const args = parseArgs(process.argv.slice(2));

  if (!args.file) {
    throw new Error('Missing --file. Example: node tools/import_user_data.mjs --file .private-data/public-data-backup.json --email you@example.com --password yourPassword');
  }
  if (!args.email || !args.password) {
    throw new Error('Missing credentials. Pass --email and --password (or set IMPORT_EMAIL / IMPORT_PASSWORD).');
  }

  const backupPath = path.resolve(process.cwd(), args.file);
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const tasks = Array.isArray(backup.tasks) ? backup.tasks : [];
  const customFields = Array.isArray(backup.custom_fields) ? backup.custom_fields : [];
  const conversations = Array.isArray(backup.ai_conversations) ? backup.ai_conversations : [];
  const boardName = backup.board?.name || 'Tasks to Complete';

  const supabase = createClient(url, anonKey);

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: args.email,
    password: args.password,
  });
  if (signInError) {
    throw new Error(`Sign in failed: ${signInError.message}`);
  }

  const userId = signInData.user?.id;
  if (!userId) {
    throw new Error('Sign in succeeded but no user ID returned.');
  }

  const { data: existingBoard, error: existingBoardError } = await supabase
    .from('boards')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingBoardError) {
    throw new Error(`Failed to query user board: ${existingBoardError.message}`);
  }

  let boardId;
  if (existingBoard) {
    boardId = existingBoard.id;

    const { error: boardUpdateError } = await supabase
      .from('boards')
      .update({ name: boardName })
      .eq('id', boardId);
    if (boardUpdateError) {
      throw new Error(`Failed to update user board: ${boardUpdateError.message}`);
    }

    const [deleteAi, deleteTasks, deleteFields] = await Promise.all([
      supabase.from('ai_conversations').delete().eq('board_id', boardId),
      supabase.from('tasks').delete().eq('board_id', boardId),
      supabase.from('custom_field_definitions').delete().eq('board_id', boardId),
    ]);

    if (deleteAi.error) throw new Error(`Failed clearing AI conversations: ${deleteAi.error.message}`);
    if (deleteTasks.error) throw new Error(`Failed clearing tasks: ${deleteTasks.error.message}`);
    if (deleteFields.error) throw new Error(`Failed clearing custom fields: ${deleteFields.error.message}`);
  } else {
    const { data: insertedBoard, error: boardInsertError } = await supabase
      .from('boards')
      .insert({
        name: boardName,
        owner_id: userId,
      })
      .select('*')
      .single();

    if (boardInsertError) {
      throw new Error(`Failed creating board for user: ${boardInsertError.message}`);
    }
    boardId = insertedBoard.id;
  }

  const fieldIdMap = new Map();
  for (const field of customFields) {
    const { data: insertedField, error: fieldError } = await supabase
      .from('custom_field_definitions')
      .insert({
        board_id: boardId,
        name: field.name,
        field_type: field.field_type,
        options: field.options,
        position: field.position,
      })
      .select('*')
      .single();

    if (fieldError) {
      throw new Error(`Failed importing custom field "${field.name}": ${fieldError.message}`);
    }

    if (field.id && insertedField.id) {
      fieldIdMap.set(field.id, insertedField.id);
    }
  }

  if (tasks.length > 0) {
    const taskRows = tasks.map(task => ({
      board_id: boardId,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      tags: task.tags || [],
      assignee: task.assignee || '',
      position: task.position,
      custom_field_values: mapCustomFieldValues(task.custom_field_values || {}, fieldIdMap),
    }));

    const { error: taskError } = await supabase.from('tasks').insert(taskRows);
    if (taskError) {
      throw new Error(`Failed importing tasks: ${taskError.message}`);
    }
  }

  if (conversations.length > 0) {
    const messageRows = conversations.map(message => ({
      board_id: boardId,
      role: message.role,
      content: message.content,
    }));

    const { error: aiError } = await supabase.from('ai_conversations').insert(messageRows);
    if (aiError) {
      throw new Error(`Failed importing AI conversation history: ${aiError.message}`);
    }
  }

  console.log(`Import complete for ${args.email}`);
  console.log(`Board: ${boardName}`);
  console.log(`Rows: ${customFields.length} fields, ${tasks.length} tasks, ${conversations.length} AI messages`);
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
