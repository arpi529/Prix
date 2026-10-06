create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  full_name text,
  email text,
  title text not null,
  description text not null,
  category text not null,
  location text not null,
  severity text not null,
  image_url text,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

alter table public.complaints enable row level security;

create policy "Users can view own complaints"
  on public.complaints for select
  using (auth.uid() = user_id or email = auth.email());

create policy "Users can insert own complaints"
  on public.complaints for insert
  with check (auth.uid() = user_id or email = auth.email());

create policy "Users can update own complaints"
  on public.complaints for update
  using (auth.uid() = user_id or email = auth.email());
