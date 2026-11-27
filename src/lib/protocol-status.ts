export type StatusTone = "neutral" | "amber" | "cyan" | "violet" | "blue" | "teal" | "green" | "rose";

const ideaTones: Record<string, StatusTone> = {
  Pending: "amber", Voting: "cyan", WonVoting: "violet", Funded: "blue",
  InProcess: "teal", Completed: "green", Rejected: "rose", Cancelled: "rose",
};

export function ideaStatusTone(status: string): StatusTone {
  return ideaTones[status] ?? "neutral";
}

export function proposalStatusTone(status: number): StatusTone {
  return (["amber", "rose", "blue", "violet", "cyan", "cyan", "green", "rose", "green", "rose", "teal"] as const)[status] ?? "neutral";
}

export function executionStatusTone(status: number): StatusTone {
  return (["neutral", "blue", "cyan", "amber", "violet", "green", "rose", "amber"] as const)[status] ?? "neutral";
}

export function proposalGuidance(status: number) {
  const descriptions: Record<number, string> = {
    0: "Community Validators review this proposal. Voting is not open yet.",
    1: "Validators rejected this proposal. Check the recorded decision and bond state below.",
    2: "An eligible wallet can open binary voting. Members vote only after it opens.",
    3: "Community Admins can include this candidate in a Slate round. It is not a funded winner yet.",
    4: "Eligible Members can vote YES or NO. When the Community-clock deadline passes, finalize the outcome.",
    5: "Eligible Members choose a candidate on its Slate round page. Settlement happens after that round closes.",
    6: "The proposal was accepted. Check its execution plan for proof, authorization and actual payment status.",
    7: "The proposal was rejected. Check your recorded vote and the refund controls for eligibility.",
    8: "This proposal won its round. Selection is not a payout: continue to the execution plan.",
    9: "Another proposal won this round. Open the round to inspect its result and available refunds.",
    10: "The proposal is settled. Inspect the execution plan and your position; this label alone does not prove payment.",
  };
  return descriptions[status] ?? "The proposal state is unconfirmed. Refresh onchain data before deciding what to do.";
}

export function executionGuidance(status: number) {
  return [
    "No execution plan is recorded.",
    "The execution recipient submits the evidence bundle before the proof deadline.",
    "Eligible winning supporters review the proof. Finalization after the review closes determines the next step, not immediate payment.",
    "The recipient waits for the correction cooldown, then reopens and submits a correction before the existing proof deadline.",
    "The review is in its grace stage. Eligible supporters review; finalize when the active Community-clock window closes.",
    "The Manager records execution as completed. Released funds are shown separately below.",
    "Execution failed. Winning supporters can check their remaining refund entitlement; a refund claim is a separate transaction.",
    "Current Community Admins authorize the fixed tranche. Once quorum is reached, a wallet relays the transfer to the fixed recipient.",
  ][status] ?? "Execution status is unconfirmed. Refresh before taking action.";
}

export function slatePhase(round: { settled: boolean; startTime: bigint; endTime: bigint; winningProposalId: bigint }, time?: bigint): { label: string; tone: StatusTone; next: string } {
  if (round.settled) return { label: "Settled", tone: "green", next: round.winningProposalId > 0n ? "Selection is recorded, not payment. Open the winner and its execution plan." : "No winner is recorded. Inspect the round outcome and refund controls." };
  if (time === undefined) return { label: "Checking Community time", tone: "neutral", next: "The time window is unconfirmed. No open-voting claim is made until the Community clock loads." };
  if (time < round.startTime) return { label: "Upcoming", tone: "violet", next: "Voting has not started. Members can review the candidates before the round opens." };
  if (time >= round.endTime) return { label: "Awaiting settlement", tone: "amber", next: "The voting window has closed. Finalize the round to record its outcome." };
  return { label: "Voting open", tone: "cyan", next: "Eligible Members choose one candidate. USDC approval and the vote are separate transactions." };
}
