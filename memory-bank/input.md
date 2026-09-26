# Input — apresentação

`input/` é o Vue 3 + Vite: HTML, CSS, componentes, e o ato de **disparar** intenção (“ciclou comparativo”). Sem botão de save no v1. Enums vêm de `core/`.

## Superfície de tela (v1)

**Uma rota só** (`/`). Na mesma página: layout do print + controles (escolher elencos `2025-1` / `2026-2`, toggle das 3 UX do comparativo).

CRUD de elencos e split overlay/painel: `melhorias_futuras.md`.

## Layout (contrato visual)

Espelhar o print, canvas **fixo 1920×1080** (não “responsivo para celular”). Produção de conteúdo não é site.

```
+------------------+---------------------------+------------------+
| ELENCO {id}      |        [ CÂMERA ]         | ELENCO {id}      |
| Goleiros …       |                           | Goleiros …       |
| Zagueiros …      |      COMPARATIVO          | …                |
| …                |      (7 posições)         |                  |
| Atacantes …      |      LEGENDA              | Atacantes …      |
+------------------+---------------------------+------------------+
```

Título da faixa: `ELENCO 2025-1` (o `id` do elenco).

- Fundo escuro + molduras amarelas (identidade do print).
- **Câmera:** retângulo preto (ou chroma key) no topo-centro. Não embarcar webcam. O web só reserva o furo.
- Cada posição: label + row de heads (foto circular, badge 1/2 se `jogador.janela != null`).
- Comparativo: 7 células (6 em grid 2 colunas + atacantes centralizado, como no print), cada uma: `{idEsq} {símbolo} {idDir}`.
- Legenda fixa, não editável no ar.
- Sem persistir comparação: o criador tira print da tela.

## Comparativo — três UX para testar

O **símbolo desenhado é idêntico**. Só o hit-target muda. Toggle na própria página: `ciclo | seletor | setas`.

### 1. Ciclo no clique

Clica na célula (ou no símbolo). Avança na ordem do core: `=` → `>` → `>>` → `<` → `<<` → `=`.

Prós: zero deslocamento de olho, um gesto no calor do debate.  
Contras: passar do ponto obriga ciclar o resto; sem feedback de “o que vem next”.

### 2. Seletor

Clique abre 5 opções visuais (os próprios símbolos). Escolhe um, fecha.

Prós: explícito, não erra o ciclo.  
Contras: um passo extra.

### 3. Valor central + setas

Símbolo no meio; um controle para o lado esquerdo e um para o direito (simples e dupla, ou seta e seta-seta).

Leitura operacional: seta para a esquerda premia o elenco A; dupla premia “bem melhor”; idem direita. Clique no `=` reseta.

Prós: bate com a metáfora da seta do print.  
Contras: mais alvos; precisa bater a tabela de transições com o core (`passoSeta`).

**Recomendação de teste:** as três na mesma página. Medir no ensaio qual o produtor acerta mais rápido.

## Estado que a view segura (mínimo)

Store (ref/reactive do Vue, ou Pinia se precisar — v1 cabe num composable):

- `elencoEsq`, `elencoDir` (carregados via API, ids tipo `2025-1`)
- `comparativo` (valores, só memória)
- `modoInteracao`

Save/load de UI: `melhorias_futuras.md`.

Toda mutação de valor passa por função do core. O composable de input chama a API (`output`) e hidrata via core.

Na implementação atual, `input/` tem dados de demonstração enquanto não há elencos locais configurados. A tela tenta carregar o índice e os dois elencos iniciais pela API; em caso de falha informa o motivo e mantém os mocks como fallback. A URL da API pode ser definida com `VITE_API_URL` (padrão `http://localhost:3000`). Elencos adicionais do índice são carregados sob demanda pela mesma API. O Vite lê as variáveis do `.env` da raiz do monorepo.

## O que o input NÃO faz

- Não escreve no S3.
- Não monta key `elencos/2025-1.json` (só manda o `id`; o output resolve).
- Não decide CORS, content-type, UUID de arquivo.

## Dependências Vue (esperadas)

- Vue 3 + Vite, Composition API.
- Sem Pinia no v1, a menos que o estado estoure um composable.
- `fetch` / axios só contra a API do próprio monolito.
- Sem AWS SDK no browser.
