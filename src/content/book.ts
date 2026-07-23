import type { BookChapter } from "./types";

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

import type { BookPart } from "./types";

// Inclusive chapter-index ranges; updated when chapters are inserted.
export const BOOK_PARTS: BookPart[] = [
  { title: "Part I — Foundations", from: 0, to: 6 },
  { title: "Part II — Testing", from: 7, to: 7 },
  { title: "Part III — Patterns at the Edge", from: 8, to: 8 },
  { title: "Part IV — Practice", from: 9, to: 11 },
];
