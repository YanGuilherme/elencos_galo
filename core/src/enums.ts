export const POSICOES = [
  "GOLEIRO",
  "ZAGUEIRO",
  "LATERAL_DIREITO",
  "LATERAL_ESQUERDO",
  "VOLANTE",
  "MEIA",
  "ATACANTE",
] as const;

export type Posicao = (typeof POSICOES)[number];

export const VALORES_COMPARACAO = [
  "IGUAL",
  "ESQ_MELHOR",
  "ESQ_MUITO_MELHOR",
  "DIR_MELHOR",
  "DIR_MUITO_MELHOR",
] as const;

export type ValorComparacao = (typeof VALORES_COMPARACAO)[number];

/** Ordem do clique-ciclo: = → > → >> → < → << → = */
export const CICLO_COMPARACAO: ValorComparacao[] = [
  "IGUAL",
  "ESQ_MELHOR",
  "ESQ_MUITO_MELHOR",
  "DIR_MELHOR",
  "DIR_MUITO_MELHOR",
];

export const SIMBOLO_COMPARACAO: Record<ValorComparacao, string> = {
  IGUAL: "=",
  ESQ_MELHOR: ">",
  ESQ_MUITO_MELHOR: ">>",
  DIR_MELHOR: "<",
  DIR_MUITO_MELHOR: "<<",
};

export type JanelaChegada = 1 | 2 | null;
export type JanelaElenco = 1 | 2;

export const ELENCO_ID_RE = /^\d{4}-[12]$/;
