/** Decode the fields used by read-only search instead of asserting an unchecked tuple. */
function field(value: unknown, index: number, name: string): unknown {
  if (Array.isArray(value)) return value[index];
  return value && typeof value === "object" ? (value as Record<string, unknown>)[name] : undefined;
}

function safeId(value: unknown): value is bigint {
  return typeof value === "bigint" && value > 0n && value <= BigInt(Number.MAX_SAFE_INTEGER);
}

export function searchIdeaResult(value: unknown): { id: number; title: string; totalVotes: bigint } | null {
  const id = field(value, 0, "id");
  const title = field(value, 2, "title");
  const totalVotes = field(value, 6, "totalVotes");
  return safeId(id) && typeof title === "string" && typeof totalVotes === "bigint" && totalVotes >= 0n
    ? { id: Number(id), title, totalVotes } : null;
}

export function searchRoundResult(value: unknown): { id: number; totalVotes: bigint } | null {
  const id = field(value, 0, "id");
  const totalVotes = field(value, 6, "totalVotes");
  return safeId(id) && typeof totalVotes === "bigint" && totalVotes >= 0n
    ? { id: Number(id), totalVotes } : null;
}

export function distributionAmount(value: unknown): bigint | null {
  const amount = field(value, 2, "amount");
  return typeof amount === "bigint" && amount >= 0n ? amount : null;
}
