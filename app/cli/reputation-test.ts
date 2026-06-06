import {
  updateReputation,
  weightedConsensus,
} from "@/app/domains/resolution/service/reputation";

function heading(label: string): void {
  console.log(`\n── ${label} ${"─".repeat(50 - label.length)}`);
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exit(1);
  }
}

export function reputationTestCommand(): void {
  // 1 — Correct prediction stays near 1.0
  heading("Correct prediction (yes/yes) from r=1.0");
  const correct = updateReputation(1.0, "yes", "yes");
  console.log(`  r = ${correct.toFixed(6)}`);
  assert(correct >= 0.99, `expected >= 0.99, got ${correct}`);

  // 2 — Wrong prediction decays
  heading("Wrong prediction (yes/no) from r=1.0");
  const wrong = updateReputation(1.0, "yes", "no");
  console.log(`  r = ${wrong.toFixed(6)}`);
  assert(wrong < 0.97, `expected < 0.97, got ${wrong}`);

  // 3 — Multiple correct predictions compound toward 1.0
  heading("10 consecutive correct predictions from r=0.5");
  let r = 0.5;
  for (let i = 0; i < 10; i++) {
    r = updateReputation(r, "yes", "yes");
    console.log(`  round ${i + 1}: r = ${r.toFixed(6)}`);
  }
  assert(r > 0.5, `expected > 0.5 after 10 correct, got ${r}`);

  // 4 — Multiple wrong predictions decay toward 0.01
  heading("10 consecutive wrong predictions from r=1.0");
  r = 1.0;
  for (let i = 0; i < 10; i++) {
    r = updateReputation(r, "yes", "no");
    console.log(`  round ${i + 1}: r = ${r.toFixed(6)}`);
  }
  assert(r < 1.0 && r < correct, `expected decay below starting value after 10 wrong, got ${r}`);

  // 5 — Clamping: never below 0.01
  heading("Clamping — floor at 0.01");
  let rFloor = 0.01;
  rFloor = updateReputation(rFloor, "yes", "no");
  console.log(`  r = ${rFloor.toFixed(6)}`);
  assert(rFloor >= 0.01, `expected >= 0.01, got ${rFloor}`);

  // 6 — Weighted consensus with mixed reputations
  heading("Weighted consensus — mixed reputations");
  const predictions = [
    { reputation_score: 0.9, predicted_outcome: "yes" as const },
    { reputation_score: 0.8, predicted_outcome: "yes" as const },
    { reputation_score: 0.2, predicted_outcome: "no" as const },
    { reputation_score: 0.1, predicted_outcome: "no" as const },
  ];
  const consensus = weightedConsensus(predictions);
  console.log(`  consensus = ${consensus.toFixed(6)}`);
  assert(consensus > 0.5, `expected > 0.5, got ${consensus}`);

  // 7 — Weighted consensus — empty list
  heading("Weighted consensus — empty list");
  const empty = weightedConsensus([]);
  console.log(`  consensus = ${empty.toFixed(6)}`);
  assert(empty === 0.5, `expected 0.5, got ${empty}`);

  console.log("\n✓ All reputation tests passed.\n");
}
