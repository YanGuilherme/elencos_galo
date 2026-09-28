import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { criarApp } from "./app.js";
import { criarStore } from "./store-factory.js";

try {
  loadEnvFile(fileURLToPath(new URL("../../.env", import.meta.url)));
} catch (error) {
  if (
    !error ||
    typeof error !== "object" ||
    !("code" in error) ||
    error.code !== "ENOENT"
  ) {
    throw error;
  }
}

const store = criarStore();
const source = process.env.ELENCOS_SOURCE ?? "classpath";
const port = Number(process.env.PORT ?? 3000);
const app = criarApp(store, process.env.CORS_ORIGIN ?? "http://localhost:5173", source);

await app.listen({ port, host: "0.0.0.0" });
