-- =========================================================
-- 🗂️ SECTION 1: DATABASE EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 📊 SECTION 2: TABLE CONFIGURATIONS & INTEGRITY SCHEMAS
-- =========================================================

-- Table 1: game_rooms (Lobby Hubs & Central Geofences)
CREATE TABLE IF NOT EXISTS public.game_rooms (
  room_code VARCHAR(12) PRIMARY KEY,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  current_leader_name VARCHAR(100) DEFAULT NULL,
  all_slots_filled BOOLEAN DEFAULT FALSE NOT NULL, -- Hook indicator for backend/tickserver.js clock
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 2: player_scores (Lobby Profiles, Standings, & GPS Pins)
CREATE TABLE IF NOT EXISTS public.player_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(12) NOT NULL REFERENCES public.game_rooms(room_code) ON DELETE CASCADE,
  name VARCHAR(20) NOT NULL,
  slot_id VARCHAR(30) DEFAULT NULL, -- Stores: 'oggy-blue', 'jack-green', 'olivia-pink', 'bob-purple'
  score INT4 DEFAULT 0 NOT NULL,
  latitude DOUBLE PRECISION DEFAULT 0 NOT NULL,
  longitude DOUBLE PRECISION DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- CORE REGULATION: Blocks race-conditions if 2 cats select the same color avatar card at once!
  CONSTRAINT unique_room_slot UNIQUE (room_code, slot_id)
);

-- Table 3: veggie_spawns (Dynamic Augmented Reality Coordinates Grid)
CREATE TABLE IF NOT EXISTS public.veggie_spawns (
  id TEXT PRIMARY KEY,
  room_code VARCHAR(12) NOT NULL REFERENCES public.game_rooms(room_code) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- Variant keys: 'carrot', 'tomato', 'broccoli', 'golden'
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  points INT4 NOT NULL DEFAULT 10 CONSTRAINT points_range_check CHECK (points >= 1 AND points <= 100)
);

-- =========================================================
-- 🥕 SECTION 3: AUTOMATED SPAWN CONTROLLER LOGIC
-- =========================================================

CREATE OR REPLACE FUNCTION public.spawn_room_vegetables(
  p_room_code TEXT, 
  p_lat DOUBLE PRECISION, 
  p_lng DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Spawn a Common Carrot (10 Points)
  INSERT INTO public.veggie_spawns (id, room_code, type, latitude, longitude, points)
  VALUES ('v_carrot_' || floor(random()*1000)::text, p_room_code, 'carrot', p_lat + (random()-0.5)*0.0015, p_lng + (random()-0.5)*0.0015, 10);

  -- 2. Spawn a Bouncing Tomato (15 Points)
  INSERT INTO public.veggie_spawns (id, room_code, type, latitude, longitude, points)
  VALUES ('v_tomato_' || floor(random()*1000)::text, p_room_code, 'tomato', p_lat + (random()-0.5)*0.0015, p_lng + (random()-0.5)*0.0015, 15);

  -- 3. Spawn an Acrobatic Broccoli (25 Points)
  INSERT INTO public.veggie_spawns (id, room_code, type, latitude, longitude, points)
  VALUES ('v_broccoli_' || floor(random()*1000)::text, p_room_code, 'broccoli', p_lat + (random()-0.5)*0.0015, p_lng + (random()-0.5)*0.0015, 25);
END;
$$;

-- =========================================================
-- 🛰️ SECTION 4: POSTGREST RPC DATABASE EXECUTIONS
-- =========================================================

-- RPC 1: join_room (Handles tracking entrance loops)
CREATE OR REPLACE FUNCTION public.join_room(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_room_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_code TEXT;
  v_random_name TEXT;
  v_player_id UUID;
BEGIN
  v_room_code := UPPER(TRIM(p_room_code));
  v_random_name := 'Cat-' || floor(random() * 9000 + 1000)::text;

  -- Verify or instantiate game room hub mapping center point variables
  INSERT INTO public.game_rooms (room_code, center_lat, center_lng)
  VALUES (v_room_code, p_lat, p_lng)
  ON CONFLICT (room_code) DO NOTHING;

  -- Ensure we spawn items if this is a fresh registration frame
  IF NOT EXISTS (SELECT 1 FROM public.veggie_spawns WHERE room_code = v_room_code) THEN
    PERFORM public.spawn_room_vegetables(v_room_code, p_lat, p_lng);
  END IF;

  -- Create player scorecard row instance
  INSERT INTO public.player_scores (room_code, name, slot_id, latitude, longitude, score)
  VALUES (v_room_code, v_random_name, NULL, p_lat, p_lng, 0)
  RETURNING id INTO v_player_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'success', true,
    'player_id', v_player_id,
    'room_code', v_room_code,
    'name', v_random_name
  );
END;
$$;

-- RPC 2: claim_character (Alphabetical property footprint used by the frontend compiler)
CREATE OR REPLACE FUNCTION public.claim_character(
  p_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_name TEXT,
  p_room_code TEXT,
  p_slot_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_code TEXT;
  v_claimed_count INT4;
BEGIN
  v_room_code := UPPER(TRIM(p_room_code));

  -- Update character profile assignment securely
  UPDATE public.player_scores
  SET slot_id = p_slot_id,
      latitude = p_lat,
      longitude = p_lng,
      name = COALESCE(p_name, name)
  WHERE id = p_id;

  -- Validate how many slots have been successfully occupied inside this lobby code
  SELECT COUNT(*) INTO v_claimed_count 
  FROM public.player_scores 
  WHERE room_code = v_room_code AND slot_id IS NOT NULL;

  -- CLOCK TRIGGER: Flip master flag once 4 distinct player rows assign avatars
  IF v_claimed_count >= 4 THEN
    UPDATE public.game_rooms 
    SET all_slots_filled = TRUE 
    WHERE room_code = v_room_code;
  END IF;

  RETURN jsonb_build_object(
    'status', 'success',
    'success', true,
    'player_id', p_id,
    'slot_id', p_slot_id,
    'room_code', v_room_code,
    'name', p_name
  );
EXCEPTION WHEN unique_violation THEN
  -- Safeguards database from race-condition duplicate slot assertions
  RETURN jsonb_build_object(
    'status', 'error', 
    'success', false, 
    'message', 'This character profile slot is already occupied!'
  );
END;
$$;

-- RPC 3: update_location (Routinely accepts mobile GPS telemetry)
CREATE OR REPLACE FUNCTION public.update_location(
  p_player_id UUID, 
  p_lat DOUBLE PRECISION, 
  p_lng DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.player_scores
  SET latitude = p_lat,
      longitude = p_lng
  WHERE id = p_player_id;
END;
$$;

-- RPC 4: capture_veggie (Secure Haversine Swipe Verification Engine)
CREATE OR REPLACE FUNCTION public.capture_veggie(
  p_player_id UUID,
  p_veggie_id TEXT,
  p_player_lat DOUBLE PRECISION,
  p_player_lng DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_code TEXT;
  v_veg_lat DOUBLE PRECISION;
  v_veg_lng DOUBLE PRECISION;
  v_veg_pts INT4;
  v_dist DOUBLE PRECISION;
  v_new_score INT4;
BEGIN
  SELECT room_code, latitude, longitude, points INTO v_room_code, v_veg_lat, v_veg_lng, v_veg_pts
  FROM public.veggie_spawns WHERE id = p_veggie_id;

  IF v_room_code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Target vegetable has already vanished.');
  END IF;

  -- HAVERSINE CALCULATION: Validates physical spatial distance proximity mapping
  v_dist := 6371000 * 2 * atan2(
    sqrt(sin(((v_veg_lat - p_player_lat) * pi() / 180)/2)^2 + cos(p_player_lat * pi() / 180) * cos(v_veg_lat * pi() / 180) * sin(((v_veg_lng - p_player_lng) * pi() / 180)/2)^2),
    sqrt(1 - (sin(((v_veg_lat - p_player_lat) * pi() / 180)/2)^2 + cos(p_player_lat * pi() / 180) * cos(v_veg_lat * pi() / 180) * sin(((v_veg_lng - p_player_lng) * pi() / 180)/2)^2))
  );

  -- Enforce anti-cheat proximity perimeter verification check
  IF v_dist > 25.0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Out of proximity catch limits.');
  END IF;

  -- Allocate scores into table statistics
  UPDATE public.player_scores 
  SET score = score + v_veg_pts 
  WHERE id = p_player_id 
  RETURNING score INTO v_new_score;

  -- Re-seed the item instance matrix safely inside the active environment radius
  UPDATE public.veggie_spawns
  SET id = 'v_' || type || '_' || floor(random() * 1000)::text,
      latitude = p_player_lat + (random() - 0.5) * 0.0018,
      longitude = p_player_lng + (random() - 0.5) * 0.0018
  WHERE id = p_veggie_id;

  RETURN jsonb_build_object(
    'success', true, 
    'points_gained', v_veg_pts, 
    'updated_score', v_new_score
  );
END;
$$;

-- =========================================================
-- ⚡ SECTION 5: REAL-TIME REPLICATION CONFIGURATION
-- =========================================================
ALTER TABLE public.game_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.player_scores REPLICA IDENTITY FULL;
ALTER TABLE public.veggie_spawns REPLICA IDENTITY FULL;

-- Append structural assets into the default broadcast streams framework channel
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.veggie_spawns;
