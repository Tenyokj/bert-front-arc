/** Converts Community Layer custom errors into concise, actionable wallet messages. */
export function communityErrorMessage(error: unknown): string {
  const technical = error instanceof Error ? error.message : String(error ?? "");

  const messages: Array<[string, string]> = [
    ["BinaryVoteAlreadyCast", "You have already voted on this binary proposal. One wallet can cast only one vote."],
    ["ProposalAuthorCannotVote", "Proposal authors cannot vote on their own binary proposal."],
    ["RoundVoteAlreadyCast", "You have already voted in this Slate Round. One wallet can cast only one round vote."],
    ["VotingNotOpen", "Voting has not been opened for this proposal yet."],
    ["VotingWindowClosed", "Voting is closed for this proposal or round."],
    ["VotingStillOpen", "The on-chain voting deadline has not passed yet, so this item cannot be settled."],
    ["VoteStakeTooLow", "Your stake is below this Community's minimum vote amount."],
    ["VoteAmountCapExceeded", "A single vote cannot exceed the protocol cap of 10,000 USDC."],
    ["InvalidVoteChoice", "Choose YES or NO before submitting your binary vote."],
    ["NotCommunityMember", "Only an active Community Member can perform this action."],
    ["NotCommunityAdmin", "This action requires the Community Admin role."],
    ["NotCommunityValidator", "This action requires the Community Validator role."],
    ["AdminValidatorRoleConflict", "This wallet already holds another active Community role. Community roles are exclusive."],
    ["RoleAlreadyAssigned", "This wallet already holds that Community role."],
    ["ValidatorNotEligible", "This former Member has not reached the Community's validator proposal-point threshold."],
    ["ValidatorSetLocked", "The validator set cannot change while member proposals are awaiting validation."],
    ["AlreadyCommunityMember", "This wallet is already an active Community Member."],
    ["ValidatorDecisionAlreadyCast", "You have already recorded a validation decision for this proposal."],
    ["ExitAlreadyRequested", "A membership exit request is already pending for this wallet."],
    ["ExitNotRequested", "Request a membership exit before trying to finalize it."],
    ["ExitCooldownNotFinished", "The membership exit cooldown has not finished yet."],
    ["MembershipExitBlocked", "This wallet still has an unresolved proposal or vote lock. Settle it and clear its lock before exiting."],
    ["ProposalNotSettled", "This vote lock can be cleared only after the proposal or round is settled."],
    ["VoteLockNotFound", "This wallet does not have a vote lock for this item."],
    ["VoteLockAlreadyCleared", "This vote lock has already been cleared."],
    ["ValidationWindowClosed", "The validator review window has closed."],
    ["ValidationStillOpen", "The validation deadline has not passed yet."],
    ["ProposalAlreadySettled", "This proposal or round has already been settled."],
    ["InvalidProposalState", "This action is not available in the proposal's current on-chain state."],
    ["InvalidRoundProposal", "This proposal is not eligible for the selected Slate Round."],
    ["RefundNotAvailable", "There is no claimable NO-side refund for this wallet on this proposal."],
    ["RefundAlreadyClaimed", "This NO-side refund has already been claimed by this wallet."],
    ["InsufficientExecutionBalance", "The Community Treasury does not have enough available execution funds."],
    ["WithdrawalAlreadyApproved", "You have already approved this withdrawal request."],
    ["WithdrawalApprovalThresholdNotMet", "More Admin approvals are required before this withdrawal can be executed."],
    ["WithdrawalCancellationAlreadyRequested", "A cancellation request for this withdrawal is already awaiting the Admin quorum."],
    ["WithdrawalAlreadyCancelled", "This withdrawal has already been cancelled and its execution reservation was released."],
    ["WithdrawalAlreadyExecuted", "This withdrawal has already been executed and cannot be cancelled."],
    ["AdminActionApprovalThresholdNotMet", "More Admin approvals are required before this protected action can execute."],
    ["AdminActionAlreadyApproved", "You have already approved this protected Admin action."],
    ["AdminActionRequestExpired", "This Admin action request expired before reaching execution."],
    ["CommunityIsPaused", "This Community is paused. Governance actions are temporarily unavailable."],
    ["CommunityNotActive", "This Community is not active, so this action is currently unavailable."],
    ["CommunityArchiveBlocked", "Archive is blocked until every pending validation, binary vote, Slate Round, and member proposal is resolved."],
    ["CommunityIsArchived", "This Community is already archived."],
    ["CannotRemoveLastAdmin", "A Community must retain at least one active Admin before archival."],
    ["RoleNotAssigned", "This wallet does not currently hold that Community role."],
  ];

  const match = messages.find(([name]) => technical.includes(name));
  if (match) return match[1];
  if (technical.includes("User rejected") || technical.includes("User denied")) return "Transaction was cancelled in your wallet.";
  if (technical.includes("Internal error")) return "The RPC rejected this transaction. Check the current on-chain state and local V3 FundingPool configuration.";
  return "Transaction failed. Check the current Community state, then try again.";
}

/** Keeps the raw provider message available without making it the primary UI copy. */
export function communityTechnicalError(error: unknown): string | null {
  const message = error instanceof Error ? error.message : error ? String(error) : null;
  return message || null;
}
