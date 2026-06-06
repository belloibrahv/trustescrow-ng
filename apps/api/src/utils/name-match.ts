// apps/api/src/utils/name-match.ts
// Handles name matching between NIMC and NIBSS records.
// Nigerian names frequently appear in different orders between the two databases.
import natural from 'natural';

const MATCH_THRESHOLD = 0.80; // Minimum Jaro-Winkler similarity for a pass

/**
 * Tokenise a full name into a sorted set of tokens.
 * This handles name-order variations (e.g. "IBRAHIM ADEWALE" vs "ADEWALE IBRAHIM").
 */
function tokenise(name: string): string[] {
  return name
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .sort(); // Sort alphabetically so order doesn't matter
}

/**
 * Returns similarity score (0–1) between two name strings.
 * Combines Jaro-Winkler with token-set comparison.
 */
export function nameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;

  // Direct Jaro-Winkler
  const directScore = natural.JaroWinklerDistance(a.toLowerCase(), b.toLowerCase());

  // Token-set comparison (handles reordered names)
  const tokensA = tokenise(a).join(' ');
  const tokensB = tokenise(b).join(' ');
  const tokenScore = natural.JaroWinklerDistance(tokensA, tokensB);

  // Return the higher of the two scores
  return Math.max(directScore, tokenScore);
}

/**
 * Returns true if two names are similar enough to pass cross-match.
 * Logs the score for audit purposes.
 */
export function namesMatch(
  nimcName: string,
  bvnName: string
): { match: boolean; score: number } {
  const score = nameSimilarity(nimcName, bvnName);
  return { match: score >= MATCH_THRESHOLD, score };
}
