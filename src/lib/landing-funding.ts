export const grantStages = [
  { label: "Grant claimed", progress: 20, detail: "The initial 20% is released when the winning author claims the grant." },
  { label: "Progress approved", progress: 60, detail: "Eligible winning backers approve the first milestone proof. Another 40% is released." },
  { label: "Delivery approved", progress: 100, detail: "The completion proof passes backer review. The final 40% is released." },
] as const;

/** An illustrative pledge-only grant, not a quote, live balance or policy read. */
export function fundingExample(pledges: number, stage: number) {
  if (!Number.isSafeInteger(pledges) || pledges < 100 || pledges > 10000 || !Number.isInteger(stage) || stage < 0 || stage >= grantStages.length) {
    throw new RangeError("Invalid illustrative funding input");
  }
  const paidGross = pledges * grantStages[stage].progress / 100;
  const earnedFee = paidGross * 0.05;
  const revenue = earnedFee * 0.2;
  return { author: paidGross - earnedFee, reserve: earnedFee - revenue, revenue, escrow: pledges - paidGross };
}
