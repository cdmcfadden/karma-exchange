-- Skill validation links — stores user-provided profile URLs
-- and the results of AI-powered verification against claimed skills.

CREATE TABLE public.skill_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'linked'
    CHECK (status IN ('linked', 'verifying', 'verified', 'partial', 'failed', 'inaccessible')),
  results JSONB,
  error_message TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, site_id)
);

CREATE INDEX idx_skill_validations_user ON public.skill_validations(user_id);

ALTER TABLE public.skill_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skill_validations_own" ON public.skill_validations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "skill_validations_read_all" ON public.skill_validations
  FOR SELECT TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_validations;

CREATE TRIGGER skill_validations_updated_at BEFORE UPDATE ON public.skill_validations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
