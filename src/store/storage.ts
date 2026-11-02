import { SEED_MATCHES, SEED_PLAYERS } from "../domain/seed";
import { recomputePhases } from "../domain/campaigns";
import type { PersistedState, Scope, TournamentType } from "../domain/types";

export const STORAGE_KEY = "fulbo-tracker:v1";
export const UI_STORAGE_KEY = "fulbo-tracker:ui:v1";

export interface PersistedUiPrefs {
  scope: Scope;
  lastTournament: TournamentType;
}

export type LoadStateResult =
  | { status: "ok"; state: PersistedState }
  | { status: "corrupted"; raw: string };

export function createSeedState(): PersistedState {
  const { matches } = recomputePhases(SEED_MATCHES);
  return {
    schemaVersion: 1,
    players: SEED_PLAYERS.map((p) => ({ ...p, aliases: [...p.aliases] })),
    matches,
    updatedAt: new Date().toISOString(),
  };
}

export function isValidPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  if (obj.schemaVersion !== 1) return false;
  if (!Array.isArray(obj.players) || !Array.isArray(obj.matches)) return false;

  for (const p of obj.players) {
    if (!p || typeof p !== "object") return false;
    const pl = p as Record<string, unknown>;
    if (typeof pl.id !== "string" || typeof pl.displayName !== "string") return false;
    if (!Array.isArray(pl.aliases)) return false;
  }

  for (const m of obj.matches) {
    if (!m || typeof m !== "object") return false;
    const ma = m as Record<string, unknown>;
    if (typeof ma.id !== "string") return false;
    if (ma.tournamentType !== "mundialito" && ma.tournamentType !== "mixto") return false;
    if (typeof ma.date !== "string" || typeof ma.cost !== "number") return false;
    if (ma.result !== "win" && ma.result !== "loss" && ma.result !== "draw") return false;
    if (!Array.isArray(ma.teamPlayers) || ma.teamPlayers.length === 0) return false;
  }

  return true;
}

export function loadPersistedState(): LoadStateResult {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const seed = createSeedState();
      savePersistedState(seed);
      return { status: "ok", state: seed };
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isValidPersistedState(parsed)) {
      return { status: "corrupted", raw };
    }
    const { matches } = recomputePhases(parsed.matches);
    return {
      status: "ok",
      state: {
        ...parsed,
        matches,
      },
    };
  } catch {
    let raw = "";
    try {
      raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      raw = "";
    }
    return { status: "corrupted", raw };
  }
}

export function savePersistedState(state: PersistedState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function parseImportedBackup(rawText: string): PersistedState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("El archivo no es una copia de Fulbo Tracker.");
  }
  if (!isValidPersistedState(parsed)) {
    throw new Error("El archivo no es una copia de Fulbo Tracker.");
  }
  const { matches } = recomputePhases(parsed.matches);
  return {
    schemaVersion: 1,
    players: parsed.players,
    matches,
    updatedAt: new Date().toISOString(),
  };
}

export function loadUiPrefs(): PersistedUiPrefs {
  try {
    const raw = window.localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) return { scope: "mundialito", lastTournament: "mundialito" };
    const parsed = JSON.parse(raw) as Partial<PersistedUiPrefs>;
    const scope: Scope =
      parsed.scope === "mundialito" || parsed.scope === "mixto" || parsed.scope === "all"
        ? parsed.scope
        : "mundialito";
    const lastTournament: TournamentType =
      parsed.lastTournament === "mixto" ? "mixto" : "mundialito";
    return { scope, lastTournament };
  } catch {
    return { scope: "mundialito", lastTournament: "mundialito" };
  }
}

export function saveUiPrefs(prefs: PersistedUiPrefs): void {
  try {
    window.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage failures on non-critical UI preferences.
  }
}

