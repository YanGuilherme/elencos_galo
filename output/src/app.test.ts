import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { criarApp } from "./app.js";
import { DominioErro, type Elenco, type ElencoResumo } from "@janela-galo/core";
import type { ElencoStore } from "./store.js";

const elenco: Elenco = {
  id: "2025-1",
  rotulo: "ELENCO 2025-1",
  ano: 2025,
  janela: 1,
  jogadores: [],
};
const indice: ElencoResumo[] = [{ id: "2025-1", rotulo: "ELENCO 2025-1", ano: 2025, janela: 1 }];
const apps: ReturnType<typeof criarApp>[] = [];

function criarStore(overrides: Partial<ElencoStore> = {}): ElencoStore {
  return {
    async listar() {
      return indice;
    },
    async obter(id) {
      return id === elenco.id ? elenco : null;
    },
    ...overrides,
  };
}

function criarAppTeste(store = criarStore()) {
  const app = criarApp(store, "http://localhost:5173", "test");
  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("API de elencos", () => {
  it("lista elencos e retorna CORS configurado", async () => {
    const resposta = await criarAppTeste().inject({ method: "GET", url: "/elencos" });
    assert.equal(resposta.statusCode, 200);
    assert.deepEqual(resposta.json(), indice);
    assert.equal(resposta.headers["access-control-allow-origin"], "http://localhost:5173");
  });

  it("informa no health check qual origem de dados foi configurada", async () => {
    const resposta = await criarAppTeste().inject({ method: "GET", url: "/health" });
    assert.equal(resposta.statusCode, 200);
    assert.deepEqual(resposta.json(), { ok: true, store: "test" });
  });

  it("retorna um elenco existente e valida o formato do ID", async () => {
    const app = criarAppTeste();
    const resposta = await app.inject({ method: "GET", url: "/elencos/2025-1" });
    const idInvalido = await app.inject({ method: "GET", url: "/elencos/invalido" });
    assert.equal(resposta.statusCode, 200);
    assert.deepEqual(resposta.json(), elenco);
    assert.equal(idInvalido.statusCode, 400);
  });

  it("retorna 404 para elenco ausente e 422 para erro de domínio", async () => {
    const ausente = await criarAppTeste().inject({ method: "GET", url: "/elencos/2026-2" });
    const invalido = await criarAppTeste(
      criarStore({
        async obter() {
          throw new DominioErro("elenco inválido");
        },
      }),
    ).inject({ method: "GET", url: "/elencos/2025-1" });
    assert.equal(ausente.statusCode, 404);
    assert.equal(invalido.statusCode, 422);
    assert.deepEqual(invalido.json(), { erro: "elenco inválido" });
  });

  it("responde preflight OPTIONS sem corpo", async () => {
    const resposta = await criarAppTeste().inject({ method: "OPTIONS", url: "/elencos" });
    assert.equal(resposta.statusCode, 204);
    assert.equal(resposta.headers["access-control-allow-methods"], "GET,OPTIONS");
  });
});
