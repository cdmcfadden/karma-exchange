-- Add willing_to_help toggle and user-overridden level to wheelhouse_skills.
-- willing_to_help: whether the user offers to teach this skill (default true).
-- user_level: user's self-assessed level override (null = use AI-recommended level).

ALTER TABLE public.wheelhouse_skills
  ADD COLUMN willing_to_help BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.wheelhouse_skills
  ADD COLUMN user_level TEXT
  CHECK (user_level IN ('beginner', 'intermediate', 'advanced', 'expert', 'master'));
