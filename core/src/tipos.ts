import type { JanelaChegada, JanelaElenco, Posicao, ValorComparacao } from "./enums";

export interface Jogador {
  id: string;
  nome: string;
  fotoUrl: string;
  janela: JanelaChegada;
  posicoes: Posicao[];
}

export interface Elenco {
  id: string;
  rotulo: string;
  ano: number;
  janela: JanelaElenco;
  jogadores: Jogador[];
}

export interface ElencoResumo {
  id: string;
  rotulo: string;
  ano: number;
  janela: JanelaElenco;
}

export interface Comparativo {
  elencoEsquerdaId: string;
  elencoDireitaId: string;
  valores: Record<Posicao, ValorComparacao>;
}
