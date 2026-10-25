import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { installWallet } from "./e2e/wallet.mjs";

test("test wallet does not access storage in opaque or non-local documents", () => {
  for (const location of [{ protocol: "about:", hostname: "" }, { protocol: "https:", hostname: "example.com" }]) {
    const context = { location, window: {} };
    Object.defineProperty(context, "sessionStorage", { get() { throw new Error("opaque storage must not be read"); } });
    vm.runInNewContext(`(${installWallet.toString()})({ account: '0x123', rpc: 'http://127.0.0.1:18545' })`, context);
    assert.equal(context.window.ethereum, undefined);
  }
});
