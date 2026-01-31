-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Events table
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  title varchar(50) not null,
  passcode char(4) not null,
  start_date date not null,
  creator_token uuid default uuid_generate_v4(),
  is_locked boolean default false,
  final_slot jsonb null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '45 days')
);

-- Responses table
create table if not exists responses (
  id serial primary key,
  event_id uuid references events(id) on delete cascade,
  nickname varchar(20) not null,
  user_fingerprint varchar(128) not null,
  availability jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(event_id, nickname)
);

-- Indexes
create index if not exists idx_events_passcode on events(passcode);
create index if not exists idx_events_expires_at on events(expires_at);
create index if not exists idx_responses_event_id on responses(event_id);
create index if not exists idx_responses_fingerprint on responses(user_fingerprint);

-- Row Level Security
alter table events enable row level security;
alter table responses enable row level security;

-- Policies for events (allow anonymous read/write)
create policy "Allow anonymous read events"
  on events for select
  using (true);

create policy "Allow anonymous insert events"
  on events for insert
  with check (true);

create policy "Allow anonymous update events"
  on events for update
  using (true);

-- Policies for responses (allow anonymous read/write)
create policy "Allow anonymous read responses"
  on responses for select
  using (true);

create policy "Allow anonymous insert responses"
  on responses for insert
  with check (true);

create policy "Allow anonymous update responses"
  on responses for update
  using (true);

-- Function to get heatmap data for an event
create or replace function get_event_heatmap(target_event_id uuid)
returns table (
  slot_date date,
  slot_type text,
  participant_count bigint,
  names text[]
)
language plpgsql
as $$
begin
  return query
  with expanded_availability as (
    select
      r.nickname,
      (jsonb_each_text(r.availability)).key as date_key,
      (jsonb_each_text(r.availability)).value as slots_json
    from responses r
    where r.event_id = target_event_id
  ),
  parsed_slots as (
    select
      ea.nickname,
      ea.date_key::date as slot_date,
      jsonb_array_elements_text(ea.slots_json::jsonb) as slot_type
    from expanded_availability ea
  )
  select
    ps.slot_date,
    ps.slot_type,
    count(distinct ps.nickname) as participant_count,
    array_agg(distinct ps.nickname) as names
  from parsed_slots ps
  group by ps.slot_date, ps.slot_type
  order by participant_count desc, ps.slot_date, ps.slot_type;
end;
$$;

-- Function to clean up expired events (run via cron)
create or replace function cleanup_expired_events()
returns void
language plpgsql
as $$
begin
  delete from events where expires_at < now();
end;
$$;

-- Generate random 4-digit passcode
create or replace function generate_passcode()
returns char(4)
language plpgsql
as $$
begin
  return lpad(floor(random() * 10000)::text, 4, '0');
end;
$$;
