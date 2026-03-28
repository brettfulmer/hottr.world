-- Early Access Signups
create table if not exists early_access_signups (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  created_at timestamptz default now(),
  granted_access boolean default false
);

-- Access Codes
create table if not exists access_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null default 'universal' check (type in ('universal', 'personal')),
  email text,
  uses integer default 0,
  max_uses integer,
  active boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table early_access_signups enable row level security;
alter table access_codes enable row level security;

-- Allow anonymous inserts to signups only
create policy "Allow anonymous insert" on early_access_signups
  for insert to anon with check (true);

-- No direct access to access_codes from client
-- All validation goes through the RPC function

-- RPC function for secure code validation
create or replace function validate_access_code(input_code text)
returns boolean
language plpgsql
security definer
as $$
declare
  code_row access_codes%rowtype;
begin
  select * into code_row
  from access_codes
  where code = input_code
    and active = true
    and (max_uses is null or uses < max_uses)
  limit 1;

  if code_row.id is null then
    return false;
  end if;

  update access_codes set uses = uses + 1 where id = code_row.id;
  return true;
end;
$$;

-- Seed: insert a universal access code (change 'DANCEFLOOR2026' to your desired code)
insert into access_codes (code, type, active)
values ('DANCEFLOOR2026', 'universal', true)
on conflict (code) do nothing;
