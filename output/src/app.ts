import Fastify, { type FastifyInstance } from "fastify";
import { DominioErro, ELENCO_ID_RE } from "@janela-galo/core";
import type { ElencoStore } from "./store.js";

export function criarApp(
  store: ElencoStore,
  corsOrigin = "http://localhost:5173",
  tipoStore = "custom",
): FastifyInstance {
  const app = Fastify({ logger: true });

  app.addHook("onRequest", async (req, reply) => {
    reply.header("access-control-allow-origin", corsOrigin);
    reply.header("access-control-allow-headers", "content-type");
    reply.header("access-control-allow-methods", "GET,OPTIONS");
    if (req.method === "OPTIONS") {
      return reply.code(204).send();
    }
  });

  app.get("/health", async () => ({ ok: true, store: tipoStore }));

  app.get("/elencos", async () => store.listar());

  app.get<{ Params: { id: string } }>("/elencos/:id", async (req, reply) => {
    const { id } = req.params;
    if (!ELENCO_ID_RE.test(id)) {
      return reply.code(400).send({ erro: "id inválido, use AAAA-1 ou AAAA-2" });
    }
    const elenco = await store.obter(id);
    if (!elenco) return reply.code(404).send({ erro: "elenco não encontrado" });
    return elenco;
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof DominioErro) {
      return reply.code(422).send({ erro: err.message });
    }
    app.log.error(err);
    return reply.code(500).send({ erro: "erro interno" });
  });

  return app;
}
