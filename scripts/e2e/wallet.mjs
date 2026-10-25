/** Browser-only EIP-1193 test wallet. Signs no credentials and forwards writes only to our owned local node. */
export function installWallet({ account, rpc, accounts = [account] }) {
  // Init scripts also run in opaque about:blank documents, where storage is unavailable.
  if (location.protocol !== "http:" || location.hostname !== "127.0.0.1") return;
  const url = new URL(rpc);
  if (url.hostname !== "127.0.0.1" || url.port !== "18545") throw new Error("Non-local E2E RPC refused");
  const listeners = new Map();
  const savedAccount = sessionStorage.getItem("bert-e2e-selected-account");
  if (savedAccount && accounts.some((candidate) => candidate.toLowerCase() === savedAccount.toLowerCase())) account = savedAccount;
  window.__e2eTransactions = JSON.parse(sessionStorage.getItem("bert-e2e-transactions") || "[]");
  window.__e2eRejectNext = false;
  const call = async (method, params = []) => {
    const response = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
    const body = await response.json();
    if (body.error) throw Object.assign(new Error(body.error.message), body.error);
    return body.result;
  };
  const provider = {
    isMetaMask: true, selectedAddress: account, chainId: "0x7a69", networkVersion: "31337",
    isConnected: () => true,
    on(event, listener) { const set = listeners.get(event) || new Set(); set.add(listener); listeners.set(event, set); return provider; },
    removeListener(event, listener) { listeners.get(event)?.delete(listener); return provider; },
    async request({ method, params = [] }) {
      if (method === "eth_accounts" || method === "eth_requestAccounts") return [account];
      if (method === "eth_chainId") return "0x7a69";
      if (method === "net_version") return "31337";
      if (method === "wallet_requestPermissions" || method === "wallet_getPermissions") return [{ parentCapability: "eth_accounts", caveats: [{ type: "restrictReturnedAccounts", value: [account] }] }];
      if (method === "wallet_getCapabilities") return {};
      if (method === "wallet_switchEthereumChain") {
        if (params[0]?.chainId !== "0x7a69") throw new Error("E2E wallet refuses public chains");
        return null;
      }
      if (method === "eth_sendTransaction") {
        if (params[0]?.from?.toLowerCase() !== account.toLowerCase()) throw new Error("Unexpected transaction sender");
        if (await call("eth_chainId") !== "0x7a69") throw new Error("Local chain identity changed");
        if (window.__e2eRejectNext) { window.__e2eRejectNext = false; throw Object.assign(new Error("User rejected the request."), { code: 4001 }); }
        const hash = await call(method, params);
        window.__e2eTransactions.push(hash);
        sessionStorage.setItem("bert-e2e-transactions", JSON.stringify(window.__e2eTransactions));
        return hash;
      }
      if (/^(eth_(call|get|estimate|block|fee|max|gas)|net_|web3_)/.test(method)) return call(method, params);
      throw Object.assign(new Error(`Unsupported test-wallet method: ${method}`), { code: 4200 });
    },
  };
  Object.defineProperty(window, "ethereum", { value: provider, configurable: true });
  window.__e2eSetAccount = (next) => {
    if (!accounts.some((candidate) => candidate.toLowerCase() === next.toLowerCase())) throw new Error("Unknown local test account");
    account = next;
    provider.selectedAddress = next;
    sessionStorage.setItem("bert-e2e-selected-account", next);
    for (const listener of listeners.get("accountsChanged") || []) listener([next]);
  };
  const announce = () => window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: {
    info: { uuid: "6f8a2204-0868-4245-9b47-3e532f737a2c", name: "MetaMask", icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>", rdns: "io.metamask" }, provider,
  } }));
  window.addEventListener("eip6963:requestProvider", announce);
  announce();
}
