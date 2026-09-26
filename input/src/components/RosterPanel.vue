<script setup lang="ts">
import {
  POSICOES,
  type Elenco,
  type Jogador,
  type Posicao,
} from "@janela-galo/core";

defineProps<{
  elenco: Elenco;
  grupos: Record<Posicao, Jogador[]>;
  rotulos: Record<Posicao, string>;
}>();

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}
</script>

<template>
  <section class="roster-panel">
    <header class="roster-heading">
      <span class="club-crest" aria-hidden="true">A</span>
      <h1>{{ elenco.rotulo || `ELENCO ${elenco.id}` }}</h1>
    </header>
    <div class="roster-list">
      <section v-for="posicao in POSICOES" :key="posicao" class="roster-row">
        <h2>{{ rotulos[posicao] }}</h2>
        <div class="player-list">
          <article v-for="jogador in grupos[posicao]" :key="jogador.id" class="player-card">
            <div class="player-photo">
              <img v-if="jogador.fotoUrl" :src="jogador.fotoUrl" :alt="jogador.nome" />
              <span v-else aria-hidden="true">{{ iniciais(jogador.nome) }}</span>
              <span v-if="jogador.janela !== null" class="arrival-badge">{{ jogador.janela }}</span>
            </div>
            <span class="player-name">{{ jogador.nome }}</span>
          </article>
          <span v-if="grupos[posicao].length === 0" class="empty-position">—</span>
        </div>
      </section>
    </div>
  </section>
</template>
