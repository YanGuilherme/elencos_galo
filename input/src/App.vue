<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import RosterPanel from "./components/RosterPanel.vue";
import {
  agruparPorPosicao,
  comElencos,
  comValor,
  comparativoVazio,
  cicloProximo,
  ELENCO_ID_RE,
  POSICOES,
  passoSeta,
  resetComparativo,
  SIMBOLO_COMPARACAO,
  validarElenco,
  type Comparativo,
  type Elenco,
  type ElencoResumo,
  type Posicao,
  type ValorComparacao,
} from "@janela-galo/core";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const rotulosPosicao: Record<Posicao, string> = {
  GOLEIRO: "Goleiros",
  ZAGUEIRO: "Zagueiros",
  LATERAL_DIREITO: "Laterais direitos",
  LATERAL_ESQUERDO: "Laterais esquerdos",
  VOLANTE: "Volantes",
  MEIA: "Meias",
  ATACANTE: "Atacantes",
};
const modos = [
  { id: "ciclo", label: "Ciclo no clique" },
  { id: "seletor", label: "Seletor" },
  { id: "setas", label: "Valor + setas" },
] as const;
type ModoInteracao = (typeof modos)[number]["id"];
const VALORES: ValorComparacao[] = [
  "IGUAL",
  "ESQ_MELHOR",
  "ESQ_MUITO_MELHOR",
  "DIR_MELHOR",
  "DIR_MUITO_MELHOR",
];

const elencosDisponiveis = ref<ElencoResumo[]>([]);
const elencoEsq = ref<Elenco | null>(null);
const elencoDir = ref<Elenco | null>(null);
const cacheElencos = new Map<string, Elenco>();
const comparativo = ref<Comparativo | null>(null);
const modoInteracao = ref<ModoInteracao>("ciclo");
const seletorAberto = ref<Posicao | null>(null);
const aviso = ref("");
const carregando = ref(true);

const gruposEsq = computed(() => (elencoEsq.value ? agruparPorPosicao(elencoEsq.value) : null));
const gruposDir = computed(() => (elencoDir.value ? agruparPorPosicao(elencoDir.value) : null));

async function obterElenco(id: string): Promise<Elenco> {
  const emCache = cacheElencos.get(id);
  if (emCache) return emCache;
  const resposta = await fetch(`${API_URL}/elencos/${encodeURIComponent(id)}`);
  if (!resposta.ok) throw new Error(`GET /elencos/${id} respondeu ${resposta.status}`);
  const respostaJson: unknown = await resposta.json();
  if (!respostaJson || typeof respostaJson !== "object") {
    throw new Error(`A API retornou um elenco inválido para ${id}.`);
  }
  const elenco = respostaJson as Elenco;
  validarElenco(elenco);
  if (elenco.id !== id) throw new Error(`A API retornou ${elenco.id} para o pedido ${id}.`);
  cacheElencos.set(id, elenco);
  return elenco;
}

async function atualizarElencos(idEsq: string, idDir: string): Promise<void> {
  const resumoEsq = elencosDisponiveis.value.find((elenco) => elenco.id === idEsq);
  const resumoDir = elencosDisponiveis.value.find((elenco) => elenco.id === idDir);
  if (!resumoEsq || !resumoDir) {
    aviso.value = "Um dos elencos selecionados não está no índice carregado.";
    return;
  }

  carregando.value = true;
  try {
    const novoEsq = await obterElenco(idEsq);
    const novoDir = idDir === idEsq ? novoEsq : await obterElenco(idDir);
    elencoEsq.value = novoEsq;
    elencoDir.value = novoDir;
    comparativo.value = comparativo.value
      ? comElencos(comparativo.value, idEsq, idDir)
      : comparativoVazio(idEsq, idDir);
    aviso.value = "";
  } catch (erro) {
    aviso.value = erro instanceof Error ? erro.message : "Não foi possível carregar o elenco.";
  } finally {
    carregando.value = false;
  }
}

function selecionarEsquerda(event: Event): void {
  if (!elencoDir.value) return;
  const id = (event.target as HTMLSelectElement).value;
  void atualizarElencos(id, elencoDir.value.id);
}

function selecionarDireita(event: Event): void {
  if (!elencoEsq.value) return;
  const id = (event.target as HTMLSelectElement).value;
  void atualizarElencos(elencoEsq.value.id, id);
}

function definirValor(posicao: Posicao, valor: ValorComparacao): void {
  if (!comparativo.value) return;
  comparativo.value = comValor(comparativo.value, posicao, valor);
  seletorAberto.value = null;
}

function clicarComparativo(posicao: Posicao): void {
  if (!comparativo.value) return;
  if (modoInteracao.value === "ciclo") {
    definirValor(posicao, cicloProximo(comparativo.value.valores[posicao]));
  } else if (modoInteracao.value === "seletor") {
    seletorAberto.value = seletorAberto.value === posicao ? null : posicao;
  } else if (comparativo.value.valores[posicao] !== "IGUAL") {
    definirValor(posicao, "IGUAL");
  }
}

function moverComparativo(posicao: Posicao, direcao: "esq" | "dir"): void {
  if (!comparativo.value) return;
  const proximo = passoSeta(comparativo.value.valores[posicao], direcao);
  definirValor(posicao, proximo);
}

async function carregarDaApi(): Promise<void> {
  carregando.value = true;
  try {
    const respostaIndice = await fetch(`${API_URL}/elencos`);
    if (!respostaIndice.ok) throw new Error(`GET /elencos respondeu ${respostaIndice.status}`);
    const indice: unknown = await respostaIndice.json();
    if (!Array.isArray(indice) || indice.length < 1) {
      throw new Error("O índice da API não contém elencos.");
    }
    const resumos = indice as ElencoResumo[];
    const idsResumos = new Set<string>();
    const resumoInvalido = resumos.some((elenco) => {
      if (
        typeof elenco?.id !== "string" ||
        !ELENCO_ID_RE.test(elenco.id) ||
        typeof elenco.rotulo !== "string"
      ) {
        return true;
      }
      const [ano, janela] = elenco.id.split("-");
      const invalido =
        !elenco.rotulo.trim() ||
        elenco.ano !== Number(ano) ||
        elenco.janela !== Number(janela) ||
        idsResumos.has(elenco.id);
      idsResumos.add(elenco.id);
      return invalido;
    });
    if (resumoInvalido) {
      throw new Error("O índice da API contém resumo inválido ou ID duplicado.");
    }

    elencosDisponiveis.value = resumos;
    const idAtual = elencoEsq.value?.id;
    const idInicial = idAtual && resumos.some((elenco) => elenco.id === idAtual)
      ? idAtual
      : resumos[0].id;
    await atualizarElencos(idInicial, idInicial);
  } catch (erro) {
    const detalhe = erro instanceof Error ? erro.message : "erro desconhecido";
    aviso.value = `Não foi possível carregar elencos da API: ${detalhe}`;
    elencosDisponiveis.value = [];
    elencoEsq.value = null;
    elencoDir.value = null;
    comparativo.value = null;
  } finally {
    carregando.value = false;
  }
}

onMounted(carregarDaApi);
</script>

<template>
  <main class="stage">
    <header class="toolbar">
      <div class="brand"><span class="brand-mark">JG</span><span>JANELA GALO</span></div>
      <div class="toolbar-controls">
        <label class="select-control">
          <span>Esquerda</span>
          <select :value="elencoEsq?.id ?? ''" :disabled="carregando || elencosDisponiveis.length === 0" @change="selecionarEsquerda">
            <option v-for="elenco in elencosDisponiveis" :key="elenco.id" :value="elenco.id">
              {{ elenco.id }}
            </option>
          </select>
        </label>
        <label class="select-control">
          <span>Direita</span>
          <select :value="elencoDir?.id ?? ''" :disabled="carregando || elencosDisponiveis.length === 0" @change="selecionarDireita">
            <option v-for="elenco in elencosDisponiveis" :key="elenco.id" :value="elenco.id">
              {{ elenco.id }}
            </option>
          </select>
        </label>
        <div class="mode-switch" role="group" aria-label="Modo de interação">
          <button
            v-for="modo in modos"
            :key="modo.id"
            type="button"
            :class="{ active: modoInteracao === modo.id }"
            @click="modoInteracao = modo.id"
          >
            {{ modo.label }}
          </button>
        </div>
        <button class="reset-button" type="button" :disabled="!comparativo || carregando" @click="comparativo && (comparativo = resetComparativo(comparativo))">
          Reset comparativo
        </button>
      </div>
      <button class="refresh-button" type="button" :disabled="carregando" @click="carregarDaApi">
        {{ carregando ? "Carregando…" : "↻ Atualizar" }}
      </button>
    </header>

    <p v-if="aviso && elencoEsq && elencoDir" class="source-notice" role="status">{{ aviso }}</p>

    <section v-if="elencoEsq && elencoDir && comparativo && gruposEsq && gruposDir" class="broadcast" aria-label="Comparativo de elencos">
      <RosterPanel :elenco="elencoEsq" :grupos="gruposEsq" :rotulos="rotulosPosicao" />

      <section class="center-panel">
        <div class="camera-frame" aria-label="Área reservada para a câmera">
          <span>CÂMERA</span>
        </div>
        <div class="comparison-heading">
          <span>{{ elencoEsq.id }}</span>
          <span class="versus">COMPARATIVO</span>
          <span>{{ elencoDir.id }}</span>
        </div>
        <div class="comparison-grid">
          <article
            v-for="posicao in POSICOES"
            :key="posicao"
            class="comparison-cell"
            :class="{ striker: posicao === 'ATACANTE', 'selector-open': seletorAberto === posicao }"
            role="button"
            tabindex="0"
            @click="clicarComparativo(posicao)"
            @keydown.enter.self="clicarComparativo(posicao)"
            @keydown.space.self.prevent="clicarComparativo(posicao)"
          >
            <span class="comparison-position">{{ rotulosPosicao[posicao] }}</span>
            <div class="comparison-controls">
              <span class="cell-team">{{ elencoEsq.id }}</span>
              <button v-if="modoInteracao === 'setas'" class="arrow-control" type="button" :aria-label="`Melhorar lado esquerdo: ${rotulosPosicao[posicao]}`" @click.stop="moverComparativo(posicao, 'esq')">«</button>
              <span class="comparison-value" :aria-label="`${rotulosPosicao[posicao]}: ${comparativo.valores[posicao]}`">
                {{ SIMBOLO_COMPARACAO[comparativo.valores[posicao]] }}
              </span>
              <button v-if="modoInteracao === 'setas'" class="arrow-control" type="button" :aria-label="`Melhorar lado direito: ${rotulosPosicao[posicao]}`" @click.stop="moverComparativo(posicao, 'dir')">»</button>
              <span class="cell-team">{{ elencoDir.id }}</span>
            </div>
            <div v-if="seletorAberto === posicao" class="symbol-picker" role="group" :aria-label="`Escolha para ${rotulosPosicao[posicao]}`">
              <button
                v-for="valor in VALORES"
                :key="valor"
                type="button"
                :aria-label="valor"
                @click.stop="definirValor(posicao, valor)"
              >
                {{ SIMBOLO_COMPARACAO[valor] }}
              </button>
            </div>
          </article>
        </div>
        <div class="legend">
          <strong>LEGENDA</strong>
          <span><b>→</b> melhor</span>
          <span><b>⇉</b> bem melhor</span>
          <span><b>=</b> mesmo nível</span>
          <span><i></i> janela de chegada</span>
        </div>
      </section>

      <RosterPanel :elenco="elencoDir" :grupos="gruposDir" :rotulos="rotulosPosicao" />
    </section>
    <section v-else class="load-state" role="status">
      {{ carregando ? "Carregando elencos…" : aviso }}
    </section>

    <footer class="broadcast-footer">
      <span>ATLÉTICO-MG</span>
      <span>COMPARATIVO DE ELENCOS</span>
      <span>JANELA GALO · AO VIVO</span>
    </footer>
  </main>
</template>
