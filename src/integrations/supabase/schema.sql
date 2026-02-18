-- Legacy schema reference for the original board/column/task model.
-- This local branch is intentionally unauthenticated and uses open RLS policies.

create table if not exists boards (
  id uuid default gen_random_uuid() primary key,
  name text not null,
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
  board_id uuid references boards on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  pomodoros_completed integer default 0 not null
);

alter table boards enable row level security;
alter table columns enable row level security;
alter table tasks enable row level security;

create policy "Public boards access" on boards
  for all using (true) with check (true);

create policy "Public columns access" on columns
  for all using (true) with check (true);

create policy "Public tasks access" on tasks
  for all using (true) with check (true);
