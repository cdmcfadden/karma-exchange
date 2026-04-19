-- Karma transaction helper: atomically adjust balance and write ledger entry.

CREATE OR REPLACE FUNCTION public.apply_karma_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_ref_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_balance INTEGER;
  v_new_rank INTEGER;
BEGIN
  -- Update balance; also increment rank if this is an earning (positive non-decay, non-refund)
  UPDATE public.users
  SET
    karma_points = karma_points + p_amount,
    karma_rank = karma_rank + CASE
      WHEN p_amount > 0 AND p_type IN ('session_earn', 'rating_bonus', 'first_helper_bonus', 'referral_bonus')
      THEN p_amount
      ELSE 0
    END
  WHERE id = p_user_id
  RETURNING karma_points, karma_rank INTO v_new_balance, v_new_rank;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  IF v_new_balance < 0 THEN
    -- Revert the update
    UPDATE public.users
    SET karma_points = karma_points - p_amount
    WHERE id = p_user_id;
    RAISE EXCEPTION 'Insufficient karma balance';
  END IF;

  -- Write ledger entry
  INSERT INTO public.karma_transactions (user_id, amount, type, ref_id, description, balance_after)
  VALUES (p_user_id, p_amount, p_type, p_ref_id, p_description, v_new_balance);

  RETURN v_new_balance;
END;
$$;

-- Monthly decay: 2% of balance above 1,000 karma
CREATE OR REPLACE FUNCTION public.apply_monthly_decay()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user RECORD;
  v_decay INTEGER;
  v_count INTEGER := 0;
BEGIN
  FOR v_user IN
    SELECT id, karma_points FROM public.users WHERE karma_points > 1000
  LOOP
    v_decay := FLOOR((v_user.karma_points - 1000) * 0.02);
    IF v_decay > 0 THEN
      PERFORM public.apply_karma_transaction(
        v_user.id,
        -v_decay,
        'decay',
        NULL,
        'Monthly 2% decay on balance above 1,000'
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Schedule: first of each month at 00:00 UTC
-- Requires pg_cron superuser privileges; configure in Supabase dashboard.
-- SELECT cron.schedule(
--   'karma-monthly-decay',
--   '0 0 1 * *',
--   $$ SELECT public.apply_monthly_decay(); $$
-- );

-- Reciprocity status recalc: green if given >= received-2, amber if received > given+2, red if received > given+7
CREATE OR REPLACE FUNCTION public.recalc_reciprocity_status()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE public.users
  SET reciprocity_status = CASE
    WHEN total_received - total_given > 7 THEN 'red'
    WHEN total_received - total_given > 2 THEN 'amber'
    ELSE 'green'
  END
  WHERE created_at < now() - INTERVAL '14 days';  -- 14-day grace period

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Schedule: daily at 03:00 UTC
-- SELECT cron.schedule(
--   'karma-reciprocity-recalc',
--   '0 3 * * *',
--   $$ SELECT public.recalc_reciprocity_status(); $$
-- );
