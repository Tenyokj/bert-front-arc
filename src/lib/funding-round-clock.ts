/** Mirrors VotingSystem.canEndRound: settlement starts strictly after the chain deadline. */
export function fundingRoundCanSettle(
  round: { active: boolean; ended: boolean; endTime: bigint },
  blockTimestamp: bigint | undefined,
): boolean {
  return round.active && !round.ended && blockTimestamp !== undefined && blockTimestamp > round.endTime;
}
