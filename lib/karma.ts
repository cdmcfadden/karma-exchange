import { createServiceClient } from "@/lib/supabase/server";

export const KARMA_CONFIG = {
  WELCOME_GRANT: 500,
  FIRST_HELPER_BONUS: 250,
  FIRST_RECEIVER_BONUS: 100,
  REFERRAL_BONUS: 200,
  RATING_5_STAR_BONUS: 50,
  DAILY_CHECKIN: 5,
  DAILY_CHECKIN_MAX_PER_WEEK: 35,
  DECAY_THRESHOLD: 1000,
  DECAY_RATE: 0.02, // 2% monthly on balance above threshold
  SESSION_COSTS: {
    express: 75,
    standard: 200,
    deep: 350,
  } as const,
  RECIPROCITY_GRACE_DAYS: 14,
  RECIPROCITY_AMBER_THRESHOLD: 2,
  RECIPROCITY_RED_THRESHOLD: 7,
  AMBER_MATCH_PENALTY: 0.3, // -30% score
} as const;

export type KarmaTransactionType =
  | "welcome_grant"
  | "session_earn"
  | "session_spend"
  | "session_refund"
  | "decay"
  | "referral_bonus"
  | "first_helper_bonus"
  | "rating_bonus"
  | "daily_checkin"
  | "gift_sent"
  | "gift_received"
  | "admin_adjustment";

/**
 * Atomically apply a karma transaction via the Postgres stored procedure.
 * Positive `amount` = credit; negative = debit. Also updates `karma_rank` for earning types.
 * Throws on insufficient balance (for debits).
 */
export async function applyKarmaTransaction(args: {
  userId: string;
  amount: number;
  type: KarmaTransactionType;
  refId?: string | null;
  description?: string | null;
}): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("apply_karma_transaction", {
    p_user_id: args.userId,
    p_amount: args.amount,
    p_type: args.type,
    p_ref_id: args.refId ?? null,
    p_description: args.description ?? null,
  });
  if (error) throw new Error(`Karma transaction failed: ${error.message}`);
  return data as number;
}

/**
 * Session karma cost for a given session type.
 */
export function sessionCost(type: "express" | "standard" | "deep"): number {
  return KARMA_CONFIG.SESSION_COSTS[type];
}
