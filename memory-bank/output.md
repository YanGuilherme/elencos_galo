# Output — S3, API fina, persistência

`output/` é a única camada que fala com o mundo externo. No v1 **só lê** elencos do classpath (arquivos locais do projeto) ou S3, conforme `ELENCOS_SOURCE`, e expõe HTTP curto para o `input`.

O core não sabe que S3 existe. A API não contém regra de “como ciclar seta”. Sem write de comparativo, save ou foto no v1.

## Por que a apizinha existe (e ainda é monolito)

Você pensou: frontend → S3, sem backend. Isso até funciona num protótipo com bucket público. Quebra em produção pelos motivos abaixo.

| Sem API (browser → S3) | Com API no mesmo repo |
|---|---|
| Access key no JS ou Cognito para um CRUD interno | Credencial só no servidor / `.env` |
| Listar elencos = `ListObjects` + CORS | `GET /elencos` |
| Bucket world-writable se o SPA gravasse | V1 não grava; site público sem login |

A API **não** é um segundo produto. É um módulo `output/` ao lado do Vue, um `package.json` na raiz, um `docker compose` ou dois processos (`vite` + `api`). Monolito modularizado.

Stack sugerida da API (TS, para importar `core/` sem FFI): **Fastify**, AWS SDK v3, um arquivo de rotas. Nest só se o ceremonial ajudar; aqui não ajuda.

## Layout no bucket

```
s3://janela-galo/
  elencos/{elencoId}.json     # elencoId = "2025-1", "2025-2", "2026-1", …
  elencos/index.json          # [{ id, rotulo, ano, janela }]
  fotos/{elencoId}/{jogadorId}.jpg
```

JSON de elenco: o objeto `Elenco` do core. Fotos são URLs públicas de leitura.

Write (`saves/`, `live/`, upload): `melhorias_futuras.md`.

## Contratos HTTP (v1)

Só leitura.

- `GET /elencos` → índice
- `GET /elencos/:id` → elenco

Sem auth. Site público. Credencial AWS só no processo da API.

## Fotos

Objetos em `fotos/` com leitura pública (ou a API devolve a URL já no JSON do elenco). Upload de foto não é rota do v1.

## CORS

A API libera a origin do Vite (`localhost:5173` em dev, e o host do deploy). O browser não fala com S3 se a API proxyar o GET do JSON. Se o JSON apontar `fotoUrl` direto no bucket, o S3 (ou CloudFront) precisa servir GET público de imagem.

## O que o output NÃO faz (v1)

- Não escolhe símbolo de comparação.
- Não grava comparativo, save, live state nem foto.
- Não conhece CSS do overlay.

## Operação local

- Bucket real (dev) **ou** LocalStack/MinIO no compose, mesmo contrato.
- Env: `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (nunca no `input/`).
- `ELENCOS_SOURCE=classpath` (padrão) lê `output/data/elencos/`.
- `ELENCOS_SOURCE=s3` lê `elencos/index.json` e `elencos/{id}.json` do bucket configurado em `S3_BUCKET`; sem bucket a API falha ao iniciar. Não há fallback silencioso entre fontes.

## Importar jogadores em JSONL

O importador `scripts/importar-elenco.mjs` converte um arquivo com um objeto JSON por linha no formato extraído do Transfermarkt para o contrato `Elenco`. Na raiz do repo:

```bash
npm run importar:elenco -- 2025-2 output/data/import/jogadores_atletico_mg.jsonl
```

Por padrão, grava/substitui `output/data/elencos/2025-2.json` e atualiza `output/data/elencos/index.json`, preservando os outros IDs do índice. Pode-se passar uma terceira opção para escolher a pasta de saída. Cada registro usa `/spieler/{id}` do `href` (ou `code`) como ID, combina `name`/`last_name`, copia `image_url`, converte `position` e atribui `janela` com base no mês de `joined` se o ano coincidir com o elenco. Datas sem valor ou de outro ano viram `null`. Posições não mapeadas, JSON malformado e IDs repetidos interrompem a importação antes de gravar o novo elenco.

Arquivos brutos JSONL ficam em `output/data/import/`; essa pasta é só entrada do importador. A API local lê os arquivos gerados em `output/data/elencos/`.
