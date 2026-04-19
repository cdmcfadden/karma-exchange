-- Add profile fields for the profile modal (city, birth_year, availability, bio)
-- and enable Realtime on sessions + session_messages for notifications + messaging.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_year INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;
