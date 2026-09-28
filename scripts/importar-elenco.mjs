import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const POSICOES_POR_ORIGEM = new Map([
  ["goalkeeper", ["GOLEIRO"]],
  ["defender - centre-back", ["ZAGUEIRO"]],
  ["defender - center-back", ["ZAGUEIRO"]],
  ["defender - sweeper", ["ZAGUEIRO"]],
  ["defender - right-back", ["LATERAL_DIREITO"]],
  ["defender - left-back", ["LATERAL_ESQUERDO"]],
  ["midfield - defensive midfield", ["VOLANTE"]],
  ["midfield - central midfield", ["MEIA"]],
  ["midfield - attacking midfield", ["MEIA"]],
  ["midfield", ["MEIA"]],
  ["midfield - right midfield", ["MEIA", "ATACANTE"]],
  ["midfield - left midfield", ["MEIA", "ATACANTE"]],
  ["midfield - right winger", ["ATACANTE"]],
  ["midfield - left winger", ["ATACANTE"]],
  ["attack - right winger", ["ATACANTE"]],
  ["attack - left winger", ["ATACANTE"]],
  ["attack - second striker", ["ATACANTE"]],
  ["attack - centre-forward", ["ATACANTE"]],
  ["attack - center-forward", ["ATACANTE"]],
  ["attack - striker", ["ATACANTE"]],
]);

function texto(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function criarErro(linha, message) {
  return new Error(`Linha ${linha}: ${message}`);
}

function idTransfermarkt(player) {
  const href = texto(player.href);
  const transfermarktId = href.match(/\/spieler\/(\d+)(?:\/|$)/)?.[1];
  if (transfermarktId) return transfermarktId;

  const code = texto(player.code);
  if (code) return code;
  throw new Error("não encontrei ID estável em `href` (/spieler/ID) nem em `code`.");
}

function nomeJogador(player) {
  const fullName = texto(player.full_name);
  if (fullName) return fullName;

  const parts = [texto(player.name), texto(player.last_name)].filter(Boolean);
  const distinct = [...new Set(parts)];
  if (distinct.length) return distinct.join(" ");
  throw new Error("jogador sem nome (`full_name`, `name` ou `last_name`).");
}

function posicoesJogador(position) {
  const normalized = texto(position).normalize("NFKC").toLocaleLowerCase("en-US");
  const positions = POSICOES_POR_ORIGEM.get(normalized);
  if (!positions) {
    throw new Error(`posição Transfermarkt não mapeada: ${JSON.stringify(texto(position))}.`);
  }
  return positions;
}

function janelaDeChegada(joined, anoElenco) {
  const date = texto(joined);
  if (!date) return null;

  const match = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) throw new Error(`data de chegada inválida: ${JSON.stringify(date)}.`);

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`data de chegada inválida: ${JSON.stringify(date)}.`);
  }
  if (year !== anoElenco) return null;
  return month <= 6 ? 1 : 2;
}

export function converterJogador(player, anoElenco, linha) {
  if (!player || typeof player !== "object" || Array.isArray(player)) {
    throw criarErro(linha, "cada linha precisa conter um objeto de jogador.");
  }

  try {
    const name = nomeJogador(player);
    const photo = texto(player.image_url);
    if (photo) {
      const url = new URL(photo);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("`image_url` precisa ser uma URL HTTP ou HTTPS.");
      }
    }
    return {
      id: idTransfermarkt(player),
      nome: name,
      fotoUrl: photo,
      janela: janelaDeChegada(player.joined, anoElenco),
      posicoes: posicoesJogador(player.position),
    };
  } catch (error) {
    throw criarErro(linha, error instanceof Error ? error.message : "registro inválido.");
  }
}

export function converterJsonl(contents, elencoId) {
  const match = elencoId.match(/^(\d{4})-([12])$/);
  if (!match) throw new Error(`ID de elenco inválido: ${elencoId}. Use AAAA-1 ou AAAA-2.`);
  const ano = Number(match[1]);
  const janela = Number(match[2]);
  const jogadores = [];
  const ids = new Set();
  const errors = [];

  for (const [index, line] of contents.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const lineNumber = index + 1;
    let player;
    try {
      player = JSON.parse(line);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "JSON inválido.";
      errors.push(criarErro(lineNumber, `JSON inválido: ${detail}`).message);
      continue;
    }

    try {
      const converted = converterJogador(player, ano, lineNumber);
      if (ids.has(converted.id)) {
        throw criarErro(lineNumber, `ID de jogador duplicado: ${converted.id}.`);
      }
      ids.add(converted.id);
      jogadores.push(converted);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Linha ${lineNumber}: registro inválido.`);
    }
  }

  if (errors.length) {
    throw new Error(`Não foi possível importar o elenco:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
  if (jogadores.length === 0) throw new Error("O arquivo não contém nenhum jogador.");

  return {
    id: elencoId,
    rotulo: `ELENCO ${elencoId}`,
    ano,
    janela,
    jogadores,
  };
}

async function gravarAtomico(filePath, contents) {
  const tempPath = `${filePath}.tmp-${process.pid}`;
  try {
    await writeFile(tempPath, contents, { encoding: "utf8", flag: "wx" });
    await rename(tempPath, filePath);
  } finally {
    await rm(tempPath, { force: true });
  }
}

export async function importarElenco(elencoId, inputPath, dataDir) {
  const contents = await readFile(inputPath, "utf8");
  const elenco = converterJsonl(contents, elencoId);
  const indexPath = path.join(dataDir, "index.json");
  let indice = [];
  try {
    const rawIndex = await readFile(indexPath, "utf8");
    indice = JSON.parse(rawIndex);
    if (!Array.isArray(indice)) throw new Error("index.json precisa conter um array.");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const resumo = {
    id: elenco.id,
    rotulo: elenco.rotulo,
    ano: elenco.ano,
    janela: elenco.janela,
  };
  const novosResumos = indice.filter((entry) => entry?.id !== elenco.id);
  novosResumos.push(resumo);
  novosResumos.sort((left, right) => left.id.localeCompare(right.id));

  await mkdir(dataDir, { recursive: true });
  await gravarAtomico(path.join(dataDir, `${elencoId}.json`), `${JSON.stringify(elenco, null, 2)}\n`);
  await gravarAtomico(indexPath, `${JSON.stringify(novosResumos, null, 2)}\n`);
  return elenco;
}

function uso() {
  console.error(
    "Uso: node scripts/importar-elenco.mjs <AAAA-1|AAAA-2> <jogadores.jsonl> [pasta-de-saida]\n" +
      "Padrão da pasta de saída: output/data/elencos",
  );
}

async function main(args) {
  if (args.length < 2 || args.length > 3) {
    uso();
    process.exitCode = 2;
    return;
  }
  const [elencoId, inputPath, outputArg] = args;
  const dataDir = path.resolve(outputArg ?? "output/data/elencos");
  try {
    const elenco = await importarElenco(elencoId, inputPath, dataDir);
    console.log(
      `Importados ${elenco.jogadores.length} jogadores em ${path.join(dataDir, `${elencoId}.json`)}.`,
    );
    console.log(`Índice atualizado: ${path.join(dataDir, "index.json")}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main(process.argv.slice(2));
}
