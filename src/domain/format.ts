import type { BadgeId, MatchResult, Phase, Scope } from "./types";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function formatArs(amount: number): string {
  return arsFormatter.format(Math.round(amount));
}

// Parse YYYY-MM-DD in local time so UTC-3 never shifts the day backwards.
function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatMatchDate(isoDate: string): string {
  const date = parseLocalDate(isoDate);
  return dateFormatter.format(date).replace(/\./g, "");
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals).replace(".", ",")} %`;
}

export function formatDecimal(value: number, decimals = 2): string {
  return value.toFixed(decimals).replace(".", ",");
}

export const PHASE_LABELS: Record<Phase, string> = {
  group: "Fase de grupos",
  r16: "Octavos de final",
  qf: "Cuartos de final",
  sf: "Semifinal",
  final: "Final",
};

export const PHASE_SHORT_LABELS: Record<Phase, string> = {
  group: "Grupos",
  r16: "8vos",
  qf: "4tos",
  sf: "Semi",
  final: "Final",
};

export const RESULT_LETTER: Record<MatchResult, string> = {
  win: "V",
  loss: "D",
  draw: "E",
};

export const RESULT_LABEL: Record<MatchResult, string> = {
  win: "Victoria",
  loss: "Derrota",
  draw: "Empate",
};

export const BADGE_LABELS: Record<BadgeId, string> = {
  talisman: "Talismán",
  inseparable: "Inseparable",
  mufa: "Mufa",
  invicto: "Invicto",
};

export const SCOPE_LABELS: Record<Scope, string> = {
  mundialito: "Fútbol 2026",
  mixto: "Mixto",
  all: "Todo",
};

const AVATAR_TONES = [
  { bg: "#172A20", text: "#C8E6D2", border: "#4E7A61" },
  { bg: "#1E2822", text: "#D5E3DA", border: "#5E7568" },
  { bg: "#232A1B", text: "#DCE5CC", border: "#6C7D58" },
  { bg: "#1A2729", text: "#CBE2E5", border: "#55767A" },
  { bg: "#26231C", text: "#E6DEC8", border: "#7A7158" },
  { bg: "#1F2429", text: "#D4DCE5", border: "#606D7A" },
];

export function playerTone(playerId: string): {
  bg: string;
  text: string;
  border: string;
} {
  let hash = 0;
  for (let i = 0; i < playerId.length; i += 1) {
    hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export function playerDorsal(playerId: string): string {
  let hash = 0;
  for (let i = 0; i < playerId.length; i += 1) {
    hash = (hash * 37 + playerId.charCodeAt(i)) >>> 0;
  }
  const num = (hash % 98) + 2;
  return String(num).padStart(2, "0");
}

export function formatMatchCode(n: number): string {
  return String(n).padStart(3, "0");
}

export function todayIsoLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

