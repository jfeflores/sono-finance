-- Usage logs table for server-side rate limiting
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups by user + feature + date
CREATE INDEX idx_usage_logs_lookup ON public.usage_logs (user_id, feature, used_at);

-- RLS: users can only see their own usage
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON public.usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Server-side function to check usage count for today
CREATE OR REPLACE FUNCTION public.check_daily_usage(_user_id UUID, _feature TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.usage_logs
  WHERE user_id = _user_id
    AND feature = _feature
    AND used_at >= (CURRENT_DATE AT TIME ZONE 'UTC');
$$;

-- Server-side function to record usage
CREATE OR REPLACE FUNCTION public.record_usage(_user_id UUID, _feature TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.usage_logs (user_id, feature) VALUES (_user_id, _feature);
$$;