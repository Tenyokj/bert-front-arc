import {
  getIdeaById,
  getIdeaVoteEntries,
  getIdeasByRoundId,
  getRoundById,
  getRoundVoteEntries,
  ideas,
  rounds,
  userProfile,
} from "@/lib/dapp-mock";

function parseMoney(value: string) {
  return Number(value.replace(/[$,]/g, "")) || 0;
}

const finalizedRounds = rounds.filter((round) => round.ended);
const fundedIdeas = ideas.filter((idea) => idea.status === "Funded" || idea.status === "Completed");

export const demoStats = {
  totalTreasury: rounds.reduce((sum, round) => sum + parseMoney(round.totalStake), 0),
  activeRounds: rounds.filter((round) => round.active && !round.ended).length,
  activeIdeas: ideas.filter((idea) => idea.status === "Voting" || idea.status === "Pending").length,
  grantsDistributed: finalizedRounds.reduce((sum, round) => sum + round.totalVotes / 1_000_000, 0),
  successfulProjects: fundedIdeas.length,
  totalVotesCast: rounds.reduce((sum, round) => sum + round.totalVotes, 0),
};

export const demoHighlights = [
  {
    title: "Ideas become funding candidates",
    description:
      "Builders submit proposals with scope, proof links, and a stake-backed intent to execute.",
  },
  {
    title: "Rounds batch governance decisions",
    description:
      "Curated ideas move into a voting window where the community allocates stablecoin voting power.",
  },
  {
    title: "Winners unlock milestone grants",
    description:
      "Treasury release follows a 30 / 40 / 30 structure so the final payout depends on validated delivery.",
  },
];

export const demoWalkthrough = [
  "Open a live or demo round to see which ideas are competing.",
  "Inspect an idea page to understand author context, status, and vote traction.",
  "Track how treasury capital moves from round outcome to staged grant release.",
];

export {
  getIdeaById,
  getIdeaVoteEntries,
  getIdeasByRoundId,
  getRoundById,
  getRoundVoteEntries,
  ideas,
  rounds,
  userProfile,
};
