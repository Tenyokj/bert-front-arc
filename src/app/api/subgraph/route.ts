import { NextRequest, NextResponse } from "next/server";
import { graphqlData } from "@/lib/graphql-response";

const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
const graphApiKey = process.env.GRAPH_STUDIO_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!subgraphUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_SUBGRAPH_URL is not set" },
        { status: 500 }
      );
    }

    if (!graphApiKey) {
      return NextResponse.json(
        { error: "GRAPH_STUDIO_API_KEY is not set" },
        { status: 500 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const upstream = await fetch(subgraphUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${graphApiKey}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!upstream.ok) return NextResponse.json({ error: `Subgraph upstream HTTP ${upstream.status}. Check its URL/version and server API key.` }, { status: 502 });
    let payload: unknown;
    try { payload = await upstream.json(); }
    catch { return NextResponse.json({ error: "Subgraph upstream did not return GraphQL JSON. Check its URL/version." }, { status: 502 }); }
    try { graphqlData(payload); }
    catch {
      // Real GraphQL errors remain visible; provider envelopes never look like successful data.
      if (!payload || typeof payload !== "object" || !("errors" in payload) || !Array.isArray(payload.errors) || !payload.errors.length) return NextResponse.json({ error: "Subgraph returned no GraphQL data. Check NEXT_PUBLIC_SUBGRAPH_URL and its deployed version/access." }, { status: 502 });
    }
    return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Subgraph upstream could not be reached within the request window. Try again or check the configured endpoint." },
      { status: 502 }
    );
  }
}
