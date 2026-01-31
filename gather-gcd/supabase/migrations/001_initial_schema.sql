-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Events table
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  title varchar(50) not null,
  passcode char(6) not null,
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

-- Policies for events
-- Read: Allow reading non-expired events (hide passcode via API)
create policy "Allow anonymous read events"
  on events for select
  using (expires_at > now());

-- Insert: Allow creating new events with valid data
create policy "Allow anonymous insert events"
  on events for insert
  with check (
    title is not null and
    length(title) between 1 and 50 and
    passcode is not null and
    length(passcode) = 6 and
    start_date is not null
  );

-- Update: Only allow updating is_locked and final_slot fields
-- (creator_token verification is done at API level)
create policy "Allow anonymous update events"
  on events for update
  using (expires_at > now())
  with check (
    -- Prevent modifying sensitive fields
    title = (select title from events where id = events.id) and
    passcode = (select passcode from events where id = events.id) and
    creator_token = (select creator_token from events where id = events.id)
  );

-- Policies for responses
-- Read: Allow reading responses for non-expired events
create policy "Allow anonymous read responses"
  on responses for select
  using (
    exists (
      select 1 from events
      where events.id = responses.event_id
      and events.expires_at > now()
    )
  );

-- Insert: Allow inserting responses with valid data
create policy "Allow anonymous insert responses"
  on responses for insert
  with check (
    nickname is not null and
    length(nickname) between 1 and 20 and
    user_fingerprint is not null and
    exists (
      select 1 from events
      where events.id = event_id
      and events.expires_at > now()
      and events.is_locked = false
    )
  );

-- Update: Allow updating own responses (fingerprint verification done at API level)
create policy "Allow anonymous update responses"
  on responses for update
  using (
    exists (
      select 1 from events
      where events.id = responses.event_id
      and events.expires_at > now()
      and events.is_locked = false
    )
  );

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

-- Generate random 6-digit passcode
create or replace function generate_passcode()
returns char(6)
language plpgsql
as $$
begin
  return lpad(floor(random() * 1000000)::text, 6, '0');
end;
$$;
