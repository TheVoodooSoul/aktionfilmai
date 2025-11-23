-- Create character_references table for Writers Room
-- Users create characters that link to A2E avatars

create table if not exists character_references (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  image_url text,
  description text,
  avatar_id text, -- A2E avatar ID for performing lines
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS policies
alter table character_references enable row level security;

-- Users can only see their own characters
create policy "Users can view own characters"
  on character_references for select
  using (auth.uid() = user_id);

-- Users can create their own characters
create policy "Users can create own characters"
  on character_references for insert
  with check (auth.uid() = user_id);

-- Users can update their own characters
create policy "Users can update own characters"
  on character_references for update
  using (auth.uid() = user_id);

-- Users can delete their own characters
create policy "Users can delete own characters"
  on character_references for delete
  using (auth.uid() = user_id);

-- Add index for faster queries
create index idx_character_references_user on character_references(user_id);

-- Add updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_character_references_updated_at
  before update on character_references
  for each row
  execute function update_updated_at_column();
