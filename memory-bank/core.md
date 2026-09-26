# Core — regra de negócio pura

O `core/` não importa Vue, DOM, HTTP, AWS SDK nem paths de S3. Ele descreve o domínio, valida e calcula o que a tela só exibe. Sem regra de save no v1.

Quem chama o core: a camada `input` (após clique) e a camada `output` (ao hidratar JSON do S3). Os dois falam a mesma língua.

## Enums (fonte da verdade)

Valores estáveis no código e no JSON. Labels de UI ficam no `input/`.

### Posição

Ordem de render das faixas (igual ao print):

| Enum | Label (PT) |
|---|---|
| `GOLEIRO` | Goleiros |
| `ZAGUEIRO` | Zagueiros |
| `LATERAL_DIREITO` | Laterais direitos |
| `LATERAL_ESQUERDO` | Laterais esquerdos |
| `VOLANTE` | Volantes |
| `MEIA` | Meias |
| `ATACANTE` | Atacantes |

Jogador tem `posicoes: Posicao[]` (mínimo 1). Pode aparecer em mais de uma fileira.

### Janela de transferência (badge no card)

| Enum / JSON | Significado | UI |
|---|---|---|
| `1` | Chegou na janela 1 daquele elenco | badge verde `1` |
| `2` | Chegou na janela 2 | badge verde `2` |
| `null` | Não chegou naquele ano (já estava / sem badge de chegada) | sem badge |

Isso **não** entra no comparativo. É metadado do jogador naquele elenco.

### Valor de comparação (por posição)

Sempre do ponto de vista **esquerda vs direita**, não “2025 vs 2026” hardcoded. Os rótulos vêm do id do elenco (`2025-1`, `2026-2`).

| Enum | Símbolo no overlay | Leitura (se esquerda=`2025-2`, direita=`2026-1`) |
|---|---|---|
| `IGUAL` | `=` | Mesmo nível |
| `ESQ_MELHOR` | `>` (seta para a esquerda no print) | Elenco da esquerda é melhor |
| `ESQ_MUITO_MELHOR` | `>>` | Elenco da esquerda é bem melhor |
| `DIR_MELHOR` | `<` | Elenco da direita é melhor |
| `DIR_MUITO_MELHOR` | `<<` | Elenco da direita é bem melhor |

No print a seta aponta para o lado vencedor. No domínio gravamos **esquerda/direita**.

Ordem cíclica proposta para o teste de botão único:

`IGUAL` → `ESQ_MELHOR` → `ESQ_MUITO_MELHOR` → `DIR_MELHOR` → `DIR_MUITO_MELHOR` → (volta)

(Equivale ao “começar no `=`, depois `>`, `>>`, `<`, `<<`”.)

Legenda do espectador (texto fixo no overlay):

- seta simples → aquele lado é melhor
- seta dupla → bem melhor
- `=` → mesmo nível
- quadrado verde → janela em que o jogador chegou (card, não comparativo)

## Entidades

### Jogador

```ts
type JanelaChegada = 1 | 2 | null;

interface Jogador {
  id: string;          // estável (slug ou uuid). NÃO usar só o nome como id
  nome: string;
  fotoUrl: string;     // URL pública ou path lógico resolvido no output
  janela: JanelaChegada;
  posicoes: Posicao[]; // >= 1
}
```

Regras:

- `nome` obrigatório, trim, não vazio.
- `posicoes` sem duplicata.
- `janela` só `1 | 2 | null`.
- O mesmo `id` pode existir em elencos diferentes (o jogador “continou”); a `janela` é **por elenco**, então o objeto jogador é persistido **dentro** do JSON do elenco, não num cadastro global no v1. Se no futuro houver ficha única, o `id` já permite merge.

### Elenco

Dois snapshots por ano civil (janela 1 e janela 2). A chave **é** o rótulo curto:

```ts
type JanelaElenco = 1 | 2; // qual snapshot do ano este JSON é

interface Elenco {
  id: string;          // "2025-1" | "2025-2" | "2026-1" | …
  rotulo: string;      // "ELENCO 2025-1" — título da faixa (pode derivar de `id`)
  ano: number;         // 2025
  janela: JanelaElenco; // 1 ou 2 — tem que bater com o sufixo do id
  jogadores: Jogador[];
}
```

Regras:

- `id` no formato `{ano}-{janela}` (`/^\d{4}-[12]$/`).
- Arquivo no S3: `elencos/2025-1.json` (o `id` é o nome do objeto).
- `Elenco.janela` ≠ `Jogador.janela`: a primeira diz **qual snapshot** é este JSON; a segunda é o **badge de chegada** do atleta naquele plantel (`1` \| `2` \| `null`).

Função pura: `agruparPorPosicao(elenco) → Record<Posicao, Jogador[]>`.

Um jogador com duas posições entra nos dois arrays (referência ao mesmo objeto/`id`).

### Comparativo (estado ao vivo)

```ts
interface Comparativo {
  elencoEsquerdaId: string;
  elencoDireitaId: string;
  valores: Record<Posicao, ValorComparacao>;
}
```

Regras:

- Os dois ids de elenco são obrigatórios e **distintos**.
- Toda posição do enum tem um valor. Default de fábrica: `IGUAL`.
- Trocar um elenco (carregar outro `2025-1` / `2026-2`) **não** apaga os valores sozinho — a produção pode querer manter o debate. Reset é ação explícita da UI (`resetComparativo`).
- Estado do comparativo **não persiste**. Refresh volta ao default. O artefato é o print da tela.

Save nomeado, load e snapshot: `melhorias_futuras.md`.

Funções puras (v1):

- `cicloProximo(valorAtual): ValorComparacao`
- `passoSeta(valorAtual, direcao: 'esq' | 'dir'): ValorComparacao`
- `comparativoVazio(idEsq, idDir)`
- `resetComparativo(comparativo)`
- `agruparPorPosicao(elenco)`
- `validarElenco`, `validarJogador`, `validarComparativo`

## O que o core NÃO faz

- Não monta HTML.
- Não escolhe qual das 3 UX está ativa (flag de UI).
- Não assina URL do S3, não lista bucket, não sabe `s3://`.
- Não formata CSS da câmera.
- Não define se o sync é websocket ou poll — só o shape do `Comparativo` que trafega.

## Contratos de teste (quando formos codar)

- Ciclo fecha nos 5 valores e volta ao `IGUAL`.
- Setas: a partir de `IGUAL`, seta direita uma vez → `DIR_MELHOR`; duas → `DIR_MUITO_MELHOR`; seta esquerda desfaz ou vai para o lado esquerdo (tabela fecha na implementação).
- Agrupar por posição duplica jogador multi-posição sem duplicar `id` na mesma fileira.
