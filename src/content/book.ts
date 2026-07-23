import type { BookChapter, BookPart } from "./types";

export const BOOK: BookChapter[] = [
  {
    title: "Why Boundaries Exist",
    blocks: [
      {
        t: "p",
        c: "Every codebase answers two very different questions. WHAT happens: a reward gets redeemed, cashback gets granted, an order gets confirmed. And HOW it happens: DynamoDB queries, HTTP calls to a partner API, environment variables, auth tokens. The first is business logic. The second is infrastructure. The entire pattern you are learning exists because of one observation: when these two are mixed, every property you care about degrades at once.",
      },
      {
        t: "p",
        c: "Consider the classic entangled function. It fetches from DynamoDB, checks a business rule, then fires a raw fetch to a partner API, all in fifteen lines. It looks efficient. It is a trap, for three compounding reasons.",
      },
      {
        t: "li",
        c: [
          "Change amplification: swapping DynamoDB for Postgres, or one reward provider for another, forces you to rewrite the workflow itself, and every workflow that made the same choice.",
          "Testing pain: verifying the rule 'unavailable rewards cannot be redeemed' requires mocking AWS and intercepting network calls. The simplest rule in the system has the most expensive test.",
          "Cognitive load: a reader who wants to understand the business must wade through TableName, headers, tokens and response shapes. The WHAT is buried in the HOW.",
        ],
      },
      {
        t: "p",
        c: "A boundary is a line in the code where knowledge stops flowing. On one side, the business logic knows nothing about vendors, protocols or configuration. On the other side, infrastructure code knows everything about one vendor and nothing about business rules. Ports, adapters and dependency injection are simply the three tools that make this line real instead of aspirational.",
      },
      {
        t: "p",
        c: "One mental model to carry through the whole book: the business logic is the center of a hexagon, and every interaction with the outside world crosses one of its edges through a well-defined contract. That is why the pattern is also called hexagonal architecture. The shape does not matter. The edges do.",
      },
      {
        t: "take",
        c: "Business logic describes WHAT happens, infrastructure describes HOW. A boundary is where knowledge stops flowing between the two. Everything else in this book is machinery for enforcing that line.",
      },
    ],
  },
  {
    title: "Coupling and the Direction of Dependencies",
    blocks: [
      {
        t: "p",
        c: "Coupling is the degree to which changing one piece of code forces changes in another. Some coupling is unavoidable: a use case must somehow reach a database. The design question is never 'coupled or not', it is: in which DIRECTION does the dependency point, and toward what kind of code?",
      },
      {
        t: "p",
        c: "Code differs in volatility. Business rules change when the business changes: rarely, deliberately. Infrastructure changes constantly: SDK versions, API contracts, vendor migrations, pricing. The golden rule of dependable design is that stable things must not depend on volatile things. When your reward rules import the DynamoDB SDK, the most stable code in your system inherits the volatility of the least stable.",
      },
      {
        t: "p",
        c: "The naive dependency direction is: use case, then database driver. The arrow points outward, from stable to volatile. Dependency inversion flips it. The use case depends on an abstraction it owns (a port), and the infrastructure implements that abstraction. Now both sides point at the interface, and the arrow from concrete infrastructure points INWARD, toward the business.",
      },
      {
        t: "code",
        c: "WITHOUT inversion:\n  use case ---> DynamoDB SDK        (stable depends on volatile)\n\nWITH inversion:\n  use case ---> RewardRepository <--- DynamoDB adapter\n               (port, owned by the business)",
      },
      {
        t: "p",
        c: "This is the Dependency Inversion Principle, the D in SOLID: high-level modules should not depend on low-level modules, both should depend on abstractions, and abstractions should not depend on details. Notice something subtle and interview-relevant: dependency inversion is a design principle about direction. Dependency injection, which arrives in chapter 6, is a technique for supplying implementations. They are related but not synonyms, and confusing them is a common tell.",
      },
      {
        t: "take",
        c: "Point every arrow inward. Stable business code must never depend on volatile infrastructure. Inversion is the principle (who depends on whom), injection is the technique (how implementations arrive).",
      },
    ],
  },
  {
    title: "Ports: Interfaces Owned by the Domain",
    blocks: [
      {
        t: "p",
        c: "A port is an interface defined by the inner logic that expresses a need. Every word of that sentence carries weight. Defined BY the inner logic: the domain writes it, owns it, and shapes it around its own vocabulary. Expresses a NEED: 'I need to fetch a reward', 'I need to trigger a redemption', 'I need to know the current time'. A port never describes a mechanism.",
      },
      {
        t: "code",
        c: "interface RewardRepository {\n  getById(id: string): Promise<Reward | null>;\n}\n\ninterface RedemptionService {\n  redeem(userEmail: string, reward: Reward): Promise<void>;\n}\n\ninterface Clock {\n  now(): Date;\n}",
      },
      {
        t: "p",
        c: "Three rules make a port a real port. First, business language only: getById and redeem, never query(params) or executeHttpPost. Second, domain types only: it speaks in Reward and Order, never in DynamoDB.DocumentClient.QueryOutput or Response. Third, minimal surface: a port exposes what its consumers need, nothing more. An interface with fifteen methods 'just in case' is a god port, and every adapter must implement all of it forever.",
      },
      {
        t: "p",
        c: "Even time and randomness can be ports. A Clock port looks like over-engineering until you need to test 'offers expire at midnight' and discover your test only passes before noon. Wrapping Date.now behind a port makes time injectable, and therefore controllable. The same goes for ID generation and randomness. The rule of thumb: anything non-deterministic or external is a candidate for a port.",
      },
      {
        t: "p",
        c: "A vocabulary note worth dropping in the interview: the literature distinguishes driving ports (how the world calls you: an HTTP handler invoking a use case) and driven ports (how you call the world: repositories, external services). The reference guide focuses on driven ports, and so does this book, because that is where most of the coupling damage happens.",
      },
      {
        t: "take",
        c: "A port is written by the business, in the language of the business, exposing only what the business needs. If an SDK type or a protocol detail appears in a port, the abstraction is already leaking.",
      },
    ],
  },
  {
    title: "Adapters: Translators at the Edge",
    blocks: [
      {
        t: "p",
        c: "An adapter is a concrete implementation of a port. It lives at the edge of the system and absorbs everything messy about the real world: SDK clients, HTTP, authentication, retries, timeouts, pagination, serialization, and the translation between vendor shapes and domain types. Ports define what is needed. Adapters define how it is done.",
      },
      {
        t: "code",
        c: "const dynamoDbRewardRepositoryCreator = ({\n  dynamoClient,\n  tableName,\n}: {\n  dynamoClient: DynamoDB.DocumentClient;\n  tableName: string;\n}): RewardRepository => ({\n  async getById(id: string): Promise<Reward | null> {\n    const result = await dynamoClient\n      .get({ TableName: tableName, Key: { rewardId: id } })\n      .promise();\n    return result.Item ?? null;\n  },\n});",
      },
      {
        t: "p",
        c: "Study the shape of this creator function, because it is the house style of the codebase you will read. It receives its own dependencies (the client, the table name) as a parameter object, and returns an object satisfying the port. The adapter does not read process.env, does not construct its own client, and does not know who will call it. It is a pure translator with its inputs handed to it.",
      },
      {
        t: "p",
        c: "The one thing an adapter must never do is decide. If an adapter filters out unavailable rewards 'to be helpful', a business rule now lives in vendor-specific code: invisible to domain tests, and silently lost the day someone writes the Postgres adapter. When you review an adapter, read every line and ask: is this translation, or is this a decision? Decisions go up into the use case.",
      },
      {
        t: "p",
        c: "One port, many adapters. The production adapter talks to DynamoDB. The in-memory adapter wraps a Map and exists for tests and local development: no network, no Docker, no AWS credentials, and fully predictable state that you seed yourself. In-memory adapters are not second-class test hacks. They are legitimate implementations of the contract, and chapter 8 shows they are the foundation of the entire testing strategy.",
      },
      {
        t: "code",
        c: "const inMemoryRewardRepositoryCreator = (\n  rewards: Map<string, Reward>\n): RewardRepository => ({\n  async getById(id: string): Promise<Reward | null> {\n    return rewards.get(id) ?? null;\n  },\n});",
      },
      {
        t: "take",
        c: "Adapters translate, they never decide. They receive their own dependencies, absorb all vendor mess at the edge, and return domain types. Any port can have many adapters, and the in-memory one is a first-class citizen.",
      },
    ],
  },
  {
    title: "The Fake Boundary Trap",
    blocks: [
      {
        t: "p",
        c: "Here is the most instructive failure in the whole pattern, and a near-certain interview topic. A developer reads about ports and adapters, extracts the interfaces, writes the creators, and then does this inside the use case:",
      },
      {
        t: "code",
        c: 'async function redeemReward(userEmail: string, rewardId: string) {\n  // ports exist... but the logic builds its own adapters\n  const rewardRepository = dynamoDbRewardRepositoryCreator({\n    dynamoClient,\n    tableName: process.env.REWARDS_TABLE!,\n  });\n  const redemptionService = iFeelGoodsRedemptionServiceCreator({\n    apiToken: process.env.REDEMPTION_API_TOKEN!,\n  });\n\n  const reward = await rewardRepository.getById(rewardId);\n  if (!reward) throw new Error("Reward not found");\n  if (!reward.available) throw new Error("Reward unavailable");\n  await redemptionService.redeem(userEmail, reward);\n}',
      },
      {
        t: "p",
        c: "This looks better than the entangled original. The rules read cleanly, the DynamoDB details are elsewhere. But the boundary is fake. The use case still names concrete creators, still reads environment variables, still hard-codes the decision that storage means DynamoDB and redemption means iFeelGoods. Knowledge of the infrastructure has not left the business logic. It has only been indented differently.",
      },
      {
        t: "p",
        c: "The proof is the test. Try to unit test this function: you cannot hand it an in-memory repository, because it constructs its own. You are back to mocking AWS and intercepting fetch. A boundary you cannot exploit in a test is not a boundary, it is decoration. This gives you a sharp review heuristic: whoever CREATES the dependency controls it. If the logic creates its adapters, the logic is still coupled to them, interfaces or not.",
      },
      {
        t: "p",
        c: "A cousin of this trap is the service locator: instead of creating adapters, the use case reaches into a global registry to fetch them. Same disease, different syntax. The dependencies become hidden, the function signature lies about what the code needs, and tests must mutate global state. Explicitness is the cure for both, and it arrives in the next chapter.",
      },
      {
        t: "take",
        c: "Ports without injection are decoration. If the use case creates (or looks up) its own adapters, infrastructure knowledge is still inside the boundary. The litmus test is always: can I hand it an in-memory implementation from the outside?",
      },
    ],
  },
  {
    title: "Dependency Injection Without a Framework",
    blocks: [
      {
        t: "p",
        c: "Dependency injection rests on one principle: do not create dependencies where you use them, receive them from the outside. The logic declares WHAT it needs, and something external decides HOW those needs are met. In TypeScript, the entire technique is a factory function and a parameter object. No container, no decorators, no framework.",
      },
      {
        t: "code",
        c: 'interface Dependencies {\n  rewardRepository: RewardRepository;\n  redemptionService: RedemptionService;\n}\n\nfunction createRedeemRewardUseCase({\n  rewardRepository,\n  redemptionService,\n}: Dependencies) {\n  return async function redeemReward(\n    userEmail: string,\n    rewardId: string\n  ) {\n    const reward = await rewardRepository.getById(rewardId);\n    if (!reward) throw new Error("Reward not found");\n    if (!reward.available) throw new Error("Reward unavailable");\n    await redemptionService.redeem(userEmail, reward);\n  };\n}',
      },
      {
        t: "p",
        c: "Read what changed. The use case has no idea which infrastructure serves it. Its dependencies are explicit: the Dependencies interface is an honest, machine-checked list of everything this workflow needs from the world. The returned function closes over those dependencies, so callers just call redeemReward(email, id) without ever seeing the wiring. And the function became trivially testable, because the caller controls every collaborator.",
      },
      {
        t: "p",
        c: "This closure-based style is functionally identical to constructor injection in class-based codebases: the constructor receives collaborators, methods use them. If your interviewer comes from a class background, saying 'the factory function is our constructor, the closure is our private field' builds an instant bridge.",
      },
      {
        t: "p",
        c: "Do you ever need a DI framework? In a large object graph, containers automate wiring, at the cost of magic: resolution happens at runtime, errors move from compile time to startup time, and readers can no longer follow construction by reading code. The honest position, and a good interview answer, is that explicit manual wiring scales further than people expect, and you reach for a container when wiring pain is real and measured, not by default.",
      },
      {
        t: "take",
        c: "Receive, do not create. A factory function taking a typed Dependencies object IS dependency injection: explicit, compile-checked, framework-free. The closure it returns is the use case with its needs already satisfied.",
      },
    ],
  },
  {
    title: "The Composition Root",
    blocks: [
      {
        t: "p",
        c: "If nothing creates its own dependencies, something must create all of them. That place is the composition root: the single location in the system where adapters are chosen, configured and plugged into use cases. It is deliberately boring code, and its boringness is the point: all the knowledge about which vendor, which table, which token is concentrated in one file you can read top to bottom.",
      },
      {
        t: "code",
        c: '// Production wiring\nexport const redeemReward = createRedeemRewardUseCase({\n  rewardRepository: dynamoDbRewardRepositoryCreator({\n    dynamoClient,\n    tableName: process.env.REWARDS_TABLE!,\n  }),\n  redemptionService: iFeelGoodsRedemptionServiceCreator({\n    apiToken: process.env.REDEMPTION_API_TOKEN!,\n  }),\n});\n\n// Test / local wiring\nexport const redeemReward = createRedeemRewardUseCase({\n  rewardRepository: inMemoryRewardRepositoryCreator(\n    new Map([["test-reward-1", { id: "test-reward-1",\n      available: true, internalRewardId: "int1" }]])\n  ),\n  redemptionService: inMemoryRedemptionServiceCreator(),\n});',
      },
      {
        t: "p",
        c: "Notice where process.env finally appears: here, and only here. Configuration is an infrastructure concern, so it enters through the wiring and is passed into adapter creators as plain values. The moment an environment variable shows up inside a use case or an adapter's business-facing code, the boundary has a hole.",
      },
      {
        t: "p",
        c: "The composition root is also the best map of an unfamiliar codebase. Reading it tells you every use case that exists, every port each one consumes, and every adapter currently chosen, in one screen. When you open an interview codebase, finding the composition root first is the single highest-leverage move available to you, and announcing that strategy out loud demonstrates method before knowledge.",
      },
      {
        t: "p",
        c: "Two properties define a healthy root: it is the ONLY place that imports both domain code and concrete adapters, and swapping any vendor is a one-line change inside it while the use case code never changes. Scattered wiring, where handlers assemble their own dependencies ad hoc, recreates the fake boundary at a larger scale.",
      },
      {
        t: "take",
        c: "One place chooses everything. Config enters here, adapters are picked here, use cases are assembled here. The composition root is both the enforcement point of the architecture and the map you read first in any unfamiliar codebase.",
      },
    ],
  },
  {
    title: "Testing: The Payoff",
    blocks: [
      {
        t: "p",
        c: "Everything so far was investment. Testing is where it pays out. Because the use case receives its collaborators, a unit test is nothing more than a second composition root: wire in-memory adapters, seed the exact state you need, run the workflow, assert on behavior. No mocking library, no network, no Docker, and each test runs in microseconds, deterministically.",
      },
      {
        t: "p",
        c: "For outbound effects, hand-roll a recording adapter: an in-memory spy that satisfies the port and remembers its calls. Twenty lines, no framework, and it doubles as proof in the interview that you understand test doubles rather than just importing them.",
      },
      {
        t: "code",
        c: 'const recordingRedemptionServiceCreator = () => {\n  const calls: { userEmail: string; reward: Reward }[] = [];\n  return {\n    service: {\n      async redeem(userEmail: string, reward: Reward) {\n        calls.push({ userEmail, reward });\n      },\n    },\n    calls,\n  };\n};\n\nit("redeems an available reward", async () => {\n  const { service, calls } = recordingRedemptionServiceCreator();\n  const redeemReward = createRedeemRewardUseCase({\n    rewardRepository: inMemoryRewardRepositoryCreator(\n      new Map([["r1", reward]])\n    ),\n    redemptionService: service,\n  });\n\n  await redeemReward("user@example.com", "r1");\n\n  expect(calls).toEqual([{ userEmail: "user@example.com", reward }]);\n});',
      },
      {
        t: "p",
        c: "Assert on behavior, not implementation. The test above checks WHAT happened: this user, this reward, one redemption. It does not check that getById was called once with certain arguments, because that pins the test to the current internals and makes refactoring break green tests. Error paths get the same treatment: an empty Map produces 'Reward not found', a seeded unavailable reward produces 'Reward unavailable', and a throwing adapter simulates infrastructure failure.",
      },
      {
        t: "p",
        c: "Vocabulary that earns points: a stub returns canned data (the in-memory repository), a spy records calls (the recording service), and both are test doubles. And be ready for the follow-up question 'so do you never test the real adapters?'. The answer: adapters get a small number of integration tests against real or containerized infrastructure, verifying translation only. The pyramid stays healthy because rules and workflows, the code that changes most, are covered by the fast tests.",
      },
      {
        t: "take",
        c: "A unit test is a second composition root. Stubs seed state, spies record effects, assertions target behavior. If a test needs a mocking library to patch modules, that is not a testing problem, it is an architecture problem surfacing.",
      },
    ],
  },
  {
    title: "Unit Testing the Domain in Depth",
    blocks: [
      {
        t: "p",
        c: "Chapter 8 gave you the big idea: a unit test is a second composition root, wiring the use case to hand-rolled doubles instead of real adapters. This chapter gives you the vocabulary and the discipline. First, the taxonomy, because interviewers use these words precisely. A dummy is passed but never used, there to satisfy a signature. A stub returns canned answers and drives the 'given' of your test. A spy records what was done to it so you can assert on the 'then'. A fake is a working lightweight implementation, like inMemoryRewardRepositoryCreator backed by a Map. A mock is pre-programmed with expectations about how it will be called and verifies itself. This codebase hand-rolls stubs and spies and skips the mocking framework entirely, and the reason is worth saying out loud: when your ports are small interfaces, a stub is an object literal and a spy is an array you push into. A framework would buy you nothing but a new DSL, and its convenience nudges you toward the mock end of the spectrum, asserting on interactions instead of outcomes.",
      },
      {
        t: "p",
        c: "Every test follows the same three-beat structure: given a world in some state, when the use case runs, then something observable happened. Keep the beats visually separated. The 'given' is your stubs, the 'when' is one call, the 'then' is your assertions on returned values and on what the spies recorded.",
      },
      {
        t: "code",
        c: "it('grants cashback equal to the reward cost', async () => {\n  // given\n  const granted: Array<{ userId: string; amount: number }> = [];\n  const redeemReward = redeemRewardCreator({\n    rewardRepository: {\n      getById: async () => ({\n        id: 'r1',\n        status: 'available',\n        cashbackAmount: 500,\n        expiresAt: new Date('2026-08-01T00:00:00Z'),\n      }),\n    },\n    cashbackService: {\n      grantCashback: async (userId, amount) => {\n        granted.push({ userId, amount });\n      },\n    },\n    clock: { now: () => new Date('2026-07-01T00:00:00Z') },\n  });\n  // when\n  await redeemReward({ userId: 'u1', rewardId: 'r1' });\n  // then\n  expect(granted).toEqual([{ userId: 'u1', amount: 500 }]);\n});",
      },
      {
        t: "p",
        c: "Notice what the assertion touches: the cashback that was granted, an outcome visible at a port. It does not assert that getById was called exactly once, or in what order the ports were consulted. Call-count assertions rot, because they pin down implementation, not behavior. Add a cache in front of the repository, or a defensive re-read before granting, and the system behaves identically while those tests go red. A test that fails when behavior is unchanged is worse than no test: it trains the team to update assertions mechanically until green. The sentence to say in the interview is: 'I assert on what the system did, not on how it did it.'",
      },
      {
        t: "p",
        c: "The happy path is one test. The value of the suite is in the systematic sweep of everything else. For each port the use case touches, walk the failure modes deliberately rather than waiting for production to find them:",
      },
      {
        t: "li",
        c: [
          "Not found: getById resolves null, expect a domain error and use the spy to prove no cashback was granted",
          "Unavailable: status is 'redeemed' or 'disabled', each rejected with its own reason, not a generic failure",
          "Mid-flow failure: grantCashback throws, and the test documents what happens to the reward you already touched",
          "Boundary values: a cashback amount of 0, the exact expiry instant, one millisecond before it",
        ],
      },
      {
        t: "p",
        c: "That last line needs infrastructure. If the expiry rule calls new Date() inside the use case, the boundary is untestable: the test that passes at noon fails at midnight. Time is a dependency like any other, so it enters through a port. Chapter 3 mentioned Clock in passing; here is where it earns its keep. The composition root injects a real clock; the test injects a frozen one and walks it right up to the edge of the rule.",
      },
      {
        t: "code",
        c: "const clockAt = (iso: string): Clock => ({\n  now: () => new Date(iso),\n});\n\nit('rejects a reward at the exact expiry instant', async () => {\n  const redeemReward = redeemRewardCreator({\n    rewardRepository: {\n      getById: async () => ({\n        id: 'r1',\n        status: 'available',\n        cashbackAmount: 500,\n        expiresAt: new Date('2026-07-01T00:00:00Z'),\n      }),\n    },\n    cashbackService: { grantCashback: async () => {} },\n    clock: clockAt('2026-07-01T00:00:00Z'),\n  });\n  await expect(\n    redeemReward({ userId: 'u1', rewardId: 'r1' })\n  ).rejects.toThrow(RewardExpiredError);\n});",
      },
      {
        t: "p",
        c: "Name every test so the suite reads as a specification. 'grants cashback equal to the reward cost', 'rejects an already-redeemed reward without granting cashback', 'rejects a reward at the exact expiry instant'. Someone running the suite with names printed should be reading the business rules of redemption, no source required. In a live coding interview this is a quiet flex: before writing code, sketch the test names as a list, and you have shown you can enumerate the spec.",
      },
      {
        t: "p",
        c: "Finally, know what stays out. Adapters do not get unit tests with doubles: stubbing the DynamoDB client to test dynamoDbRewardRepositoryCreator only proves you can transcribe the SDK, and it verifies nothing about the real service. Adapters get integration tests against the real thing, or nothing. The composition root gets no unit tests either; it is wiring, and the whole app starting is its test. Unit tests exist to pin down decisions, and chapters 4 and 7 established that adapters and wiring make none.",
      },
      {
        t: "take",
        c: "Hand-rolled stubs drive the given, spies observe the then, and assertions target outcomes at the ports, never call counts. Sweep error paths and boundary values systematically, make time injectable through a Clock port, and name tests so the suite reads as the specification. Adapters and wiring make no decisions, so they get no unit tests.",
      },
    ],
  },
  {
    title: "Integration Testing Adapters",
    blocks: [
      {
        t: "p",
        c: "Chapter 8 made the case that unit tests exercise your use cases through in-memory adapters. That leaves a hole, and you should name it before the interviewer does: the real adapters never ran. dynamoDbRewardRepositoryCreator is code, and code has bugs. A misspelled attribute name, a Date serialized one way and parsed another, a pagination loop that stops after the first page. None of that is visible to a domain test, because the domain test replaced the adapter on purpose. The integration test closes the hole: point the real adapter at a real instance of the technology and verify the translation.",
      },
      {
        t: "p",
        c: "Verify the translation, nothing more. An adapter integration test asserts that domain values survive the round trip through the vendor: save a Reward, read it back, expect deep equality. It does not assert that expired rewards cannot be redeemed. Chapter 4 placed decisions in the use case and chapter 8 tested them there. If you find yourself asserting a business rule against a database, either the rule leaked into the adapter or your test is aimed at the wrong layer, and both are findings worth saying out loud in a code review round.",
      },
      {
        t: "code",
        c: "describe('dynamoDbRewardRepositoryCreator', () => {\n  const dynamoClient = new DynamoDB.DocumentClient({\n    endpoint: 'http://localhost:8000',\n    region: 'local',\n  });\n  const repository = dynamoDbRewardRepositoryCreator({\n    dynamoClient,\n    tableName: 'rewards-test',\n  });\n  const someReward: Reward = {\n    rewardId: 'r-1',\n    merchantId: 'm-1',\n    name: 'Free espresso',\n  };\n\n  it('round-trips a reward', async () => {\n    await repository.save(someReward);\n    const found = await repository.getById(\n      someReward.rewardId,\n    );\n    expect(found).toEqual(someReward);\n  });\n\n  it('returns null for an absent reward', async () => {\n    const found = await repository.getById('nope');\n    expect(found).toBeNull();\n  });\n});",
      },
      {
        t: "p",
        c: "Notice that the test builds its own tiny composition root, exactly as chapter 8 described, except the dependency handed in is real. DynamoDB Local runs in a Docker container started before the suite, and the endpoint override is the only thing distinguishing this client from production. The adapter under test is byte-for-byte the code you ship, which is the entire point. The same pattern works for any port with a containerizable backing service: Postgres in Testcontainers, LocalStack for the rest of AWS.",
      },
      {
        t: "p",
        c: "Four translation concerns deserve a test each, and this checklist is worth memorizing:",
      },
      {
        t: "li",
        c: [
          "Shape mapping: Dates, numbers, nested objects. Does a Date leave as an ISO string and come back as a Date?",
          "Null and absent: a missing item must become null, not undefined and not a throw. Test the empty read explicitly.",
          "Pagination: insert enough rewards to force a second page and assert you get them all. The one-page happy path hides the most expensive class of bug.",
          "Error mapping: does ConditionalCheckFailedException surface as the domain error the port promises, or leak out as a vendor exception?",
        ],
      },
      {
        t: "code",
        c: "it('lists rewards across pages', async () => {\n  // the adapter queries with Limit: 100\n  for (let i = 0; i < 150; i += 1) {\n    await repository.save({\n      ...someReward,\n      rewardId: `r-${i}`,\n    });\n  }\n  const listed = await repository.listByMerchant('m-1');\n  expect(listed).toHaveLength(150);\n});",
      },
      {
        t: "p",
        c: "Keep these tests few and let them be slow. One small suite per adapter, single-digit test counts, seconds instead of milliseconds. They earn that budget because each one covers a failure mode nothing else can. Tag them: a separate script, a separate CI job that starts the container, never a gate on the fast unit loop. A strong sentence in a system design discussion: my unit tests run in milliseconds on every save, my adapter tests run in a tagged CI stage where slow is acceptable.",
      },
      {
        t: "p",
        c: "The trap is integration-testing through mocks. A test that stubs the DocumentClient and asserts it was called with certain parameters proves only that you wrote the code you wrote. If your marshalling assumption is wrong, say you assume a missing item makes the call throw when DynamoDB actually returns an empty result, the mock encodes the same wrong assumption and passes forever. The sentence to say is: a test that mocks the SDK verifies my assumptions, not the vendor's behavior. Stub the port to test the use case; use the real thing to test the adapter; there is no useful layer in between.",
      },
      {
        t: "p",
        c: "One class of adapter cannot run against a container: the third-party service. iFeelGoodsRedemptionServiceCreator talks to a vendor API with no local emulator, so its integration test hits the vendor's sandbox, with credentials injected by the CI environment through the wiring, never read inside the adapter, per chapter 7. A real cloud test also earns its cost when the emulator diverges from production: IAM permissions, throughput limits, consistency behavior DynamoDB Local does not simulate. Run those nightly, not per pull request, and treat a failure as news about the vendor, not about your diff.",
      },
      {
        t: "take",
        c: "Adapter integration tests point the shipped adapter at a real instance of the technology and verify translation only: shapes, nulls, pagination, error mapping. Keep them few, slow-tolerated, and CI-tagged so the unit loop stays fast. A test that mocks the SDK verifies nothing, and business rules stay out entirely, because they were already tested where they live.",
      },
    ],
  },
  {
    title: "The Test Pyramid and Contract Tests",
    blocks: [
      {
        t: "p",
        c: "The test pyramid is usually taught as a policy: write many unit tests, fewer integration tests, very few end-to-end tests. In a hexagonal codebase it is not a policy. It is a consequence. The ratios fall out of the architecture, and that is the interesting thing to say about it in an interview. Because the domain depends only on ports, every business rule can be exercised through a test composition root with in-memory adapters, exactly as chapter 8 showed. Those tests touch no network, no disk, no clock. You can afford thousands of them, and they run in seconds.",
      },
      {
        t: "p",
        c: "Move one layer out and the economics flip. An adapter like dynamoDbRewardRepositoryCreator is thin translation code, so it needs few tests, but each one is expensive: it wants a real DynamoDB Local container, real serialization, real error shapes. You write a handful per adapter and run them less often. At the top, end-to-end tests answer only one question the lower layers cannot: is the production composition root wired correctly? Redeem one reward, grant one cashback, done. A smoke test, not a rule catalogue, because every rule already has a fast test below.",
      },
      {
        t: "p",
        c: "The whole pyramid rests on one assumption: the in-memory adapter behaves like the real one. If inMemoryRewardRepositoryCreator returns undefined where the DynamoDB adapter returns null, or ignores a duplicate save that Dynamo would overwrite, your thousands of fast tests are verifying a fiction. The fix is the contract test pattern: one shared suite that describes the port's observable behavior, executed against both adapters. Write it as a function that receives a factory and runs describe blocks.",
      },
      {
        t: "code",
        c: "const reward: Reward = {\n  rewardId: 'reward-1',\n  label: '10% cashback',\n};\n\nconst rewardRepositoryContract = (\n  name: string,\n  makeRepository: () => Promise<RewardRepository>,\n) => {\n  describe(`RewardRepository contract: ${name}`, () => {\n    it('returns null for an unknown id', async () => {\n      const repository = await makeRepository();\n      const found = await repository.getById('nope');\n      expect(found).toBeNull();\n    });\n\n    it('returns a saved reward by id', async () => {\n      const repository = await makeRepository();\n      await repository.save(reward);\n      const found = await repository.getById(\n        reward.rewardId,\n      );\n      expect(found).toEqual(reward);\n    });\n  });\n};",
      },
      {
        t: "p",
        c: "Notice the suite asserts behavior visible through the port: what getById returns, how save and getById compose. It says nothing about table names or Map internals, so any correct implementation passes. Notice also that it takes a factory, not an instance, so every test starts from fresh state. Then you run it twice.",
      },
      {
        t: "code",
        c: "rewardRepositoryContract('in-memory', async () =>\n  inMemoryRewardRepositoryCreator({ rewards: [] }),\n);\n\nrewardRepositoryContract('dynamodb', async () =>\n  dynamoDbRewardRepositoryCreator({\n    dynamoClient: localDynamoClient(),\n    tableName: await createFreshTestTable(),\n  }),\n);",
      },
      {
        t: "p",
        c: "The in-memory run costs milliseconds and executes on every commit. The DynamoDB run needs a container and executes in CI. The moment either adapter drifts from the contract, a test fails with the same name on both sides, and you know exactly which behavior diverged. The sentence to say is: the fake is kept honest by the same contract suite that verifies production, so it cannot silently drift. That one sentence separates people who use fakes from people who trust them.",
      },
      {
        t: "p",
        c: "The same idea crosses service boundaries. When the implementation behind a port is another team's service, say the redemption API behind iFeelGoodsRedemptionServiceCreator is replaced by an internal RedemptionService owned elsewhere, you cannot run their code in your CI. Consumer-driven contracts invert the direction: you publish the requests your adapter makes and the responses it depends on, and the provider's pipeline replays them against every release. Same guarantee, negotiated across a network instead of a describe block.",
      },
      {
        t: "p",
        c: "Finally, the pyramid is a diagnostic. When the boundary is fake in the chapter 5 sense, ports mirroring vendor SDKs, domain code importing clients, nothing can be tested without infrastructure. Teams in that position write a thin, apologetic layer of unit tests and pile everything into slow end-to-end suites: the ice cream cone. If an interview codebase shows you forty end-to-end tests and six unit tests, do not critique the test suite. Critique the architecture that made fast tests impossible, then show the port that fixes it.",
      },
      {
        t: "take",
        c: "The pyramid's ratios are a consequence of the architecture: real boundaries make domain tests cheap and push expensive tests to a thin edge. One shared contract suite, run against both the in-memory and the real adapter, is what earns the right to trust the fake. An ice cream cone is not a testing failure; it is an architecture failure wearing a testing costume.",
      },
    ],
  },
  {
    title: "Test-Driven Development Across the Boundary",
    blocks: [
      {
        t: "p",
        c: "Red-green-refactor in one paragraph: write a failing test that describes a behavior you want, write the least code that makes it pass, then improve the design while the bar stays green. Repeat in small cycles, never writing production code that a failing test did not ask for. In most codebases this loop drives the code. In a hexagonal codebase it drives something more valuable: the boundary itself. Every dependency your test wishes existed becomes a port, and every fake you write to satisfy that wish becomes the first adapter.",
      },
      {
        t: "p",
        c: "This is outside-in TDD, and the direction matters. Do not start by designing OrderRepository on a whiteboard. Start from the use case test, with in-memory adapters, and let the workflow tell you what it needs. Suppose the interview task is: grant cashback when an order completes. There is no grantCashback, no OrderRepository, no CashbackService. You open a test file first and write the test you wish would pass.",
      },
      {
        t: "code",
        c: "it('grants cashback on a completed order', async () => {\n  const orderRepository = inMemoryOrderRepositoryCreator({\n    orders: [\n      {\n        orderId: 'order-1',\n        userId: 'user-1',\n        amount: 5000,\n        status: 'completed',\n      },\n    ],\n  });\n  const granted: { userId: string; amount: number }[] = [];\n  const cashbackService: CashbackService = {\n    async grant(userId, amount) {\n      granted.push({ userId, amount });\n    },\n  };\n  const grantCashback = grantCashbackCreator({\n    orderRepository,\n    cashbackService,\n  });\n\n  await grantCashback({ orderId: 'order-1', rate: 0.05 });\n\n  expect(granted).toEqual([\n    { userId: 'user-1', amount: 250 },\n  ]);\n});",
      },
      {
        t: "p",
        c: "Nothing in this test compiles yet. That is the point. The red phase just pulled two ports into existence, and look at what it named them: OrderRepository and CashbackService, vocabulary from the reward domain, not DynamoOrderTable or IFeelGoodsClient. The port was discovered from the needs of the workflow, not designed up front. A port designed in advance grows speculative methods nobody calls; a port discovered by a test has exactly the surface the use case needs, because the test refuses to compile until it exists. Notice also that the test is wired exactly like chapter 8 said it would be: it is a second composition root, assembling the use case from an in-memory adapter and a hand-rolled spy.",
      },
      {
        t: "p",
        c: "Green is deliberately boring. You write the smallest use case that satisfies the test, in the creator shape the rest of the codebase uses.",
      },
      {
        t: "code",
        c: "const grantCashbackCreator = ({\n  orderRepository,\n  cashbackService,\n}: {\n  orderRepository: OrderRepository;\n  cashbackService: CashbackService;\n}) => async ({\n  orderId,\n  rate,\n}: {\n  orderId: string;\n  rate: number;\n}): Promise<void> => {\n  const order = await orderRepository.getById(orderId);\n  if (!order || order.status !== 'completed') {\n    return;\n  }\n  await cashbackService.grant(\n    order.userId,\n    Math.round(order.amount * rate),\n  );\n};",
      },
      {
        t: "p",
        c: "Then you refactor and keep cycling: a red test for a pending order, a red test for an already-granted order, which will pull a Clock port or an idempotency check into existence when, and only when, a test demands it. When the last domain test is green, something quietly important has happened: the ports are frozen. Only now do you write the real adapters, dynamoDbOrderRepositoryCreator against an OrderRepository that is a proven fact rather than a guess, and iFeelGoodsCashbackServiceCreator against a CashbackService contract the whole workflow already exercises. Writing adapters last, against frozen ports, is what kills the usual failure mode of integration work: the vendor SDK bending the domain interface to its own shape. The dependency arrows from chapter 2 are not just drawn in this order; they were built in this order.",
      },
      {
        t: "p",
        c: "In a live coding interview, TDD is also a narration technique. Thinking out loud in red-green cycles turns silence into signal: the interviewer sees your design decisions the moment you make them, and every cycle ends with something demonstrably working. The rhythm sounds like this:",
      },
      {
        t: "li",
        c: [
          "Red: 'I will write the test I wish passed. It needs to load an order, so I need an OrderRepository, and the test just told me its first method.'",
          "Green: 'Smallest thing that passes. I am allowed to be unsophisticated here; the next test will force the sophistication.'",
          "Refactor: 'Tests are green, so I can reshape freely. This calculation is getting rich enough to become a domain function.'",
          "Before touching an SDK: 'The domain is green and the ports are frozen. Now the adapter is pure translation, exactly like the in-memory one I already have.'",
        ],
      },
      {
        t: "p",
        c: "A strong sentence in a system design discussion, if TDD comes up: 'I work outside-in from the use case test, so my ports are discovered, not invented; the in-memory adapter is the first implementation and the vendor adapter is the last.' It compresses this whole chapter, and it tells the interviewer you see tests as a design tool, not an afterthought.",
      },
      {
        t: "take",
        c: "Outside-in TDD makes the failing use case test the designer: it pulls ports into existence with domain vocabulary and exactly the surface the workflow needs. Adapters come last, written against ports the domain tests have already frozen. In an interview, narrate the red-green-refactor cycles out loud; the rhythm itself demonstrates architectural judgment.",
      },
    ],
  },
  {
    title: "Decorators: Extending Without Touching",
    blocks: [
      {
        t: "p",
        c: "Once ports exist, a new move unlocks: wrapping. A decorator is an adapter that implements a port by delegating to another implementation of the same port, adding one behavior on the way through. Because both sides speak the port, the use case cannot tell the difference, and the composition root simply wraps at wiring time.",
      },
      {
        t: "code",
        c: "const cachedRewardRepositoryCreator = ({\n  inner,\n  ttlMs,\n}: {\n  inner: RewardRepository;\n  ttlMs: number;\n}): RewardRepository => {\n  const cache = new Map<string, { value: Reward | null; at: number }>();\n  return {\n    async getById(id: string) {\n      const hit = cache.get(id);\n      if (hit && Date.now() - hit.at < ttlMs) return hit.value;\n      const value = await inner.getById(id);\n      cache.set(id, { value, at: Date.now() });\n      return value;\n    },\n  };\n};\n\n// Wiring: wrap without touching anything\nrewardRepository: cachedRewardRepositoryCreator({\n  inner: dynamoDbRewardRepositoryCreator({ dynamoClient, tableName }),\n  ttlMs: 60_000,\n})",
      },
      {
        t: "p",
        c: "The same shape solves a whole family of cross-cutting needs: retries with backoff around a flaky partner API, timeouts, logging, metrics, circuit breaking. Each concern is one small decorator, individually unit-testable by wrapping an in-memory inner, and they stack: cached(retrying(dynamoDb)). Resilience lives at the edge, where it belongs, and the use case remains pure workflow.",
      },
      {
        t: "p",
        c: "This is the Open/Closed Principle in working clothes: the system is open to extension (wrap another decorator) and closed to modification (no existing file changes). When an interviewer asks 'how would you add caching without touching the business logic', this chapter is the answer, and the phrase 'a decorator adapter around the port, composed in the wiring' is the sentence to say.",
      },
      {
        t: "p",
        c: "One design decision does belong to the domain: the port's failure contract. Whether getById throws on infrastructure failure or the port models a result type is the domain's call, because the use case must handle it. Decorators must honor whatever contract the port declares. Mentioning this shows you know where the edge of 'hide it in the adapter' actually is.",
      },
      {
        t: "take",
        c: "A decorator implements the port by wrapping the port. Caching, retries, logging and circuit breaking become small, stackable, testable wrappers composed in the wiring, while the use case never changes.",
      },
    ],
  },
  {
    title: "Error Handling and the Failure Contract",
    blocks: [
      {
        t: "p",
        c: "Every port method makes two promises: the shape of success and the shape of failure. Chapter 3 established that the domain owns its ports; that ownership includes the failure contract. Whether getById returns null or throws RewardNotFound, whether redeem throws or returns a result object, is not an implementation detail to be discovered by reading the adapter. It is a design decision written into the port, and in an interview it is one of the fastest ways to show you think in contracts rather than in code. The sentence to say is: 'the failure modes of a port are part of its contract, and the domain decides them.'",
      },
      {
        t: "p",
        c: "TypeScript gives you two honest options. The first is throwing typed domain errors. The use case reads linearly, async/await composes naturally, and the whole JavaScript ecosystem already speaks this dialect. The cost is that the compiler tracks none of it: nothing in the signature of redeemReward tells a caller that RewardUnavailable can come flying out, so the contract lives in documentation and discipline.",
      },
      {
        t: "code",
        c: "class RewardNotFound extends Error {\n  constructor(readonly rewardId: string) {\n    super(`Reward ${rewardId} not found`);\n    this.name = 'RewardNotFound';\n  }\n}\n\nclass RewardUnavailable extends Error {\n  constructor(readonly rewardId: string) {\n    super(`Reward ${rewardId} unavailable`);\n    this.name = 'RewardUnavailable';\n  }\n}\n\nconst redeemRewardCreator = ({\n  rewardRepository,\n}: {\n  rewardRepository: RewardRepository;\n}) =>\n  async (rewardId: string, userId: string) => {\n    const reward = await rewardRepository.getById(rewardId);\n    if (reward === null) {\n      throw new RewardNotFound(rewardId);\n    }\n    if (reward.stock === 0) {\n      throw new RewardUnavailable(rewardId);\n    }\n    // ...grant the redemption\n  };",
      },
      {
        t: "p",
        c: "The second option is returning a Result type. Now the failure modes are spelled out in the signature, the compiler refuses to let a caller ignore them, and exhaustive switches catch you the day someone adds a new failure. The cost is ceremony: every call site unwraps, helpers compose less naturally, and half-adopting it is the worst outcome, because then nobody knows which convention a given port follows. Pick one per codebase and hold the line. A strong sentence in a code review: 'I care less about which convention we chose than about the port declaring it and both sides honoring it.'",
      },
      {
        t: "code",
        c: "type RedeemFailure =\n  | 'RewardNotFound'\n  | 'RewardUnavailable';\n\ntype RedeemResult =\n  | { ok: true; redemption: Redemption }\n  | { ok: false; reason: RedeemFailure };\n\ninterface RedemptionService {\n  redeem(input: {\n    rewardId: string;\n    userId: string;\n    idempotencyKey: string;\n  }): Promise<RedeemResult>;\n}",
      },
      {
        t: "p",
        c: "Whichever convention you pick, one rule is absolute: infrastructure errors never cross the boundary raw. If a DynamoDB ProvisionedThroughputExceededException escapes the adapter and lands in redeemReward, your use case is now coupled to a vendor exception class, your unit tests cannot reproduce it, and swapping to Postgres silently changes your error behavior. Chapter 4 said adapters translate data; they translate failures with exactly the same duty. The adapter catches everything vendor-shaped and rethrows either something domain-meaningful, or a generic RepositoryUnavailable when the domain has nothing more precise to say.",
      },
      {
        t: "code",
        c: "class RepositoryUnavailable extends Error {\n  constructor(\n    operation: string,\n    options?: { cause: unknown },\n  ) {\n    super(`${operation} failed`, options);\n    this.name = 'RepositoryUnavailable';\n  }\n}\n\n// inside dynamoDbRewardRepositoryCreator:\nasync getById(id: string): Promise<Reward | null> {\n  try {\n    const result = await dynamoClient\n      .get({ TableName: tableName, Key: { rewardId: id } })\n      .promise();\n    return result.Item ?? null;\n  } catch (cause) {\n    throw new RepositoryUnavailable(\n      'RewardRepository.getById',\n      { cause },\n    );\n  }\n}",
      },
      {
        t: "p",
        c: "Notice the idempotencyKey in the redeem signature above. It is there because of the ugliest failure mode in distributed systems: the ambiguous timeout. When the call to the redemption service times out, you do not know whether the redemption happened. Retrying blindly might grant the reward twice and pay cashback twice; not retrying might strand a user who was charged. The only clean exit is an idempotency key: the use case generates one key per logical redemption and reuses it on every retry, so the service can recognize a repeat and treat it as a no-op that returns the original outcome. Retries themselves belong in the adapter or in a resilience decorator, but the key belongs in the port's contract, because deciding that redemption must be idempotent is a business decision, not a networking one.",
      },
      {
        t: "li",
        c: [
          "Catch what you have a business answer for: redeemReward can catch RewardUnavailable if the product wants to offer an alternative reward.",
          "Propagate what you cannot answer: RepositoryUnavailable means nothing to the use case; let it rise to the edge, where the HTTP handler maps it to a 503.",
          "Never catch, log, and continue: a swallowed failure in grantCashback is money moving with no explanation, and no test will ever see it.",
        ],
      },
      {
        t: "p",
        c: "That list is the whole discipline for the use case layer. A use case that catches everything 'to be safe' is hiding failures from the composition root and from the tests chapter 8 taught you to write. A use case that catches nothing is fine more often than people expect. Catching is a claim: 'I know what the business does next.' If you cannot finish that sentence, do not write the catch block.",
      },
      {
        t: "take",
        c: "The failure contract belongs to the port, and the domain decides it: thrown domain errors or a Result type, either is defensible, but declare it and be consistent. Adapters translate infrastructure failures into domain terms just as they translate data, and ambiguous timeouts make idempotency keys part of the contract, not an afterthought. A use case catches only the failures it has a business answer for and lets the rest propagate.",
      },
    ],
  },
  {
    title: "Driving Ports: the Delivery Edge",
    blocks: [
      {
        t: "p",
        c: "So far the adapters you have seen sit on the driven side: repositories, payment gateways, the clock. The domain calls them through ports it owns. But the hexagon has a second edge, and in an interview codebase it is usually the first file you open. Something has to trigger a use case: an HTTP request, a CLI command, a message on a queue, a scheduler firing at 3am. All of these are adapters too. Same rule as chapter 4 — translate, never decide — but the call points the other way: driven adapters are called by the domain, driving adapters call into it.",
      },
      {
        t: "p",
        c: "Here is what a thin HTTP handler looks like in the house style. Notice it is a creator like any other adapter: it receives the use case as a dependency and returns something the framework can mount. The composition root wires it, exactly as chapter 7 described.",
      },
      {
        t: "code",
        c: "const redeemRewardHandlerCreator = ({\n  redeemReward,\n}: {\n  redeemReward: RedeemReward;\n}) =>\n  async (req: Request, res: Response) => {\n    const { rewardId, userId } = req.body;\n    if (typeof rewardId !== 'string' || rewardId === '') {\n      return res.status(400).json({ error: 'rewardId is required' });\n    }\n    if (typeof userId !== 'string' || userId === '') {\n      return res.status(400).json({ error: 'userId is required' });\n    }\n    try {\n      const redemption = await redeemReward({ rewardId, userId });\n      return res.status(200).json(toRedemptionDto(redemption));\n    } catch (err) {\n      if (err instanceof RewardNotFoundError) {\n        return res.status(404).json({ error: err.message });\n      }\n      if (err instanceof RewardUnavailableError) {\n        return res.status(409).json({ error: err.message });\n      }\n      throw err;\n    }\n  };",
      },
      {
        t: "li",
        c: [
          "Parse and validate the shape of the incoming request",
          "Call exactly one use case with plain domain input",
          "Map the outcome — success or domain error — to protocol vocabulary",
        ],
      },
      {
        t: "p",
        c: "That list is the complete job description. No repository access, no availability checks, no cashback math, no branching on business state. The moment a handler queries the OrderRepository directly or decides that a reward 'looks expired', a business rule has leaked into HTTP-specific code where no domain test will ever find it. When you review a handler, count its responsibilities against that list; a fourth one is a finding.",
      },
      {
        t: "p",
        c: "The validation line deserves precision, because it is where candidates blur the boundary. Checking that rewardId is a non-empty string, that the body is valid JSON, that userId matches the token — that is format validation, and it belongs at the edge, because it is about the delivery mechanism's contract. Checking that the reward is still available, that the user has not exceeded their redemption quota — that is business meaning, and it belongs in the use case, because it must hold no matter who calls. The sentence to say is: 'the handler validates shape, the use case validates meaning.'",
      },
      {
        t: "p",
        c: "The same discipline applies to types. The use case signature takes { rewardId, userId } and returns a domain Redemption — never a Request, a Response, or an APIGatewayProxyEvent. The handler maps inward from the wire format and outward through toRedemptionDto. If you ever see an Express type in a use case import, you are looking at the fake boundary from chapter 5: the layers exist on disk, but HTTP has colonized the domain, and every caller now needs to fabricate a Request object just to redeem a reward.",
      },
      {
        t: "p",
        c: "Why insist on this thinness? Because the delivery mechanism is the most volatile decision in the system. Today redemption happens over HTTP; next quarter product wants it asynchronous behind a queue, and support wants a CLI for manual grants. If the handler is thin, each of those is a new driving adapter over the same untouched use case.",
      },
      {
        t: "code",
        c: "const redeemRewardConsumerCreator = ({\n  redeemReward,\n}: {\n  redeemReward: RedeemReward;\n}) =>\n  async (message: QueueMessage): Promise<void> => {\n    const { rewardId, userId } = JSON.parse(message.body);\n    await redeemReward({ rewardId, userId });\n  };",
      },
      {
        t: "p",
        c: "Same use case, zero duplication of business logic, and each adapter is trivially testable: hand the handler a stubbed redeemReward that throws RewardUnavailableError and assert the 409, exactly the stub-and-spy technique chapter 8 gave you. Meanwhile the use case tests never mention status codes at all. A strong sentence in a system design discussion: 'HTTP is a delivery detail; I want to swap it for a queue by writing one adapter and one line of wiring.'",
      },
      {
        t: "take",
        c: "Handlers, CLI commands, consumers and schedulers are driving adapters: they parse input, call one use case, and translate the outcome back into their protocol. Format validation lives at the edge, business rules live in the domain, and protocol types never cross into use case signatures. Keep the delivery edge thin and the delivery mechanism becomes a swappable, independently testable detail.",
      },
    ],
  },
  {
    title: "Events and Asynchronous Adapters",
    blocks: [
      {
        t: "p",
        c: "Everything so far has been synchronous: redeemReward runs, returns, done. But redeeming a reward has consequences that do not belong in that call. Cashback must be granted, an email sent, analytics updated. Stuffing all of that into the use case couples it to every downstream concern and makes the call as slow as its slowest side effect. The hexagonal answer is a domain event: the use case states what happened, in domain vocabulary, and publishes it through a port it owns. Who listens, and over which transport, is not its problem.",
      },
      {
        t: "code",
        c: "type RewardRedeemed = {\n  eventId: string;\n  type: 'RewardRedeemed';\n  rewardId: string;\n  orderId: string;\n  occurredAt: Date;\n};\n\ninterface EventPublisher {\n  publish(event: RewardRedeemed): Promise<void>;\n}\n\nconst inMemoryEventPublisherCreator = (): EventPublisher & {\n  published: RewardRedeemed[];\n} => {\n  const published: RewardRedeemed[] = [];\n  return {\n    published,\n    publish: async (event) => {\n      published.push(event);\n    },\n  };\n};",
      },
      {
        t: "p",
        c: "The recording publisher is the same move chapter 8 made with spies. In production the composition root wires an SNS or SQS adapter behind the port; in tests it wires this one, and you assert that redeeming a reward published exactly one RewardRedeemed with the right orderId. The event becomes an observable behavior of the use case, not an invisible side effect buried in vendor code.",
      },
      {
        t: "p",
        c: "Now the honest paragraph. The naive implementation saves the order and then publishes the event: two systems, two writes, no shared transaction. Crash between them and you have a redeemed reward that never granted cashback, or worse, the reverse. This is the dual-write problem, and no amount of try/catch fixes it. The outbox pattern is the standard answer: write the state change and the event into the same database, in the same transaction, and let a separate relay read the outbox table and push to the queue afterwards. The event cannot be lost because it commits or rolls back with the state it describes.",
      },
      {
        t: "code",
        c: "await withTransaction(async (tx) => {\n  await orderRepository.save(order, tx);\n  await outbox.append(\n    {\n      eventId: crypto.randomUUID(),\n      type: 'RewardRedeemed',\n      rewardId: reward.id,\n      orderId: order.id,\n      occurredAt: clock.now(),\n    },\n    tx\n  );\n});\n// A relay polls the outbox table, publishes each\n// row to the queue, and marks it as sent.",
      },
      {
        t: "p",
        c: "On the consuming side, the symmetry is exact. An HTTP handler is a driving adapter that parses a request and calls a use case; a queue consumer is a driving adapter that parses a message and calls a use case. It deserializes, translates, delegates, and nothing more. The grantCashback use case does not know it was triggered by SQS any more than it would know about Express. A strong sentence in a system design discussion: 'the queue consumer is just another driving adapter; the use case is transport-agnostic.'",
      },
      {
        t: "code",
        c: "const sqsCashbackConsumerCreator = ({\n  grantCashback,\n}: {\n  grantCashback: GrantCashback;\n}) =>\n  async (message: { body: string }): Promise<void> => {\n    const event = JSON.parse(message.body) as {\n      eventId: string;\n      orderId: string;\n      rewardId: string;\n    };\n    await grantCashback({\n      eventId: event.eventId,\n      orderId: event.orderId,\n      rewardId: event.rewardId,\n    });\n  };",
      },
      {
        t: "p",
        c: "Assume at-least-once delivery by default. Queues redeliver on timeout, the relay retries after a crash mid-publish, and exactly-once is a claim vendors make in headlines and retract in footnotes. So the same RewardRedeemed will eventually arrive twice, and handling that is a business decision, which means it lives in the use case, not the adapter. Two respectable options: a processed-event table keyed by event id, checked before acting; or natural idempotency, where granting cashback for an orderId that already has cashback is defined as a no-op. The second is better when the domain allows it, because there is no extra state to keep consistent.",
      },
      {
        t: "p",
        c: "Finally, the phrase that gets probed in interviews: eventual consistency. Between the redemption committing and the cashback landing, the system is briefly inconsistent, and that is a feature you chose, not a bug you shipped. The sentence to say is: 'we traded immediate consistency for availability and decoupling; the invariant is not that cashback is granted instantly, but that it is granted exactly once, eventually.' Then name the machinery that makes it true: outbox for the publish, idempotent handling for the consume.",
      },
      {
        t: "take",
        c: "Events leave through a port the domain owns, and the in-memory recording publisher makes them testable behavior. The outbox pattern answers dual-write by committing event and state together; the queue consumer is just a driving adapter calling a use case. Assume at-least-once delivery, and treat idempotency as a business rule in the use case, not plumbing in the adapter.",
      },
    ],
  },
  {
    title: "Refactoring Legacy Code to the Hexagon",
    blocks: [
      {
        t: "p",
        c: "Every chapter so far assumed you could draw the boundary before writing the code. In practice you inherit the code first. The interview codebase, and every production codebase you will ever be paid to improve, is a tangle of business rules, SDK calls, and process.env reads sharing the same function body. When an interviewer asks how you would introduce this architecture into a legacy codebase, they are testing whether you know the answer is not a rewrite. It is a sequence of small, boring, reversible moves, and this chapter is that sequence.",
      },
      {
        t: "p",
        c: "The first move touches no production code: characterization tests. Before extracting anything, pin down what the system currently does, including its bugs, because someone downstream may depend on them. Call the entry point, capture what comes back and which side effects fire, and assert exactly that. These are not the behavior tests of chapter 8; they make no claim that the behavior is correct, only that it is unchanged. They are scaffolding, there to make the next moves safe, and you may delete them once real ports and real domain tests exist. Here is the kind of function they will be protecting.",
      },
      {
        t: "code",
        c: "async function redeemReward(userId: string, rewardId: string) {\n  const db = new DynamoDB.DocumentClient();\n  const res = await db\n    .get({\n      TableName: process.env.REWARDS_TABLE!,\n      Key: { rewardId },\n    })\n    .promise();\n  if (!res.Item || res.Item.stock <= 0) {\n    throw new Error('Reward unavailable');\n  }\n  await axios.post(\n    'https://api.vendor.example/redemptions',\n    { userId, sku: res.Item.sku },\n    { headers: { token: process.env.REDEMPTION_API_TOKEN } }\n  );\n  await db\n    .update({\n      TableName: process.env.REWARDS_TABLE!,\n      Key: { rewardId },\n      UpdateExpression: 'SET stock = stock - 1',\n    })\n    .promise();\n}",
      },
      {
        t: "p",
        c: "This function decides and translates in the same breath: a stock rule, Dynamo shapes, a vendor call, config reads. Do not extract everything at once. Pick one workflow, redemption, and one infrastructure touchpoint inside it, the reward storage, and put a port around just that. Chapter 3 defined what a port is; here the skill is restraint. One interface, methods named for what the workflow needs rather than what DynamoDB offers, and a seam that keeps every existing caller working.",
      },
      {
        t: "code",
        c: "interface RewardRepository {\n  getById(id: string): Promise<Reward | null>;\n  decrementStock(id: string): Promise<void>;\n}\n\nconst legacyRewardRepositoryCreator = ({\n  db,\n  tableName,\n}: {\n  db: DynamoDB.DocumentClient;\n  tableName: string;\n}): RewardRepository => ({\n  // the same Dynamo calls, lifted verbatim\n  async getById(id: string): Promise<Reward | null> {\n    const res = await db\n      .get({ TableName: tableName, Key: { rewardId: id } })\n      .promise();\n    return res.Item ?? null;\n  },\n  async decrementStock(id: string): Promise<void> {\n    await db\n      .update({\n        TableName: tableName,\n        Key: { rewardId: id },\n        UpdateExpression: 'SET stock = stock - 1',\n      })\n      .promise();\n  },\n});\n\nasync function redeemReward(\n  userId: string,\n  rewardId: string,\n  rewardRepository: RewardRepository =\n    legacyRewardRepositoryCreator({\n      db: new DynamoDB.DocumentClient(),\n      tableName: process.env.REWARDS_TABLE!,\n    })\n) {\n  const reward = await rewardRepository.getById(rewardId);\n  if (!reward || reward.stock <= 0) {\n    throw new Error('Reward unavailable');\n  }\n  // vendor call unchanged, for now\n  await rewardRepository.decrementStock(rewardId);\n}",
      },
      {
        t: "p",
        c: "The default argument is the seam: production callers change nothing, but a test can now hand in inMemoryRewardRepositoryCreator, ten lines you write next. Run the characterization tests twice, once against the legacy creator and once against the fake. Same green, seam proven. That is one pull request, the system worked before and after, and nothing else in the codebase noticed. Then repeat: the vendor call becomes a RedemptionService port behind iFeelGoodsRedemptionServiceCreator. When the last touchpoint is extracted, the default arguments and the process.env reads move out to the composition root of chapter 7, and the function has quietly become a use case.",
      },
      {
        t: "p",
        c: "That is the strangler fig at function scale, and it scales up to modules: stand up a new, fully hexagonal redemption module beside the old code, route one call site at a time through it, and let the old module shrink until deleting it is a one-line change. What never works is the big-bang rewrite. A rewrite has no shippable midpoint; for months the only working system is the old one, which keeps changing underneath you because the business does not pause. The rewrite chases a moving target, becomes unreviewable, and dies in a merge conflict. The strangler wins because every step ships.",
      },
      {
        t: "li",
        c: [
          "Pin current behavior with characterization tests",
          "Extract one port around one touchpoint of one workflow",
          "Prove the seam with an in-memory fake; ship that PR",
          "Move the decisions into a use case; ship again",
          "Repeat per touchpoint, then delete the legacy path",
        ],
      },
      {
        t: "p",
        c: "So when the question comes in the interview, the sentence to say is: 'I would not rewrite it. I would pin current behavior with characterization tests, extract one port around one infrastructure touchpoint of one workflow, prove the seam with an in-memory fake, and repeat, so every PR leaves the system working.' If the discussion goes deeper, name the seam and the strangler fig explicitly. A strong sentence in a system design discussion is one that comes with a deletion plan for the old code.",
      },
      {
        t: "take",
        c: "Legacy migration is a sequence of seams, not a rewrite. Pin behavior with characterization tests, extract one port at a time, prove each seam with an in-memory fake, and strangle modules call site by call site so every PR ships a working system. Big bangs fail because they have no shippable midpoint.",
      },
    ],
  },
  {
    title: "Structure and Enforcement",
    blocks: [
      {
        t: "p",
        c: "Architecture that lives only in people's heads erodes one pull request at a time. The folder structure should make the boundary visible, and tooling should make it mechanical.",
      },
      {
        t: "code",
        c: "src/\n  domain/\n    rewards/\n      reward.ts            // entities and domain types\n      ports.ts             // RewardRepository, RedemptionService\n      redeem-reward.ts     // createRedeemRewardUseCase\n      redeem-reward.test.ts // fast tests, in-memory adapters\n  adapters/\n    dynamodb/\n      dynamo-reward-repository.ts\n    ifeelgoods/\n      ifeelgoods-redemption-service.ts\n    in-memory/\n      in-memory-reward-repository.ts\n  wiring/\n    production.ts          // the composition root\n    test.ts",
      },
      {
        t: "p",
        c: "The load-bearing rule is about imports: domain imports nothing from adapters, wiring, or any SDK. Adapters import domain types and ports, plus their own vendor. Wiring imports both, and is the only place that does. This is checkable by machine: an ESLint no-restricted-imports rule, or dependency-cruiser, fails the build when someone imports aws-sdk inside domain. 'The import graph is the architecture, and we lint it' is a strong sentence in a system design discussion.",
      },
      {
        t: "p",
        c: "Naming carries information too. The codebase's Creator suffix (dynamoDbRewardRepositoryCreator) signals a factory that receives dependencies and returns a port implementation. Ports are named for needs (RewardRepository, Clock), adapters for technology plus port (dynamoDbRewardRepository), use cases for business actions (redeemReward). A reader should be able to classify any file from its name alone, which is exactly the skill the classify drill in this app trains.",
      },
      {
        t: "p",
        c: "Two boundary questions worth having opinions on. Where do domain types live? In the domain, exported outward: adapters translate INTO them, never the reverse. And how far does this go? Pragmatism: a tiny script does not need a hexagon. The pattern earns its cost where rules matter, vendors may change, and tests must be fast, which is precisely the profile of a production product codebase.",
      },
      {
        t: "take",
        c: "Make the boundary visible in folders and enforceable in CI. Domain imports nothing external, only wiring imports everything, and a lint rule turns the architecture from a convention into a guarantee.",
      },
    ],
  },
  {
    title: "A Catalogue of Smells",
    blocks: [
      {
        t: "p",
        c: "Code review is pattern matching. This catalogue lists the violations you are most likely to be shown in the interview, each with the reason it hurts and the sentence to say when you spot it.",
      },
      {
        t: "li",
        c: [
          "SDK types in a port: the interface mentions DynamoDB.DocumentClient or Response. Every consumer now speaks the vendor's language, and swapping storage breaks the domain. Say: 'this port leaks infrastructure, I would reshape it around the business need, like getById returning a domain Reward.'",
          "Business rule in an adapter: an adapter filters, validates or decides. The rule is invisible to domain tests and will be lost in the next adapter. Say: 'adapters translate, they should not decide, this rule belongs in the use case where it is visible and testable.'",
          "process.env inside domain or use case: configuration crossing the boundary. Say: 'config is infrastructure, it should enter at the composition root and arrive as a plain value.'",
          "Raw fetch or SDK client call inside a workflow: no port at all. Say: 'this is a hidden dependency, I would extract a port and push the HTTP details into an adapter.'",
          "Use case constructing its own adapters: the fake boundary of chapter 5. Say: 'whoever creates the dependency controls it, this should receive its collaborators instead.'",
          "Tests full of jest.mock and module patching: the symptom, not the disease. Say: 'the mocking effort tells me the boundary is missing, with DI these become in-memory adapters.'",
          "God port: one interface with a dozen methods serving unrelated use cases. Say: 'I would segregate this by need, so each adapter implements only what its consumers use.'",
          "Scattered wiring: every handler assembles dependencies itself. Say: 'I would centralize this in a composition root so vendor choices live in one reviewable place.'",
        ],
      },
      {
        t: "p",
        c: "Notice the shared shape of every response: name the smell, state the principle in one clause, propose the move. Diagnosis, principle, remedy. In a live review, that rhythm reads as seniority. Ranting about bad code without the remedy, or fixing without naming why, both read as less.",
      },
      {
        t: "take",
        c: "Every smell is knowledge in the wrong place: vendor knowledge in the domain, rule knowledge in an adapter, wiring knowledge in a workflow. Review by asking of each line: does this code KNOW something it should not?",
      },
    ],
  },
  {
    title: "Talking the Talk: Glossary and Interview Phrasing",
    blocks: [
      {
        t: "p",
        c: "The interview is in English, and precision of vocabulary is part of the signal. This closing chapter is the language layer: the terms, and the sentences that deploy them.",
      },
      {
        t: "li",
        c: [
          "Boundary: the line where knowledge stops flowing between business and infrastructure.",
          "Coupling: how much a change here forces a change there. Volatility: how often a thing changes.",
          "Dependency inversion: the principle that arrows point inward, toward abstractions the domain owns.",
          "Dependency injection: the technique of receiving collaborators from outside instead of creating them.",
          "Port: an interface owned by the domain expressing a need. Adapter: an edge implementation of a port.",
          "Composition root: the single place that chooses and wires adapters. Wiring: the act of doing so.",
          "Leaky abstraction: an interface that exposes its implementation, like SDK types in a port.",
          "Test double: any stand-in. Stub: returns canned data. Spy: records calls. Seam: a place where behavior can be swapped for testing.",
          "Decorator: a port implementation wrapping another, adding one behavior.",
          "God port / fat interface: an interface serving too many masters. Interface segregation: the cure.",
          "Vendor lock-in, to swap out, to hard-code, to ripple through the codebase: the verbs of trade-off talk.",
        ],
      },
      {
        t: "p",
        c: "Sentence templates to make automatic, so your working memory stays free for the actual problem. For reasoning: 'Let me walk you through my reasoning.' 'My first instinct is X, but let me check the boundary.' 'The trade-off I see is speed of delivery against cost of change.' For review: 'What this adapter knows here is a business rule, so I would move it up into the use case.' For design: 'I would keep the domain vendor-neutral and absorb that concern in a decorator at the edge.' For the AI assistant: 'I will let the assistant scaffold the adapter, and I will review it for leaked rules, because boundary decisions stay with me.'",
      },
      {
        t: "p",
        c: "And one closing frame for the product engineering phase: a product built on merchant APIs, banking connections and reward partners lives or dies by how cheaply it can change partners. Ports make each partner a plug. That is not clean code for its own sake, it is the architecture of business agility, and connecting those two ideas in one sentence is the strongest note you can end an interview on.",
      },
      {
        t: "take",
        c: "Precision of language is precision of thought made audible. Master the twelve takeaway boxes, the glossary, and the sentence templates, and the English of this interview becomes a home game.",
      },
    ],
  },
];

// Inclusive chapter-index ranges.
export const BOOK_PARTS: BookPart[] = [
  {
    title: "Part I — Foundations",
    from: 0,
    to: 6,
  },
  {
    title: "Part II — Testing",
    from: 7,
    to: 11,
  },
  {
    title: "Part III — Patterns at the Edge",
    from: 12,
    to: 16,
  },
  {
    title: "Part IV — Practice",
    from: 17,
    to: 19,
  },
];
