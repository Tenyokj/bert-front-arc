export type SubgraphRound = {
  id: string;
  startTime: string;
  endTime: string;
  active: boolean;
  ended: boolean;
  totalVotes: string;
  winningIdeaId: string;
  ideaIds: string[];
};

export type SubgraphIdea = {
  id: string;
  author: string;
  title: string;
  description: string;
  link: string;
  createdAt: string;
  totalVotes: string;
  status: string;
  roundId?: string | null;
};

export type SubgraphVote = {
  id: string;
  roundId: string;
  ideaId: string;
  voter: string;
  amount: string;
  timestamp: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
const SUBGRAPH_PAGE_SIZE = 1000;
const SUBGRAPH_CACHE_TTL_MS = 15_000;
const subgraphCache = new Map<string, { expiresAt: number; data: unknown }>();

function getSubgraphProxyUrl() {
  if (typeof window !== "undefined") {
    return "/api/subgraph";
  }

  return null;
}

function clampSubgraphPageSize(first: number) {
  if (!Number.isFinite(first) || first <= 0) return SUBGRAPH_PAGE_SIZE;
  return Math.min(Math.floor(first), SUBGRAPH_PAGE_SIZE);
}

async function collectSubgraphPages<T>(
  fetchPage: (first: number, skip: number) => Promise<T[]>,
  pageSize = SUBGRAPH_PAGE_SIZE
) {
  const normalizedPageSize = clampSubgraphPageSize(pageSize);
  const rows: T[] = [];
  let skip = 0;

  while (true) {
    const page = await fetchPage(normalizedPageSize, skip);
    rows.push(...page);
    if (page.length < normalizedPageSize) break;
    skip += page.length;
  }

  return rows;
}

export function hasSubgraphConfigured() {
  return Boolean(subgraphUrl);
}

export async function fetchGraphQL<T>(query: string, variables?: Record<string, unknown>) {
  if (!subgraphUrl) {
    throw new Error("NEXT_PUBLIC_SUBGRAPH_URL is not set");
  }

  const cacheKey = JSON.stringify([query, variables ?? null]);
  const now = Date.now();
  const cached = subgraphCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const requestUrl = getSubgraphProxyUrl();
  if (!requestUrl) {
    throw new Error("Subgraph proxy route is unavailable in this environment");
  }

  const res = await fetch(requestUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Subgraph request failed: ${res.status}${text ? ` ${text}` : ""}`);
  }

  const payload = (await res.json()) as GraphQLResponse<T>;
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((entry) => entry.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("Subgraph response has no data");
  }

  subgraphCache.set(cacheKey, {
    expiresAt: now + SUBGRAPH_CACHE_TTL_MS,
    data: payload.data,
  });

  return payload.data;
}

const ROUNDS_QUERY = `
  query Rounds($first: Int!, $skip: Int!) {
    rounds(first: $first, skip: $skip, orderBy: id, orderDirection: desc) {
      id
      startTime
      endTime
      active
      ended
      totalVotes
      winningIdeaId
      ideaIds
    }
  }
`;

export async function fetchRoundsPageFromSubgraph(first: number, skip: number) {
  const data = await fetchGraphQL<{ rounds: SubgraphRound[] }>(ROUNDS_QUERY, {
    first: clampSubgraphPageSize(first),
    skip,
  });

  return data.rounds;
}

const IDEAS_QUERY = `
  query Ideas($first: Int!, $skip: Int!) {
    ideas(first: $first, skip: $skip, orderBy: id, orderDirection: desc) {
      id
      author
      title
      description
      link
      createdAt
      totalVotes
      status
      roundId
    }
  }
`;

export async function fetchIdeasPageFromSubgraph(first: number, skip: number) {
  const data = await fetchGraphQL<{ ideas: SubgraphIdea[] }>(IDEAS_QUERY, {
    first: clampSubgraphPageSize(first),
    skip,
  });
  return data.ideas;
}

export async function fetchAllIdeasFromSubgraph() {
  return collectSubgraphPages((first, skip) =>
    fetchIdeasPageFromSubgraph(first, skip)
  );
}

const ROUND_BY_ID_QUERY = `
  query RoundById($id: ID!) {
    round(id: $id) {
      id
      startTime
      endTime
      active
      ended
      totalVotes
      winningIdeaId
      ideaIds
    }
  }
`;

export async function fetchRoundByIdFromSubgraph(roundId: string) {
  const data = await fetchGraphQL<{ round: SubgraphRound | null }>(ROUND_BY_ID_QUERY, {
    id: roundId,
  });
  return data.round;
}

const IDEA_BY_ID_QUERY = `
  query IdeaById($id: ID!) {
    idea(id: $id) {
      id
      author
      title
      description
      link
      createdAt
      totalVotes
      status
      roundId
    }
  }
`;

export async function fetchIdeaByIdFromSubgraph(ideaId: string) {
  const data = await fetchGraphQL<{ idea: SubgraphIdea | null }>(IDEA_BY_ID_QUERY, {
    id: ideaId,
  });
  return data.idea;
}

const IDEAS_BY_IDS_QUERY = `
  query IdeasByIds($ids: [ID!]!) {
    ideas(where: { id_in: $ids }, first: 1000) {
      id
      author
      title
      description
      link
      createdAt
      totalVotes
      status
      roundId
    }
  }
`;

export async function fetchIdeasByIdsFromSubgraph(ids: string[]) {
  if (!ids.length) return [] as SubgraphIdea[];
  const data = await fetchGraphQL<{ ideas: SubgraphIdea[] }>(IDEAS_BY_IDS_QUERY, {
    ids,
  });
  return data.ideas;
}

const IDEAS_BY_AUTHOR_QUERY = `
  query IdeasByAuthor($author: Bytes!, $first: Int!, $skip: Int!) {
    ideas(
      where: { author: $author }
      first: $first
      skip: $skip
      orderBy: id
      orderDirection: desc
    ) {
      id
      author
      title
      description
      link
      createdAt
      totalVotes
      status
      roundId
    }
  }
`;

export async function fetchIdeasByAuthorFromSubgraph(
  author: string,
  first = SUBGRAPH_PAGE_SIZE,
  skip = 0
) {
  const data = await fetchGraphQL<{ ideas: SubgraphIdea[] }>(IDEAS_BY_AUTHOR_QUERY, {
    author: author.toLowerCase(),
    first: clampSubgraphPageSize(first),
    skip,
  });
  return data.ideas;
}

export async function fetchAllIdeasByAuthorFromSubgraph(author: string) {
  return collectSubgraphPages((first, skip) =>
    fetchIdeasByAuthorFromSubgraph(author, first, skip)
  );
}

const VOTES_BY_ROUND_QUERY = `
  query VotesByRound($roundId: BigInt!, $first: Int!, $skip: Int!) {
    votes(
      first: $first
      skip: $skip
      where: { roundId: $roundId }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      roundId
      ideaId
      voter
      amount
      timestamp
    }
  }
`;

export async function fetchVotesByRoundFromSubgraph(
  roundId: string,
  first = SUBGRAPH_PAGE_SIZE,
  skip = 0
) {
  const data = await fetchGraphQL<{ votes: SubgraphVote[] }>(VOTES_BY_ROUND_QUERY, {
    roundId,
    first: clampSubgraphPageSize(first),
    skip,
  });
  return data.votes;
}

export async function fetchAllVotesByRoundFromSubgraph(roundId: string) {
  return collectSubgraphPages((first, skip) =>
    fetchVotesByRoundFromSubgraph(roundId, first, skip)
  );
}

const VOTES_BY_IDEA_QUERY = `
  query VotesByIdea($ideaId: BigInt!, $first: Int!, $skip: Int!) {
    votes(
      first: $first
      skip: $skip
      where: { ideaId: $ideaId }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      roundId
      ideaId
      voter
      amount
      timestamp
    }
  }
`;

export async function fetchVotesByIdeaFromSubgraph(
  ideaId: string,
  first = SUBGRAPH_PAGE_SIZE,
  skip = 0
) {
  const data = await fetchGraphQL<{ votes: SubgraphVote[] }>(VOTES_BY_IDEA_QUERY, {
    ideaId,
    first: clampSubgraphPageSize(first),
    skip,
  });
  return data.votes;
}

export async function fetchAllVotesByIdeaFromSubgraph(ideaId: string) {
  return collectSubgraphPages((first, skip) =>
    fetchVotesByIdeaFromSubgraph(ideaId, first, skip)
  );
}

const ACTIVE_ROUNDS_QUERY = `
  query ActiveRounds($first: Int!, $skip: Int!) {
    rounds(
      first: $first
      skip: $skip
      where: { active: true, ended: false }
      orderBy: id
      orderDirection: desc
    ) {
      id
    }
  }
`;

export async function fetchActiveRoundsPageFromSubgraph(first: number, skip: number) {
  const data = await fetchGraphQL<{ rounds: Array<{ id: string }> }>(ACTIVE_ROUNDS_QUERY, {
    first: clampSubgraphPageSize(first),
    skip,
  });
  return data.rounds;
}

const SEARCH_QUERY = `
  query Search($q: String!, $first: Int!) {
    rounds(first: $first, where: { id_contains: $q }, orderBy: id, orderDirection: desc) {
      id
      totalVotes
    }
    ideas(first: $first, where: { title_contains_nocase: $q }, orderBy: id, orderDirection: desc) {
      id
      title
      totalVotes
    }
  }
`;

export async function searchSubgraph(q: string, first: number) {
  const data = await fetchGraphQL<{
    rounds: Array<{ id: string; totalVotes: string }>;
    ideas: Array<{ id: string; title: string; totalVotes: string }>;
  }>(SEARCH_QUERY, { q, first });
  return data;
}
