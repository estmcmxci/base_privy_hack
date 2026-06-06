/**
 * Reputation scoring — canonical formula from the Scenius paper.
 *
 * r_i = (1 - α) * r_i + α * exp(-β * (p_ij - Y_j)²)
 *
 * α = 0.05  EMA smoothing — 95 % weight on history
 * β = 5.0   sharpness — penalty severity
 *
 * All tastemakers initialize at r = 1.0.
 */

const ALPHA = 0.05;
const BETA = 5.0;

type BinaryOutcome = "yes" | "no";

/**
 * EMA reputation update after a prediction resolves.
 *
 * Returns the updated reputation clamped to [0.01, 0.99].
 */
export function updateReputation(
  currentScore: number,
  predictedOutcome: BinaryOutcome,
  actualOutcome: BinaryOutcome,
): number {
  const p = predictedOutcome === "yes" ? 1.0 : 0.0;
  const y = actualOutcome === "yes" ? 1.0 : 0.0;
  const credit = Math.exp(-BETA * Math.pow(p - y, 2));
  const updated = (1 - ALPHA) * currentScore + ALPHA * credit;
  return Math.max(0.01, Math.min(0.99, updated));
}

interface WeightedPrediction {
  reputation_score: number;
  predicted_outcome: BinaryOutcome;
}

/**
 * Reputation-weighted aggregate signal across predictions for an artist.
 *
 * Returns a probability between 0 and 1. Falls back to 0.5 when there are
 * no predictions (i.e. total weight is zero).
 */
export function weightedConsensus(predictions: WeightedPrediction[]): number {
  const toProb = (o: BinaryOutcome): number => (o === "yes" ? 1.0 : 0.0);
  const num = predictions.reduce(
    (s, p) => s + p.reputation_score * toProb(p.predicted_outcome),
    0,
  );
  const den = predictions.reduce((s, p) => s + p.reputation_score, 0);
  return den === 0 ? 0.5 : num / den;
}
