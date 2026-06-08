import { NextRequest, NextResponse } from "next/server";

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
    });

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown subgraph proxy error";

    return NextResponse.json(
      { error: "Subgraph proxy failed", details: message },
      { status: 500 }
    );
  }
}
