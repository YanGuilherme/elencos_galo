export { POSICOES, VALORES_COMPARACAO, CICLO_COMPARACAO, SIMBOLO_COMPARACAO, ELENCO_ID_RE } from "./enums";
export type { Posicao, ValorComparacao, JanelaChegada, JanelaElenco } from "./enums";
export type { Jogador, Elenco, ElencoResumo, Comparativo } from "./tipos";
export { DominioErro, validarJogador, validarElenco, validarComparativo } from "./validar";
export {
  agruparPorPosicao,
  comparativoVazio,
  resetComparativo,
  cicloProximo,
  passoSeta,
  comElencos,
  comValor,
} from "./regras";
