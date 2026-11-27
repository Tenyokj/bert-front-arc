import { isAddress, zeroAddress } from "viem";

const loopback = (hostname: string) => ["localhost", "127.0.0.1", "[::1]"].includes(hostname);

export function demoProofUrl(backend: string, environment: string | undefined, origin: string) {
  const local = new URL(origin);
  return environment === "development" && loopback(local.hostname) ? "/api/local-demo-proof" : `${backend.replace(/\/$/, "")}/api/pop/demo-proof`;
}

type Configuration = { environment: string | undefined; enabled: boolean; chain: string | undefined; backend: string | undefined; verifier: string | undefined };
export async function forwardLocalDemo(request: Request, config: Configuration, fetcher: typeof fetch = fetch): Promise<Response> {
  const json = (value: unknown, status: number) => Response.json(value, { status, headers: { "cache-control": "no-store" } });
  const url = new URL(request.url);
  if (config.environment !== "development" || !config.enabled || !loopback(url.hostname) || (config.chain || "arc").toLowerCase() !== "arc") return json({ error: "Local demo relay is unavailable." }, 404);
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (request.headers.get("origin") !== url.origin) return json({ error: "Same-origin request required." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "JSON request required." }, 415);
  if (!config.backend || !config.verifier || !isAddress(config.verifier, { strict: false }) || config.verifier.toLowerCase() === zeroAddress) return json({ error: "Demo backend/verifier is not configured." }, 503);
  let target: URL;
  try {
    target = new URL(`${config.backend.replace(/\/$/, "")}/api/pop/demo-proof`);
    if (!["http:", "https:"].includes(target.protocol) || target.username || target.password || target.search || target.hash) throw Error("Invalid backend URL");
  } catch { return json({ error: "Invalid demo backend configuration." }, 503); }
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 2048) return json({ error: "Request too large." }, 413);
    body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw Error("Invalid body");
  } catch { return json({ error: "Invalid JSON body." }, 400); }
  if (body.chainId !== 5042002 || typeof body.walletAddress !== "string" || !isAddress(body.walletAddress, { strict: false }) || body.walletAddress.toLowerCase() === zeroAddress || typeof body.verifierAddress !== "string" || body.verifierAddress.toLowerCase() !== config.verifier.toLowerCase() || Object.keys(body).some((key) => !["chainId", "walletAddress", "verifierAddress"].includes(key))) return json({ error: "Only an Arc Testnet demo request for the configured verifier is allowed." }, 400);
  try {
    const upstream = await fetcher(target, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ walletAddress: body.walletAddress, chainId: 5042002, verifierAddress: config.verifier }),
      signal: AbortSignal.timeout(15_000), redirect: "error", cache: "no-store",
    });
    if (!upstream.ok) return json({ error: `Demo backend returned HTTP ${upstream.status}. Check its testnet demo configuration.` }, 502);
    return json(await upstream.json(), 200);
  } catch { return json({ error: "Demo backend unavailable. No verification was completed by this relay." }, 502); }
}
