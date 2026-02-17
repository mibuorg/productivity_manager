-- Create tables
create table if not exists boards (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists columns (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references boards on delete cascade not null,
  title text not null,
  position integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text default 'todo' not null,
  column_id uuid references columns on delete cascade not null,
  position integer not null,
  user_id uuid references auth.users,
  board_id uuid references boards on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  pomodoros_completed integer default 0 not null
);

-- RLS Policies
alter table boards enable row level security;
alter table columns enable row level security;
alter table tasks enable row level security;

-- Boards policies
create policy "Users can view their own boards" on boards
  for select using (auth.uid() = owner_id);
create policy "Users can insert their own boards" on boards
  for insert with check (auth.uid() = owner_id);
create policy "Users can update their own boards" on boards
  for update using (auth.uid() = owner_id);

-- Columns policies (Accessible if user has access to the board)
create policy "Users can view columns of their boards" on columns
  for select using (
    exists (select 1 from boards where id = columns.board_id and owner_id = auth.uid())
  );
create policy "Users can insert columns to their boards" on columns
  for insert with check (
    exists (select 1 from boards where id = columns.board_id and owner_id = auth.uid())
  );
create policy "Users can update columns of their boards" on columns
  for update using (
    exists (select 1 from boards where id = columns.board_id and owner_id = auth.uid())
  );

-- Tasks policies (Accessible if user has access to the board)
create policy "Users can view tasks of their boards" on tasks
  for select using (
    exists (select 1 from boards where id = tasks.board_id and owner_id = auth.uid())
  );
create policy "Users can insert tasks to their boards" on tasks
  for insert with check (
    exists (select 1 from boards where id = tasks.board_id and owner_id = auth.uid())
  );
create policy "Users can update tasks of their boards" on tasks
  for update using (
    exists (select 1 from boards where id = tasks.board_id and owner_id = auth.uid())
  );
create policy "Users can delete tasks of their boards" on tasks
  for delete using (
    exists (select 1 from boards where id = tasks.board_id and owner_id = auth.uid())
  );
