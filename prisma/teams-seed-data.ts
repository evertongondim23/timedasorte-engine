/**
 * Grade fixa do Jogo do Bicho (ordem 1–25 dos bichos e faixas de milhar).
 * Os **animais** são o núcleo — nomes e emojis seguem a loteria tradicional.
 * Cada `name` é um clube brasileiro **compatível** com o bicho (apelido, mascote
 * ou torcida) e deve coincidir com as chaves em `TeamLogo.tsx` no app.
 *
 * ⚠️ Reordenar esta lista altera os `id` dos times no banco após seed limpo;
 * em produção com dados existentes, alinhar migração ou `migrate reset` em dev.
 */
export interface TeamSeedRow {
  name: string;
  animal: string;
  animalEmoji: string;
  jerseys: number[];
  color: string;
  shield: string;
}

export const BRAZILIAN_TEAMS_SEED: TeamSeedRow[] = [
  { name: "Flamengo", animal: "Avestruz", animalEmoji: "🦤", jerseys: [1, 2, 3, 4], color: "#E30613", shield: "🦤" },
  { name: "Corinthians", animal: "Águia", animalEmoji: "🦅", jerseys: [5, 6, 7, 8], color: "#000000", shield: "🦅" },
  { name: "São Paulo", animal: "Burro", animalEmoji: "🫏", jerseys: [9, 10, 11, 12], color: "#FF0000", shield: "🫏" },
  { name: "Fluminense", animal: "Borboleta", animalEmoji: "🦋", jerseys: [13, 14, 15, 16], color: "#8B0034", shield: "🦋" },
  { name: "Santos", animal: "Cachorro", animalEmoji: "🐕", jerseys: [17, 18, 19, 20], color: "#000000", shield: "🐕" },
  { name: "Vasco", animal: "Cabra", animalEmoji: "🐐", jerseys: [21, 22, 23, 24], color: "#000000", shield: "🐐" },
  { name: "Botafogo", animal: "Carneiro", animalEmoji: "🐏", jerseys: [25, 26, 27, 28], color: "#000000", shield: "🐏" },
  { name: "Bahia", animal: "Camelo", animalEmoji: "🐪", jerseys: [29, 30, 31, 32], color: "#0033A0", shield: "🐪" },
  { name: "Grêmio", animal: "Cobra", animalEmoji: "🐍", jerseys: [33, 34, 35, 36], color: "#0075BF", shield: "🐍" },
  { name: "Internacional", animal: "Coelho", animalEmoji: "🐰", jerseys: [37, 38, 39, 40], color: "#D10000", shield: "🐰" },
  { name: "Cruzeiro", animal: "Cavalo", animalEmoji: "🐴", jerseys: [41, 42, 43, 44], color: "#003DA5", shield: "🐴" },
  { name: "Chapecoense", animal: "Elefante", animalEmoji: "🐘", jerseys: [45, 46, 47, 48], color: "#009639", shield: "🐘" },
  { name: "Atlético-MG", animal: "Galo", animalEmoji: "🐓", jerseys: [49, 50, 51, 52], color: "#000000", shield: "🐓" },
  { name: "Vitória", animal: "Gato", animalEmoji: "🐱", jerseys: [53, 54, 55, 56], color: "#E30613", shield: "🐱" },
  { name: "Ceará", animal: "Jacaré", animalEmoji: "🐊", jerseys: [57, 58, 59, 60], color: "#000000", shield: "🐊" },
  { name: "Sport", animal: "Leão", animalEmoji: "🦁", jerseys: [61, 62, 63, 64], color: "#D10000", shield: "🦁" },
  { name: "Ponte Preta", animal: "Macaco", animalEmoji: "🐵", jerseys: [65, 66, 67, 68], color: "#000000", shield: "🐵" },
  { name: "Palmeiras", animal: "Porco", animalEmoji: "🐷", jerseys: [69, 70, 71, 72], color: "#006437", shield: "🐷" },
  { name: "Coritiba", animal: "Pavão", animalEmoji: "🦚", jerseys: [73, 74, 75, 76], color: "#00703C", shield: "🦚" },
  { name: "Goiás", animal: "Peru", animalEmoji: "🦃", jerseys: [77, 78, 79, 80], color: "#006F3C", shield: "🦃" },
  { name: "Athletico-PR", animal: "Touro", animalEmoji: "🐂", jerseys: [81, 82, 83, 84], color: "#E30613", shield: "🐂" },
  { name: "Criciúma", animal: "Tigre", animalEmoji: "🐯", jerseys: [85, 86, 87, 88], color: "#FFD700", shield: "🐯" },
  { name: "Paysandu", animal: "Urso", animalEmoji: "🐻", jerseys: [89, 90, 91, 92], color: "#0066CC", shield: "🐻" },
  { name: "Fortaleza", animal: "Veado", animalEmoji: "🦌", jerseys: [93, 94, 95, 96], color: "#DC143C", shield: "🦌" },
  { name: "Remo", animal: "Vaca", animalEmoji: "🐮", jerseys: [97, 98, 99, 0], color: "#0047AB", shield: "🐮" },
];
