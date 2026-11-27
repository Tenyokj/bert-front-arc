export const sitePages = [
  { path: "/how-it-works", label: "How it works", group: "Start here", description: "Follow funding and Community execution from proposal to delivery." },
  { path: "/protocol-stats", label: "Protocol metrics", group: "Explore", description: "Read contract values, their scope and their source." },
  { path: "/faq", label: "FAQ", group: "Start here", description: "Search practical answers about participation, funds and verification." },
  { path: "/developer-guide", label: "Developer guide", group: "Build", description: "Integrate contracts, indexers and transaction-safe interfaces." },
  { path: "/governance-stack", label: "Architecture", group: "Build", description: "Understand modules, authorities and contract boundaries." },
  { path: "/on-chain-votes", label: "Voting execution", group: "Protocol", description: "What is checked onchain, and what a vote actually changes." },
  { path: "/treasury-policies", label: "Treasury policies", group: "Protocol", description: "Custody, obligations, reserve and earned fees are different balances." },
  { path: "/policy-docs", label: "Governance policies", group: "Protocol", description: "Read parameter snapshots and the rules behind participation." },
  { path: "/testnet-information", label: "Testnet guide", group: "Start here", description: "Set up a test wallet, activate Demo verification and report clearly." },
  { path: "/security-roadmap", label: "Security & limitations", group: "Safety", description: "Current trust boundaries, planned hardening and disclosure guidance." },
  { path: "/bug-bounty", label: "Responsible disclosure", group: "Safety", description: "Scope, reporting instructions and the actual reward model." },
  { path: "/privacy-notice", label: "Privacy & security", group: "Legal", description: "The privacy model and the services involved in using BERT." },
  { path: "/terms-of-use", label: "Terms of use", group: "Legal", description: "Conditions and responsibilities for using the testnet interface." },
] as const;

export type SitePath = typeof sitePages[number]["path"];
