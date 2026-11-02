import React, { useMemo, useRef, useState } from "react";
import { useStore } from "../store/StoreContext";
import {
  filterByScope,
  computeMetrics,
  computePlayerStats,
  computePartnerStats,
} from "../domain/stats";
import { winsNeededForTitle } from "../domain/campaigns";
import {
  formatArs,
  formatDecimal,
  formatPct,
  PHASE_LABELS,
  PHASE_SHORT_LABELS,
  RESULT_LABEL,
  RESULT_LETTER,
  SCOPE_LABELS,
} from "../domain/format";
import { PhaseTrack } from "../components/PhaseTrack";
import { ScopeSwitch } from "../components/ScopeSwitch";
import { WinRateGauge } from "../components/WinRateGauge";
import { SolarIcon } from "../components/SolarIcon";
import { SplitHeading } from "../components/SplitHeading";
import { TacticalPitchCanvas } from "../components/TacticalPitchCanvas";
import { ChampionsLeaderboardSection } from "../components/ChampionsLeaderboardSection";
import { POSITION_LABELS } from "../domain/leaderboard";
import { useViewChoreography } from "../components/MotionSystem";
import { CardSpotlight } from "../components/ui/CardSpotlight";
import { Magnet } from "../components/ui/Magnet";
import { CountUp } from "../components/ui/CountUp";

export const HomeView: React.FC = () => {
  const {
    matches,
    players,
    campaigns,
    scope,
    setScope,
    navigate,
    setModal,
    setOpenPlayerId,
    exportBackup,
    importBackupFile,
    isImporting,
    setConfirmDialog,
    resetToSeed,
    resetToEmpty,
    activeUser,
    openSignInModal,
  } = useStore();

  const [viewMode, setViewMode] = useState<"personal" | "club">("personal");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewRef = useViewChoreography<HTMLDivElement>([]);

  const userMatches = useMemo(() => {
    if (!activeUser?.linkedPlayerId) return matches;
    return matches.filter((m) =>
      m.teamPlayers.includes(activeUser.linkedPlayerId)
    );
  }, [matches, activeUser]);

  const isPersonal = Boolean(activeUser && viewMode === "personal");
  const displayedMatches = isPersonal ? userMatches : matches;

  const metrics = useMemo(
    () =>
      computeMetrics(
        displayedMatches,
        scope,
        isPersonal ? activeUser?.linkedPlayerId : null
      ),
    [displayedMatches, scope, isPersonal, activeUser]
  );

  const playerStats = useMemo(() => {
    if (isPersonal && activeUser) {
      return computePartnerStats(matches, players, scope, activeUser.linkedPlayerId);
    }
    return computePlayerStats(matches, players, scope);
  }, [isPersonal, activeUser, matches, players, scope]);

  const activeCampaign = useMemo(() => {
    const last = campaigns[campaigns.length - 1];
    if (!last || last.status !== "active") return null;
    return last;
  }, [campaigns]);

  const activeGroupMatches = useMemo(() => {
    if (!activeCampaign) return [];
    const ids = new Set(activeCampaign.matchIds);
    return matches.filter((m) => ids.has(m.id) && m.phase === "group");
  }, [activeCampaign, matches]);

  const recentFive = useMemo(() => {
    const scoped = filterByScope(displayedMatches, scope);
    return [...scoped]
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(a.date);
        return a.matchNumber - b.matchNumber;
      })
      .slice(-5);
  }, [displayedMatches, scope]);

  const talisman = useMemo(
    () => playerStats.find((s) => s.badges.includes("talisman")) ?? null,
    [playerStats]
  );
  const mufa = useMemo(
    () => playerStats.find((s) => s.badges.includes("mufa")) ?? null,
    [playerStats]
  );
  const inseparables = useMemo(
    () => playerStats.filter((s) => s.badges.includes("inseparable")),
    [playerStats]
  );
  const invictos = useMemo(
    () => playerStats.filter((s) => s.badges.includes("invicto")),
    [playerStats]
  );

  const maxPjInScope = useMemo(
    () =>
      playerStats.length > 0
        ? Math.max(...playerStats.map((s) => s.matchesPlayed))
        : 0,
    [playerStats]
  );

  const winsToChampion = winsNeededForTitle(activeCampaign ?? undefined);
  const nextCampaignNumber = activeCampaign
    ? activeCampaign.index
    : campaigns.length + 1;
  const nextPhaseLabel =
    activeCampaign && activeCampaign.nextPhase
      ? PHASE_LABELS[activeCampaign.nextPhase]
      : "Fase de grupos";

  return (
    <div ref={viewRef} className="flex flex-col gap-10 sm:gap-12">
      <CardSpotlight
        radius={360}
        color="rgba(229, 57, 53, 0.12)"
        data-animate="hero"
        aria-labelledby="campaign-path-heading"
        className="espn-card p-5 sm:p-7 flex flex-col gap-5 border border-[var(--line)] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="badge-hot text-[10px]">MATCH CENTER</span>
                <span className="text-xs font-bold text-[var(--espn-red-dark)] uppercase tracking-wider font-mono-tech">
                  MUNDIAL {nextCampaignNumber}
                </span>
              </div>
              <SplitHeading
                as="h1"
                id="campaign-path-heading"
                text={`Próximo partido: ${nextPhaseLabel}`}
                className="font-display text-3xl sm:text-[42px] font-black leading-tight text-[var(--espn-red)]"
              />
              <p className="text-sm text-[var(--text-muted)]">
                Mundial {nextCampaignNumber} en curso · Restan {winsToChampion}{" "}
                {winsToChampion === 1 ? "victoria" : "victorias consecutivas"} para el
                campeonato.
              </p>
            </div>

            <PhaseTrack
              size="large"
              nextPhase={activeCampaign?.nextPhase ?? "group"}
              status="active"
              groupMatches={activeGroupMatches}
            />
          </div>

          <div className="lg:col-span-5">
            <TacticalPitchCanvas
              nextPhase={activeCampaign?.nextPhase ?? "group"}
              campaignIndex={nextCampaignNumber}
              winsToTitle={winsToChampion}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {activeUser ? (
              <>
                <span className="px-2 py-0.5 rounded-[4px] bg-[var(--win-surface)] border border-[var(--win)] text-[var(--win-muted)] font-mono-tech font-bold">
                  #{String(activeUser.dorsal).padStart(2, "0")}
                </span>
                <span className="text-[var(--text)] font-semibold">
                  Jugador activo: {activeUser.displayName} ({activeUser.handle} ·{" "}
                  {POSITION_LABELS[activeUser.position]})
                </span>
                <button
                  type="button"
                  onClick={() => openSignInModal()}
                  className="text-[var(--win)] hover:underline font-bold ml-1 cursor-pointer"
                >
                  Cambiar usuario
                </button>
              </>
            ) : (
              <>
                <span className="text-[var(--text-muted)]">
                  Navegando en modo invitado (club global).
                </span>
                <button
                  type="button"
                  onClick={() => openSignInModal()}
                  className="text-[var(--win)] hover:underline font-bold ml-1 cursor-pointer inline-flex items-center gap-1"
                >
                  <SolarIcon name="userId" className="w-3.5 h-3.5" />
                  <span>Iniciar sesión</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Magnet>
              <button
                type="button"
                onClick={() => openSignInModal()}
                className="text-[var(--win)] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <SolarIcon name="userId" className="w-3.5 h-3.5" />
                <span>{activeUser ? "Cambiar de jugador" : "Sign In"}</span>
              </button>
            </Magnet>
            <span className="text-[var(--line-strong)]">·</span>
            <a
              href="#/equipos"
              onClick={(e) => {
                e.preventDefault();
                navigate("/equipos");
              }}
              className="text-[var(--club-orange-bright)] hover:underline font-semibold inline-flex items-center gap-1"
            >
              <SolarIcon name="usersGroup" className="w-3.5 h-3.5" />
              <span>Armar equipos</span>
            </a>
            <span className="text-[var(--line-strong)]">·</span>
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
              className="text-[var(--gold)] hover:underline font-semibold inline-flex items-center gap-1"
            >
              <SolarIcon name="home" className="w-3.5 h-3.5" />
              <span>Ir al Inicio / Club</span>
            </a>
          </div>
        </div>
      </CardSpotlight>

      <section
        aria-label="Resumen de rendimiento"
        className="espn-card p-5 sm:p-6 flex flex-col gap-6"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-3 flex-wrap">
            <ScopeSwitch value={scope} onChange={setScope} />

            {activeUser ? (
              <div
                role="group"
                aria-label="Selector de estadísticas"
                className="inline-flex rounded-lg bg-[var(--surface-2)] p-1 border border-[var(--line-strong)]"
              >
                <button
                  type="button"
                  onClick={() => setViewMode("personal")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "personal"
                      ? "bg-[var(--win)] text-white shadow-xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  Mis Números (#{String(activeUser.dorsal).padStart(2, "0")} {activeUser.displayName})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("club")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "club"
                      ? "bg-[var(--win)] text-white shadow-xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  Todo el Club
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openSignInModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--espn-red)]/10 text-[var(--espn-red)] border border-[var(--espn-red)]/20 text-xs font-bold hover:bg-[var(--espn-red)]/20 cursor-pointer transition-colors"
              >
                <SolarIcon name="userId" className="w-3.5 h-3.5" />
                <span>Sign In para ver tus números</span>
              </button>
            )}
          </div>

          <span className="text-xs text-[var(--text-muted)]">
            {isPersonal
              ? `Estadísticas personales de ${activeUser?.displayName} · ${SCOPE_LABELS[scope]}`
              : `Rendimiento global del Club · ${SCOPE_LABELS[scope]}`}
          </span>
        </div>

        {metrics.totalMatches === 0 ? (
          <div className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-[var(--text)]">
              {isPersonal
                ? `${activeUser?.displayName} todavía no disputó partidos de ${SCOPE_LABELS[scope]}.`
                : `No hay partidos registrados de ${SCOPE_LABELS[scope]} todavía.`}
            </p>
            <button
              type="button"
              onClick={() =>
                setModal({
                  kind: "add",
                  defaultTournament: scope === "mixto" ? "mixto" : "mundialito",
                })
              }
              className="min-h-[44px] px-4 py-2 rounded-[8px] bg-[var(--win)] text-[var(--on-win)] text-sm font-semibold active:scale-[0.97] transition-transform duration-150 cursor-pointer"
            >
              Registrar el primero
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 flex justify-center md:border-r border-[var(--line)] md:pr-6">
              <WinRateGauge
                winRate={metrics.globalWinRate}
                wins={metrics.totalWins}
                total={metrics.totalMatches}
              />
            </div>

            <div className="md:col-span-8 flex flex-col gap-5">
              <dl className="grid grid-cols-2 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)] border-b border-[var(--line)] pb-4">
                <div className="py-2 sm:py-0 sm:pr-5">
                  <dt className="text-xs text-[var(--text-muted)]">
                    {isPersonal ? `Partidos (${activeUser?.displayName})` : "Partidos del Club"}
                  </dt>
                  <dd className="font-display text-3xl font-bold tabular-nums text-[var(--text)] mt-0.5">
                    <CountUp to={metrics.totalMatches} duration={1.1} />
                  </dd>
                  <dd className="font-mono-tech text-xs text-[var(--text-muted)] mt-1 tabular-nums">
                    {metrics.totalWins} V
                    {metrics.totalDraws > 0 ? ` · ${metrics.totalDraws} E` : ""} ·{" "}
                    {metrics.totalLosses} D
                  </dd>
                </div>

                <div className="py-2 sm:py-0 sm:px-5">
                  <dt className="text-xs text-[var(--text-muted)]">
                    {isPersonal ? `Goles de ${activeUser?.displayName}` : "Goles en planilla"}
                  </dt>
                  <dd className="font-display text-3xl font-bold tabular-nums text-[var(--win)] mt-0.5">
                    <CountUp to={metrics.totalGoals} duration={1.2} />
                  </dd>
                  <dd className="font-mono-tech text-xs text-[var(--text-muted)] mt-1 tabular-nums">
                    {formatDecimal(metrics.avgGoalsPerMatch, 2)} x pdo · en{" "}
                    {metrics.matchesWithGoals} con dato
                  </dd>
                </div>

                <div className="col-span-2 sm:col-span-1 pt-3 sm:pt-0 sm:pl-5">
                  <dt className="text-xs text-[var(--text-muted)]">
                    {isPersonal ? `Inversión (${activeUser?.displayName})` : "Inversión total"}
                  </dt>
                  <dd className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[var(--gold)] mt-0.5">
                    <CountUp
                      to={metrics.totalSpent}
                      prefix="$ "
                      thousandSeparator="."
                      duration={1.3}
                    />
                  </dd>
                  <dd className="font-mono-tech text-xs text-[var(--text-muted)] mt-1 tabular-nums">
                    {formatArs(metrics.avgCost)} x pdo
                  </dd>
                </div>
              </dl>

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--text-muted)]">Racha actual:</span>
                  {metrics.currentStreak ? (
                    <span className="font-display text-lg font-bold tabular-nums text-[var(--text)]">
                      {metrics.currentStreak.count}{" "}
                      {RESULT_LETTER[metrics.currentStreak.result]}
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">Sin partidos</span>
                  )}
                  <span className="text-xs text-[var(--text-muted)]">
                    · Pico: {metrics.maxGoalsInMatch} goles en un partido
                  </span>
                </div>

                <div
                  className="flex items-center gap-1.5"
                  aria-label="Últimos 5 partidos"
                >
                  <span className="text-xs text-[var(--text-muted)] mr-1">
                    Últimos {recentFive.length}:
                  </span>
                  {recentFive.map((m) => (
                    <span
                      key={m.id}
                      title={`${
                        m.tournamentType === "mundialito" ? "Fulbo" : "Mixto"
                      } #${m.matchNumber}: ${RESULT_LABEL[m.result]}`}
                      className={`w-6 h-6 rounded-[4px] inline-flex items-center justify-center font-display text-sm font-bold ${
                        m.result === "win"
                          ? "bg-[var(--win)] text-[var(--on-win)]"
                          : m.result === "loss"
                          ? "bg-[var(--loss)] text-[var(--on-loss)]"
                          : "bg-[var(--draw)] text-[var(--on-draw)]"
                      }`}
                    >
                      {RESULT_LETTER[m.result]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section
          aria-labelledby="campaigns-history-heading"
          className="lg:col-span-5 espn-card p-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <h2
              id="campaigns-history-heading"
              className="font-display text-2xl font-bold text-[var(--text)]"
            >
              Campañas del Mundial
            </h2>
            <a
              href="#/partidos"
              onClick={(e) => {
                e.preventDefault();
                navigate("/partidos");
              }}
              className="text-xs text-[var(--win)] hover:underline min-h-[44px] inline-flex items-center px-2"
            >
              Ver historial completo
            </a>
          </div>

          <ul className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
            {[...campaigns].reverse().map((camp) => {
              const campMatches = matches.filter((m) =>
                camp.matchIds.includes(m.id)
              );
              const firstNum = campMatches[0]?.matchNumber ?? 0;
              const lastNum =
                campMatches[campMatches.length - 1]?.matchNumber ?? 0;

              let statusText = "";
              let statusPill =
                "bg-[var(--loss-surface)] border border-[var(--loss)] text-[var(--loss-muted)]";
              if (camp.status === "active") {
                statusText = `en curso, a ${
                  PHASE_SHORT_LABELS[camp.nextPhase ?? "group"]
                }`;
                statusPill =
                  "bg-[var(--win-surface)] border border-[var(--win)] text-[var(--win-muted)] font-semibold";
              } else if (camp.status === "champion") {
                statusText = "campeón";
                statusPill =
                  "bg-[var(--gold-surface)] border border-[var(--gold)] text-[var(--gold-muted)] font-semibold";
              } else if (camp.eliminatedAt === "final") {
                statusText = "subcampeón";
                statusPill =
                  "bg-[var(--gold-surface)] border border-[var(--gold)] text-[var(--gold-muted)] font-semibold";
              } else if (camp.eliminatedAt) {
                statusText = `afuera en ${PHASE_SHORT_LABELS[camp.eliminatedAt]}`;
              }

              return (
                <li key={camp.index}>
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/partidos", { campaign: camp.index })
                    }
                    className="w-full min-h-[44px] px-2 py-2.5 hover:bg-[var(--surface-2)] rounded-[4px] flex items-center justify-between gap-3 text-left transition-colors duration-150 cursor-pointer"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-lg font-bold text-[var(--text)]">
                        M{camp.index}
                      </span>
                      <span className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums">
                        Fulbos {firstNum}-{lastNum}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-xs ${statusPill}`}
                    >
                      {statusText}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          aria-labelledby="feeling-highlights-heading"
          className="lg:col-span-7 espn-card p-5 flex flex-col gap-3 justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2
                id="feeling-highlights-heading"
                className="font-display text-2xl font-bold text-[var(--text)]"
              >
                {isPersonal
                  ? `Química de ${activeUser?.displayName}`
                  : "Feeling del Club"}{" "}
                ({SCOPE_LABELS[scope]})
              </h2>
              <a
                href="#/feeling"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/feeling");
                }}
                className="text-xs text-[var(--win)] hover:underline min-h-[44px] inline-flex items-center px-2"
              >
                Ver tabla completa
              </a>
            </div>

            {!talisman && !mufa && (
              <p className="text-xs text-[var(--text-muted)] py-2 border-t border-[var(--line)]">
                Talismán y Mufa se determinan con un mínimo de 4 partidos disputados en dupla. El registro actual es{" "}
                {maxPjInScope}.
              </p>
            )}

            <dl className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
              {talisman && (
                <div className="py-3 flex items-center justify-between gap-2">
                  <dt className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold text-[var(--gold)]">
                    <SolarIcon name="trophy" className="w-4 h-4" />
                    <span>Talismán</span>
                  </dt>
                  <dd className="flex items-baseline gap-2.5">
                    <button
                      type="button"
                      onClick={() => setOpenPlayerId(talisman.id)}
                      className="font-semibold text-sm text-[var(--text)] hover:text-[var(--win)] underline decoration-[var(--line-strong)] cursor-pointer"
                    >
                      {talisman.name}
                    </button>
                    <span className="font-display text-lg font-bold tabular-nums text-[var(--win)]">
                      {formatPct(talisman.winRate, 1)}
                    </span>
                    <span className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums">
                      {talisman.matchesPlayed} PJ
                    </span>
                  </dd>
                </div>
              )}

              {inseparables.length > 0 && (
                <div className="py-3 flex items-center justify-between gap-2">
                  <dt className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold text-[var(--text)]">
                    <SolarIcon name="bolt" className="w-4 h-4 text-[var(--win)]" />
                    <span>Inseparable</span>
                  </dt>
                  <dd className="flex items-baseline gap-2.5 flex-wrap justify-end">
                    {inseparables.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setOpenPlayerId(s.id)}
                        className="font-semibold text-sm text-[var(--text)] hover:text-[var(--win)] underline decoration-[var(--line-strong)] cursor-pointer"
                      >
                        {s.name} ({s.matchesPlayed} PJ · {formatPct(s.winRate, 1)})
                      </button>
                    ))}
                  </dd>
                </div>
              )}

              {mufa && (
                <div className="py-3 flex items-center justify-between gap-2">
                  <dt className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold text-[var(--loss)]">
                    <SolarIcon name="danger" className="w-4 h-4" />
                    <span>Mufa</span>
                  </dt>
                  <dd className="flex items-baseline gap-2.5">
                    <button
                      type="button"
                      onClick={() => setOpenPlayerId(mufa.id)}
                      className="font-semibold text-sm text-[var(--text)] hover:text-[var(--win)] underline decoration-[var(--line-strong)] cursor-pointer"
                    >
                      {mufa.name}
                    </button>
                    <span className="font-display text-lg font-bold tabular-nums text-[var(--loss)]">
                      {formatPct(mufa.winRate, 1)}
                    </span>
                    <span className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums">
                      {mufa.matchesPlayed} PJ
                    </span>
                  </dd>
                </div>
              )}

              {invictos.length > 0 && (
                <div className="py-3 flex items-center justify-between gap-2">
                  <dt className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold text-[var(--gold)]">
                    <SolarIcon name="shield" className="w-4 h-4" />
                    <span>Invictos</span>
                  </dt>
                  <dd className="flex items-center gap-2 flex-wrap justify-end text-sm">
                    {invictos.map((s, idx) => (
                      <React.Fragment key={s.id}>
                        <button
                          type="button"
                          onClick={() => setOpenPlayerId(s.id)}
                          className="font-medium text-[var(--text)] hover:text-[var(--win)] underline decoration-[var(--line-strong)] cursor-pointer"
                        >
                          {s.name} {s.wins}/{s.matchesPlayed}
                        </button>
                        {idx < invictos.length - 1 && (
                          <span className="text-[var(--text-muted)]">·</span>
                        )}
                      </React.Fragment>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>
      </div>

      <ChampionsLeaderboardSection compact={true} headingLevel="h2" />

      <footer
        aria-label="Respaldo de datos"
        className="border-t border-[var(--line-strong)] pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <p className="text-sm text-[var(--text-muted)]">
          Datos almacenados en este navegador ({matches.length} partidos registrados).
        </p>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={exportBackup}
            className="min-h-[44px] px-3.5 py-2 rounded-[8px] bg-[var(--surface)] border border-[var(--line-strong)] hover:border-[var(--win)] text-xs font-semibold text-[var(--text)] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <SolarIcon name="download" className="w-4 h-4 text-[var(--win)]" />
            <span>Exportar copia</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Importar archivo de copia de seguridad"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                void importBackupFile(f);
                e.target.value = "";
              }
            }}
          />
          <button
            type="button"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-3.5 py-2 rounded-[8px] bg-[var(--surface)] border border-[var(--line-strong)] hover:border-[var(--win)] text-xs font-semibold text-[var(--text)] disabled:opacity-60 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <SolarIcon name="upload" className="w-4 h-4 text-[var(--win)]" />
            <span>{isImporting ? "Leyendo copia de seguridad…" : "Importar"}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setConfirmDialog({
                title: "Reiniciar todas las estadísticas",
                message:
                  "¿Confirmar el reinicio de estadísticas a cero? Se borrarán todos los partidos de Neon y del almacenamiento local para iniciar el registro desde cero.",
                confirmLabel: "Sí, reiniciar a cero",
                onConfirm: resetToEmpty,
              })
            }
            className="min-h-[44px] px-3.5 py-2 rounded-[8px] bg-[var(--surface)] border border-[var(--loss)]/40 hover:border-[var(--loss)] text-xs font-semibold text-[var(--loss)] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <SolarIcon name="trash" className="w-4 h-4 text-[var(--loss)]" />
            <span>Resetear a cero</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setConfirmDialog({
                title: "Restaurar datos del Excel",
                message:
                  "¿Confirmar la restauración de los 25 partidos de FUTBOL 2026.xlsx? Cualquier registro posterior será reemplazado.",
                confirmLabel: "Sí, restaurar Excel",
                onConfirm: resetToSeed,
              })
            }
            className="min-h-[44px] px-3.5 py-2 rounded-[8px] bg-[var(--surface)] border border-[var(--line-strong)] hover:border-[var(--loss)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <SolarIcon name="restart" className="w-4 h-4" />
            <span>Restaurar Excel</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
