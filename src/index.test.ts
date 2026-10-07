import assert from "node:assert/strict";
import test, { mock } from "node:test";

test("busca, persiste e agenda a próxima execução nessa ordem", async () => {
  const { TemperaturePolling } = await import("./index.js");
  const events: string[] = [];
  const source = {
    getTemperature: async () => {
      events.push("buscar");
      return { city: "Canoas", value: 22, measuredAt: new Date() };
    }
  };
  const persistence = {
    save: async () => {
      events.push("salvar");
    }
  };
  mock.method(globalThis, "setTimeout", () => {
    events.push("agendar");
    return 0 as unknown as NodeJS.Timeout;
  });
  const polling = new TemperaturePolling(source, persistence, 10000);

  polling.start();
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(events, ["buscar", "salvar", "agendar"]);
});

test("persiste exatamente a temperatura obtida pela fonte", async () => {
  const { TemperaturePolling } = await import("./index.js");
  const temperature = { city: "Canoas", value: -273.15, measuredAt: new Date() };
  let savedTemperature: unknown;
  const polling = new TemperaturePolling(
    { getTemperature: async () => temperature },
    { save: async value => { savedTemperature = value; } },
    10000
  );

  await polling.execute();

  assert.equal(savedTemperature, temperature);
});

test("não persiste quando a fonte falha", async () => {
  const { TemperaturePolling } = await import("./index.js");
  let saved = false;
  const polling = new TemperaturePolling(
    { getTemperature: async () => { throw new Error("falha na fonte"); } },
    { save: async () => { saved = true; } },
    10000
  );

  await polling.execute();

  assert.equal(saved, false);
});

test("agenda o intervalo mínimo configurado após concluir a execução", async () => {
  const { TemperaturePolling } = await import("./index.js");
  const events: string[] = [];
  mock.method(globalThis, "setTimeout", (_callback: () => void, delay: number) => {
    events.push(`agendar:${delay}`);
    return 0 as unknown as NodeJS.Timeout;
  });
  const polling = new TemperaturePolling(
    { getTemperature: async () => { events.push("buscar"); return { city: "Canoas", value: 0, measuredAt: new Date() }; } },
    { save: async () => { events.push("salvar"); } },
    0
  );

  polling.start();
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(events, ["buscar", "salvar", "agendar:0"]);
});
