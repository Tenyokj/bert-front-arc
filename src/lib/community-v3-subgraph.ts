import type { Address } from "viem";

export type IndexedCommunity = {
  id: string;
  communityId: bigint;
  creator: Address;
  hub?: Address;
  treasury: Address;
  name: string;
  metadataURI: string;
  active: boolean;
  createdAt: bigint;
};

export type IndexedCommunityRoleSets = {
  admins: Address[];
  validators: Address[];
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

const v3SubgraphUrl = process.env.NEXT_PUBLIC_V3_SUBGRAPH_URL;

/** Returns indexed V3 Communities when a public Graph endpoint is configured. */
export async function fetchIndexedCommunities(
  first: number,
  communityId?: bigint
): Promise<IndexedCommunity[] | null> {
  if (!v3SubgraphUrl) return null;

  const response = await fetch(v3SubgraphUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: `
        query Communities($first: Int!, $where: Community_filter) {
          communities(first: $first, orderBy: createdAt, orderDirection: desc, where: $where) {
            id communityId creator hub treasury name metadataURI active createdAt
          }
        }
      `,
      variables: {
        first,
        where: communityId === undefined ? {} : { communityId: communityId.toString() },
      },
    }),
  });

  if (!response.ok) throw new Error(`V3 subgraph request failed (${response.status})`);
  const payload = (await response.json()) as GraphQLResponse<{ communities: Array<Record<string, string | boolean | null>> }>;
  if (payload.errors?.length) throw new Error(payload.errors[0]?.message || "V3 subgraph query failed");

  return (payload.data?.communities || []).map((community) => ({
    id: String(community.id),
    communityId: BigInt(String(community.communityId)),
    creator: String(community.creator) as Address,
    hub: community.hub ? (String(community.hub) as Address) : undefined,
    treasury: String(community.treasury) as Address,
    name: String(community.name),
    metadataURI: String(community.metadataURI),
    active: Boolean(community.active),
    createdAt: BigInt(String(community.createdAt)),
  }));
}

/** Returns the current local roster indexed from CommunityHub role events. */
export async function fetchIndexedCommunityRoleSets(hub: Address): Promise<IndexedCommunityRoleSets | null> {
  if (!v3SubgraphUrl) return null;

  const response = await fetch(v3SubgraphUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: `
        query CommunityRoleSets($hub: Bytes!) {
          communityMembers(first: 100, where: { community_: { hub: $hub } }) {
            account
            isAdmin
            isValidator
          }
        }
      `,
      variables: { hub },
    }),
  });

  if (!response.ok) throw new Error(`V3 subgraph request failed (${response.status})`);
  const payload = (await response.json()) as GraphQLResponse<{
    communityMembers: Array<{ account: string; isAdmin: boolean; isValidator: boolean }>;
  }>;
  if (payload.errors?.length) throw new Error(payload.errors[0]?.message || "V3 subgraph query failed");

  const members = payload.data?.communityMembers || [];
  return {
    admins: members.filter((member) => member.isAdmin).map((member) => member.account as Address),
    validators: members.filter((member) => member.isValidator).map((member) => member.account as Address),
  };
}
