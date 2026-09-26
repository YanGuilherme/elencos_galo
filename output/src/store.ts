import type { Elenco, ElencoResumo } from "@janela-galo/core";

export interface ElencoStore {
  listar(): Promise<ElencoResumo[]>;
  obter(id: string): Promise<Elenco | null>;
}
