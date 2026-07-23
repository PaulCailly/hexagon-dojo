import type { ReviewMission } from "./types";

export const REVIEWS: ReviewMission[] = [
  {
    title: "Mission 1: the entangled use case",
    intro:
      "You receive this in a pull request. Select every real problem, then reveal.",
    code: 'async function grantCashback(userId: string, orderId: string) {\n  const order = await dynamoClient.get({\n    TableName: process.env.ORDERS_TABLE,\n    Key: { orderId },\n  }).promise();\n\n  if (!order.Item) throw new Error("Order not found");\n  if (order.Item.status !== "confirmed")\n    throw new Error("Order not confirmed");\n\n  await fetch(`https://api.bank.com/v2/transfer`, {\n    method: "POST",\n    headers: { Authorization: `Bearer ${process.env.BANK_TOKEN}` },\n    body: JSON.stringify({ userId, amount: order.Item.cashback }),\n  });\n}',
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
    fix: '// Ports (defined by the logic, business language only)\ninterface OrderRepository {\n  getById(id: string): Promise<Order | null>;\n}\ninterface CashbackService {\n  transfer(userId: string, amount: number): Promise<void>;\n}\n\n// Use case (receives its needs, decides nothing about infra)\nconst createGrantCashbackUseCase = ({\n  orderRepository,\n  cashbackService,\n}: Dependencies) =>\n  async (userId: string, orderId: string) => {\n    const order = await orderRepository.getById(orderId);\n    if (!order) throw new Error("Order not found");\n    if (order.status !== "confirmed")\n      throw new Error("Order not confirmed");\n    await cashbackService.transfer(userId, order.cashback);\n  };',
  },
  {
    title: "Mission 2: the leaky port and the smuggled rule",
    intro:
      "This PR claims to follow the ports and adapters guide. Does it? Select every real problem.",
    code: '// The "port"\ninterface RewardRepository {\n  query(params: DynamoDB.DocumentClient.QueryInput):\n    Promise<DynamoDB.DocumentClient.QueryOutput>;\n}\n\n// The "adapter"\nconst dynamoRewardRepositoryCreator = ({ dynamoClient, tableName }) => ({\n  async query(params) {\n    const result = await dynamoClient.query(params).promise();\n    // filter out unavailable rewards so the use case\n    // does not have to worry about it\n    result.Items = result.Items?.filter((r) => r.available);\n    return result;\n  },\n});',
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
    fix: '// Port in business language, vendor-neutral\ninterface RewardRepository {\n  getById(id: string): Promise<Reward | null>;\n}\n\n// Use case owns the rule, visibly and testably\nif (!reward) throw new Error("Reward not found");\nif (!reward.available) throw new Error("Reward unavailable");\n\n// Adapter only translates DynamoDB shapes to domain types\nconst dynamoRewardRepositoryCreator = ({ dynamoClient, tableName }) => ({\n  async getById(id) {\n    const result = await dynamoClient\n      .get({ TableName: tableName, Key: { rewardId: id } })\n      .promise();\n    return result.Item ?? null;\n  },\n});',
  },
  {
    title: "Mission 3: the mock-everything test suite",
    intro:
      "This test file arrives in the PR with a proud comment: '100% coverage on redeemReward'. It is green, it is thorough, and it is testing almost nothing. Read it the way you would in the interview: for every mock, ask what boundary is missing that made the mock necessary, and for every assertion, ask whether it describes behavior or plumbing.",
    code: "import { DocumentClient } from 'aws-sdk/clients/dynamodb';\nimport { redeemReward } from './redeemReward';\njest.mock('aws-sdk/clients/dynamodb');\nglobal.fetch = jest.fn();\n\nit('redeems a reward', async () => {\n  const get = jest.fn().mockReturnValue({\n    promise: () =>\n      Promise.resolve({ Item: { rewardId: 'r1', cost: 500 } }),\n  });\n  const update = jest.fn().mockReturnValue({\n    promise: () => Promise.resolve({}),\n  });\n  (DocumentClient as unknown as jest.Mock)\n    .mockImplementation(() => ({ get, update }));\n  (global.fetch as jest.Mock)\n    .mockResolvedValue({ ok: true, json: async () => ({}) });\n\n  await redeemReward('r1', 'user-9');\n\n  expect(get).toHaveBeenCalledTimes(1);\n  expect(get).toHaveBeenCalledWith({\n    TableName: 'rewards', Key: { rewardId: 'r1' },\n  });\n  expect(global.fetch).toHaveBeenCalledWith(\n    'https://api.ifeelgoods.com/v2/redeem',\n    expect.objectContaining({ method: 'POST' }),\n  );\n  expect(update).toHaveBeenCalledTimes(1);\n});",
    issues: [
      {
        text: "The jest.mock of the AWS SDK proves the use case constructs its own DynamoDB client instead of receiving a RewardRepository port.",
        correct: true,
        why: "You only need to hijack the module system when the dependency is created where it is used. If redeemReward were built by a creator receiving { rewardRepository }, the test would pass inMemoryRewardRepositoryCreator and never call jest.mock at all. The mock is not the disease, it is the symptom: the missing boundary is.",
      },
      {
        text: "The assertions pin call counts and call arguments, so any refactor that preserves behavior — renaming the table, batching reads, switching to transactWrite — turns the test red.",
        correct: true,
        why: "This is over-specification. The test encodes how the code works today, not what it must do. A test suite like this punishes exactly the refactoring it should enable, and in the interview the sentence to say is: 'these tests will fail for every reason except a real bug'.",
      },
      {
        text: "global.fetch is stubbed and the vendor URL is asserted inside a use-case test, meaning the redemption HTTP call has no port.",
        correct: true,
        why: "That URL belongs inside iFeelGoodsRedemptionServiceCreator, verified by the adapter's own test. The use case should only see a RedemptionService. As written, when the vendor changes its path, a domain-level test breaks — the vendor has leaked two layers up.",
      },
      {
        text: "Nothing asserts the state of the system after redemption: no returned value, no reward status, no observable outcome.",
        correct: true,
        why: "expect(update).toHaveBeenCalledTimes(1) says an update happened; it says nothing about what was written. With an in-memory repository you read the reward back and assert its status is 'redeemed' — an assertion about the world, not about the wiring.",
      },
      {
        text: "The real problem is using mocks at all; this should be an integration test against DynamoDB local.",
        correct: false,
        why: "No. A unit test with in-memory adapters is exactly right for a use case: fast, deterministic, framework-free. Real DynamoDB belongs in a narrow contract test for the adapter. Swapping mocks for containers keeps the missing-port disease and adds a slow test suite on top.",
      },
      {
        text: "The test is incomplete because it never asserts the JSON body passed to fetch; a wrong payload would slip through.",
        correct: false,
        why: "Asserting more call arguments deepens the over-specification, it does not cure it. Payload correctness is the redemption adapter's contract, tested where the payload is built. The use-case test should not know a payload exists.",
      },
    ],
    fix: "it('marks the reward redeemed', async () => {\n  const rewardRepository = inMemoryRewardRepositoryCreator({\n    rewards: [\n      { rewardId: 'r1', cost: 500, status: 'available' },\n    ],\n  });\n  const redemptionService =\n    inMemoryRedemptionServiceCreator();\n  const redeemReward = redeemRewardCreator({\n    rewardRepository,\n    redemptionService,\n  });\n\n  await redeemReward({ rewardId: 'r1', userId: 'user-9' });\n\n  const reward = await rewardRepository.getById('r1');\n  expect(reward?.status).toBe('redeemed');\n  expect(redemptionService.wasDelivered('r1', 'user-9'))\n    .toBe(true);\n});",
  },
  {
    title: "Mission 4: the god port",
    intro:
      "This PR introduces 'one clean interface for everything reward-related'. Three use cases depend on it, and each one uses a different slice. In the interview, read an interface the way you read a function: not 'is each method reasonable' but 'do these methods belong to one client's need'.",
    code: "interface RewardService {\n  getRewardById(id: string): Promise<Reward | null>;\n  listAvailableRewards(): Promise<Reward[]>;\n  redeemReward(rewardId: string, userId: string): Promise<void>;\n  refundRedemption(redemptionId: string): Promise<void>;\n  grantCashback(orderId: string, amount: number): Promise<void>;\n  getOrderHistory(userId: string): Promise<Order[]>;\n  sendRedemptionEmail(\n    userId: string,\n    rewardId: string,\n  ): Promise<void>;\n  logEvent(name: string, payload: unknown): Promise<void>;\n  isFeatureEnabled(flag: string): Promise<boolean>;\n}\n\nconst redeemRewardCreator = ({\n  rewardService,\n}: {\n  rewardService: RewardService;\n}) => async (rewardId: string, userId: string) => {\n  if (!(await rewardService.isFeatureEnabled('redemption'))) {\n    return;\n  }\n  await rewardService.redeemReward(rewardId, userId);\n  await rewardService.sendRedemptionEmail(userId, rewardId);\n  await rewardService.logEvent('reward.redeemed', { rewardId });\n};",
    issues: [
      {
        text: "One interface bundles storage, redemption, email, telemetry and feature flags — five unrelated capabilities behind a single port.",
        correct: true,
        why: "A port is the shape of one need, and this port has five. Any implementation must speak DynamoDB, a redemption API, an email provider, a logger and a flag system at once. That is not an abstraction, it is a bag. The sentence to say is: 'this interface has five reasons to change'.",
      },
      {
        text: "Every consumer depends on methods it never calls: a test fake for redeemReward must stub all nine methods to satisfy the type.",
        correct: true,
        why: "This is the interface segregation principle in its most concrete form. The use case touches four methods, yet its in-memory fake carries five dead stubs. Fat fakes are the tax god ports collect on every single test, forever.",
      },
      {
        text: "No backend can be swapped independently: migrating reward storage to Postgres means reimplementing redemption, email, logging and flags in the new adapter too.",
        correct: true,
        why: "The whole payoff of ports is swapping one edge at a time. With one port covering everything, 'change the database' becomes 'rewrite the world'. Segregated ports make the migration answer the strong one: new creator, one line in the composition root.",
      },
      {
        text: "The port mixes two aggregates: grantCashback and getOrderHistory are Order concerns living in a Reward-named interface.",
        correct: true,
        why: "Cashback and order history belong behind CashbackService and OrderRepository. When Order operations hide inside RewardService, the codebase has two vocabularies for one concept, and the next reader cannot tell where an Order behavior lives without grepping.",
      },
      {
        text: "Nine methods is simply over the limit; a well-designed interface never exceeds about five methods.",
        correct: false,
        why: "There is no magic number. A RewardRepository with nine cohesive query methods can be a perfectly good port. The rule is cohesion — one client need per interface — not arithmetic. Counting methods is how this design gets 'fixed' into two god ports of four and five.",
      },
      {
        text: "The feature-flag check makes the use case impure; the if belongs inside the adapter.",
        correct: false,
        why: "Whether redemption is enabled is a business decision, and decisions live in the use case — an adapter that silently skips redemptions is Mission 2 all over again. The real problem is only where the capability arrives from: a dedicated FeatureFlags port, not the god port.",
      },
    ],
    fix: "interface RedemptionService {\n  redeem(rewardId: string, userId: string): Promise<void>;\n}\n\ninterface RedemptionNotifier {\n  rewardRedeemed(userId: string, rewardId: string): Promise<void>;\n}\n\ninterface FeatureFlags {\n  isEnabled(flag: string): Promise<boolean>;\n}\n\nconst redeemRewardCreator = ({\n  redemptionService,\n  redemptionNotifier,\n  featureFlags,\n}: {\n  redemptionService: RedemptionService;\n  redemptionNotifier: RedemptionNotifier;\n  featureFlags: FeatureFlags;\n}) => async (rewardId: string, userId: string) => {\n  if (!(await featureFlags.isEnabled('redemption'))) return;\n  await redemptionService.redeem(rewardId, userId);\n  await redemptionNotifier.rewardRedeemed(userId, rewardId);\n};",
  },
  {
    title: "Mission 5: the service locator",
    intro:
      "The author of this PR found a pattern that 'removes all the wiring boilerplate': a global Registry. The use case creator now takes zero arguments, and the PR description brags that adding a dependency never changes a signature again. This snippet is classic interview bait: it compiles, it works in production, and it is quietly rotting the codebase. Read it and decide what you would say in the review.",
    code: "class Registry {\n  private static services = new Map<string, unknown>();\n\n  static set(name: string, service: unknown): void {\n    Registry.services.set(name, service);\n  }\n\n  static get<T>(name: string): T {\n    const service = Registry.services.get(name);\n    if (!service) throw new Error(`Not registered: ${name}`);\n    return service as T;\n  }\n}\n\nconst redeemRewardCreator = () =>\n  async (userId: string, rewardId: string): Promise<void> => {\n    const rewardRepository =\n      Registry.get<RewardRepository>('rewardRepository');\n    const redemptionService =\n      Registry.get<RedemptionService>('redemptionSevice');\n    const reward = await rewardRepository.getById(rewardId);\n    if (!reward) {\n      throw new Error(`Unknown reward: ${rewardId}`);\n    }\n    await redemptionService.redeem(userId, reward);\n  };",
    issues: [
      {
        text: "The use case's dependencies are invisible: the creator takes no arguments, so nothing in any signature tells you it needs a RewardRepository and a RedemptionService.",
        correct: true,
        why: "This is the defining sin of a service locator. The creator's parameter object is the contract that tells reviewers, callers, and tests what the use case needs. Here that contract is empty and the real dependencies are discovered by reading the body. The sentence to say is: a service locator turns explicit dependencies into hidden ones.",
      },
      {
        text: "Lookups are stringly-typed with an unchecked cast. The key 'redemptionSevice' is misspelled, the compiler is happy, and the first redemption in production throws.",
        correct: true,
        why: "Registry.get<T>(name) is a cast wearing a costume. TypeScript cannot connect the string to the type, so a typo or a wrong registration compiles cleanly and detonates at runtime. Constructor-injected dependencies would make this exact bug a compile error.",
      },
      {
        text: "Testing the use case requires mutating global state: every test must call Registry.set before and clean up after, and parallel tests share one Registry.",
        correct: true,
        why: "The static Map is shared mutable state. Tests that forget to reset it leak fakes into each other, and running tests concurrently becomes a lottery. With a creator that receives its dependencies, a test just passes an inMemoryRewardRepositoryCreator result and never touches anything global.",
      },
      {
        text: "Wiring errors surface at call time, not at startup: a missing registration is only discovered when the first user hits this code path.",
        correct: true,
        why: "A composition root fails fast: if a dependency is missing, the process does not even boot. With call-time resolution, the misspelled key above ships, deploys green, and fails on the first real redemption. Late failure is the price of lazy lookup.",
      },
      {
        text: "The Map lookup on every call is a performance problem; the services should be cached in module-level variables instead.",
        correct: false,
        why: "A Map.get is nanoseconds next to a DynamoDB round trip; performance is not the issue here. And module-level singletons are the same disease with different syntax: still global, still hidden, still mutated by tests. The fix is explicit injection, not a faster locator.",
      },
      {
        text: "The real fix is to adopt a proper DI container framework with decorators, so registration and resolution are handled correctly.",
        correct: false,
        why: "A framework is not required and in this codebase would be a step sideways. A creator function receiving its dependencies as a parameter object is complete dependency injection: typed, explicit, zero magic. Reaching for a container to fix a locator misses that the problem was indirection itself.",
      },
    ],
    fix: "const redeemRewardCreator = ({\n  rewardRepository,\n  redemptionService,\n}: {\n  rewardRepository: RewardRepository;\n  redemptionService: RedemptionService;\n}) =>\n  async (userId: string, rewardId: string): Promise<void> => {\n    const reward = await rewardRepository.getById(rewardId);\n    if (!reward) {\n      throw new Error(`Unknown reward: ${rewardId}`);\n    }\n    await redemptionService.redeem(userId, reward);\n  };\n\n// Composition root: the only place that knows the wiring.\nconst dynamoClient = new DynamoDB.DocumentClient();\nconst redeemReward = redeemRewardCreator({\n  rewardRepository: dynamoDbRewardRepositoryCreator({\n    dynamoClient,\n    tableName: process.env.REWARDS_TABLE_NAME!,\n  }),\n  redemptionService: iFeelGoodsRedemptionServiceCreator({\n    apiToken: process.env.REDEMPTION_API_TOKEN!,\n  }),\n});",
  },
  {
    title: "Mission 6: the leaky HTTP handler",
    intro:
      "A teammate shipped the redemption endpoint in one file 'to keep it simple'. It works, the demo went fine, and the PR is under thirty lines. This is the most common shape you will meet in an interview codebase: every line is individually reasonable, and almost none of them are where they belong. Your job is not to find bugs. It is to decide which lines are doing work that is not HTTP's job.",
    code: "app.post('/rewards/:rewardId/redeem', async (req, res) => {\n  const { userId } = req.body;\n  if (typeof userId !== 'string' || userId.length === 0) {\n    return res.status(400).json({ error: 'userId is required' });\n  }\n  const result = await dynamoClient\n    .get({\n      TableName: process.env.REWARDS_TABLE_NAME!,\n      Key: { rewardId: req.params.rewardId },\n    })\n    .promise();\n  const reward = result.Item;\n  if (!reward) {\n    return res.status(404).json({ error: 'reward not found' });\n  }\n  const now = new Date().toISOString();\n  const available =\n    reward.startsAt <= now &&\n    now < reward.endsAt &&\n    reward.remainingStock > 0;\n  if (!available) {\n    return res.status(409).json({ error: 'reward unavailable' });\n  }\n  await redemptionService.redeem(userId, reward);\n  return res.status(200).json({ status: 'REDEEMED' });\n});",
    issues: [
      {
        text: "The availability rule (date window plus remaining stock) is coded inside the express handler, so the core business decision of the product lives in the transport layer.",
        correct: true,
        why: "This rule is why the feature exists, and right now you cannot test it without spinning up express and faking requests. Worse: the day a cron job or queue consumer also needs to redeem, someone will copy these three lines and the two versions will drift. Rules live in the use case, where every entry point shares them.",
      },
      {
        text: "The handler queries DynamoDB directly and reads process.env inline, so there is no RewardRepository port and a storage migration means editing HTTP code.",
        correct: true,
        why: "The handler knows the table name, the key shape, and the SDK's promise() quirk. Swap DynamoDB for Postgres and you are rewriting an HTTP endpoint. Behind a RewardRepository port, that migration is a new creator plus one line in the composition root, and process.env stays in the wiring where it belongs.",
      },
      {
        text: "Time is read with new Date() in the middle of the logic, so the expiry boundary cannot be tested deterministically.",
        correct: true,
        why: "The interesting cases here are the edges: one second before startsAt, the exact endsAt instant. With an inline new Date() you cannot pin the clock, so those cases go untested. Inject a Clock port and the test hands in a fixed now. A strong sentence in the review: even time is a dependency.",
      },
      {
        text: "result.Item, an untyped DynamoDB shape, is passed straight into redemptionService.redeem as if it were a domain Reward.",
        correct: true,
        why: "reward here is whatever the table happens to contain; rename an attribute and startsAt silently becomes undefined, which makes the comparison false and every reward unavailable. The adapter's job is to translate the vendor shape into a typed Reward at the edge. Nothing downstream should ever see an Item.",
      },
      {
        text: "The req.body validation at the top is also misplaced; checking that userId is a non-empty string should move into the use case with the other rules.",
        correct: false,
        why: "Validating the shape of an HTTP request is exactly the handler's job: it is the adapter for HTTP, and malformed input is an HTTP concern that ends in a 400. The use case should receive already-typed arguments. A thin handler is not an empty handler; parsing and validating the request is the part it keeps.",
      },
      {
        text: "Mapping outcomes to 404, 409 and 200 is business logic and should be returned by the use case itself.",
        correct: false,
        why: "Status codes are HTTP vocabulary, and the use case should not know HTTP exists. The clean split: the use case returns a domain outcome like NOT_FOUND or UNAVAILABLE, and the handler translates it to a status code. Push codes into the use case and your domain is coupled to a protocol it never needed to know about.",
      },
    ],
    fix: "const redeemRewardCreator = ({\n  rewardRepository,\n  redemptionService,\n  clock,\n}: RedeemRewardDeps) =>\n  async (userId: string, rewardId: string) => {\n    const reward = await rewardRepository.getById(rewardId);\n    if (!reward) return 'NOT_FOUND' as const;\n    if (!isRedeemable(reward, clock.now())) {\n      return 'UNAVAILABLE' as const;\n    }\n    await redemptionService.redeem(userId, reward);\n    return 'REDEEMED' as const;\n  };\n\nconst statusFor = { NOT_FOUND: 404, UNAVAILABLE: 409, REDEEMED: 200 };\n\n// redeemReward is built in the composition root.\napp.post('/rewards/:rewardId/redeem', async (req, res) => {\n  const { userId } = req.body;\n  if (typeof userId !== 'string' || userId.length === 0) {\n    return res.status(400).json({ error: 'userId is required' });\n  }\n  const outcome = await redeemReward(userId, req.params.rewardId);\n  return res.status(statusFor[outcome]).json({ outcome });\n});",
  },
  {
    title: "Mission 7: the integration test that tests nothing",
    intro:
      "The PR is titled 'add integration tests for the DynamoDB reward repository' and CI is green. In the interview you will be handed test files like this one and asked a simple question: would this suite catch a real regression? Read it slowly and decide what it actually proves.",
    code: "import { DynamoDB } from 'aws-sdk';\nimport { dynamoDbRewardRepositoryCreator } from './repository';\n\ndescribe('dynamoDbRewardRepository integration', () => {\n  const item = { rewardId: 'r1', title: 'Cashback 5%' };\n  const dynamoClient = {\n    get: jest.fn().mockReturnValue({\n      promise: () => Promise.resolve({ Item: item }),\n    }),\n  } as unknown as DynamoDB.DocumentClient;\n\n  const repository = dynamoDbRewardRepositoryCreator({\n    dynamoClient,\n    tableName: 'rewards-test',\n  });\n\n  it('returns the reward from DynamoDB', async () => {\n    const reward = await repository.getById('r1');\n    expect(reward).toEqual(item);\n  });\n\n  it('queries DynamoDB with the reward id', async () => {\n    await repository.getById('r1');\n    expect(dynamoClient.get).toHaveBeenCalledWith({\n      TableName: 'rewards-test',\n      Key: { rewardId: 'r1' },\n    });\n  });\n});",
    issues: [
      {
        text: "The word 'integration' is a lie: the DynamoDB client is a jest mock, so no query, no serialization, and no real client behavior is ever exercised.",
        correct: true,
        why: "An adapter integration test exists to cross the boundary. Mocking the client removes the only thing this test could verify. The sentence to say is: 'this test would stay green against an empty database, a renamed table, or no database at all.'",
      },
      {
        text: "The first assertion is circular: the expected value is the mock's own stubbed input, so the test certifies that the raw Dynamo item is handed straight through to the domain.",
        correct: true,
        why: "The expectation and the stub are the same variable. Nothing independently states what a domain Reward should look like, so the adapter's entire job, translation, is never specified. If the mapping were wrong, this test could not know.",
      },
      {
        text: "The missing-item path has zero coverage, so the null-handling branch of the adapter is completely untested.",
        correct: true,
        why: "When the item is absent, DynamoDB returns an empty result with no Item key. Whether the adapter turns that into null, undefined, or a crash is exactly what an adapter test must pin down, and it is the most common real bug at this boundary.",
      },
      {
        text: "The second test just restates the adapter's implementation: it asserts the mock was called with the same TableName and Key the source code contains.",
        correct: true,
        why: "It is green as long as the code agrees with itself. If the real table's key schema differs from what the adapter sends, both the code and the mock share the same wrong assumption and the test passes. It fails on refactors, never on defects.",
      },
      {
        text: "The table name should come from process.env in the test, the way production configuration does.",
        correct: false,
        why: "Not a problem. A test is its own composition root: it wires the creator with explicit values, exactly like the production wiring does. process.env belongs only in wiring, and hardcoding 'rewards-test' here is the Creator pattern working as intended.",
      },
      {
        text: "The fix is to mock the RewardRepository port itself instead of the low-level DynamoDB client.",
        correct: false,
        why: "The repository is the subject under test. Mock it and there is nothing left to test. Port-level fakes belong one layer up, in use case tests. Down here the fix goes the other way: less mocking, a real database.",
      },
    ],
    fix: "describe('dynamoDbRewardRepository (DynamoDB Local)', () => {\n  const dynamoClient = new DynamoDB.DocumentClient({\n    endpoint: 'http://localhost:8000',\n    region: 'local',\n  });\n  const repository = dynamoDbRewardRepositoryCreator({\n    dynamoClient,\n    tableName: 'rewards-test',\n  });\n  const stored = { rewardId: 'r1', title: 'Cashback 5%' };\n\n  it('maps the stored item to a domain Reward', async () => {\n    await dynamoClient\n      .put({ TableName: 'rewards-test', Item: stored })\n      .promise();\n    const reward = await repository.getById('r1');\n    expect(reward).toEqual({ rewardId: 'r1', title: 'Cashback 5%' });\n  });\n\n  it('returns null when the reward is absent', async () => {\n    expect(await repository.getById('nope')).toBeNull();\n  });\n});",
  },
  {
    title: "Mission 8: the decorator that decides",
    intro:
      "This PR puts a cache in front of RewardRepository to cut Dynamo reads. The author calls it 'a pure decorator, zero behavior change'. Decorators come up constantly in the interview because they look innocent. Ask the adapter question one line at a time: is this memoization, or is this a decision?",
    code: "const cachingRewardRepositoryCreator = ({\n  inner,\n  cache,\n  clock,\n}: {\n  inner: RewardRepository;\n  cache: Map<string, { value: Reward; expiresAt: number }>;\n  clock: Clock;\n}): RewardRepository => ({\n  async getById(id: string): Promise<Reward | null> {\n    const hit = cache.get(id);\n    if (hit && hit.expiresAt > clock.now().getTime()) {\n      return hit.value;\n    }\n    const reward = await inner.getById(id);\n    if (reward === null) return null;\n    if (reward.status !== 'AVAILABLE') return null;\n    const ttlMs =\n      reward.type === 'FLASH_DEAL' ? 5_000 : 60_000;\n    cache.set(id, {\n      value: reward,\n      expiresAt: clock.now().getTime() + ttlMs,\n    });\n    return reward;\n  },\n});",
    issues: [
      {
        text: "The decorator hides non-AVAILABLE rewards by returning null, turning a caching wrapper into a policy layer.",
        correct: true,
        why: "'Only available rewards are usable' is a business rule, and it now lives in infrastructure: invisible to domain tests and applied only when this wrapper happens to be wired. Worse, it destroys information. The use case can no longer tell 'does not exist' from 'exists but unavailable', so redeemReward cannot produce the right error.",
      },
      {
        text: "Cache lifetime is derived from reward.type, burying a product freshness decision inside the wrapper.",
        correct: true,
        why: "How stale a FLASH_DEAL is allowed to be is a product call, hardcoded here where no one will ever look for it. A pure decorator takes a single ttlMs from the composition root and treats every Reward identically. The moment a wrapper inspects domain fields to change behavior, it has started deciding.",
      },
      {
        text: "The smuggled rule is not even applied consistently: the cache-hit path returns hit.value with no status check at all.",
        correct: true,
        why: "A reward cached while AVAILABLE keeps being served after it flips to unavailable, so the same id answers differently depending on cache state. This is how smuggled rules rot: every code path has to remember to re-apply them, and one already forgot.",
      },
      {
        text: "A plain Map is not a real cache; this should be Redis behind its own CachePort.",
        correct: false,
        why: "The storage choice is irrelevant to the design flaw. An in-memory cache is a first-class adapter, and swapping Map for Redis later is exactly the kind of change this style makes cheap. The problem is the decisions in the wrapper, not the data structure under it.",
      },
      {
        text: "Injecting Clock is over-engineering here; Date.now() would be simpler and equivalent.",
        correct: false,
        why: "Clock as a port is the one thing this wrapper gets right. It is what lets a test advance time and prove an entry expires without sleeping in a test runner. Deleting it would make the only legitimate behavior in this file, expiry, untestable.",
      },
    ],
    fix: "const cachingRewardRepositoryCreator = ({\n  inner,\n  cache,\n  clock,\n  ttlMs,\n}: CachingRewardRepositoryDeps): RewardRepository => ({\n  async getById(id: string): Promise<Reward | null> {\n    const hit = cache.get(id);\n    if (hit && hit.expiresAt > clock.now().getTime()) {\n      return hit.value;\n    }\n    const reward = await inner.getById(id);\n    if (reward !== null) {\n      cache.set(id, {\n        value: reward,\n        expiresAt: clock.now().getTime() + ttlMs,\n      });\n    }\n    return reward;\n  },\n});\n// ttlMs is wired in the composition root. The rule\n// moves up into redeemReward, where tests can see it:\n// if (reward.status !== 'AVAILABLE')\n//   throw new RewardUnavailableError(id);",
  },
  {
    title: "Mission 9: the event handler doing everything",
    intro:
      "This handler shipped in a PR titled 'consume order-completed events'. It works on the demo. In production it granted one user cashback twice in a single afternoon, and nobody could write a test to reproduce it. Read it the way you would in the interview: start from the delivery guarantee. SQS is at-least-once, so the same message can and will arrive more than once. Then walk each line and ask what it is: transport, translation, or decision. Select every statement that names a real problem.",
    code: "export const handler = async (event: SQSEvent) => {\n  for (const record of event.Records) {\n    const body = JSON.parse(record.body);\n    if (!body.orderId || !body.userId) continue;\n    const rate = body.merchantTier === 'gold' ? 0.05 : 0.02;\n    const amount = body.orderTotal * rate;\n    if (amount <= 0) continue;\n    await dynamoClient\n      .put({\n        TableName: 'cashback-grants',\n        Item: {\n          grantId: randomUUID(),\n          userId: body.userId,\n          orderId: body.orderId,\n          amount,\n          grantedAt: Date.now(),\n        },\n      })\n      .promise();\n    await snsClient\n      .publish({\n        TopicArn: process.env.CASHBACK_TOPIC_ARN,\n        Message: JSON.stringify({ userId: body.userId, amount }),\n      })\n      .promise();\n  }\n};",
    issues: [
      {
        text: "There is no idempotency: SQS delivers at least once, and grantId: randomUUID() mints a fresh id per delivery, so a redelivered message writes a second grant and double-pays the cashback.",
        correct: true,
        why: "Real, and it is the bug that costs money. The id is derived from the delivery, not from the order, and nothing checks whether a grant for this orderId already exists. Redelivery is not an edge case in SQS; it is the contract. The sentence to say is: 'at-least-once delivery plus a non-idempotent consumer equals a duplicate side effect.'",
      },
      {
        text: "The tier-to-rate rule (gold merchants pay 5%, everyone else 2%) is a business decision living inside the transport handler, invisible to domain tests.",
        correct: true,
        why: "Real. To test the cashback rate you now have to fabricate an SQSEvent. The rule belongs in a pure domain function like computeCashback, where a three-line unit test covers it. Handlers translate; they do not decide.",
      },
      {
        text: "The handler drives raw DynamoDB and SNS clients directly. There is no CashbackGrantRepository or EventPublisher port, so nothing here can be tested or swapped without AWS.",
        correct: true,
        why: "Real. The use case is welded to two vendors at once. With ports, the in-memory repository and a fake publisher make the whole flow testable in milliseconds, and the SQS handler shrinks to a translator.",
      },
      {
        text: "process.env.CASHBACK_TOPIC_ARN is read inside the handler instead of entering once at the composition root and being passed into an adapter creator.",
        correct: true,
        why: "Real. Config read at point of use means every test and every runtime silently depends on the environment. The house style is explicit: process.env only in wiring, handed to creators as plain typed values.",
      },
      {
        text: "The for...of loop awaits records sequentially; the real defect is not using Promise.all to process the batch concurrently.",
        correct: false,
        why: "Not the issue. Sequential processing is a throughput knob, and often a deliberate one: it keeps partial-batch failure behavior simple and avoids write storms. Fixing concurrency while the consumer double-grants money is optimizing the wrong thing.",
      },
      {
        text: "Publishing a follow-up event from a consumer is an anti-pattern in itself; the handler should call the downstream service directly instead.",
        correct: false,
        why: "Not the issue. Emitting a cashback-granted event is a legitimate, decoupled design. The problems are where it happens (inline, through a raw SNS client, mid-handler) and that it can fire twice; not the fact of publishing. Behind an EventPublisher port, driven by the use case, it is exactly right.",
      },
    ],
    fix: "const sqsOrderCompletedHandlerCreator = ({\n  grantCashback,\n}: {\n  grantCashback: GrantCashback;\n}) => async (event: SQSEvent) => {\n  for (const record of event.Records) {\n    await grantCashback(parseOrderCompleted(record.body));\n  }\n};\nconst grantCashbackCreator = ({\n  grantRepository,\n  eventPublisher,\n}: {\n  grantRepository: CashbackGrantRepository;\n  eventPublisher: EventPublisher;\n}): GrantCashback => async (order) => {\n  const grantId = `grant-${order.orderId}`;\n  const created = await grantRepository.createIfAbsent({\n    grantId,\n    userId: order.userId,\n    amount: computeCashback(order),\n  });\n  if (!created) return;\n  await eventPublisher.publish(cashbackGranted(grantId));\n};",
  },
  {
    title: "Mission 10: the config sprawl",
    intro:
      "Nothing in this diff crashes, which is exactly how config sprawl survives review after review. process.env is read in four different files across four different layers, each with its own fallback default, and one of them logs a secret. In the interview, the sentence to say is: 'configuration is an input like any other; it enters once, at the composition root, as typed values.' Read each layer and select the real problems.",
    code: "// domain/cashback.ts\nexport const computeCashback = (order: Order): number =>\n  order.total * Number(process.env.CASHBACK_RATE ?? '0.02');\n\n// usecases/redeemReward.ts\nexport const redeemRewardCreator = ({\n  rewardRepository,\n  redemptionService,\n}: RedeemRewardDeps) => async (rewardId: string) => {\n  if (process.env.ENABLE_REDEMPTION !== 'true') {\n    throw new Error('redemption disabled');\n  }\n  const reward = await rewardRepository.getById(rewardId);\n  if (!reward) throw new Error('unknown reward');\n  return redemptionService.redeem(reward);\n};\n\n// adapters/iFeelGoodsRedemptionService.ts\nexport const iFeelGoodsRedemptionServiceCreator =\n  (): RedemptionService => {\n    const token = process.env.IFG_API_TOKEN ?? 'dev-token';\n    console.log('IFG client ready, token: ' + token);\n    return { redeem: (r) => postRedemption(token, r) };\n  };\n\n// index.ts — composition root\nconst rewardRepository = dynamoDbRewardRepositoryCreator({\n  dynamoClient,\n  tableName: process.env.REWARDS_TABLE ?? 'rewards-dev',\n});",
    issues: [
      {
        text: "computeCashback, a domain function, reads process.env. The cashback rate is now environmental state: the same order produces different money depending on the shell that launched the process.",
        correct: true,
        why: "Real, and the worst of the four. The domain must be pure: same input, same output. A test that forgets to set CASHBACK_RATE silently runs at 2%, and a typo in a deploy manifest changes payouts with no code diff. The rate is an input; pass it in.",
      },
      {
        text: "The iFeelGoods adapter configures itself from the environment and falls back to 'dev-token', so a missing production variable does not fail fast, it quietly calls the vendor with dev credentials.",
        correct: true,
        why: "Real. Creators receive their dependencies; they do not forage for them. And a fallback default on a secret converts a loud deploy-time failure into a silent runtime one. Required config should throw at startup, in the composition root.",
      },
      {
        text: "console.log prints IFG_API_TOKEN in plaintext. The secret now lives forever in CloudWatch, in log aggregators, and in anyone's terminal scrollback.",
        correct: true,
        why: "Real, and the one to name first in the interview: it is a security incident, not a style issue. Secrets never go to logs, and rotating this token now means auditing every log sink it reached.",
      },
      {
        text: "The use case gates redemption on process.env.ENABLE_REDEMPTION directly, so the feature flag is untestable without mutating global state and invisible in the creator's signature.",
        correct: true,
        why: "Real. Testing both branches means writing to process.env between tests: shared mutable global state. Inject redemptionEnabled: boolean through the creator's parameter object and both branches become one-line test setups.",
      },
      {
        text: "index.ts also reads process.env; even the composition root should get its values through a ConfigService port instead.",
        correct: false,
        why: "Not the issue. The composition root is precisely the one place allowed to touch process.env: it is where the messy outside world is converted into typed values and handed inward. Wrapping it in a port adds indirection with no seam worth testing.",
      },
      {
        text: "The Number(...) coercion is the core defect; environment variables must be parsed with a schema validation library.",
        correct: false,
        why: "Not the issue. A schema library is a nice-to-have, not the fix. The defect is where parsing happens, scattered across four layers, not the absence of a dependency. A hand-rolled loadConfig at the root that throws on missing values is entirely sufficient.",
      },
    ],
    fix: "// index.ts — the only file that reads process.env\nconst loadConfig = (env: NodeJS.ProcessEnv) => {\n  const ifgApiToken = env.IFG_API_TOKEN;\n  if (!ifgApiToken) throw new Error('IFG_API_TOKEN missing');\n  return {\n    cashbackRate: Number(env.CASHBACK_RATE ?? '0.02'),\n    redemptionEnabled: env.ENABLE_REDEMPTION === 'true',\n    rewardsTable: env.REWARDS_TABLE ?? 'rewards-dev',\n    ifgApiToken,\n  };\n};\n\nconst config = loadConfig(process.env);\nconst redemptionService = iFeelGoodsRedemptionServiceCreator({\n  apiToken: config.ifgApiToken,\n});\nconst redeemReward = redeemRewardCreator({\n  rewardRepository,\n  redemptionService,\n  redemptionEnabled: config.redemptionEnabled,\n});\n// computeCashback(order, config.cashbackRate) — rate is now\n// an argument, and the domain is pure again.",
  },
];
