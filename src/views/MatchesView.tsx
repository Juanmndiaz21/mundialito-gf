import React, { useMemo, useState } from "react";
import { useStore } from "../store/StoreContext";
import { PHASE_ORDER } from "../domain/campaigns";
import type { Phase } from "../domain/types";
import { PHASE_LABELS, PHASE_SHORT_LABELS } from "../domain/format";
import { countActiveFilters, type MatchFilters } from "../store/router";
import { MatchCard } from "../components/MatchCard";
import { SolarIcon } from "../components/SolarIcon";
import { SplitHeading } from "../components/SplitHeading";
import { useViewChoreography } from "../components/MotionSystem";
import { useFocusTrap } from "../components/useFocusTrap";

function buildEmptyFilterSentence(
  filters: MatchFilters,
  playersMap: Map<string, { displayName: string }>
): string {
  const parts: string[] = ["Ningún partido"];
  if (filters.result === "win") parts.push("ganado");
  if (filters.result === "loss") parts.push("perdido");

  if (filters.players.length > 0) {
    const names = filters.players.map(
      (id) => playersMap.get(id)?.displayName ?? id
    );
    parts.push(`con ${names.join(" y ")}`);
  }

  if (filters.phases.length > 0) {
    const phNames = filters.phases.map((p) => PHASE_LABELS[p]);
    parts.push(`en ${phNames.join(" o ")}`);
  }

  if (filters.campaign !== null) {
    parts.push(`del Mundial ${filters.campaign}`);
  }

  return `${parts.join(" ")}.`;
}

export const MatchesView: React.FC = () => {
  const {
    matches,
    players,
    campaigns,
    filters,
    setFilters,
    clearFilters,
    setOpenMatchId,
    setOpenPlayerId,
    setModal,
    activeUser,
  } = useStore();

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const viewRef = useViewChoreography<HTMLDivElement>([]);

  const playersMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  const mundialitoMatches = useMemo(
    () => matches.filter((m) => m.tournamentType === "mundialito"),
    [matches]
  );

  const campaignByMatchId = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of campaigns) {
      for (const id of c.matchIds) {
        map.set(id, c.index);
      }
    }
    return map;
  }, [campaigns]);

  const filteredMatches = useMemo(() => {
    return mundialitoMatches.filter((m) => {
      if (filters.result !== "all" && m.result !== filters.result) {
        return false;
      }
      if (
        filters.phases.length > 0 &&
        (!m.phase || !filters.phases.includes(m.phase))
      ) {
        return false;
      }
      if (
        filters.players.length > 0 &&
        !filters.players.every((pid) => m.teamPlayers.includes(pid))
      ) {
        return false;
      }
      if (
        filters.campaign !== null &&
        campaignByMatchId.get(m.id) !== filters.campaign
      ) {
        return false;
      }
      return true;
    });
  }, [campaignByMatchId, filters, mundialitoMatches]);

  const activeFilterCount = countActiveFilters(filters);

  const togglePhase = (phase: Phase) => {
    const exists = filters.phases.includes(phase);
    const next = exists
      ? filters.phases.filter((p) => p !== phase)
      : [...filters.phases, phase];
    setFilters({ phases: next });
  };

  const togglePlayer = (playerId: string) => {
    const exists = filters.players.includes(playerId);
    const next = exists
      ? filters.players.filter((id) => id !== playerId)
      : [...filters.players, playerId];
    setFilters({ players: next });
  };

  const mundialitoPlayerList = useMemo(() => {
    const usedIds = new Set<string>();
    for (const m of mundialitoMatches) {
      for (const pid of m.teamPlayers) usedIds.add(pid);
    }
    return players
      .filter((p) => usedIds.has(p.id))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "es-AR"));
  }, [mundialitoMatches, players]);

  const trapRef = useFocusTrap<HTMLDivElement>(mobileSheetOpen, () =>
    setMobileSheetOpen(false)
  );

  const renderFilterControls = () => (
    <div className="flex flex-col gap-4">
      {activeUser && (
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--line)] flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Filtro rápido:</span>
            <button
              type="button"
              onClick={() => {
                const hasMe = filters.players.includes(activeUser.linkedPlayerId);
                if (hasMe) {
                  setFilters({
                    players: filters.players.filter(
                      (p) => p !== activeUser.linkedPlayerId
                    ),
                  });
                } else {
                  setFilters({
                    players: [activeUser.linkedPlayerId],
                  });
                }
              }}
              className={`min-h-[36px] px-3 py-1 rounded-[6px] text-xs font-bold border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                filters.players.includes(activeUser.linkedPlayerId)
                  ? "bg-[var(--win)] text-white border-[var(--win)] shadow-xs"
                  : "bg-[var(--surface-2)] text-[var(--text)] border-[var(--line-strong)] hover:border-[var(--win)]"
              }`}
            >
              <SolarIcon name="userId" className="w-3.5 h-3.5" />
              <span>
                Solo partidos de {activeUser.displayName} (#{String(activeUser.dorsal).padStart(2, "0")})
              </span>
            </button>
          </div>

          {filters.players.includes(activeUser.linkedPlayerId) && (
            <span className="text-xs font-semibold text-[var(--win)]">
              Mostrando cotejos donde jugó {activeUser.displayName}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <span className="block text-xs text-[var(--text-muted)] mb-1.5">
            Resultado
          </span>
          <div
            role="group"
            aria-label="Filtrar por resultado"
            className="inline-flex rounded-[8px] bg-[var(--surface-2)] p-1 border border-[var(--line-strong)] gap-1"
          >
            {(
              [
                { value: "all", label: "Todos" },
                { value: "win", label: "Victorias" },
                { value: "loss", label: "Derrotas" },
              ] as const
            ).map((opt) => {
              const active = filters.result === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilters({ result: opt.value })}
                  className={`min-h-[38px] px-3 py-1 rounded-[4px] text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    active
                      ? "bg-[var(--win)] text-[var(--on-win)]"
                      : "text-[var(--text)] hover:bg-[var(--surface)]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="block text-xs text-[var(--text-muted)] mb-1.5">
            Fase del Mundial
          </span>
          <div
            role="group"
            aria-label="Filtrar por fase"
            className="flex flex-wrap gap-1.5"
          >
            {PHASE_ORDER.map((ph) => {
              const active = filters.phases.includes(ph);
              return (
                <button
                  key={ph}
                  type="button"
                  aria-pressed={active}
                  onClick={() => togglePhase(ph)}
                  className={`min-h-[38px] px-3 py-1 rounded-[4px] border text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    active
                      ? "bg-[var(--win)] text-[var(--on-win)] border-[var(--win)]"
                      : "bg-[var(--surface-2)] text-[var(--text)] border-[var(--line-strong)] hover:border-[var(--win)]"
                  }`}
                >
                  {PHASE_SHORT_LABELS[ph]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="campaign-filter-select"
            className="block text-xs text-[var(--text-muted)] mb-1.5"
          >
            Campaña
          </label>
          <select
            id="campaign-filter-select"
            value={filters.campaign ?? ""}
            onChange={(e) =>
              setFilters({
                campaign: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="min-h-[40px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-xs font-semibold text-[var(--text)]"
          >
            <option value="">Todas las campañas</option>
            {campaigns.map((c) => (
              <option key={c.index} value={c.index}>
                Mundial {c.index}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="block text-xs text-[var(--text-muted)] mb-1.5">
          Compañeros (incluye a todos los elegidos)
        </span>
        <div
          role="group"
          aria-label="Filtrar por compañero"
          className="flex flex-wrap gap-1.5"
        >
          {mundialitoPlayerList.map((p) => {
            const active = filters.players.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => togglePlayer(p.id)}
                className={`min-h-[38px] px-2.5 py-1 rounded-[4px] border text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  active
                    ? "bg-[var(--win)] text-[var(--on-win)] border-[var(--win)] font-semibold"
                    : "bg-[var(--surface-2)] text-[var(--text)] border-[var(--line-strong)] hover:border-[var(--win)]"
                }`}
              >
                {p.displayName}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (mundialitoMatches.length === 0) {
    return (
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--line-strong)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-[var(--text)]">
          No hay partidos registrados de Fútbol 2026 todavía.
        </p>
        <button
          type="button"
          onClick={() =>
            setModal({ kind: "add", defaultTournament: "mundialito" })
          }
          className="min-h-[44px] px-4 py-2 rounded-[8px] bg-[var(--win)] text-[var(--on-win)] text-sm font-semibold active:scale-[0.97] transition-transform duration-150 cursor-pointer"
        >
          Registrar el primero
        </button>
      </div>
    );
  }

  return (
    <div ref={viewRef} className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <SplitHeading
            as="h1"
            text="Partidos · Fútbol 2026"
            className="font-display text-3xl sm:text-4xl font-bold text-[var(--text)]"
          />
          <p className="text-sm text-[var(--text-muted)] mt-1 tabular-nums">
            {filteredMatches.length} de {mundialitoMatches.length} partidos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-[44px] px-3.5 py-2 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] hover:border-[var(--loss)] text-xs font-semibold text-[var(--text)] cursor-pointer"
            >
              Quitar filtros
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="lg:hidden min-h-[44px] px-3.5 py-2 rounded-[8px] bg-[var(--surface)] border border-[var(--line-strong)] text-xs font-semibold text-[var(--text)] inline-flex items-center gap-2 cursor-pointer"
          >
            <SolarIcon name="filter" className="w-4 h-4 text-[var(--win)]" />
            <span>
              Filtrar{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </span>
          </button>
        </div>
      </div>

      <section
        aria-label="Filtros de partidos"
        className="hidden lg:block espn-card p-5"
      >
        {renderFilterControls()}
      </section>

      {mobileSheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 flex items-end bg-black/75"
          onClick={() => setMobileSheetOpen(false)}
        >
          <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-sheet-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="drawer-surface w-full max-h-[88dvh] overflow-y-auto bg-[var(--surface)] border-t border-[var(--line-strong)] rounded-t-[12px] p-4 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--line-strong)] pb-3">
              <h2
                id="filter-sheet-title"
                className="font-display text-2xl font-bold text-[var(--text)]"
              >
                Filtrar partidos
              </h2>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                aria-label="Cerrar filtros"
                className="min-w-[44px] min-h-[44px] rounded-[8px] inline-flex items-center justify-center text-[var(--text-muted)] border border-[var(--line-strong)]"
              >
                <SolarIcon name="close" className="w-5 h-5" />
              </button>
            </div>

            {renderFilterControls()}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-[8px] bg-[var(--win)] text-[var(--on-win)] text-sm font-semibold active:scale-[0.97] transition-transform duration-150"
              >
                Ver {filteredMatches.length} partidos
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearFilters();
                    setMobileSheetOpen(false);
                  }}
                  className="min-h-[44px] px-4 py-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm font-medium text-[var(--text)]"
                >
                  Quitar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {filteredMatches.length === 0 ? (
        <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--line-strong)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-[var(--text)]">
            {buildEmptyFilterSentence(filters, playersMap)}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-[44px] px-4 py-2 rounded-[8px] bg-[var(--win)] text-[var(--on-win)] text-sm font-semibold cursor-pointer"
          >
            Quitar filtros
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {[...campaigns].reverse().map((camp) => {
            const campMatchIds = new Set(camp.matchIds);
            const groupMatches = filteredMatches
              .filter((m) => campMatchIds.has(m.id))
              .sort((a, b) => b.matchNumber - a.matchNumber);

            if (groupMatches.length === 0) return null;

            let campSummary = "";
            if (camp.status === "active") {
              campSummary = `en curso, próximo: ${
                PHASE_LABELS[camp.nextPhase ?? "group"]
              }`;
            } else if (camp.status === "champion") {
              campSummary = "campeón";
            } else if (camp.eliminatedAt === "final") {
              campSummary = "subcampeón";
            } else if (camp.eliminatedAt) {
              campSummary = `afuera en ${PHASE_LABELS[camp.eliminatedAt]}`;
            }

            return (
              <section
                key={camp.index}
                aria-labelledby={`campaign-group-${camp.index}`}
                className="flex flex-col gap-3"
              >
                <div className="flex items-baseline justify-between border-b border-[var(--line-strong)] pb-2">
                  <h2
                    id={`campaign-group-${camp.index}`}
                    className="font-display text-2xl font-bold text-[var(--text)]"
                  >
                    Mundial {camp.index} · {campSummary}
                  </h2>
                  <span className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums">
                    {groupMatches.length}{" "}
                    {groupMatches.length === 1 ? "partido" : "partidos"}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {groupMatches.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      campaignIndex={camp.index}
                      playersMap={playersMap}
                      onOpenMatch={setOpenMatchId}
                      onOpenPlayer={setOpenPlayerId}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
