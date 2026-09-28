import { ELENCO_ID_RE, POSICOES, VALORES_COMPARACAO, type Posicao } from "./enums";
import type { Comparativo, Elenco, Jogador } from "./tipos";

export class DominioErro extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DominioErro";
  }
}

function posicoesUnicas(posicoes: Posicao[]): boolean {
  return new Set(posicoes).size === posicoes.length;
}

export function validarJogador(jogador: Jogador): void {
  if (!jogador.id?.trim()) throw new DominioErro("Jogador sem id");
  if (!jogador.nome?.trim()) throw new DominioErro(`Jogador ${jogador.id} sem nome`);
  if (!Array.isArray(jogador.posicoes) || jogador.posicoes.length < 1) {
    throw new DominioErro(`Jogador ${jogador.id} precisa de ao menos uma posição`);
  }
  if (!posicoesUnicas(jogador.posicoes)) {
    throw new DominioErro(`Jogador ${jogador.id} com posição duplicada`);
  }
  for (const p of jogador.posicoes) {
    if (!POSICOES.includes(p)) throw new DominioErro(`Posição inválida: ${p}`);
  }
  if (jogador.janela !== 1 && jogador.janela !== 2 && jogador.janela !== null) {
    throw new DominioErro(`Janela de chegada inválida em ${jogador.id}`);
  }
}

export function validarElenco(elenco: Elenco): void {
  if (!ELENCO_ID_RE.test(elenco.id)) {
    throw new DominioErro(`Id de elenco inválido: ${elenco.id}`);
  }
  const [anoStr, janelaStr] = elenco.id.split("-");
  const anoId = Number(anoStr);
  const janelaId = Number(janelaStr) as 1 | 2;
  if (elenco.ano !== anoId || elenco.janela !== janelaId) {
    throw new DominioErro(`Elenco ${elenco.id}: ano/janela não batem com o id`);
  }
  if (!elenco.rotulo?.trim()) throw new DominioErro(`Elenco ${elenco.id} sem rótulo`);
  const ids = new Set<string>();
  for (const j of elenco.jogadores) {
    validarJogador(j);
    if (ids.has(j.id)) throw new DominioErro(`Jogador duplicado no elenco: ${j.id}`);
    ids.add(j.id);
  }
}

export function validarComparativo(comparativo: Comparativo): void {
  if (!ELENCO_ID_RE.test(comparativo.elencoEsquerdaId)) {
    throw new DominioErro("elencoEsquerdaId inválido");
  }
  if (!ELENCO_ID_RE.test(comparativo.elencoDireitaId)) {
    throw new DominioErro("elencoDireitaId inválido");
  }
  if (!comparativo.valores || typeof comparativo.valores !== "object") {
    throw new DominioErro("Comparativo sem valores por posição");
  }
  for (const p of POSICOES) {
    if (!VALORES_COMPARACAO.includes(comparativo.valores[p])) {
      throw new DominioErro(`Comparativo sem valor para ${p}`);
    }
  }
}
