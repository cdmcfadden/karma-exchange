-- Enable Supabase Realtime for the Wheelhouse tables.
-- The onboarding right-pane preview (components/WheelhousePreview.tsx) subscribes
-- to postgres_changes on these tables; without them in the publication, inserts
-- are never broadcast and the preview stays empty until a manual refresh.

ALTER PUBLICATION supabase_realtime ADD TABLE public.wheelhouse_skills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wheelhouse_seeks;
