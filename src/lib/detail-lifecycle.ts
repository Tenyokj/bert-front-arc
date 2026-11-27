export type JourneyStep = {
  title: string;
  detail: string;
  state: "done" | "current" | "waiting" | "unknown" | "stopped";
};

export type RoundClock = {
  active: boolean;
  ended: boolean;
  startTime: bigint;
  endTime: bigint;
};

export function roundPhase(round: RoundClock, timestamp: bigint | undefined) {
  if (round.ended) return "Settled";
  if (timestamp === undefined) return "Checking chain time";
  if (timestamp < round.startTime) return "Upcoming";
  if (timestamp > round.endTime) return "Awaiting settlement";
  return round.active ? "Voting open" : "Inactive";
}

export function roundJourney(round: RoundClock & { winningIdeaId: bigint }, timestamp: bigint | undefined): JourneyStep[] {
  const phase = roundPhase(round, timestamp);
  return [
    { title: "Proposals admitted", detail: "Inspect each proposal's scope and net funding target.", state: "done" },
    { title: "Pledge window", detail: "One pledge per wallet in this round. Approval alone is not a pledge.", state: round.ended || (timestamp !== undefined && timestamp > round.endTime) ? "done" : phase === "Voting open" ? "current" : timestamp === undefined ? "unknown" : "waiting" },
    { title: "Settle the round", detail: "After the chain deadline, a wallet submits settlement. Time passing alone does not settle a round.", state: round.ended ? "done" : phase === "Awaiting settlement" && round.active ? "current" : "waiting" },
    { title: round.ended && round.winningIdeaId === 0n ? "No winner selected" : "Grant & refunds", detail: round.ended && round.winningIdeaId === 0n ? "Inspect your pledge below for its refund path." : "Selection is not a payout. The winning author claims; subsequent releases require milestone review.", state: round.ended ? round.winningIdeaId === 0n ? "stopped" : "current" : "waiting" },
  ];
}

export function milestoneMode(backer: unknown) {
  return backer === true ? "Backer review / 20-40-40" : backer === false ? "Legacy review / 30-40-30" : "Review mode unavailable";
}

type GrantProgress = { initialClaimed: boolean; inProcessPaid: boolean; completionPaid: boolean; cancelled: boolean };
export function ideaJourney(input: {
  roundId: number | null;
  round: (RoundClock & { winningIdeaId: bigint }) | null;
  ideaId: bigint;
  payout: GrantProgress | null;
  backer: unknown;
  stageOneActive: boolean | undefined;
  stageTwoActive: boolean | undefined;
}): JourneyStep[] {
  const { roundId, round, ideaId, payout, backer } = input;
  const selected = round?.ended && round.winningIdeaId === ideaId;
  const stopped = !!round?.ended && !selected;
  const cancelled = !!payout?.cancelled;
  const percentages = backer === true ? [20, 40, 40] : backer === false ? [30, 40, 30] : null;
  const tranche = (index: number) => percentages ? `${percentages[index]}%` : "mode unconfirmed";
  const paidState = (paid: boolean | undefined, current: boolean): JourneyStep["state"] => paid ? "done" : cancelled || stopped ? "stopped" : !payout && selected ? "unknown" : current ? "current" : "waiting";
  return [
    { title: "Proposal published", detail: "The proposal record exists; this does not mean it is funded.", state: "done" },
    { title: "Round & selection", detail: roundId === null ? "No round association found in the loaded data." : !round ? `Round #${roundId}: status unavailable.` : !round.ended ? `Round #${roundId}: voting and settlement precede selection.` : selected ? `Selected in round #${roundId}. No payout is inferred from selection.` : `Not selected in round #${roundId}.`, state: selected ? "done" : stopped ? "stopped" : round ? "current" : roundId === null ? "waiting" : "unknown" },
    { title: `Initial release / ${tranche(0)}`, detail: payout?.initialClaimed ? "Initial claim recorded by GrantManager." : cancelled ? "Grant cancelled; unpaid releases are not available." : "Only the winning author can claim, subject to contract checks.", state: paidState(payout?.initialClaimed, !!selected) },
    { title: `In-process / ${tranche(1)}`, detail: payout?.inProcessPaid ? "In-process payout recorded." : input.stageOneActive ? "Proof submitted. Review is not yet a confirmed payout." : "Author supplies proof; the round's reviewers assess it.", state: paidState(payout?.inProcessPaid, !!payout?.initialClaimed) },
    { title: `Completion / ${tranche(2)}`, detail: payout?.completionPaid ? "Completion payout recorded." : input.stageTwoActive ? "Completion proof is under review; release remains unconfirmed." : "Delivery evidence and the final review precede the last release.", state: paidState(payout?.completionPaid, !!payout?.inProcessPaid) },
  ];
}

export function utcDeadline(timestamp: bigint | undefined): string {
  if (timestamp === undefined || timestamp <= 0n) return "Unavailable";
  const date = new Date(Number(timestamp) * 1000);
  if (!Number.isFinite(date.getTime())) return "Unavailable";
  return `${date.toISOString().slice(0, 19).replace("T", " ")} UTC`;
}

export function voteReadiness(input: {
  connected: boolean;
  correctChain: boolean;
  round: RoundClock;
  timestamp: bigint | undefined;
  hasVoted: boolean | undefined;
}) {
  if (!input.connected) return "Connect your wallet to pledge. You can browse without connecting.";
  if (!input.correctChain) return "Switch your wallet to the app's network before signing.";
  const phase = roundPhase(input.round, input.timestamp);
  if (phase !== "Voting open") return phase === "Checking chain time" ? "Waiting for the latest chain time. Voting is disabled until it is available." : `${phase}. New pledges are not available.`;
  if (input.hasVoted === undefined) return "Reading this wallet's participation. No voting eligibility is assumed yet.";
  if (input.hasVoted) return "This wallet has already pledged in this round. A second pledge is not allowed.";
  return null;
}
