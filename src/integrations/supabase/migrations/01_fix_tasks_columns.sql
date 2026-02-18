-- Run this in your Supabase SQL Editor to fix missing task columns.
-- Local branch mode uses no authentication and open RLS policies.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'column_id') THEN
        ALTER TABLE tasks ADD COLUMN column_id uuid references columns(id) on delete cascade;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'pomodoros_completed') THEN
        ALTER TABLE tasks ADD COLUMN pomodoros_completed integer default 0 not null;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'board_id') THEN
        ALTER TABLE tasks ADD COLUMN board_id uuid references boards(id) on delete cascade;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'position') THEN
        ALTER TABLE tasks ADD COLUMN position integer default 0 not null;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Public tasks access') THEN
        create policy "Public tasks access" on tasks for all using (true) with check (true);
    END IF;
END $$;
