import { storeLocal } from "./store-local.js";
import { storeS3 } from "./store-s3.js";
import type { ElencoStore } from "./store.js";

export function criarStore(env: NodeJS.ProcessEnv = process.env): ElencoStore {
  const source = env.ELENCOS_SOURCE ?? "classpath";
  if (source === "classpath") return storeLocal();
  if (source === "s3") {
    if (!env.S3_BUCKET?.trim()) {
      throw new Error("S3_BUCKET é obrigatório quando ELENCOS_SOURCE=s3.");
    }
    return storeS3(env.S3_BUCKET, env.AWS_REGION ?? "sa-east-1");
  }
  throw new Error(`ELENCOS_SOURCE inválido: ${source}. Use "classpath" ou "s3".`);
}
