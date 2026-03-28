-- PIN Usage Tracking
create table if not exists pin_usage (
  id uuid primary key default gen_random_uuid(),
  pin_code text not null,
  pin_label text not null,
  user_agent text,
  screen_width integer,
  screen_height integer,
  created_at timestamptz default now()
);

-- Allow anonymous inserts
alter table pin_usage enable row level security;

create policy "Allow anonymous insert" on pin_usage
  for insert to anon with check (true);

-- Allow reading for authenticated/service role only
create policy "Allow service read" on pin_usage
  for select to service_role using (true);
