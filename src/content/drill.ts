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
  {
    id: "d1",
    title: "Reading the Reference Codebase",
    items: DRILL,
  },
  {
    id: "d2",
    title: "Testing Code",
    items: [
      {
        code: "interface IdGenerator { next(): string }",
        answer: "Port",
        why: "Generated IDs are nondeterminism, like time; hiding them behind a port makes tests deterministic.",
      },
      {
        code: 'const fixedClock: Clock = { now: () => new Date("2026-01-01") }',
        answer: "Adapter",
        why: "A test double implementing a port is still an adapter; the fixed clock is a first-class citizen.",
      },
      {
        code: 'await expect(redeemReward("u@x.com", "r1")).rejects.toThrow("Reward unavailable")',
        answer: "Use case",
        why: "The assertion targets a business rule's outcome, so it exercises the use case, not any adapter.",
      },
      {
        code: 'const rewards = new Map([["r1", { ...testReward, available: false }]])',
        answer: "Composition root",
        why: "Seeding state to hand into a creator is wiring: the test's composition root decides what world the use case sees.",
      },
      {
        code: "redeem: async (email, rewardId) => { calls.push({ email, rewardId }) }",
        answer: "Adapter",
        why: "A recording fake is an adapter: it satisfies the port and captures calls instead of hitting a vendor.",
      },
      {
        code: "interface OrderRepository { getByUser(email: string): Promise<Order[]> }",
        answer: "Port",
        why: "An interface written in pure business language, owned by the domain: a port, wherever the file sits.",
      },
      {
        code: "createRedeemRewardUseCase({ rewardRepository: fakeRepo, clock: fixedClock })",
        answer: "Composition root",
        why: "The test's setup block is a composition root: same wiring as production, fakes instead of vendors.",
      },
      {
        code: 'if (order.total < reward.minSpend) throw new Error("Minimum spend not met")',
        answer: "Use case",
        why: "A guard clause is a business decision; it lives in the use case, and that is exactly what your fakes let you test.",
      },
      {
        code: "async save(reward: Reward) { store.set(reward.rewardId, reward) }",
        answer: "Adapter",
        why: "This is the in-memory fake's own persistence logic; a fake implementing the port is an adapter like any other.",
      },
      {
        code: "interface CashbackService { grantCashback(order: Order): Promise<void> }",
        answer: "Port",
        why: "It declares what the use case needs, never how; even referenced from a test file it stays a port.",
      },
      {
        code: 'expect(grantedCashback).toEqual([{ orderId: "o1", amount: 500 }])',
        answer: "Use case",
        why: "Asserting the domain outcome captured by a recording fake tests use case behavior, not plumbing.",
      },
      {
        code: "const deps = { clock: fixedClock, rewardRepository: inMemoryRepo }",
        answer: "Composition root",
        why: "Choosing which implementation fulfills each port is wiring, whether it happens in prod or in a test.",
      },
    ],
  },
  {
    id: "d3",
    title: "The Delivery Edge",
    items: [
      {
        code: 'if (!req.body.rewardId) return res.status(400).json({ error: "rewardId required" })',
        answer: "Adapter",
        why: "Validating the transport shape and speaking HTTP status codes is edge work; the domain never sees a req or a res.",
      },
      {
        code: "type RedeemReward = (userEmail: string, rewardId: string) => Promise<Redemption>",
        answer: "Port",
        why: "A driving port: the contract the HTTP handler calls, named in business language with zero HTTP in sight.",
      },
      {
        code: "if (order.total < reward.minimumSpend) throw new MinimumSpendNotMetError()",
        answer: "Use case",
        why: "A minimum-spend rule is business policy; guard clauses like this belong in the use case, never in a handler.",
      },
      {
        code: 'app.post("/redeem", redeemRewardHandlerCreator({ redeemReward }))',
        answer: "Composition root",
        why: "Route registration is wiring: it hands a use case to a handler creator, which is exactly what the composition root does.",
      },
      {
        code: 'const { userEmail, rewardId } = JSON.parse(event.body ?? "{}")',
        answer: "Adapter",
        why: "Parsing a raw event body into a DTO is translation from the wire; that mess stays at the edge.",
      },
      {
        code: "if (reward.expiresAt <= clock.now()) throw new RewardExpiredError(rewardId)",
        answer: "Use case",
        why: "Expiry is a business rule, and asking a Clock port for the time keeps this decision deterministic in tests.",
      },
      {
        code: "iFeelGoodsRedemptionServiceCreator({ apiToken: process.env.IFG_TOKEN, httpClient })",
        answer: "Composition root",
        why: "Only the wiring reads process.env and feeds it to a creator; the adapter itself receives the token, never fetches it.",
      },
      {
        code: "catch (e) { return { statusCode: e instanceof RewardUnavailableError ? 409 : 500 } }",
        answer: "Adapter",
        why: "Mapping domain errors to status codes is the handler translating outcomes back into HTTP: pure edge work.",
      },
      {
        code: "type RewardRedeemedHandler = (event: RewardRedeemed) => Promise<void>",
        answer: "Port",
        why: "A contract for reacting to a domain event: still a port, even though the implementation may be a queue consumer.",
      },
      {
        code: "await redemptionService.redeem(reward, order.userEmail)",
        answer: "Use case",
        why: "Orchestrating work through a port interface is the use case's job; contrast with a handler calling the use case itself.",
      },
      {
        code: "isTest ? inMemoryRewardRepositoryCreator(new Map()) : dynamoDbRewardRepositoryCreator(deps)",
        answer: "Composition root",
        why: "Choosing which adapter satisfies a port is the one decision the wiring owns; the sentence to say is 'swap it here, nothing else moves'.",
      },
    ],
  },
  {
    id: "d4",
    title: "Events, Config and Async",
    items: [
      {
        code: "interface EventPublisher { publish(event: RewardEvent): Promise<void> }",
        answer: "Port",
        why: "A business-language contract for emitting events; it names the need, not the queue.",
      },
      {
        code: "await sqsClient.send(new SendMessageCommand({ QueueUrl: queueUrl }))",
        answer: "Adapter",
        why: "A vendor SDK call belongs inside sqsEventPublisherCreator, translating domain events to messages.",
      },
      {
        code: "if (await processedEvents.wasProcessed(event.id)) return",
        answer: "Use case",
        why: "Idempotency is a business rule: grant each cashback exactly once, whatever the transport does.",
      },
      {
        code: "const queueUrl = process.env.REWARD_EVENTS_QUEUE_URL!",
        answer: "Composition root",
        why: "Only the wiring reads env; the queue URL is handed into the adapter creator as a plain string.",
      },
      {
        code: "type RewardRedeemed = { rewardId: string; userEmail: string }",
        answer: "Port",
        why: "Event types written in domain language are part of the port's contract, not the transport format.",
      },
      {
        code: "for (const evt of await outbox.fetchUnsent()) await sendToQueue(evt)",
        answer: "Adapter",
        why: "An outbox relay loop is delivery plumbing at the edge; it moves events, it never decides them.",
      },
      {
        code: 'registerConsumer("OrderCompleted", createGrantCashbackUseCase(deps))',
        answer: "Composition root",
        why: "Binding an event type to its handler is wiring: the use case does not know who subscribes to it.",
      },
      {
        code: 'await eventPublisher.publish({ type: "CashbackGranted", orderId })',
        answer: "Use case",
        why: "Deciding that a business fact happened, and publishing it through the port, is domain logic.",
      },
      {
        code: "const withRetry = (inner: EventPublisher): EventPublisher => ({ ... })",
        answer: "Adapter",
        why: "A resilience decorator wraps the port so retries stay invisible to the use case; the sentence to say is: the domain does not know the network exists.",
      },
      {
        code: "interface ProcessedEventStore { wasProcessed(id: string): Promise<boolean> }",
        answer: "Port",
        why: "The domain names its need to remember handled events; DynamoDB or a Set can satisfy it later.",
      },
      {
        code: 'if (order.total < reward.minSpend) throw new Error("Not eligible")',
        answer: "Use case",
        why: "An eligibility guard is a business decision; bury it in a consumer and domain tests go blind.",
      },
      {
        code: "sqsEventPublisherCreator({ sqsClient, queueUrl })",
        answer: "Composition root",
        why: "Calling a creator with concrete dependencies is wiring; the creator's body is the adapter.",
      },
    ],
  },
  {
    id: "d5",
    title: "Decorators and Errors",
    items: [
      {
        code: "interface RewardRepository { getById(id: string): Promise<Result<Reward, StorageFailure>> }",
        answer: "Port",
        why: "A Result return type in the interface is the port declaring its failure contract in domain terms; that decision belongs to the domain side.",
      },
      {
        code: "redeem(reward: Reward): Promise<Either<RedemptionFailure, Receipt>>",
        answer: "Port",
        why: "A method signature returning Either is contract, not implementation; whether failures are thrown or returned is the one design decision the port owns.",
      },
      {
        code: 'type RedemptionFailure = "OUT_OF_STOCK" | "ALREADY_REDEEMED" | "VENDOR_DOWN"',
        answer: "Port",
        why: "The failure vocabulary declared next to the interface is part of the port's contract; adapters translate vendor errors into exactly these words.",
      },
      {
        code: 'if (e.name === "ConditionalCheckFailedException") throw new AlreadyRedeemedError()',
        answer: "Adapter",
        why: "Mapping a DynamoDB exception to a domain error is pure translation at the edge; the sentence to say is 'the vendor error never crosses the port'.",
      },
      {
        code: "const cachedRewardRepositoryCreator = ({ inner, ttlMs }) => ({ ... })",
        answer: "Adapter",
        why: "A caching decorator wraps a port and satisfies the same port; it is infrastructure implementation, no matter how generic it looks.",
      },
      {
        code: 'if (breaker.state === "open") throw new RedemptionUnavailableError()',
        answer: "Adapter",
        why: "Circuit-breaker state is resilience machinery inside a wrapper; it protects the vendor call and only speaks domain errors outward.",
      },
      {
        code: "if (reward.stock === 0) throw new RewardUnavailableError(reward.id)",
        answer: "Use case",
        why: "A business guard raising a domain error is a decision: adapters only map errors they catch, use cases decide when a situation is an error at all.",
      },
      {
        code: "if (clock.now() > reward.expiresAt) throw new RewardExpiredError(reward.id)",
        answer: "Use case",
        why: "Expiry is a business rule; it reads time through the Clock port precisely so this guard stays testable domain logic.",
      },
      {
        code: "if (e instanceof RedemptionFailedError) await cashbackService.revokeCashback(orderId)",
        answer: "Use case",
        why: "Compensating a failed redemption is orchestration in domain terms, catching a domain error and calling a port, exactly the use case's job.",
      },
      {
        code: "const rewardRepository = cached(retrying(dynamoDbRewardRepositoryCreator(deps)))",
        answer: "Composition root",
        why: "Each wrapper is an adapter, but choosing the stack and its order is wiring; a strong sentence in review is 'decorators compose in the root'.",
      },
      {
        code: 'const maxAttempts = Number(process.env.RETRY_MAX_ATTEMPTS ?? "3")',
        answer: "Composition root",
        why: "Retry policy read from process.env is configuration; it enters through the wiring and is handed to the retrying creator as a plain value.",
      },
      {
        code: "loggingRedemptionServiceCreator({ inner: iFeelGoodsRedemptionServiceCreator(deps) })",
        answer: "Composition root",
        why: "Both creators are adapters, but this call site that picks them and nests one inside the other is the composition root doing its only job.",
      },
    ],
  },
];
