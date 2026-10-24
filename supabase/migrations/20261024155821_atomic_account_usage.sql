-- Apply this migration before deploying the updated chat and scenario-coach functions.
-- Until both handlers are updated, their old check/record race remains reachable.
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE private.sono_daily_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL CHECK (feature IN ('chat', 'scenarios')),
  usage_day date NOT NULL,
  used_count integer NOT NULL CHECK (used_count >= 0),
  PRIMARY KEY (user_id, feature, usage_day)
);
ALTER TABLE private.sono_daily_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.sono_daily_usage FROM PUBLIC, anon, authenticated;

-- Legacy APIs retain their arguments, but can only act as the signed-in caller.
CREATE OR REPLACE FUNCTION public.check_daily_usage(_user_id uuid, _feature text)
RETURNS integer
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM _user_id THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  RETURN (
    SELECT count(*)::integer FROM public.usage_logs
    WHERE user_id = _user_id AND feature = _feature
      AND used_at >= (date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
      AND used_at < ((date_trunc('day', now() AT TIME ZONE 'UTC') + interval '1 day') AT TIME ZONE 'UTC')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_usage(_user_id uuid, _feature text)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM _user_id THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.usage_logs (user_id, feature) VALUES (_user_id, _feature);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM _user_id THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id AND plan IN ('trial', 'monthly')
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_daily_usage(_feature text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  _caller uuid := auth.uid();
  _at timestamptz := statement_timestamp();
  _day date := (_at AT TIME ZONE 'UTC')::date;
  _limit integer;
  _historical integer;
  _used integer;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  _limit := CASE _feature WHEN 'chat' THEN 5 WHEN 'scenarios' THEN 1 ELSE NULL END;
  IF _limit IS NULL THEN
    RAISE EXCEPTION 'Unsupported usage feature' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _caller AND plan IN ('trial', 'monthly')
      AND (expires_at IS NULL OR expires_at > _at)
  ) THEN
    RETURN true;
  END IF;

  -- Preserve today's existing allowance, including logs written by older handlers.
  SELECT least(count(*), _limit)::integer INTO _historical
  FROM public.usage_logs
  WHERE user_id = _caller AND feature = _feature
    AND used_at >= (_day::timestamp AT TIME ZONE 'UTC')
    AND used_at < ((_day + 1)::timestamp AT TIME ZONE 'UTC');
  IF _historical >= _limit THEN
    RETURN false;
  END IF;

  -- ON CONFLICT serializes independent callers; only an admitted row is returned.
  INSERT INTO private.sono_daily_usage AS counter (user_id, feature, usage_day, used_count)
  VALUES (_caller, _feature, _day, _historical + 1)
  ON CONFLICT (user_id, feature, usage_day) DO UPDATE
    SET used_count = greatest(counter.used_count, _historical) + 1
    WHERE greatest(counter.used_count, _historical) < _limit
  RETURNING used_count INTO _used;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Failure rolls the counter back too. Provider work starts only after RPC commit.
  INSERT INTO public.usage_logs (user_id, feature, used_at) VALUES (_caller, _feature, _at);
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_daily_usage(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.record_usage(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_premium(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.consume_daily_usage(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_daily_usage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_usage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_premium(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_daily_usage(text) TO authenticated;
