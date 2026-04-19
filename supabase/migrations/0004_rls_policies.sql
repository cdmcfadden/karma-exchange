-- Row-Level Security policies

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheelhouse_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheelhouse_seeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wheelhouse_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karma_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- USERS: readable by authenticated users (for match discovery); mutable only by self
CREATE POLICY "users_select_authenticated" ON public.users
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_insert_self" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- WHEELHOUSE SKILLS: own skills full access; others' skills selected (no evidence_text for strangers)
CREATE POLICY "wheelhouse_skills_own" ON public.wheelhouse_skills
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wheelhouse_skills_read_all" ON public.wheelhouse_skills
  FOR SELECT TO authenticated USING (true);

-- WHEELHOUSE SEEKS: own full access; others read-only
CREATE POLICY "wheelhouse_seeks_own" ON public.wheelhouse_seeks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wheelhouse_seeks_read_all" ON public.wheelhouse_seeks
  FOR SELECT TO authenticated USING (true);

-- WHEELHOUSE MESSAGES: self only
CREATE POLICY "wheelhouse_messages_own" ON public.wheelhouse_messages
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- REQUESTS: own full access; others can't see drafts
CREATE POLICY "requests_own" ON public.requests
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "requests_read_active" ON public.requests
  FOR SELECT TO authenticated USING (status = 'active' OR status = 'matched');

-- SESSIONS: only helper or receiver
CREATE POLICY "sessions_participants" ON public.sessions
  FOR ALL TO authenticated
  USING (auth.uid() = helper_id OR auth.uid() = receiver_id);

-- SESSION MESSAGES: only session participants
CREATE POLICY "session_messages_participants" ON public.session_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND (auth.uid() = s.helper_id OR auth.uid() = s.receiver_id)
    )
  );
CREATE POLICY "session_messages_insert_participants" ON public.session_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND (auth.uid() = s.helper_id OR auth.uid() = s.receiver_id)
    )
  );

-- KARMA TRANSACTIONS: read-only, self only
CREATE POLICY "karma_transactions_read_own" ON public.karma_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- USER INTEGRATIONS: self only
CREATE POLICY "user_integrations_own" ON public.user_integrations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- REFERRALS: readable by referrer or referee
CREATE POLICY "referrals_participants" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
