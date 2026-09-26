import type { Elenco, ElencoResumo, Jogador, Posicao } from "@janela-galo/core";

export const MOCK_ELENCOS: ElencoResumo[] = [
  { id: "2025-1", rotulo: "ELENCO 2025-1", ano: 2025, janela: 1 },
  { id: "2026-2", rotulo: "ELENCO 2026-2", ano: 2026, janela: 2 },
];

function jogador(
  id: string,
  nome: string,
  janela: Jogador["janela"],
  ...posicoes: Posicao[]
): Jogador {
  return { id, nome, fotoUrl: "", janela, posicoes };
}

export const MOCK_ELENCOS_POR_ID: Record<string, Elenco> = {
  "2025-1": {
    id: "2025-1",
    rotulo: "ELENCO 2025-1",
    ano: 2025,
    janela: 1,
    jogadores: [
      jogador("everson", "Everson", null, "GOLEIRO"),
      jogador("lyanco", "Lyanco", 1, "ZAGUEIRO"),
      jogador("saravia", "Saravia", null, "LATERAL_DIREITO"),
      jogador("guilherme-arana", "Guilherme Arana", null, "LATERAL_ESQUERDO"),
      jogador("alan-franco", "Alan Franco", null, "VOLANTE", "MEIA"),
      jogador("gustavo-scarpa", "Gustavo Scarpa", 1, "MEIA", "ATACANTE"),
      jogador("hulk", "Hulk", null, "ATACANTE"),
    ],
  },
  "2026-2": {
    id: "2026-2",
    rotulo: "ELENCO 2026-2",
    ano: 2026,
    janela: 2,
    jogadores: [
      jogador("everson", "Everson", null, "GOLEIRO"),
      jogador("junior-alonso", "Júnior Alonso", 2, "ZAGUEIRO"),
      jogador("natanael", "Natanael", 2, "LATERAL_DIREITO"),
      jogador("guilherme-arana", "Guilherme Arana", null, "LATERAL_ESQUERDO"),
      jogador("alan-franco", "Alan Franco", null, "VOLANTE", "MEIA"),
      jogador("gustavo-scarpa", "Gustavo Scarpa", null, "MEIA", "ATACANTE"),
      jogador("riku", "Riku", 2, "ATACANTE"),
    ],
  },
};
