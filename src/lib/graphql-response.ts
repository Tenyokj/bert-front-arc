export function graphqlData<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw Error("Subgraph returned an invalid GraphQL response.");
  const row = payload as { data?: unknown; errors?: { message?: unknown }[] };
  if (Array.isArray(row.errors) && row.errors.length) {
    throw Error(row.errors.map((entry) => typeof entry?.message === "string" ? entry.message : "GraphQL query failed").join("; "));
  }
  if (!row.data || typeof row.data !== "object" || Array.isArray(row.data)) {
    throw Error("Subgraph returned no GraphQL data. Check NEXT_PUBLIC_SUBGRAPH_URL: its deployment/version may be unavailable or access may be denied.");
  }
  return row.data as T;
}
