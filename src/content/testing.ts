export const TEST_CHECKLIST: string[] = [
  "I created an in-memory repository seeded with the exact state I need",
  "I used a recording (spy) adapter to observe the outbound call",
  "I asserted on behavior (what was redeemed), not on implementation details",
  "I covered the error paths: reward not found, reward unavailable",
  "Zero mocking libraries, zero network, zero AWS in the test file",
];

export const TEST_SOLUTION: string = `// A tiny recording adapter: an in-memory spy, no library needed
const recordingRedemptionServiceCreator = () => {
  const calls: { userEmail: string; reward: Reward }[] = [];
  return {
    service: {
      async redeem(userEmail: string, reward: Reward) {
        calls.push({ userEmail, reward });
      },
    },
    calls,
  };
};

describe("redeemReward", () => {
  const reward = { id: "r1", available: true, internalRewardId: "int1" };

  it("redeems an available reward", async () => {
    const { service, calls } = recordingRedemptionServiceCreator();
    const redeemReward = createRedeemRewardUseCase({
      rewardRepository: inMemoryRewardRepositoryCreator(
        new Map([["r1", reward]])
      ),
      redemptionService: service,
    });

    await redeemReward("paul@example.com", "r1");

    expect(calls).toEqual([{ userEmail: "paul@example.com", reward }]);
  });

  it("throws when the reward does not exist", async () => {
    const redeemReward = createRedeemRewardUseCase({
      rewardRepository: inMemoryRewardRepositoryCreator(new Map()),
      redemptionService: recordingRedemptionServiceCreator().service,
    });

    await expect(redeemReward("paul@example.com", "nope"))
      .rejects.toThrow("Reward not found");
  });

  it("throws when the reward is unavailable", async () => {
    const redeemReward = createRedeemRewardUseCase({
      rewardRepository: inMemoryRewardRepositoryCreator(
        new Map([["r1", { ...reward, available: false }]])
      ),
      redemptionService: recordingRedemptionServiceCreator().service,
    });

    await expect(redeemReward("paul@example.com", "r1"))
      .rejects.toThrow("Reward unavailable");
  });
});`;

import type { TestMission } from "./types";

export const TEST_MISSIONS: TestMission[] = [
  {
    id: "t1",
    title: "Mission 1: test redeemReward without mocking anything",
    brief:
      "On paper or in your editor, write the test suite for createRedeemRewardUseCase from the guide. Cover the happy path and both error paths. Then grade yourself against the checklist and compare with the model answer.",
    checklist: TEST_CHECKLIST,
    solution: TEST_SOLUTION,
  },
  {
    id: "t2",
    title: "Integration-Test the DynamoDB Adapter",
    brief:
      "Mission 1 proved the use case without touching a network. Now go to the other side of the port: write the integration suite for dynamoDbRewardRepositoryCreator against DynamoDB Local, in your own editor. Prove three things: getById maps the stored item shape into a domain Reward, a missing id comes back as null, and a missing table surfaces as a translated error rather than a raw AWS exception. Everything this adapter does is translation, so everything you assert should be translation.",
    checklist: [
      "I used a real DynamoDB DocumentClient pointed at DynamoDB Local, with zero mocks or stubs of the SDK.",
      "I created and seeded the table from the suite itself, so the tests own their own state and can run from a clean container.",
      "I asserted that getById returns a fully-shaped domain Reward, field by field, not just that something truthy came back.",
      "I covered the missing-id path and asserted null exactly: not undefined, not a throw.",
      "I asserted that a missing table rejects with the adapter's own translated error, not a raw AWS error name leaking through the port.",
      "I made no business assertions: no redemption rules, no cashback math, translation only.",
    ],
    solution:
      'import { DynamoDB } from "aws-sdk";\nimport { dynamoDbRewardRepositoryCreator } from "../src/adapters";\nimport { RewardStorageError } from "../src/domain";\n\nconst config = {\n  endpoint: "http://localhost:8000",\n  region: "local",\n  credentials: { accessKeyId: "x", secretAccessKey: "x" },\n};\nconst dynamoClient = new DynamoDB.DocumentClient(config);\nconst tableName = "rewards-test";\nconst item = {\n  rewardId: "reward-1",\n  name: "10% cashback",\n  costInPoints: 500,\n};\n\ndescribe("dynamoDbRewardRepositoryCreator (integration)", () => {\n  const repository = dynamoDbRewardRepositoryCreator({\n    dynamoClient,\n    tableName,\n  });\n\n  beforeAll(async () => {\n    await new DynamoDB(config)\n      .createTable({\n        TableName: tableName,\n        AttributeDefinitions: [\n          { AttributeName: "rewardId", AttributeType: "S" },\n        ],\n        KeySchema: [{ AttributeName: "rewardId", KeyType: "HASH" }],\n        BillingMode: "PAY_PER_REQUEST",\n      })\n      .promise();\n  });\n\n  beforeEach(async () => {\n    await dynamoClient\n      .put({ TableName: tableName, Item: item })\n      .promise();\n  });\n\n  it("maps the stored item to a domain Reward", async () => {\n    const reward = await repository.getById("reward-1");\n    expect(reward).toEqual(item);\n  });\n\n  it("returns null for a missing id", async () => {\n    expect(await repository.getById("nope")).toBeNull();\n  });\n\n  it("translates a missing table into a domain error", async () => {\n    const broken = dynamoDbRewardRepositoryCreator({\n      dynamoClient,\n      tableName: "does-not-exist",\n    });\n    await expect(broken.getById("reward-1"))\n      .rejects.toThrow(RewardStorageError);\n  });\n});',
  },
  {
    id: "t3",
    title: "The Shared Contract Suite",
    brief:
      "You now have two implementations of RewardRepository and two test suites that could quietly drift apart. Write rewardRepositoryContract once: a function that receives a way to build a repository and a way to seed it, and declares the assertions every implementation must satisfy. Then run it against both inMemoryRewardRepositoryCreator and the DynamoDB adapter. The sentence to say in the interview is: 'the in-memory adapter is only trustworthy in unit tests because the contract suite proves it behaves like the real one.'",
    checklist: [
      "I wrote the contract as a single function taking a factory, not as a copy-pasted suite per adapter.",
      "The assertions inside the contract are byte-for-byte identical for both adapters: no per-adapter it blocks, no branching on the name.",
      "Seeding goes through a seed hook returned by each factory, so the contract never touches the DynamoDB client or the in-memory array directly.",
      "Both invocations pass in the same run: in-memory and DynamoDB Local.",
      "I covered getById found and missing-id-returns-null inside the contract, so null-vs-undefined drift between adapters is caught.",
      "I can state the drift argument out loud: if the fake diverges from the real adapter, unit tests keep passing while production fails, and the contract suite is what closes that gap.",
    ],
    solution:
      'import {\n  inMemoryRewardRepositoryCreator,\n  dynamoDbRewardRepositoryCreator,\n} from "../src/adapters";\nimport { Reward, RewardRepository } from "../src/domain";\nimport { dynamoClient, tableName } from "./dynamoLocal";\n\ntype Harness = {\n  repository: RewardRepository;\n  seed: (reward: Reward) => Promise<void>;\n};\n\nexport const rewardRepositoryContract = (\n  name: string,\n  makeRepo: () => Promise<Harness>,\n) => {\n  describe(`RewardRepository contract: ${name}`, () => {\n    const reward: Reward = {\n      rewardId: "reward-1",\n      name: "10% cashback",\n      costInPoints: 500,\n    };\n\n    it("returns a seeded reward by id", async () => {\n      const { repository, seed } = await makeRepo();\n      await seed(reward);\n      const found = await repository.getById("reward-1");\n      expect(found).toEqual(reward);\n    });\n\n    it("returns null for an unknown id", async () => {\n      const { repository } = await makeRepo();\n      expect(await repository.getById("nope")).toBeNull();\n    });\n  });\n};\n\nrewardRepositoryContract("in-memory", async () => {\n  const rewards: Reward[] = [];\n  return {\n    repository: inMemoryRewardRepositoryCreator({ rewards }),\n    seed: async (reward) => {\n      rewards.push(reward);\n    },\n  };\n});\n\nrewardRepositoryContract("dynamodb", async () => ({\n  repository: dynamoDbRewardRepositoryCreator({\n    dynamoClient,\n    tableName,\n  }),\n  seed: async (reward) => {\n    await dynamoClient\n      .put({ TableName: tableName, Item: reward })\n      .promise();\n  },\n}));',
  },
  {
    id: "t4",
    title: "Test a Caching Decorator with a Fake Clock",
    brief:
      "The interview codebase wraps its reward storage in cachedRewardRepositoryCreator({ inner, clock, ttlMs }): a decorator that satisfies the same RewardRepository port. Write a unit suite proving the three behaviors that matter: a miss delegates to the inner adapter, a hit within the TTL never touches it, and an expired entry triggers a re-fetch. Time comes only from the injected Clock port; if your suite contains a sleep or a global timer mock, you have missed the point of the port.",
    checklist: [
      "My fake Clock is a plain object with a now() method plus an advance(ms) helper; there is no fake-timers API call (vi.useFakeTimers or jest.useFakeTimers), no setTimeout, and no sleep anywhere in the suite.",
      "I wrote a counting fake for the inner RewardRepository that increments on every getById call, and I assert exact call counts, never 'called at least once'.",
      "I covered the miss path: the first getById returns the reward and the inner was called exactly once.",
      "I covered the hit path: a second call within the TTL returns the reward with the inner call count still at exactly one.",
      "I covered expiry: after advancing the fake clock to or past ttlMs, the next call reaches the inner again and the count goes to two.",
      "I tested the boundary explicitly (e.g. advance ttlMs - 1 still serves from cache), so I can say out loud whether my TTL is inclusive or exclusive.",
    ],
    solution:
      "describe('cachedRewardRepositoryCreator', () => {\n  const reward = { rewardId: 'r1', name: 'Free Coffee' };\n\n  const fakeClockCreator = (startMs: number) => {\n    let nowMs = startMs;\n    return {\n      clock: { now: () => new Date(nowMs) } as Clock,\n      advance: (ms: number) => { nowMs += ms; },\n    };\n  };\n\n  const countingRewardRepositoryCreator = () => {\n    let calls = 0;\n    const repo: RewardRepository = {\n      getById: async (id: string) => {\n        calls += 1;\n        return id === 'r1' ? reward : null;\n      },\n    };\n    return { repo, getCalls: () => calls };\n  };\n\n  const setup = () => {\n    const { repo, getCalls } = countingRewardRepositoryCreator();\n    const { clock, advance } = fakeClockCreator(0);\n    const cached = cachedRewardRepositoryCreator({\n      inner: repo, clock, ttlMs: 60_000,\n    });\n    return { cached, getCalls, advance };\n  };\n\n  it('delegates to the inner repository on a miss', async () => {\n    const { cached, getCalls } = setup();\n    expect(await cached.getById('r1')).toEqual(reward);\n    expect(getCalls()).toBe(1);\n  });\n\n  it('serves a fresh entry without the inner', async () => {\n    const { cached, getCalls, advance } = setup();\n    await cached.getById('r1');\n    advance(59_999);\n    expect(await cached.getById('r1')).toEqual(reward);\n    expect(getCalls()).toBe(1);\n  });\n\n  it('re-fetches once the TTL has expired', async () => {\n    const { cached, getCalls, advance } = setup();\n    await cached.getById('r1');\n    advance(60_000);\n    expect(await cached.getById('r1')).toEqual(reward);\n    expect(getCalls()).toBe(2);\n  });\n});",
  },
  {
    id: "t5",
    title: "Outside-In TDD: grantCashback",
    brief:
      "Build grantCashback(userId, orderId) outside-in: write a failing use case test before a single line of production code exists. Drive out the two error paths first, order not found and order not confirmed, then the happy path that transfers order.cashback to the user. Let the ports OrderRepository and CashbackService emerge from what the tests demand, nothing more. The sentence to say is: 'the test is the first consumer of the design'.",
    checklist: [
      "I wrote the first test before grantCashback or either port existed, ran it, and watched it fail for the right reason, a missing use case, not a typo.",
      "The OrderRepository and CashbackService interfaces contain only the methods my tests forced into existence, getById and grant, nothing speculative.",
      "I covered order-not-found first and asserted both the rejection and that the recording CashbackService received nothing.",
      "I covered order-not-confirmed with the same double assertion: the error fires and the grants list stays empty.",
      "The happy path asserts the exact grant, correct userId and amount equal to order.cashback, not merely 'grant was called'.",
      "I used an in-memory OrderRepository and a recording CashbackService, no mocking library; the use case receives both through its creator's parameter object.",
    ],
    solution:
      "describe('createGrantCashbackUseCase', () => {\n  const confirmedOrder: Order = {\n    orderId: 'o1',\n    userId: 'u1',\n    status: 'confirmed',\n    cashback: 12.5,\n  };\n\n  const inMemoryOrderRepositoryCreator = ({\n    orders,\n  }: { orders: Order[] }): OrderRepository => ({\n    getById: async (orderId: string) =>\n      orders.find((o) => o.orderId === orderId) ?? null,\n  });\n\n  const recordingCashbackServiceCreator = () => {\n    const grants: { userId: string; amount: number }[] = [];\n    const service: CashbackService = {\n      grant: async (userId: string, amount: number) => {\n        grants.push({ userId, amount });\n      },\n    };\n    return { service, grants };\n  };\n\n  const setup = (orders: Order[]) => {\n    const { service, grants } = recordingCashbackServiceCreator();\n    const grantCashback = createGrantCashbackUseCase({\n      orderRepository: inMemoryOrderRepositoryCreator({ orders }),\n      cashbackService: service,\n    });\n    return { grantCashback, grants };\n  };\n\n  it('rejects when the order does not exist', async () => {\n    const { grantCashback, grants } = setup([]);\n    await expect(grantCashback('u1', 'missing'))\n      .rejects.toThrow('Order not found');\n    expect(grants).toEqual([]);\n  });\n\n  it('rejects when the order is not confirmed', async () => {\n    const pending: Order = { ...confirmedOrder, status: 'pending' };\n    const { grantCashback, grants } = setup([pending]);\n    await expect(grantCashback('u1', 'o1'))\n      .rejects.toThrow('Order not confirmed');\n    expect(grants).toEqual([]);\n  });\n\n  it('grants the order cashback to the user', async () => {\n    const { grantCashback, grants } = setup([confirmedOrder]);\n    await grantCashback('u1', 'o1');\n    expect(grants).toEqual([{ userId: 'u1', amount: 12.5 }]);\n  });\n});",
  },
];
