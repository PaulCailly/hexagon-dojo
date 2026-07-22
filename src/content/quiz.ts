import type { QuizQuestion } from "./types";

export const QUIZ: QuizQuestion[] = [
  {
    q: "What is a port?",
    options: [
      "A concrete class that talks to a database",
      "An interface defined by the inner logic that expresses a need",
      "A configuration file listing external services",
      "A network endpoint exposed by the app",
    ],
    answer: 1,
    why: "A port is written in the language of the business and states WHAT the logic needs, never HOW it is done. No SDKs, no HTTP, no database types.",
  },
  {
    q: "Who defines the port, and in whose vocabulary?",
    options: [
      "The infrastructure team, using the vendor's SDK types",
      "The framework, through its plugin system",
      "The inner business logic, in business language",
      "The API provider, through its OpenAPI spec",
    ],
    answer: 2,
    why: "Ports belong to the inside. That is the inversion: infrastructure conforms to the business, not the other way around.",
  },
  {
    q: "What is an adapter?",
    options: [
      "A concrete implementation of a port, living at the edge of the system",
      "A design pattern for converting one interface into another inside the domain",
      "A wrapper that hides business rules from the infrastructure",
      "A middleware that logs every request",
    ],
    answer: 0,
    why: "Adapters deal with the real world: databases, HTTP, auth, retries, timeouts, serialization. Ports define what is needed, adapters define how it is done.",
  },
  {
    q: "Can a single port have multiple adapters?",
    options: [
      "No, that would break the contract",
      "Yes, for example a DynamoDB adapter for prod and an in-memory adapter for tests",
      "Only if the adapters share a base class",
      "Only in dynamically typed languages",
    ],
    answer: 1,
    why: "That is the whole point. Prod adapter, in-memory adapter, tomorrow a Postgres adapter. The use case never changes.",
  },
  {
    q: "The use case defines ports but instantiates its own adapters inside the function. What is wrong?",
    options: [
      "Nothing, ports exist so the boundary is real",
      "Performance: adapters are created on every call",
      "The boundary is fake: infrastructure choices are still hard-coded in the logic",
      "It only breaks if the adapters are async",
    ],
    answer: 2,
    why: "Ports without injection are a fake boundary. The logic still decides HOW its dependencies are built, so testing still requires real infra or heavy mocking.",
  },
  {
    q: "What is the core principle of dependency injection?",
    options: [
      "Use a DI framework with decorators and a container",
      "Do not create dependencies where you use them; receive them from the outside",
      "Register every class as a singleton",
      "Inject configuration through environment variables",
    ],
    answer: 1,
    why: "No framework needed. A factory function receiving its dependencies as an argument is dependency injection.",
  },
  {
    q: "What is the composition root?",
    options: [
      "The root component of the React tree",
      "The only place in the system that chooses and wires adapters",
      "A base class every adapter must extend",
      "The main() function of the runtime",
    ],
    answer: 1,
    why: "Wiring happens in exactly one place. In-memory wiring for tests and local dev, production wiring for prod. The use case code never changes.",
  },
  {
    q: "Where should process.env.REWARDS_TABLE be read?",
    options: [
      "Inside the use case, so the logic knows its table",
      "Inside the port interface as a default value",
      "In the composition root, passed into the adapter's creator",
      "Anywhere, environment variables are global anyway",
    ],
    answer: 2,
    why: "Environment and config are infrastructure details. They enter through the wiring, never through the business logic.",
  },
  {
    q: "Why are in-memory adapters valuable?",
    options: [
      "They are faster in production than a real database",
      "Fast tests, local dev without AWS or Docker, and fully predictable state",
      "They avoid writing interfaces",
      "They replace the need for a composition root",
    ],
    answer: 1,
    why: "No network, no setup, and you control the exact state, for example pre-populating a Map with test data.",
  },
  {
    q: "Which of these does NOT belong in a port interface?",
    options: [
      "A method name expressing a business need, like getById",
      "A domain type, like Reward",
      "A DynamoDB.DocumentClient parameter",
      "A Promise return type",
    ],
    answer: 2,
    why: "SDK types leaking into a port tie the business to a vendor. That is a leaky abstraction: swap the database and the port breaks too.",
  },
  {
    q: "You migrate storage from DynamoDB to Postgres. What changes?",
    options: [
      "The use case, the port, and the adapter",
      "Only the adapter and the wiring in the composition root",
      "Only the port interface",
      "Everything, migrations always ripple",
    ],
    answer: 1,
    why: "Write a postgresRewardRepositoryCreator, swap it in the composition root, done. The port and use case are untouched. This is the answer they want to hear.",
  },
  {
    q: "How do you unit test a use case built with DI?",
    options: [
      "Spin up DynamoDB Local in Docker",
      "Monkey-patch the AWS SDK with a mocking library",
      "Inject in-memory adapters with pre-populated state and assert on behavior",
      "Mock global fetch and assert on the URL called",
    ],
    answer: 2,
    why: "Inject an in-memory repository seeded with the reward you need, a no-op or recording redemption service, then assert. Instant, deterministic, no mocking framework.",
  },
];
