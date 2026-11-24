import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  FundingPoolUpgradeable,
  FundingRoundRevenueBaseSet,
  FundingRoundRevenueSnapshotted,
  ProtocolRevenueAccrued,
  ProtocolRevenueClaimed,
  RevenuePolicyActivated,
  RevenuePolicyCancelled,
  RevenuePolicyScheduled,
} from "../generated/FundingPool/FundingPoolUpgradeable";
import {
  ProtocolRevenueTreasury as TreasuryContract,
  RevenueCollected,
  RevenueReleased,
} from "../generated/templates/ProtocolRevenueTreasury/ProtocolRevenueTreasury";
import { ProtocolRevenueTreasury as TreasuryTemplate } from "../generated/templates";
import {
  FundingRoundRevenue,
  ProtocolRevenueReceiver,
  ProtocolRevenueState,
  RevenueBeneficiary,
  RevenueEvent,
  Round,
} from "../generated/schema";

const ZERO = BigInt.zero();
const BPS = BigInt.fromI32(10000);
const ZERO_ADDRESS = Address.zero();

function state(address: Address, block: BigInt): ProtocolRevenueState {
  const id = address.toHexString();
  let value = ProtocolRevenueState.load(id);
  if (value == null) {
    value = new ProtocolRevenueState(id);
    value.currentPolicyKnown = false;
    value.currentTreasury = ZERO_ADDRESS;
    value.currentShareBps = ZERO;
    value.scheduled = false;
    value.scheduledTreasury = ZERO_ADDRESS;
    value.scheduledShareBps = ZERO;
    value.readyAt = ZERO;
    value.accrued = ZERO;
    value.claimed = ZERO;
    value.pending = ZERO;
    value.firstObservedBlock = block;
  }
  value.updatedAtBlock = block;
  return value;
}

function receiver(address: Address, pool: Address, block: BigInt): ProtocolRevenueReceiver {
  const id = address.toHexString();
  let value = ProtocolRevenueReceiver.load(id);
  if (value == null) {
    value = new ProtocolRevenueReceiver(id);
    value.pool = pool.toHexString();
    value.discoveryStatus = "Unverified";
    value.templateStarted = false;
    value.payeeCount = 0;
    value.accrued = ZERO;
    value.claimed = ZERO;
    value.pending = ZERO;
    value.observedCollected = ZERO;
    value.observedReleased = ZERO;
    value.firstObservedBlock = block;
  }
  assert(value.pool == pool.toHexString(), "Revenue receiver changed pool");
  value.updatedAtBlock = block;
  return value;
}

// Constructor PayeeAdded logs predate discovery. Read only immutable fields here;
// block-end mutable getters would double count same-block collection/release logs.
function discover(address: Address, pool: Address, block: BigInt): ProtocolRevenueReceiver {
  let value = receiver(address, pool, block);
  if (value.templateStarted) return value;
  const contract = TreasuryContract.bind(address);
  const boundPool = contract.try_fundingPool();
  const token = contract.try_usdc();
  const poolToken = FundingPoolUpgradeable.bind(pool).try_usdc();
  const count = contract.try_payeeCount();
  if (boundPool.reverted || token.reverted || poolToken.reverted || count.reverted) {
    value.discoveryStatus = "Unavailable";
    value.save();
    return value;
  }
  if (!boundPool.value.equals(pool) || !token.value.equals(poolToken.value) ||
      token.value.equals(ZERO_ADDRESS) || count.value.lt(BigInt.fromI32(1)) ||
      count.value.gt(BigInt.fromI32(16))) {
    value.discoveryStatus = "Invalid";
    value.save();
    return value;
  }
  const addresses = new Array<Address>();
  const shares = new Array<BigInt>();
  let sum = ZERO;
  for (let i = 0; i < count.value.toI32(); i++) {
    const payee = contract.try_payeeAt(BigInt.fromI32(i));
    if (payee.reverted) {
      value.discoveryStatus = "Unavailable";
      value.save();
      return value;
    }
    const share = contract.try_shares(payee.value);
    if (share.reverted) {
      value.discoveryStatus = "Unavailable";
      value.save();
      return value;
    }
    let duplicate = false;
    for (let j = 0; j < addresses.length; j++) {
      if (addresses[j].equals(payee.value)) duplicate = true;
    }
    if (duplicate || payee.value.equals(ZERO_ADDRESS) || payee.value.equals(pool) ||
        payee.value.equals(address) || share.value.le(ZERO) || share.value.gt(BPS)) {
      value.discoveryStatus = "Invalid";
      value.save();
      return value;
    }
    addresses.push(payee.value);
    shares.push(share.value);
    sum = sum.plus(share.value);
  }
  if (!sum.equals(BPS)) {
    value.discoveryStatus = "Invalid";
    value.save();
    return value;
  }
  for (let i = 0; i < addresses.length; i++) {
    const beneficiary = new RevenueBeneficiary(value.id + "-" + addresses[i].toHexString());
    beneficiary.treasury = value.id;
    beneficiary.address = addresses[i];
    beneficiary.shareBps = shares[i];
    beneficiary.observedReleased = ZERO;
    beneficiary.updatedAtBlock = block;
    beneficiary.save();
  }
  value.token = token.value;
  value.payeeCount = addresses.length;
  value.discoveryStatus = "Indexed";
  value.templateStarted = true;
  value.trackingStartedAtBlock = block;
  value.save();
  TreasuryTemplate.create(address);
  return value;
}

function record(event: ethereum.Event, kind: string, pool: string): RevenueEvent | null {
  const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  if (RevenueEvent.load(id) != null) return null;
  const value = new RevenueEvent(id);
  value.kind = kind;
  value.pool = pool;
  value.txHash = event.transaction.hash;
  value.logIndex = event.logIndex;
  value.timestamp = event.block.timestamp;
  value.blockNumber = event.block.number;
  return value;
}

function clearScheduled(value: ProtocolRevenueState): void {
  value.scheduled = false;
  value.scheduledTreasury = ZERO_ADDRESS;
  value.scheduledShareBps = ZERO;
  value.readyAt = ZERO;
}

export function handleRevenuePolicyScheduled(event: RevenuePolicyScheduled): void {
  const log = record(event, "PolicyScheduled", event.address.toHexString());
  if (log == null) return;
  const value = state(event.address, event.block.number);
  value.scheduled = true;
  value.scheduledTreasury = event.params.treasury;
  value.scheduledShareBps = event.params.shareBps;
  value.readyAt = event.params.readyAt;
  value.save();
  if (!event.params.treasury.equals(ZERO_ADDRESS)) {
    log.treasury = discover(event.params.treasury, event.address, event.block.number).id;
  }
  log.shareBps = event.params.shareBps;
  log.readyAt = event.params.readyAt;
  log.save();
}

export function handleRevenuePolicyCancelled(event: RevenuePolicyCancelled): void {
  const log = record(event, "PolicyCancelled", event.address.toHexString());
  if (log == null) return;
  const value = state(event.address, event.block.number);
  clearScheduled(value);
  value.save();
  log.save();
}

export function handleRevenuePolicyActivated(event: RevenuePolicyActivated): void {
  const log = record(event, "PolicyActivated", event.address.toHexString());
  if (log == null) return;
  const value = state(event.address, event.block.number);
  value.currentPolicyKnown = true;
  value.currentTreasury = event.params.treasury;
  value.currentShareBps = event.params.shareBps;
  clearScheduled(value);
  value.save();
  if (!event.params.treasury.equals(ZERO_ADDRESS)) {
    log.treasury = discover(event.params.treasury, event.address, event.block.number).id;
  }
  log.shareBps = event.params.shareBps;
  log.save();
}

export function handleFundingRoundRevenueSnapshotted(event: FundingRoundRevenueSnapshotted): void {
  const log = record(event, "RoundSnapshotted", event.address.toHexString());
  if (log == null) return;
  state(event.address, event.block.number).save();
  const id = event.address.toHexString() + "-" + event.params.roundId.toString();
  assert(FundingRoundRevenue.load(id) == null, "Round revenue snapshot is immutable");
  assert(Round.load(event.params.roundId.toString()) != null, "Funding round missing");
  const value = new FundingRoundRevenue(id);
  value.pool = event.address.toHexString();
  value.round = event.params.roundId.toString();
  value.roundId = event.params.roundId;
  value.treasuryAddress = event.params.treasury;
  value.shareBps = event.params.shareBps;
  value.baseObserved = false;
  value.eligibleFee = ZERO;
  value.totalFee = ZERO;
  value.accrued = ZERO;
  value.createdAtBlock = event.block.number;
  value.updatedAtBlock = event.block.number;
  if (!event.params.treasury.equals(ZERO_ADDRESS)) {
    value.treasury = discover(event.params.treasury, event.address, event.block.number).id;
    log.treasury = value.treasury;
  }
  value.save();
  log.round = id;
  log.shareBps = event.params.shareBps;
  log.save();
}

export function handleFundingRoundRevenueBaseSet(event: FundingRoundRevenueBaseSet): void {
  const log = record(event, "RoundBaseSet", event.address.toHexString());
  if (log == null) return;
  const value = FundingRoundRevenue.load(event.address.toHexString() + "-" + event.params.roundId.toString());
  if (value == null) {
    assert(false, "Revenue base has no round snapshot");
    return;
  }
  assert(!value.baseObserved, "Revenue base already set");
  assert(event.params.eligibleFee.le(event.params.totalFee), "Eligible fee exceeds total fee");
  value.baseObserved = true;
  value.eligibleFee = event.params.eligibleFee;
  value.totalFee = event.params.totalFee;
  value.updatedAtBlock = event.block.number;
  value.save();
  log.round = value.id;
  log.eligibleFee = event.params.eligibleFee;
  log.totalFee = event.params.totalFee;
  log.save();
}

export function handleProtocolRevenueAccrued(event: ProtocolRevenueAccrued): void {
  const log = record(event, "Accrued", event.address.toHexString());
  if (log == null) return;
  const round = FundingRoundRevenue.load(event.address.toHexString() + "-" + event.params.roundId.toString());
  if (round == null) {
    assert(false, "Accrual has no revenue snapshot");
    return;
  }
  assert(round.baseObserved, "Accrual has no revenue base");
  assert(round.treasuryAddress.equals(event.params.treasury), "Wrong round receiver");
  const value = state(event.address, event.block.number);
  const target = discover(event.params.treasury, event.address, event.block.number);
  round.accrued = round.accrued.plus(event.params.amount);
  assert(round.accrued.le(round.eligibleFee.times(round.shareBps).div(BPS)), "Accrual exceeds pledge fee share");
  round.updatedAtBlock = event.block.number;
  round.save();
  value.accrued = value.accrued.plus(event.params.amount);
  value.pending = value.pending.plus(event.params.amount);
  value.save();
  target.accrued = target.accrued.plus(event.params.amount);
  target.pending = target.pending.plus(event.params.amount);
  target.save();
  log.round = round.id;
  log.treasury = target.id;
  log.amount = event.params.amount;
  log.save();
}

export function handleProtocolRevenueClaimed(event: ProtocolRevenueClaimed): void {
  const log = record(event, "Claimed", event.address.toHexString());
  if (log == null) return;
  const value = state(event.address, event.block.number);
  const target = discover(event.params.treasury, event.address, event.block.number);
  assert(value.pending.ge(event.params.amount) && target.pending.ge(event.params.amount), "Claim exceeds indexed accrual");
  value.claimed = value.claimed.plus(event.params.amount);
  value.pending = value.pending.minus(event.params.amount);
  value.save();
  target.claimed = target.claimed.plus(event.params.amount);
  target.pending = target.pending.minus(event.params.amount);
  target.save();
  log.treasury = target.id;
  log.amount = event.params.amount;
  log.save();
}

export function handleRevenueCollected(event: RevenueCollected): void {
  const target = ProtocolRevenueReceiver.load(event.address.toHexString());
  if (target == null) {
    assert(false, "Untracked revenue Treasury");
    return;
  }
  assert(target.templateStarted, "Untracked revenue Treasury");
  const log = record(event, "Collected", target.pool);
  if (log == null) return;
  // The matching pool Claimed log already reduced pending; never reduce it twice.
  target.observedCollected = target.observedCollected.plus(event.params.amount);
  target.updatedAtBlock = event.block.number;
  target.save();
  log.treasury = target.id;
  log.amount = event.params.amount;
  log.save();
}

export function handleRevenueReleased(event: RevenueReleased): void {
  const target = ProtocolRevenueReceiver.load(event.address.toHexString());
  if (target == null) {
    assert(false, "Untracked revenue Treasury");
    return;
  }
  assert(target.templateStarted, "Untracked revenue Treasury");
  const log = record(event, "Released", target.pool);
  if (log == null) return;
  const payee = RevenueBeneficiary.load(target.id + "-" + event.params.payee.toHexString());
  if (payee == null) {
    assert(false, "Payment to unknown beneficiary");
    return;
  }
  payee.observedReleased = payee.observedReleased.plus(event.params.amount);
  payee.updatedAtBlock = event.block.number;
  payee.save();
  target.observedReleased = target.observedReleased.plus(event.params.amount);
  target.updatedAtBlock = event.block.number;
  target.save();
  log.treasury = target.id;
  log.payee = event.params.payee;
  log.amount = event.params.amount;
  log.save();
}
