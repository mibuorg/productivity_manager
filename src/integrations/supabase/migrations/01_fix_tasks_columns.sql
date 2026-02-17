
-- Run this in your Supabase SQL Editor to fix the missing columns

-- Add column_id if it doesn't exist (using a DO block for safety if IF NOT EXISTS isn't supported directly in ADD COLUMN on older pg, but usually it is fine to just try add)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'column_id') THEN
        ALTER TABLE tasks ADD COLUMN column_id uuid references columns(id) on delete cascade;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'pomodoros_completed') THEN
        ALTER TABLE tasks ADD COLUMN pomodoros_completed integer default 0 not null;
    END IF;
    
    -- Also ensure board_id exists just in case
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'board_id') THEN
        ALTER TABLE tasks ADD COLUMN board_id uuid references boards(id) on delete cascade;
    END IF;

    -- Ensure position exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'position') THEN
        ALTER TABLE tasks ADD COLUMN position integer default 0 not null;
    END IF;

    -- Ensure user_id exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'user_id') THEN
        ALTER TABLE tasks ADD COLUMN user_id uuid references auth.users(id);
    END IF;

    -- Update RLS policies if needed (policies on missing columns would have failed creation too)
    -- So we might need to recreate policies.
END $$;

-- Verify policies exist
DO $$
BEGIN
    -- Check if policy exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view tasks of their boards') THEN
        create policy "Users can view tasks of their boards" on tasks for select using (exists (select 1 from boards where id = tasks.board_id and owner_id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can insert tasks to their boards') THEN
        create policy "Users can insert tasks to their boards" on tasks for insert with check (exists (select 1 from boards where id = tasks.board_id and owner_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can update tasks of their boards') THEN
        create policy "Users can update tasks of their boards" on tasks for update using (exists (select 1 from boards where id = tasks.board_id and owner_id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can delete tasks of their boards') THEN
        create policy "Users can delete tasks of their boards" on tasks for delete using (exists (select 1 from boards where id = tasks.board_id and owner_id = auth.uid()));
    END IF;
END $$;
