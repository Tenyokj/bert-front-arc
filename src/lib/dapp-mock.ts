export type RoundStatus = "active" | "scheduled" | "finalized";
export type IdeaStatus =
  | "Pending"
  | "Voting"
  | "WonVoting"
  | "Funded"
  | "Rejected"
  | "Completed";

export type Round = {
  id: number;
  status: RoundStatus;
  startsAt: string;
  endsAt: string;
  totalStake: string;
  totalVotes: number;
  winnersCount: number;
  active: boolean;
  ended: boolean;
  ideaIds: number[];
  winningIdeaId: number | null;
  winningVotes: number;
};

export type Idea = {
  id: number;
  roundId: number;
  author: string;
  title: string;
  summary: string;
  description: string;
  link: string;
  createdAt: string;
  totalVotes: number;
  statusCode: number;
  status: IdeaStatus;
  category: "1" | "2";
};

export type VoteEntry = {
  address: string;
  ideaId: number;
  votingPower: string;
  votes: number;
  txHash: string;
};

export type UserProfile = {
  address: string;
  nickname: string;
  reputation: number;
  level: number;
  ideasSubmitted: number;
  ideasFunded: number;
  votesCast: number;
  usdcBalance: string;
};

const PRIMARY_USER_ADDRESS = "0xA92d4F4bAF7b2A9f1a11B6c4fD2A2B0E21f352b1";

const baseRounds: Round[] = [
  {
    id: 12,
    status: "active",
    startsAt: "2026-02-11T08:00:00.000Z",
    endsAt: "2026-02-12T08:00:00.000Z",
    totalStake: "$610,000",
    totalVotes: 18640000,
    winnersCount: 4,
    active: true,
    ended: false,
    ideaIds: [201, 202, 203],
    winningIdeaId: null,
    winningVotes: 0,
  },
  {
    id: 11,
    status: "finalized",
    startsAt: "2026-01-25T10:00:00.000Z",
    endsAt: "2026-01-26T10:00:00.000Z",
    totalStake: "$540,000",
    totalVotes: 24900000,
    winnersCount: 3,
    active: false,
    ended: true,
    ideaIds: [204, 205],
    winningIdeaId: 204,
    winningVotes: 12880000,
  },
  {
    id: 13,
    status: "scheduled",
    startsAt: "2026-03-01T09:00:00.000Z",
    endsAt: "2026-03-02T09:00:00.000Z",
    totalStake: "$0",
    totalVotes: 0,
    winnersCount: 0,
    active: false,
    ended: false,
    ideaIds: [206],
    winningIdeaId: null,
    winningVotes: 0,
  },
];

const baseIdeas: Idea[] = [
  {
    id: 201,
    roundId: 12,
    author: PRIMARY_USER_ADDRESS,
    title: "Governance Analytics Dashboard",
    summary: "A dashboard for round-level insights, participation quality, and outcomes.",
    description:
      "Build an open analytics dashboard for Idea Registry and voting rounds with metrics for turnout quality, quorum health, and payout tracking.",
    link: "https://example.com/ideas/201",
    createdAt: "2026-02-10T11:30:00.000Z",
    totalVotes: 10410000,
    statusCode: 1,
    status: "Voting",
    category: "1",
  },
  {
    id: 202,
    roundId: 12,
    author: PRIMARY_USER_ADDRESS,
    title: "Grant Recipient Verification Toolkit",
    summary: "On-chain and off-chain verification helper toolkit for grantees.",
    description:
      "Create a verification toolkit to validate grant recipient milestones and attest deliverables before treasury release.",
    link: "https://example.com/ideas/202",
    createdAt: "2026-02-10T14:15:00.000Z",
    totalVotes: 3250000,
    statusCode: 0,
    status: "Pending",
    category: "2",
  },
  {
    id: 203,
    roundId: 12,
    author: "0x33bE...0Aef",
    title: "Open-source Voter Reputation Module",
    summary: "Improved reputation scoring with transparent formulas and anti-abuse checks.",
    description:
      "Ship a modular reputation engine with anti-sybil heuristics and transparent scoring formulas for high-signal voting.",
    link: "https://example.com/ideas/203",
    createdAt: "2026-02-09T09:50:00.000Z",
    totalVotes: 4980000,
    statusCode: 3,
    status: "Funded",
    category: "1",
  },
  {
    id: 204,
    roundId: 11,
    author: "0x4F91...A95c",
    title: "Wallet Connectors for Multi-Network",
    summary: "Reliable wallet connection layer for local Arc-style testing and stablecoin flows.",
    description:
      "Deliver robust wallet connectors with consistent network switching and safer transaction prompts across supported chains.",
    link: "https://example.com/ideas/204",
    createdAt: "2026-01-25T09:00:00.000Z",
    totalVotes: 12880000,
    statusCode: 2,
    status: "WonVoting",
    category: "2",
  },
  {
    id: 205,
    roundId: 11,
    author: "0x9bF8...2F3D",
    title: "Proposal Templates Pack",
    summary: "Standardized proposal templates for faster submission quality.",
    description:
      "Author template packs and rubric checklists to reduce low-quality proposals and improve reviewer throughput.",
    link: "https://example.com/ideas/205",
    createdAt: "2026-01-24T17:40:00.000Z",
    totalVotes: 9560000,
    statusCode: 4,
    status: "Rejected",
    category: "2",
  },
  {
    id: 206,
    roundId: 13,
    author: PRIMARY_USER_ADDRESS,
    title: "BERT Academy Launch",
    summary: "Beginner learning track about stablecoin voting and grant execution.",
    description:
      "Launch onboarding lessons and walkthrough missions that teach builder grants, USDC voting, and delivery reporting.",
    link: "https://example.com/ideas/206",
    createdAt: "2026-02-11T08:20:00.000Z",
    totalVotes: 0,
    statusCode: 5,
    status: "Completed",
    category: "1",
  },
];

const generatedRoundCount = 35;
const generatedRoundStartId = 100;
const generatedIdeaStartId = 300;
const generatedStatuses: IdeaStatus[] = ["Pending", "Voting", "WonVoting", "Funded", "Rejected", "Completed"];

const generatedIdeas: Idea[] = Array.from({ length: generatedRoundCount }, (_, index) => {
  const ideaId = generatedIdeaStartId + index;
  const roundId = generatedRoundStartId + index;
  const status = generatedStatuses[index % generatedStatuses.length];
  const statusCode = generatedStatuses.indexOf(status);

  return {
    id: ideaId,
    roundId,
    author: index < 22 ? PRIMARY_USER_ADDRESS : `0xB${String(index).padStart(3, "0")}...AA${String(index).padStart(2, "0")}`,
    title: `Community Idea #${ideaId}`,
    summary: `Execution proposal for round #${roundId}.`,
    description: `Detailed idea specification for round #${roundId}.`,
    link: `https://example.com/ideas/${ideaId}`,
    createdAt: new Date(Date.UTC(2026, 1, 1 + index, 10, 0, 0)).toISOString(),
    totalVotes: 2_000_000 + index * 120_000,
    statusCode,
    status,
    category: index % 2 === 0 ? "1" : "2",
  };
});

const generatedRounds: Round[] = Array.from({ length: generatedRoundCount }, (_, index) => {
  const id = generatedRoundStartId + index;
  const linkedIdea = generatedIdeas[index];
  const status: RoundStatus = index < 12 ? "active" : index < 24 ? "finalized" : "scheduled";
  const startsAt = new Date(Date.UTC(2026, 0, 1 + index, 8, 0, 0)).toISOString();
  const endsAt = new Date(Date.UTC(2026, 0, 2 + index, 8, 0, 0)).toISOString();

  return {
    id,
    status,
    startsAt,
    endsAt,
    totalStake: "$0",
    totalVotes: linkedIdea.totalVotes,
    winnersCount: 1,
    active: status === "active",
    ended: status === "finalized",
    ideaIds: [linkedIdea.id],
    winningIdeaId: status === "finalized" ? linkedIdea.id : null,
    winningVotes: status === "finalized" ? linkedIdea.totalVotes : 0,
  };
});

export const rounds: Round[] = [...baseRounds, ...generatedRounds];
export const ideas: Idea[] = [...baseIdeas, ...generatedIdeas];

export const userProfile: UserProfile = {
  address: PRIMARY_USER_ADDRESS,
  nickname: "Builder-Atlas",
  reputation: 742,
  level: 6,
  ideasSubmitted: 9,
  ideasFunded: 3,
  votesCast: 87,
  usdcBalance: "48,500 USDC",
};

export const roundVoteEntries: Record<number, VoteEntry[]> = {
  12: [
    { address: "0xA92d...52b1", ideaId: 201, votingPower: "1.20M USDC", votes: 118, txHash: "0x8ac4...11f2" },
    { address: "0xD10f...778a", ideaId: 202, votingPower: "980K USDC", votes: 96, txHash: "0x31be...442a" },
    { address: "0x33bE...0Aef", ideaId: 203, votingPower: "740K USDC", votes: 72, txHash: "0x6fad...9c40" },
    { address: "0x4C1a...A3c9", ideaId: 201, votingPower: "410K USDC", votes: 43, txHash: "0x90b1...b10e" },
    { address: "0x8E02...661A", ideaId: 202, votingPower: "640K USDC", votes: 66, txHash: "0x7d2c...f8e3" },
    { address: "0x772b...90Df", ideaId: 203, votingPower: "350K USDC", votes: 31, txHash: "0x2abc...0de1" },
  ],
  11: [
    { address: "0x7F10...c2d8", ideaId: 204, votingPower: "1.34M USDC", votes: 129, txHash: "0x1f77...2aa1" },
    { address: "0x5e9A...d443", ideaId: 204, votingPower: "1.12M USDC", votes: 108, txHash: "0xab19...f77b" },
    { address: "0x9912...EE0f", ideaId: 205, votingPower: "560K USDC", votes: 54, txHash: "0xaa62...7be1" },
  ],
  13: [],
};

export const ideaVoteEntries: Record<number, VoteEntry[]> = {
  201: [
    { address: "0xA92d...52b1", ideaId: 201, votingPower: "1.20M USDC", votes: 118, txHash: "0x8ac4...11f2" },
    { address: "0xD10f...778a", ideaId: 201, votingPower: "980K USDC", votes: 96, txHash: "0x31be...442a" },
    { address: "0x4C1a...A3c9", ideaId: 201, votingPower: "410K USDC", votes: 43, txHash: "0x90b1...b10e" },
  ],
  202: [
    { address: "0x8E02...661A", ideaId: 202, votingPower: "640K USDC", votes: 66, txHash: "0x7d2c...f8e3" },
    { address: "0x772b...90Df", ideaId: 202, votingPower: "350K USDC", votes: 31, txHash: "0x2abc...0de1" },
  ],
  203: [
    { address: "0x33bE...0Aef", ideaId: 203, votingPower: "740K USDC", votes: 72, txHash: "0x6fad...9c40" },
  ],
  204: [
    { address: "0x7F10...c2d8", ideaId: 204, votingPower: "1.34M USDC", votes: 129, txHash: "0x1f77...2aa1" },
    { address: "0x5e9A...d443", ideaId: 204, votingPower: "1.12M USDC", votes: 108, txHash: "0xab19...f77b" },
  ],
  205: [{ address: "0x9912...EE0f", ideaId: 205, votingPower: "560K USDC", votes: 54, txHash: "0xaa62...7be1" }],
  206: [],
};

export function getRoundById(id: number) {
  return rounds.find((round) => round.id === id);
}

export function getIdeaById(id: number) {
  return ideas.find((idea) => idea.id === id);
}

export function getIdeasByRoundId(roundId: number) {
  return ideas.filter((idea) => idea.roundId === roundId);
}

export function getIdeasByUser(address: string) {
  const normalized = address.toLowerCase();
  return ideas.filter((idea) => idea.author.toLowerCase() === normalized);
}

export function getRoundVoteEntries(roundId: number) {
  return roundVoteEntries[roundId] ?? [];
}

export function getIdeaVoteEntries(ideaId: number) {
  return ideaVoteEntries[ideaId] ?? [];
}
