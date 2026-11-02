import type { Phase } from "../domain/types";
import { PHASE_ORDER } from "../domain/campaigns";

export type RoutePath =
  | "/"
  | "/torneo"
  | "/partidos"
  | "/feeling"
  | "/mixto"
  | "/campeones"
  | "/club"
  | "/equipos";

export interface MatchFilters {
  result: "all" | "win" | "loss";
  phases: Phase[];
  players: string[];
  campaign: number | null;
}

export interface ParsedRoute {
  path: RoutePath;
  filters: MatchFilters;
}

export const EMPTY_FILTERS: MatchFilters = {
  result: "all",
  phases: [],
  players: [],
  campaign: null,
};

export function parseHash(hash: string): ParsedRoute {
  const cleaned = hash.replace(/^#/, "") || "/";
  const [rawPath, rawQuery = ""] = cleaned.split("?");
  const path: RoutePath =
    rawPath === "/torneo" ||
    rawPath === "/partidos" ||
    rawPath === "/feeling" ||
    rawPath === "/mixto" ||
    rawPath === "/campeones" ||
    rawPath === "/club" ||
    rawPath === "/equipos"
      ? rawPath
      : "/";

  const params = new URLSearchParams(rawQuery);
  const resParam = params.get("resultado");
  const result: "all" | "win" | "loss" =
    resParam === "win" || resParam === "loss" ? resParam : "all";

  const phasesParam = params.get("fase");
  const phases: Phase[] = phasesParam
    ? phasesParam
        .split(",")
        .map((s) => s.trim() as Phase)
        .filter((p) => PHASE_ORDER.includes(p))
    : [];

  const playersParam = params.get("jugador");
  const players: string[] = playersParam
    ? playersParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const campParam = params.get("campana");
  const campNum = campParam ? Number(campParam) : NaN;
  const campaign = Number.isInteger(campNum) && campNum > 0 ? campNum : null;

  return {
    path,
    filters: {
      result,
      phases,
      players,
      campaign,
    },
  };
}

export function buildHash(path: RoutePath, filters?: Partial<MatchFilters>): string {
  if (path !== "/partidos" || !filters) {
    return `#${path}`;
  }
  const params = new URLSearchParams();
  if (filters.result && filters.result !== "all") {
    params.set("resultado", filters.result);
  }
  if (filters.phases && filters.phases.length > 0) {
    params.set("fase", filters.phases.join(","));
  }
  if (filters.players && filters.players.length > 0) {
    params.set("jugador", filters.players.join(","));
  }
  if (filters.campaign) {
    params.set("campana", String(filters.campaign));
  }
  const qs = params.toString();
  return qs ? `#${path}?${qs}` : `#${path}`;
}

export function countActiveFilters(filters: MatchFilters): number {
  let count = 0;
  if (filters.result !== "all") count += 1;
  count += filters.phases.length;
  count += filters.players.length;
  if (filters.campaign !== null) count += 1;
  return count;
}
