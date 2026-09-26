import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { validarElenco, type Elenco, type ElencoResumo } from "@janela-galo/core";
import type { ElencoStore } from "./store.js";

async function bodyToString(body: unknown): Promise<string> {
  if (!body || typeof body !== "object") return "";
  const stream = body as { transformToString?: () => Promise<string> };
  if (typeof stream.transformToString === "function") {
    return stream.transformToString();
  }
  throw new Error("Resposta S3 sem body");
}

export function storeS3(bucket: string, region: string): ElencoStore {
  const client = new S3Client({ region });

  async function getJson<T>(key: string): Promise<T | null> {
    try {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const text = await bodyToString(res.Body);
      return JSON.parse(text) as T;
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === "NoSuchKey" || name === "NotFound") return null;
      throw err;
    }
  }

  return {
    async listar() {
      const index = await getJson<ElencoResumo[]>("elencos/index.json");
      if (!index) throw new Error("elencos/index.json ausente no bucket");
      return index;
    },
    async obter(id) {
      const elenco = await getJson<Elenco>(`elencos/${id}.json`);
      if (!elenco) return null;
      validarElenco(elenco);
      return elenco;
    },
  };
}
