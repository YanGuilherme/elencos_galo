import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validarElenco, type Elenco, type ElencoResumo } from "@janela-galo/core";
import type { ElencoStore } from "./store.js";

const DIR = path.join(fileURLToPath(new URL("../data/elencos", import.meta.url)));

async function lerJson<T>(file: string): Promise<T> {
  const raw = await readFile(path.join(DIR, file), "utf8");
  return JSON.parse(raw) as T;
}

export function storeLocal(): ElencoStore {
  return {
    async listar() {
      return lerJson<ElencoResumo[]>("index.json");
    },
    async obter(id) {
      try {
        const elenco = await lerJson<Elenco>(`${id}.json`);
        validarElenco(elenco);
        return elenco;
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === "ENOENT") return null;
        throw err;
      }
    },
  };
}
