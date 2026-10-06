import assert from "node:assert/strict";
import test from "node:test";

test("agenda a próxima execução somente depois de o fetch terminar", async () => {
  const originalFetch = globalThis.fetch;
  const originalSetTimeout = globalThis.setTimeout;
  let resolveFetch!: (response: Response) => void;
  let timeoutScheduled = false;

  globalThis.fetch = async () => new Promise<Response>(resolve => {
    resolveFetch = resolve;
  });
  globalThis.setTimeout = ((callback: (...args: never[]) => void) => {
    timeoutScheduled = true;
    return 0 as unknown as NodeJS.Timeout;
  }) as unknown as typeof setTimeout;

  try {
    await import(`./index.ts?test=${Date.now()}`);

    assert.equal(timeoutScheduled, false);

    resolveFetch(new Response(JSON.stringify({ current: { temperature_2m: 22 } }), {
      status: 200,
      headers: { "content-type": "application/json" }
    }));

    await new Promise(resolve => originalSetTimeout(resolve, 100));
    assert.equal(timeoutScheduled, true);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
  }
});
