-- Karma v1 — Initial Schema
-- Enables pgvector for embedding similarity search

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- users — augments Supabase auth.users
-- ============================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  timezone TEXT,
  avatar_url TEXT,
  karma_points INTEGER NOT NULL DEFAULT 500,
  karma_rank INTEGER NOT NULL DEFAULT 0,
  reciprocity_status TEXT NOT NULL DEFAULT 'green' CHECK (reciprocity_status IN ('green', 'amber', 'red')),
  total_given INTEGER NOT NULL DEFAULT 0,
  total_received INTEGER NOT NULL DEFAULT 0,
  wheelhouse_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_karma_rank ON public.users(karma_rank DESC);
CREATE INDEX idx_users_reciprocity ON public.users(reciprocity_status);

-- ============================================================
-- wheelhouse_skills — what the user can teach/help with
-- ============================================================
CREATE TABLE public.wheelhouse_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert', 'master')),
  years_experience INTEGER,
  evidence_text TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wheelhouse_skills_user ON public.wheelhouse_skills(user_id);
CREATE INDEX idx_wheelhouse_skills_category ON public.wheelhouse_skills(category);
CREATE INDEX idx_wheelhouse_skills_embedding ON public.wheelhouse_skills
  USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- wheelhouse_seeks — what the user wants to learn
-- ============================================================
CREATE TABLE public.wheelhouse_seeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  goal_description TEXT NOT NULL,
  current_level TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wheelhouse_seeks_user ON public.wheelhouse_seeks(user_id);
CREATE INDEX idx_wheelhouse_seeks_embedding ON public.wheelhouse_seeks
  USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- wheelhouse_messages — conversation history for skills extraction
-- ============================================================
CREATE TABLE public.wheelhouse_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wheelhouse_messages_user ON public.wheelhouse_messages(user_id, created_at);

-- ============================================================
-- requests — active asks for help
-- ============================================================
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT,
  urgency TEXT CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  embedding VECTOR(1536),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'matched', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_requests_user ON public.requests(user_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_embedding ON public.requests
  USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- sessions — actual help exchanges
-- ============================================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  helper_id UUID NOT NULL REFERENCES public.users(id),
  receiver_id UUID NOT NULL REFERENCES public.users(id),
  session_type TEXT NOT NULL CHECK (session_type IN ('express', 'standard', 'deep')),
  karma_cost INTEGER NOT NULL,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  receiver_rating INTEGER CHECK (receiver_rating BETWEEN 1 AND 5),
  helper_rating INTEGER CHECK (helper_rating BETWEEN 1 AND 5),
  receiver_feedback TEXT,
  helper_feedback TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (helper_id != receiver_id)
);

CREATE INDEX idx_sessions_helper ON public.sessions(helper_id);
CREATE INDEX idx_sessions_receiver ON public.sessions(receiver_id);
CREATE INDEX idx_sessions_status ON public.sessions(status);

-- ============================================================
-- session_messages — in-app chat between helper & receiver
-- ============================================================
CREATE TABLE public.session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_messages_session ON public.session_messages(session_id, created_at);

-- ============================================================
-- karma_transactions — immutable ledger
-- ============================================================
CREATE TABLE public.karma_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'welcome_grant',
    'session_earn',
    'session_spend',
    'session_refund',
    'decay',
    'referral_bonus',
    'first_helper_bonus',
    'rating_bonus',
    'daily_checkin',
    'gift_sent',
    'gift_received',
    'admin_adjustment'
  )),
  ref_id UUID,
  description TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_karma_transactions_user ON public.karma_transactions(user_id, created_at DESC);
CREATE INDEX idx_karma_transactions_type ON public.karma_transactions(type);

-- ============================================================
-- user_integrations — LinkedIn, Strava, Apple Health, etc.
-- ============================================================
CREATE TABLE public.user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('linkedin', 'strava', 'applehealth', 'github', 'goodreads', 'other')),
  external_url TEXT,
  external_id TEXT,
  metadata JSONB,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE INDEX idx_user_integrations_user ON public.user_integrations(user_id);

-- ============================================================
-- referrals — track who invited whom
-- ============================================================
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referee_sessions_completed INTEGER NOT NULL DEFAULT 0,
  bonus_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referee_id)
);

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER wheelhouse_skills_updated_at BEFORE UPDATE ON public.wheelhouse_skills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER requests_updated_at BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
