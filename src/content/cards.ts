import type { TalkCard } from "./types";

export const CARDS: TalkCard[] = [
  {
    cat: "System design",
    color: "emerald",
    q: "Add caching to reward lookups without touching the business logic. How?",
    a: "Write a caching decorator adapter: a cachedRewardRepositoryCreator that wraps any RewardRepository, checks the cache first, delegates on miss. Same port on both sides. Swap it in at the composition root. Zero changes to the use case, and you can unit test the caching behavior in isolation.",
  },
  {
    cat: "System design",
    color: "emerald",
    q: "The redemption API is flaky. Where do retries, timeouts and circuit breaking live?",
    a: "In the adapter, or in a resilience decorator wrapping the port. The use case should not know the network exists. Bonus point: mention that the port's contract (throws vs returns a result type) is the one design decision the domain does own.",
  },
  {
    cat: "System design",
    color: "emerald",
    q: "Two use cases need to fetch a user. Do they share a port?",
    a: "Prefer ports scoped to what each use case needs (interface segregation). Sharing is fine when the need is genuinely identical, but a fat shared port slowly turns into a god interface that every adapter must fully implement.",
  },
  {
    cat: "System design",
    color: "emerald",
    q: "How would you structure the folders to make the boundary visible?",
    a: "domain (entities, ports, use cases) with zero external imports, adapters (one folder per technology), and a thin app or wiring layer as composition root. The import rule is the architecture: domain imports nothing from outside itself, and a lint rule can enforce it.",
  },
  {
    cat: "Product mindset",
    color: "violet",
    q: "Why does this architecture matter for a product built on third-party integrations?",
    a: "Such a product lives on third-party integrations: merchant APIs, banking data, reward providers. Those change and break outside your control. Ports isolate each partner behind a stable contract, so swapping a provider or adding a fallback is an adapter, not a rewrite. That is business agility, not just clean code.",
  },
  {
    cat: "Product mindset",
    color: "violet",
    q: "A PM asks for a quick hack that violates the boundary. What do you say?",
    a: "Connect cost to product: the hack ships today but makes the next ten features slower and riskier. Offer the middle path: ship behind the port with a rough adapter, refine the adapter later. The boundary is what makes 'later' cheap.",
  },
  {
    cat: "AI collaboration",
    color: "cyan",
    q: "How do you use the built-in AI assistant well during this interview?",
    a: "Narrate intent out loud before prompting, use the AI for boilerplate and recall (adapter scaffolding, test setup) while owning design decisions yourself, and review its output critically: say what you are checking and why. They evaluate how you think alongside it, so verbalize the division of labor.",
  },
  {
    cat: "AI collaboration",
    color: "cyan",
    q: "The AI generates code that puts a business rule in an adapter. What do you do?",
    a: "Catch it, name it, fix it. This is the moment they are hoping to see: you spot that the AI violated the boundary, explain why it matters, and move the rule into the use case. Trust but verify, out loud.",
  },
  {
    cat: "English phrases",
    color: "amber",
    q: "Sentence starters for reasoning out loud (say them until they are automatic)",
    a: "'Let me walk you through my reasoning.' 'The trade-off I see here is...' 'My first instinct is X, but let me check the boundary.' 'What this port expresses is a business need, namely...' 'I'd rather keep the domain vendor-neutral, so...' 'Before I write code, let me map the dependencies.'",
  },
  {
    cat: "English phrases",
    color: "amber",
    q: "Vocabulary you must be fluent with in English",
    a: "Boundary, coupling, cohesion, leaky abstraction, separation of concerns, single responsibility, dependency inversion, composition root, seam, stub, spy, test double, wiring, vendor lock-in, trade-off, 'to swap out', 'to hard-code', 'to ripple through the codebase'.",
  },
  {
    cat: "Codebase reading",
    color: "slate",
    q: "First 5 minutes with an unknown codebase in a live coding interview. What is your routine?",
    a: "1: find the composition root, it is the map of the system. 2: read the ports to learn the business vocabulary. 3: pick one use case and trace it end to end. 4: only then look inside adapters. Say this plan out loud, it demonstrates method before knowledge.",
  },
  {
    cat: "Codebase reading",
    color: "slate",
    q: "How do you quickly judge if a codebase really follows the pattern?",
    a: "Grep the domain folder for SDK imports, env vars, and fetch calls: it should be clean. Check whether tests use in-memory adapters or mocking libraries. Look for business rules hiding in adapters. Three checks, two minutes, strong signal.",
  },
];
