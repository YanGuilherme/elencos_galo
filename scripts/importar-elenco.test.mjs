import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";
import { converterJsonl, importarElenco } from "./importar-elenco.mjs";

const temporarios = [];

afterEach(async () => {
  await Promise.all(temporarios.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

const jogadorRuan = {
  type: "player",
  href: "/ruan/profil/spieler/555015",
  name: "",
  last_name: "Ruan",
  position: "Defender - Centre-Back",
  image_url: "https://img.example.test/ruan.jpg",
  joined: "\n  01/07/2025  ",
};

describe("conversão do JSONL de jogadores", () => {
  it("converte ID, nome, foto, posição e janela de chegada", () => {
    const elenco = converterJsonl(JSON.stringify(jogadorRuan), "2025-2");
    assert.equal(elenco.jogadores[0].id, "555015");
    assert.equal(elenco.jogadores[0].nome, "Ruan");
    assert.equal(elenco.jogadores[0].fotoUrl, jogadorRuan.image_url);
    assert.equal(elenco.jogadores[0].janela, 2);
    assert.deepEqual(elenco.jogadores[0].posicoes, ["ZAGUEIRO"]);
  });

  it("normaliza maiúsculas/minúsculas e aceita a posição genérica Midfield", () => {
    const uppercase = { ...jogadorRuan, position: "DEFENDER - CENTRE-BACK" };
    const genericMidfield = { ...jogadorRuan, href: "/jogador/spieler/123", position: "Midfield" };
    const mixedCase = { ...jogadorRuan, href: "/jogador/spieler/456", position: "mIdFiElD - Defensive Midfield" };

    assert.deepEqual(converterJsonl(JSON.stringify(uppercase), "2025-2").jogadores[0].posicoes, ["ZAGUEIRO"]);
    assert.deepEqual(converterJsonl(JSON.stringify(genericMidfield), "2025-2").jogadores[0].posicoes, ["MEIA"]);
    assert.deepEqual(converterJsonl(JSON.stringify(mixedCase), "2025-2").jogadores[0].posicoes, ["VOLANTE"]);
  });

  it("mantém janela null se o atleta chegou em outro ano ou a data está ausente", () => {
    const deOutroAno = { ...jogadorRuan, joined: "01/07/2024" };
    const semData = { ...jogadorRuan, joined: null };
    assert.equal(converterJsonl(JSON.stringify(deOutroAno), "2025-2").jogadores[0].janela, null);
    assert.equal(converterJsonl(JSON.stringify(semData), "2025-2").jogadores[0].janela, null);
  });

  it("aponta linha malformada, posição desconhecida e ID repetido sem gravar elenco parcial", () => {
    assert.throws(() => converterJsonl('{"name":\n', "2025-1"), /Linha 1/);
    assert.throws(
      () => converterJsonl(JSON.stringify({ ...jogadorRuan, position: "Unknown" }), "2025-1"),
      /Linha 1: posição Transfermarkt não mapeada/,
    );
    assert.throws(
      () =>
        converterJsonl(
          `${JSON.stringify(jogadorRuan)}\n${JSON.stringify({ ...jogadorRuan, last_name: "Outro" })}`,
          "2025-1",
        ),
      /Linha 2: ID de jogador duplicado/,
    );
  });

  it("grava o elenco e atualiza o índice preservando outros elencos", async () => {
    const dataDir = await mkdtemp(path.join(os.tmpdir(), "janela-galo-"));
    temporarios.push(dataDir);
    await writeFile(
      path.join(dataDir, "index.json"),
      `${JSON.stringify([{ id: "2024-1", rotulo: "ELENCO 2024-1", ano: 2024, janela: 1 }])}\n`,
    );
    const inputPath = path.join(dataDir, "jogadores.jsonl");
    await writeFile(inputPath, `${JSON.stringify(jogadorRuan)}\n`);

    const elenco = await importarElenco("2025-2", inputPath, dataDir);
    const salvo = JSON.parse(await readFile(path.join(dataDir, "2025-2.json"), "utf8"));
    const indice = JSON.parse(await readFile(path.join(dataDir, "index.json"), "utf8"));
    assert.deepEqual(salvo, elenco);
    assert.deepEqual(indice.map(({ id }) => id), ["2024-1", "2025-2"]);
  });
});
