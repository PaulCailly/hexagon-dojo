import type { DrillAnswer, DrillItem, DrillSet, TagColor } from "./types";

export const DRILL: DrillItem[] = [
  {
    code: "interface UserRepository { findById(id: string): Promise<User | null> }",
    answer: "Port",
    why: "An interface expressing a need, in business language.",
  },
  {
    code: "const s3ReceiptStoreCreator = ({ s3Client, bucket }) => ({ ... })",
    answer: "Adapter",
    why: "Concrete implementation dealing with a real SDK at the edge.",
  },
  {
    code: 'if (!reward.available) throw new Error("Reward unavailable")',
    answer: "Use case",
    why: "A business rule. It belongs in the inner logic, visible and testable.",
  },
  {
    code: "createRedeemRewardUseCase({ rewardRepository: dynamoDbRewardRepositoryCreator({ ... }) })",
    answer: "Composition root",
    why: "The one place that chooses adapters and wires them in.",
  },
  {
    code: 'await fetch("https://api.ifeelgoods.com/v1/...", { headers: { Authorization } })',
    answer: "Adapter",
    why: "Raw HTTP with auth headers is edge-of-the-world territory.",
  },
  {
    code: 'inMemoryRewardRepositoryCreator(new Map([["r1", testReward]]))',
    answer: "Adapter",
    why: "In-memory implementations are adapters too, just for tests and local dev.",
  },
  {
    code: "interface Clock { now(): Date }",
    answer: "Port",
    why: "Even time can be a port. It makes date-dependent logic deterministic in tests.",
  },
  {
    code: "process.env.REDEMPTION_API_TOKEN",
    answer: "Composition root",
    why: "Config enters through the wiring and is passed into adapter creators.",
  },
  {
    code: "const redeemReward = createRedeemRewardUseCase(dependencies)",
    answer: "Composition root",
    why: "Assembling the use case from chosen adapters is wiring.",
  },
  {
    code: "return async function redeemReward(userEmail, rewardId) { ... }",
    answer: "Use case",
    why: "The factory-returned workflow: pure orchestration of ports and rules.",
  },
];

export const DRILL_OPTIONS: DrillAnswer[] = [
  "Port",
  "Adapter",
  "Use case",
  "Composition root",
];
export const DRILL_COLORS: Record<DrillAnswer, TagColor> = {
  Port: "cyan",
  Adapter: "amber",
  "Use case": "violet",
  "Composition root": "emerald",
};

export const DRILL_SETS: DrillSet[] = [
  { id: "d1", title: "Reading the Reference Codebase", items: DRILL },
];
