import React, { useMemo } from "react";
import { useStore } from "../store/StoreContext";
import { computeMetrics } from "../domain/stats";
import { formatArs, formatDecimal, formatPct } from "../domain/format";
import { MatchCard } from "../components/MatchCard";
import { SolarIcon } from "../components/SolarIcon";
import { SplitHeading } from "../components/SplitHeading";
import { useViewChoreography } from "../components/MotionSystem";

export const MixtoView: React.FC = () => {
  const {
    matches,
    players,
    setOpenMatchId,
    setOpenPlayerId,
    setModal,
    activeUser,
  } = useStore();

  const viewRef = useViewChoreography<HTMLDivElement>([]);

  const mixtoMatches = useMemo(
    () =>
      matches
        .filter((m) => m.tournamentType === "mixto")
        .sort((a, b) => b.matchNumber - a.matchNumber),
    [matches]
  );

  const userMatches = useMemo(() => {
    if (!activeUser?.linkedPlayerId) return mixtoMatches;
    return mixtoMatches.filter((m) =>
      m.teamPlayers.includes(activeUser.linkedPlayerId)
    );
  }, [mixtoMatches, activeUser]);

  const metrics = useMemo(
    () =>
      computeMetrics(
        activeUser ? userMatches : mixtoMatches,
        "mixto",
        activeUser?.linkedPlayerId
      ),
    [activeUser, userMatches, mixtoMatches]
  );

  const playersMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  return (
    <div ref={viewRef} className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <SplitHeading
            as="h1"
            text="Torneo Mixto"
            className="font-display text-3xl sm:text-4xl font-bold text-[var(--text)]"
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Partidos con marcador de equipo, goles individuales y nómina de jugadores.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModal({ kind: "add", defaultTournament: "mixto" })}
          className="min-h-[44px] px-4 py-2 rounded-[8px] bg-[var(--win)] text-[var(--on-win)] text-sm font-semibold inline-flex items-center gap-2 active:scale-[0.97] transition-transform duration-150 cursor-pointer"
        >
          <SolarIcon name="plus" className="w-4 h-4" />
          <span>Cargar partido de Mixto</span>
        </button>
      </div>

      {mixtoMatches.length === 0 ? (
        <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--line-strong)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-[var(--text)]">
            No hay partidos de Mixto registrados todavía.
          </p>
          <button
            type="button"
            onClick={() => setModal({ kind: "add", defaultTournament: "mixto" })}
            className="min-h-[44px] px-4 py-2 rounded-[8px] bg-[var(--win)] text-[var(--on-win)] text-sm font-semibold active:scale-[0.97] transition-transform duration-150 cursor-pointer"
          >
            Registrar el primero
          </button>
        </div>
      ) : (
        <>
          <section
            aria-label="Métricas de Mixto"
            className="espn-card p-5"
          >
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x divide-[var(--line)]">
              <div className="sm:pr-5">
                <dt className="text-xs text-[var(--text-muted)]">Partidos</dt>
                <dd className="font-display text-3xl font-bold tabular-nums text-[var(--text)] mt-0.5">
                  {metrics.totalMatches}
                </dd>
                <dd className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums mt-0.5">
                  {metrics.totalWins} V · {metrics.totalDraws} E ·{" "}
                  {metrics.totalLosses} D
                </dd>
              </div>

              <div className="sm:px-5">
                <dt className="text-xs text-[var(--text-muted)]">Win rate</dt>
                <dd className="font-display text-3xl font-bold tabular-nums text-[var(--text)] mt-0.5">
                  {formatPct(metrics.globalWinRate, 1)}
                </dd>
                <dd className="text-xs text-[var(--text-muted)] mt-0.5">
                  Empates no suman
                </dd>
              </div>

              <div className="sm:px-5">
                <dt className="text-xs text-[var(--text-muted)]">
                  {activeUser ? `Goles de ${activeUser.displayName}` : "Goles individuales"}
                </dt>
                <dd className="font-display text-3xl font-bold tabular-nums text-[var(--text)] mt-0.5">
                  {metrics.totalGoals}
                </dd>
                <dd className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums mt-0.5">
                  {formatDecimal(metrics.avgGoalsPerMatch, 2)} x pdo
                </dd>
              </div>

              <div className="sm:pl-5">
                <dt className="text-xs text-[var(--text-muted)]">Invertido</dt>
                <dd className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[var(--text)] mt-0.5">
                  {formatArs(metrics.totalSpent)}
                </dd>
                <dd className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums mt-0.5">
                  {formatArs(metrics.avgCost)} x pdo
                </dd>
              </div>
            </dl>
          </section>

          <section aria-label="Partidos de Mixto" className="flex flex-col gap-3">
            {mixtoMatches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                playersMap={playersMap}
                onOpenMatch={setOpenMatchId}
                onOpenPlayer={setOpenPlayerId}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
};
