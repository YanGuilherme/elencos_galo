import { CICLO_COMPARACAO, POSICOES, type Posicao, type ValorComparacao } from "./enums";
import type { Comparativo, Elenco, Jogador } from "./tipos";
import { validarComparativo, validarElenco } from "./validar";

export function agruparPorPosicao(elenco: Elenco): Record<Posicao, Jogador[]> {
  validarElenco(elenco);
  const grupos = Object.fromEntries(POSICOES.map((p) => [p, [] as Jogador[]])) as Record<
    Posicao,
    Jogador[]
  >;
  for (const jogador of elenco.jogadores) {
    const vistos = new Set<Posicao>();
    for (const posicao of jogador.posicoes) {
      if (vistos.has(posicao)) continue;
      vistos.add(posicao);
      grupos[posicao].push(jogador);
    }
  }
  return grupos;
}

export function comparativoVazio(idEsq: string, idDir: string): Comparativo {
  const valores = Object.fromEntries(POSICOES.map((p) => [p, "IGUAL"])) as Record<
    Posicao,
    ValorComparacao
  >;
  const comparativo: Comparativo = {
    elencoEsquerdaId: idEsq,
    elencoDireitaId: idDir,
    valores,
  };
  validarComparativo(comparativo);
  return comparativo;
}

export function resetComparativo(comparativo: Comparativo): Comparativo {
  return comparativoVazio(comparativo.elencoEsquerdaId, comparativo.elencoDireitaId);
}

export function cicloProximo(valorAtual: ValorComparacao): ValorComparacao {
  const i = CICLO_COMPARACAO.indexOf(valorAtual);
  if (i < 0) return "IGUAL";
  return CICLO_COMPARACAO[(i + 1) % CICLO_COMPARACAO.length];
}

const ESCALA: ValorComparacao[] = [
  "ESQ_MUITO_MELHOR",
  "ESQ_MELHOR",
  "IGUAL",
  "DIR_MELHOR",
  "DIR_MUITO_MELHOR",
];

export function passoSeta(
  valorAtual: ValorComparacao,
  direcao: "esq" | "dir",
): ValorComparacao {
  const i = ESCALA.indexOf(valorAtual);
  const atual = i < 0 ? 2 : i;
  const delta = direcao === "dir" ? 1 : -1;
  return ESCALA[Math.min(ESCALA.length - 1, Math.max(0, atual + delta))];
}

export function comElencos(comparativo: Comparativo, idEsq: string, idDir: string): Comparativo {
  const next: Comparativo = {
    ...comparativo,
    elencoEsquerdaId: idEsq,
    elencoDireitaId: idDir,
  };
  validarComparativo(next);
  return next;
}

export function comValor(
  comparativo: Comparativo,
  posicao: Posicao,
  valor: ValorComparacao,
): Comparativo {
  const next: Comparativo = {
    ...comparativo,
    valores: { ...comparativo.valores, [posicao]: valor },
  };
  validarComparativo(next);
  return next;
}
