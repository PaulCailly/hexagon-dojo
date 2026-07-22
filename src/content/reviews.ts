import type { ReviewMission } from "./types";

export const REVIEWS: ReviewMission[] = [
  {
    title: "Mission 1: the entangled use case",
    intro:
      "You receive this in a pull request. Select every real problem, then reveal.",
    code: `async function grantCashback(userId: string, orderId: string) {
  const order = await dynamoClient.get({
    TableName: process.env.ORDERS_TABLE,
    Key: { orderId },
  }).promise();

  if (!order.Item) throw new Error("Order not found");
  if (order.Item.status !== "confirmed")
    throw new Error("Order not confirmed");

  await fetch(\`https://api.bank.com/v2/transfer\`, {
    method: "POST",
    headers: { Authorization: \`Bearer \${process.env.BANK_TOKEN}\` },
    body: JSON.stringify({ userId, amount: order.Item.cashback }),
  });
}`,
    issues: [
      {
        text: "Business rules depend directly on DynamoDB response shapes (order.Item)",
        correct: true,
        why: "The rule about confirmed orders is welded to the vendor's data shape.",
      },
      {
        text: "Environment variables are read inside the business logic",
        correct: true,
        why: "Config is infrastructure. It belongs in the composition root.",
      },
      {
        text: "The bank transfer is a raw fetch inside the workflow",
        correct: true,
        why: "No port, no adapter, no way to test without hitting the network.",
      },
      {
        text: "The function is async, which breaks the hexagonal pattern",
        correct: false,
        why: "Async is fine. Ports return Promises in the reference guide too.",
      },
      {
        text: "Testing this requires mocking AWS and network calls",
        correct: true,
        why: "The symptom that proves the boundary is missing.",
      },
      {
        text: "TypeScript should not be used for backend code",
        correct: false,
        why: "Irrelevant. The codebase you are joining is TypeScript.",
      },
    ],
    fix: `// Ports (defined by the logic, business language only)
interface OrderRepository {
  getById(id: string): Promise<Order | null>;
}
interface CashbackService {
  transfer(userId: string, amount: number): Promise<void>;
}

// Use case (receives its needs, decides nothing about infra)
const createGrantCashbackUseCase = ({
  orderRepository,
  cashbackService,
}: Dependencies) =>
  async (userId: string, orderId: string) => {
    const order = await orderRepository.getById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "confirmed")
      throw new Error("Order not confirmed");
    await cashbackService.transfer(userId, order.cashback);
  };`,
  },
  {
    title: "Mission 2: the leaky port and the smuggled rule",
    intro:
      "This PR claims to follow the ports and adapters guide. Does it? Select every real problem.",
    code: `// The "port"
interface RewardRepository {
  query(params: DynamoDB.DocumentClient.QueryInput):
    Promise<DynamoDB.DocumentClient.QueryOutput>;
}

// The "adapter"
const dynamoRewardRepositoryCreator = ({ dynamoClient, tableName }) => ({
  async query(params) {
    const result = await dynamoClient.query(params).promise();
    // filter out unavailable rewards so the use case
    // does not have to worry about it
    result.Items = result.Items?.filter((r) => r.available);
    return result;
  },
});`,
    issues: [
      {
        text: "The port exposes DynamoDB SDK types, so it is not vendor-neutral",
        correct: true,
        why: "Any caller of this port must speak DynamoDB. Swapping storage breaks every consumer. The port should say getAvailableById(id), not query(params).",
      },
      {
        text: "A business rule (availability filtering) lives inside the adapter",
        correct: true,
        why: "Adapters translate, they do not decide. The availability rule is invisible, untested at the domain level, and will be lost when someone writes a Postgres adapter.",
      },
      {
        text: "The creator function pattern (dynamoRewardRepositoryCreator) is wrong",
        correct: false,
        why: "The creator receiving its own dependencies is exactly the guide's pattern.",
      },
      {
        text: "The port is named in infrastructure vocabulary, not business vocabulary",
        correct: true,
        why: "query(params) describes a database operation. A port expresses a need: fetch a reward, list available rewards.",
      },
      {
        text: "Adapters must never mutate objects, so result.Items = ... is the core bug",
        correct: false,
        why: "Mutation is a style concern here. The real bug is WHERE the rule lives, not that it mutates.",
      },
    ],
    fix: `// Port in business language, vendor-neutral
interface RewardRepository {
  getById(id: string): Promise<Reward | null>;
}

// Use case owns the rule, visibly and testably
if (!reward) throw new Error("Reward not found");
if (!reward.available) throw new Error("Reward unavailable");

// Adapter only translates DynamoDB shapes to domain types
const dynamoRewardRepositoryCreator = ({ dynamoClient, tableName }) => ({
  async getById(id) {
    const result = await dynamoClient
      .get({ TableName: tableName, Key: { rewardId: id } })
      .promise();
    return result.Item ?? null;
  },
});`,
  },
];
