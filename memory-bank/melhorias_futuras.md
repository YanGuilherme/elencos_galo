# Melhorias futuras

Fora do v1. O produto agora é: ler elencos, comparar na tela, **print resolve**. Nada disto entra no corte atual.

## Rotas overlay + painel (OBS)

No v1: **uma rota só**. Layout e cliques na mesma página; o artefato é o print.

Quando o criador for usar OBS com mesa separada:

- `/overlay` — 1920×1080, só o print, sem chrome, sem mouse.
- `/painel` — escolher elencos e mexer no comparativo.
- Os dois precisam do **mesmo estado** (sala na URL, poll `GET /live`, ou websocket). Sem isso, OBS e notebook divergem.

Também cabe um `?clean=1` na rota única para esconder controles na hora do print, sem split de app.

## Sync overlay OBS ↔ painel

Dois Chromiums, um estado. Só faz sentido depois do split de rotas acima.

## Persistir a comparação (save / load)

A ideia original: botão discreto, nome opcional, fallback `Save N dd/MM HH:mm`, load restaura elencos + valores.

Onde gravar (quando voltar o assunto):

- **localStorage** — rascunho no browser de quem opera; não cruza OBS nem outro PC.
- **Sessão / sala na API** (`/painel/:id` + `/overlay/:id`) — os três produtores e o OBS veem o mesmo estado, sem login.
- **S3** — histórico compartilhado e durável; exige write controlado (API). Sem login num site público, qualquer um grava lixo no bucket.

Load por referência vs snapshot do plantel também fica para essa fatia.

## Login / auth

Site público, um grupo pequeno usa de verdade. Sem login no v1. Depois: API key, senha compartilhada, ou sala secreta na URL.

## Write no S3

Cadastro de elenco/jogador, upload de foto, índice. Hoje o JSON e as fotos nascem fora do app (ou manual no bucket). A API do v1 só lê.

## Outras

- CRUD de elencos na UI.
- Snapshot do plantel dentro do save (elenco mudou depois do print).
- Multi-time, mais de duas colunas, notas por jogador.
- Terceira UX do comparativo que “ganhar” no ensaio vira a única.
- CloudFront / cache nas fotos.
