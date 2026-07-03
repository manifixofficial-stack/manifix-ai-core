-- ============================================================================
-- ManifiX Veggie Go — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push` with this as a
-- migration file). Replaces backend/server.js's Socket.io tick engine.
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- game_rooms — one row per active lobby/arena
-- ----------------------------------------------------------------------------
create table if not exists game_rooms (
  room_code           text primary key,
  lobby_size          int not null default 4 check (lobby_size between 1 and 4),
  match_phase         text not null default 'LOBBY'
                         check (match_phase in ('LOBBY','COUNTDOWN','ACTIVE','ENDED')),
  countdown_tick      int,
  current_leader_slot text,       -- derived, but cached here so RoomJoin.jsx can
  current_leader_name text,       -- listen to ONE column instead of recomputing
                                   -- from player_scores on every client.
  center_lat          double precision,
  center_lng          double precision,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- player_scores — one row per player-in-a-room
-- ----------------------------------------------------------------------------
create table if not exists player_scores (
  id           uuid primary key default gen_random_uuid(),
  room_code    text not null references game_rooms(room_code) on delete cascade,
  -- Themed slot ids matching CharacterSelect.jsx's ALL_SLOTS array. If you
  -- ever rename a character skin in the frontend, this constraint has to
  -- change in lockstep or claim_character will reject every claim for that
  -- slot with a check-constraint violation.
  slot_id      text not null check (slot_id in ('oggy-blue','jack-green','olivia-pink','bob-purple')),
  name         text not null default 'Player',
  score        int not null default 0,
  latitude     double precision,
  longitude    double precision,
  last_seen    timestamptz not null default now(),
  created_at   timestamptz not null default now(),

  -- THE FIX from the character-lock race condition: only one player per
  -- color per room, enforced at the DB level, not just in the UI.
  constraint unique_room_slot unique (room_code, slot_id)
);

create index if not exists idx_player_scores_room on player_scores(room_code);

-- ----------------------------------------------------------------------------
-- veggie_spawns — one row per catchable veggie currently on the map
-- ----------------------------------------------------------------------------
create table if not exists veggie_spawns (
  id          uuid primary key default gen_random_uuid(),
  room_code   text not null references game_rooms(room_code) on delete cascade,
  veggie_type text not null default 'carrot'
                check (veggie_type in ('carrot','tomato','broccoli','golden')),
  latitude    double precision not null,
  longitude   double precision not null,
  points      int not null default 10,
  spawned_at  timestamptz not null default now()
);

create index if not exists idx_veggie_spawns_room on veggie_spawns(room_code);

-- ============================================================================
-- RLS — this app has no auth layer, so we open read/write to anon on a
-- room-scoped basis. This is fine for a party game; do NOT ship this as-is
-- for anything holding real user data. Tighten with a room "host token" or
-- Supabase Auth if this grows past a demo.
-- ============================================================================
alter table game_rooms    enable row level security;
alter table player_scores enable row level security;
alter table veggie_spawns enable row level security;

create policy "anon read rooms"   on game_rooms    for select using (true);
create policy "anon read players" on player_scores for select using (true);
create policy "anon read veggies" on veggie_spawns for select using (true);

-- Writes go through the RPC functions below wherever atomicity matters
-- (character claim, capture). Direct insert/update is still allowed for the
-- simple cases (location pings, room creation) since there's no race there.
create policy "anon write rooms"   on game_rooms    for all using (true) with check (true);
create policy "anon write players" on player_scores for all using (true) with check (true);
create policy "anon write veggies" on veggie_spawns for all using (true) with check (true);

-- ============================================================================
-- RPC: join_room
-- Creates the room if it doesn't exist, otherwise no-ops. Returns the room row.
-- ============================================================================
create or replace function join_room(p_room_code text, p_lat double precision, p_lng double precision)
returns game_rooms
language plpgsql
as $$
declare
  v_room game_rooms;
begin
  insert into game_rooms (room_code, center_lat, center_lng)
  values (upper(p_room_code), p_lat, p_lng)
  on conflict (room_code) do nothing;

  select * into v_room from game_rooms where room_code = upper(p_room_code);
  return v_room;
end;
$$;

-- ============================================================================
-- RPC: claim_character
-- Atomic claim of a color slot. Relies on the unique_room_slot constraint —
-- if two players tap BLUE within the same millisecond, only one insert
-- succeeds; the loser gets a clean {success:false} instead of a thrown
-- Postgres error the client has to parse.
-- ============================================================================
create or replace function claim_character(p_room_code text, p_slot_id text, p_name text)
returns jsonb
language plpgsql
as $$
declare
  v_row player_scores;
begin
  begin
    insert into player_scores (room_code, slot_id, name)
    values (upper(p_room_code), p_slot_id, coalesce(nullif(trim(p_name), ''), p_slot_id))
    returning * into v_row;
  exception when unique_violation then
    return jsonb_build_object('success', false, 'reason', 'slot_taken');
  end;

  return jsonb_build_object(
    'success', true,
    'player_id', v_row.id,
    'slot_id', v_row.slot_id,
    'name', v_row.name
  );
end;
$$;

-- ============================================================================
-- RPC: update_location
-- Throttling happens client-side (see gameClient.js); this just writes the
-- fix and refreshes the derived leader in game_rooms in the same transaction
-- so RoomJoin.jsx's single-column listener stays correct.
-- ============================================================================
create or replace function update_location(p_player_id uuid, p_lat double precision, p_lng double precision)
returns void
language plpgsql
as $$
declare
  v_room_code text;
begin
  update player_scores
     set latitude = p_lat, longitude = p_lng, last_seen = now()
   where id = p_player_id
   returning room_code into v_room_code;

  if v_room_code is not null then
    perform refresh_leader(v_room_code);
  end if;
end;
$$;

-- ============================================================================
-- RPC: capture_veggie
-- THE atomic fix from the double-capture race condition. Delete-if-exists +
-- point award + respawn happen in one transaction. If two players swipe the
-- same veggie in the same tick, the second call's DELETE affects 0 rows and
-- the function returns {success:false} — no double-award, no orphaned point.
-- ============================================================================
create or replace function capture_veggie(p_veggie_id uuid, p_player_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_veggie   veggie_spawns;
  v_player   player_scores;
  v_new_veg  veggie_spawns;
  v_new_lat  double precision;
  v_new_lng  double precision;
begin
  delete from veggie_spawns
   where id = p_veggie_id
  returning * into v_veggie;

  if v_veggie is null then
    -- already caught by someone else, or expired
    return jsonb_build_object('success', false, 'reason', 'already_gone');
  end if;

  update player_scores
     set score = score + v_veggie.points
   where id = p_player_id
  returning * into v_player;

  if v_player is null then
    -- shouldn't happen, but don't silently eat the veggie if it does
    return jsonb_build_object('success', false, 'reason', 'player_not_found');
  end if;

  perform refresh_leader(v_player.room_code);

  -- Respawn nearby (small random jitter, ~15-40m) so the arena stays populated.
  v_new_lat := v_veggie.latitude + (random() - 0.5) * 0.0006;
  v_new_lng := v_veggie.longitude + (random() - 0.5) * 0.0006;

  insert into veggie_spawns (room_code, veggie_type, latitude, longitude, points)
  values (
    v_veggie.room_code,
    (array['carrot','tomato','broccoli','golden'])[floor(random()*4 + 1)],
    v_new_lat, v_new_lng,
    case when random() < 0.08 then 50 else 10 end -- rare golden-value bonus
  )
  returning * into v_new_veg;

  return jsonb_build_object(
    'success', true,
    'points', v_veggie.points,
    'new_score', v_player.score,
    'player_name', v_player.name,
    'slot_id', v_player.slot_id,
    'respawned_veggie_id', v_new_veg.id
  );
end;
$$;

-- ============================================================================
-- Helper: refresh_leader — recomputes game_rooms.current_leader_* from the
-- highest score in player_scores. Called after any score-affecting write
-- instead of every client recomputing it independently.
-- ============================================================================
create or replace function refresh_leader(p_room_code text)
returns void
language plpgsql
as $$
declare
  v_top player_scores;
begin
  select * into v_top
    from player_scores
   where room_code = p_room_code
   order by score desc
   limit 1;

  if v_top is not null then
    update game_rooms
       set current_leader_slot = v_top.slot_id,
           current_leader_name = v_top.name,
           updated_at = now()
     where room_code = p_room_code
       and (current_leader_slot is distinct from v_top.slot_id);
  end if;
end;
$$;

-- ============================================================================
-- Enable Realtime on the tables the client subscribes to.
-- (In the Supabase dashboard: Database > Replication > toggle these on,
-- or run this if you're on a version that supports it via SQL.)
-- ============================================================================
alter publication supabase_realtime add table game_rooms;
alter publication supabase_realtime add table player_scores;
alter publication supabase_realtime add table veggie_spawns;

-- ============================================================================
-- MIGRATION — run this block instead of the whole file above if
-- player_scores already exists in your project with the old
-- ('BLUE','PURPLE','PINK','ORANGE') constraint. Running the full file again
-- is safe for the tables (all `create table if not exists`) but the
-- constraint itself needs an explicit drop+add since Postgres has no
-- "create or replace constraint" — find the real constraint name first,
-- it may not match this guess if you renamed anything.
-- ============================================================================
-- select conname from pg_constraint where conrelid = 'player_scores'::regclass;
--
-- alter table player_scores drop constraint player_scores_slot_id_check;
-- alter table player_scores add constraint player_scores_slot_id_check
--   check (slot_id in ('oggy-blue','jack-green','olivia-pink','bob-purple'));
