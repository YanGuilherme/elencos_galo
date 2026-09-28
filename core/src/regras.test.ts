import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  agruparPorPosicao,
  cicloProximo,
  comElencos,
  comValor,
  comparativoVazio,
  passoSeta,
  validarComparativo,
  type Elenco,
} from "./index";

describe("cicloProximo", () => {
  it("fecha o ciclo nos 5 valores", () => {
    let v = cicloProximo("IGUAL");
    assert.equal(v, "ESQ_MELHOR");
    v = cicloProximo(v);
    assert.equal(v, "ESQ_MUITO_MELHOR");
    v = cicloProximo(v);
    assert.equal(v, "DIR_MELHOR");
    v = cicloProximo(v);
    assert.equal(v, "DIR_MUITO_MELHOR");
    v = cicloProximo(v);
    assert.equal(v, "IGUAL");
  });
});

describe("passoSeta", () => {
  it("de IGUAL, direita uma vez e duas vezes", () => {
    assert.equal(passoSeta("IGUAL", "dir"), "DIR_MELHOR");
    assert.equal(passoSeta("DIR_MELHOR", "dir"), "DIR_MUITO_MELHOR");
    assert.equal(passoSeta("DIR_MUITO_MELHOR", "dir"), "DIR_MUITO_MELHOR");
  });

  it("esquerda a partir de IGUAL vai para ESQ_MELHOR", () => {
    assert.equal(passoSeta("IGUAL", "esq"), "ESQ_MELHOR");
    assert.equal(passoSeta("ESQ_MELHOR", "esq"), "ESQ_MUITO_MELHOR");
  });
});

describe("agruparPorPosicao", () => {
  it("duplica jogador multi-posição sem repetir na mesma fileira", () => {
    const elenco: Elenco = {
      id: "2025-1",
      rotulo: "ELENCO 2025-1",
      ano: 2025,
      janela: 1,
      jogadores: [
        {
          id: "fulano",
          nome: "Fulano",
          fotoUrl: "",
          janela: 1,
          posicoes: ["VOLANTE", "MEIA", "VOLANTE"],
        },
      ],
    };
    assert.throws(() => agruparPorPosicao(elenco));

    elenco.jogadores[0].posicoes = ["VOLANTE", "MEIA"];
    const grupos = agruparPorPosicao(elenco);
    assert.equal(grupos.VOLANTE.length, 1);
    assert.equal(grupos.MEIA.length, 1);
    assert.equal(grupos.VOLANTE[0].id, "fulano");
    assert.equal(grupos.ATACANTE.length, 0);
  });
});

describe("comparativoVazio", () => {
  it("permite comparar o elenco consigo mesmo", () => {
    const comparativo = comparativoVazio("2025-2", "2025-2");
    assert.equal(comparativo.elencoEsquerdaId, "2025-2");
    assert.equal(comparativo.elencoDireitaId, "2025-2");
    assert.equal(comparativo.valores.GOLEIRO, "IGUAL");
  });

  it("mantém os valores ao trocar os elencos", () => {
    const comparativo = comValor(comparativoVazio("2025-1", "2026-1"), "GOLEIRO", "ESQ_MELHOR");
    const atualizado = comElencos(comparativo, "2025-2", "2026-2");
    assert.equal(atualizado.valores.GOLEIRO, "ESQ_MELHOR");
    assert.equal(atualizado.elencoEsquerdaId, "2025-2");
    assert.equal(atualizado.elencoDireitaId, "2026-2");
  });

  it("rejeita um valor de comparação fora do enum", () => {
    const comparativo = comparativoVazio("2025-1", "2026-1");
    Reflect.set(comparativo.valores, "GOLEIRO", "INVALIDO");
    assert.throws(() => validarComparativo(comparativo));
  });

  it("rejeita um comparativo sem objeto de valores", () => {
    const comparativo = comparativoVazio("2025-1", "2026-1");
    Reflect.set(comparativo, "valores", null);
    assert.throws(() => validarComparativo(comparativo));
  });
});
