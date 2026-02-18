-- Add board ownership for per-user data isolation
ALTER TABLE public.boards
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS boards_owner_id_idx ON public.boards(owner_id);

-- Remove open/public policies
DROP POLICY IF EXISTS "Public boards access" ON public.boards;
DROP POLICY IF EXISTS "Public tasks access" ON public.tasks;
DROP POLICY IF EXISTS "Public custom fields access" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "Public AI conversations access" ON public.ai_conversations;

-- Boards: authenticated owner scope
DROP POLICY IF EXISTS "Users can view their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can insert their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON public.boards;

CREATE POLICY "Users can view their own boards"
ON public.boards FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own boards"
ON public.boards FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own boards"
ON public.boards FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own boards"
ON public.boards FOR DELETE
USING (owner_id = auth.uid());

-- Tasks: inherited access through owned board
DROP POLICY IF EXISTS "Users can view tasks of their boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks to their boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks of their boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks of their boards" ON public.tasks;

CREATE POLICY "Users can view tasks of their boards"
ON public.tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = tasks.board_id
      AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert tasks to their boards"
ON public.tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = tasks.board_id
      AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update tasks of their boards"
ON public.tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = tasks.board_id
      AND boards.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = tasks.board_id
      AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks of their boards"
ON public.tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = tasks.board_id
      AND boards.owner_id = auth.uid()
  )
);

-- Custom fields: inherited access through owned board
DROP POLICY IF EXISTS "Users can view custom fields of their boards" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "Users can insert custom fields to their boards" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "Users can update custom fields of their boards" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "Users can delete custom fields of their boards" ON public.custom_field_definitions;

CREATE POLICY "Users can view custom fields of their boards"
ON public.custom_field_definitions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = custom_field_definitions.board_id
      AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert custom fields to their boards"
ON public.custom_field_definitions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = custom_field_definitions.board_id
      AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update custom fields of their boards"
ON public.custom_field_definitions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = custom_field_definitions.board_id
      AND boards.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = custom_field_definitions.board_id
      AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete custom fields of their boards"
ON public.custom_field_definitions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = custom_field_definitions.board_id
      AND boards.owner_id = auth.uid()
  )
);

-- AI conversations: inherited access through owned board
DROP POLICY IF EXISTS "Users can view AI conversations of their boards" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can insert AI conversations to their boards" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can update AI conversations of their boards" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can delete AI conversations of their boards" ON public.ai_conversations;

CREATE POLICY "Users can view AI conversations of their boards"
ON public.ai_conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = ai_conversations.board_id
      AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert AI conversations to their boards"
ON public.ai_conversations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = ai_conversations.board_id
      AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update AI conversations of their boards"
ON public.ai_conversations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = ai_conversations.board_id
      AND boards.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = ai_conversations.board_id
      AND boards.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete AI conversations of their boards"
ON public.ai_conversations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = ai_conversations.board_id
      AND boards.owner_id = auth.uid()
  )
);
