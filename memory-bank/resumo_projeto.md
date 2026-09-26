# Resumo do projeto — Janela Galo

Ferramenta web para produção de conteúdo: overlay de comparação de elencos do Atlético-MG entre duas janelas (ex.: Elenco 2025-2 vs Elenco 2026-1). Substitui o print estático usado hoje.

## O que o produto precisa entregar

Três regiões na tela, espelhando o layout de produção:

1. **Faixa esquerda** — elenco A (título + posições + fotos).
2. **Faixa direita** — elenco B (mesma estrutura).
3. **Centro**
   - **Topo:** recorte da câmera dos produtores (área vazia, preta, proporção fixa).
   - **Meio:** comparativo ao vivo por posição (símbolo escolhido no debate).
   - **Base:** legenda fixa para o espectador.

O comparativo muda na tela. O “save” do v1 é um **print**. Elencos e fotos vêm de JSON no S3 (somente leitura). Save/load, sessão e write no bucket: `melhorias_futuras.md`.

## Domínio (visão rápida)

| Conceito | Papel |
|---|---|
| Jogador | `nome`, `foto` (URL S3), `janela` (`1` \| `2` \| `null`), `posicoes[]` |
| Elenco | Snapshot do plantel numa janela do ano. Chave/rótulo `2025-1`, `2025-2`. Agrupado por posição na view |
| Comparativo | Um valor por posição entre elenco esquerda e direita (só memória da sessão da página) |

Detalhes de modelo, enums e regras: `core.md`.
Camada de tela e UX do comparativo: `input.md`.
S3 e API (leitura): `output.md`.
Backlog: `melhorias_futuras.md`.

## Stack proposta (monolito TypeScript)

Não é SPA falando AWS SDK no browser com chave na cara. Também não é um backend gordo.

```
janela_galo/
  input/          # Vue 3 + Vite — uma rota, views, CSS
  core/           # domínio puro (enums, regras do comparativo)
  output/         # API fina, lê S3
  memory-bank/    # este banco de memória
```

- **Vue 3 + Vite** em `input/`: uma página com layout do print + controles do comparativo.
- **core/**: biblioteca TS importada pelo Vue e pela API. Zero DOM, zero AWS.
- **API fina no mesmo repo** (`output/`): lista e lê elencos/fotos no S3. Sem write no v1. O browser nunca vê credencial AWS.
- **S3**: fonte dos elencos e fotos. Comparativo não vai para o bucket.

Resposta curta: **Vue 3 + Vite, S3, apizinha no monolito.**

## Fluxo (o diagrama que você mandou)

```
[Usuário] → INPUT (view) --dispara--> CORE --chama--> OUTPUT (API → S3)
                 ↑                      ↑                    |
                 |--- atualiza ---------|----- retorna ------|
                 |-------------- renderiza dados novos ------|
```

O comparativo vive no client (memória da página). Refresh zera; print já foi tirado. Uma rota só no v1. Overlay OBS + painel separado: `melhorias_futuras.md`.

## O que NÃO entra no v1

- Save / load de comparação (print basta).
- Write no S3, sessão, localStorage, login.
- Estatísticas, scouting, notas por jogador.
- CRUD de elenco na UI (JSON pode nascer fora do app).
- Multi-time. Foco Atlético-MG.
- Backend de domínio / banco relacional.

## Desafios (o que pode quebrar o desenho)

1. **Layout de broadcast** — o print é 16:9 rígido. Overlay canvas fixo (ex. 1920×1080).
2. **Três UX de comparativo** — mesmo símbolo, três hit-targets. Contrato único no core.
3. **Jogador em mais de uma posição** — `id` estável; nome não é chave.
4. **Janela 1 / 2 / null** — badge no card, não no comparativo.
5. **Câmera** — buraco visual (preto ou chroma), não `<video>` da webcam no overlay.
6. **API só lê S3** — credencial fora do browser; JSON de elenco público de leitura.

## Decisões já tomadas neste papo

- Camadas raiz: `input`, `core`, `output`.
- API interna no monolito; S3 somente leitura no v1.
- Sem login; site pode ser público.
- Comparativo em memória; print é o artefato.
- Três interações de comparativo para teste.
- Enums no core: posição, janela de chegada do jogador, valor de comparação.
- **Uma rota só** no v1 (layout + controles na mesma página).
- Chave do elenco: `{ano}-{janela}` → `2025-1`, `2025-2`. Duas janelas por ano.
- Stack do `input/`: **Vue 3 + Vite**.

Pontos abertos do papo anterior foram fechados. Próximo passo: scaffold do monolito.
