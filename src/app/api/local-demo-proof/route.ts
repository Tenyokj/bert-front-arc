import { forwardLocalDemo } from "@/lib/testnet-demo-proxy";

export async function POST(request: Request) {
  return forwardLocalDemo(request, {
    environment: process.env.NODE_ENV,
    enabled: process.env.NEXT_PUBLIC_POP_DEMO_ENABLED === "true",
    chain: process.env.NEXT_PUBLIC_DEFAULT_CHAIN,
    backend: process.env.NEXT_PUBLIC_POP_BACKEND_URL,
    verifier: process.env.NEXT_PUBLIC_POP_VERIFIER_ADDRESS,
  });
}
