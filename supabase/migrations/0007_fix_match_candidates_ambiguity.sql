-- Fix "column reference user_id is ambiguous" in match_candidates.
-- The RETURNS TABLE(user_id UUID, ...) output column conflicts with
-- unqualified user_id references inside CTEs. Fix: add table aliases.

CREATE OR REPLACE FUNCTION public.match_candidates(
  p_request_embedding VECTOR(1536),
  p_requester_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  karma_rank INT,
  reciprocity_status TEXT,
  top_skill_category TEXT,
  top_skill_name TEXT,
  top_skill_level TEXT,
  skill_similarity REAL,
  reciprocity_bonus REAL,
  rank_boost REAL,
  final_score REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH requester_strengths AS (
    SELECT ws0.embedding
    FROM public.wheelhouse_skills ws0
    WHERE ws0.user_id = p_requester_id
  ),
  candidate_top_skills AS (
    SELECT DISTINCT ON (ws.user_id)
      ws.user_id,
      ws.category,
      ws.skill_name,
      ws.level,
      1 - (ws.embedding <=> p_request_embedding) AS similarity
    FROM public.wheelhouse_skills ws
    WHERE ws.user_id != p_requester_id
    ORDER BY ws.user_id, ws.embedding <=> p_request_embedding
  ),
  candidate_reciprocity AS (
    SELECT
      cs.user_id,
      COALESCE(MAX(1 - (cs.embedding <=> rs.embedding)), 0)::REAL AS reciprocity_match
    FROM public.wheelhouse_seeks cs
    CROSS JOIN requester_strengths rs
    GROUP BY cs.user_id
  )
  SELECT
    u.id AS user_id,
    u.display_name,
    u.avatar_url,
    u.karma_rank,
    u.reciprocity_status,
    cts.category AS top_skill_category,
    cts.skill_name AS top_skill_name,
    cts.level AS top_skill_level,
    cts.similarity::REAL AS skill_similarity,
    COALESCE(cr.reciprocity_match, 0)::REAL AS reciprocity_bonus,
    CASE WHEN u.karma_rank > 500 THEN 0.05 ELSE 0 END::REAL AS rank_boost,
    ((
      cts.similarity * 0.6
      + COALESCE(cr.reciprocity_match, 0) * 0.3
      + CASE WHEN u.karma_rank > 500 THEN 0.05 ELSE 0 END
      + 0.05
    ) * CASE u.reciprocity_status
        WHEN 'red' THEN 0
        WHEN 'amber' THEN 0.7
        ELSE 1.0
      END)::REAL AS final_score
  FROM candidate_top_skills cts
  JOIN public.users u ON u.id = cts.user_id
  LEFT JOIN candidate_reciprocity cr ON cr.user_id = cts.user_id
  WHERE u.reciprocity_status != 'red'
    AND u.wheelhouse_completed_at IS NOT NULL
  ORDER BY final_score DESC
  LIMIT p_limit;
END;
$$;
