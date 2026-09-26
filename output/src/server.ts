import { criarApp } from "./app.js";
import { storeLocal } from "./store-local.js";
import { storeS3 } from "./store-s3.js";
import type { ElencoStore } from "./store.js";

function criarStore(): ElencoStore {
  const bucket = process.env.S3_BUCKET;
  if (bucket) {
    return storeS3(bucket, process.env.AWS_REGION ?? "sa-east-1");
  }
  return storeLocal();
}

const store = criarStore();
const port = Number(process.env.PORT ?? 3000);
const app = criarApp(store, process.env.CORS_ORIGIN ?? "http://localhost:5173");

await app.listen({ port, host: "0.0.0.0" });
