import React, { useMemo, useState } from "react";
import { useStore } from "../store/StoreContext";
import {
  computeChampionsLeaderboard,
  HISTORICAL_EDITIONS,
  POSITION_LABELS,
  type ChampionLeaderboardEntry,
  type LeaderboardMode,
} from "../domain/leaderboard";
import { BADGE_LABELS, formatPct, PHASE_SHORT_LABELS } from "../domain/format";
import { SolarIcon } from "./SolarIcon";
import { AnimatedGroup } from "./ui/AnimatedGroup";
import TiltedCard, { TiltedCardLayer } from "./ui/TiltedCard";
import { AmbientSectionParticles } from "./ui/AmbientSectionParticles";

type SortColumn = "titles" | "knockout" | "winRate";

interface ChampionsLeaderboardSectionProps {
  compact?: boolean;
  headingLevel?: "h1" | "h2";
}

export const ChampionsLeaderboardSection: React.FC<
  ChampionsLeaderboardSectionProps
> = ({ compact = false, headingLevel = "h2" }) => {
  const {
    matches,
    players,
    campaigns,
    registeredUsers,
    activeUser,
    setOpenPlayerId,
    openRegistrationModal,
    navigate,
  } = useStore();

  const [mode, setMode] = useState<LeaderboardMode>("palmares_total");
  const [sortBy, setSortBy] = useState<SortColumn>("titles");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const baseEntries = useMemo(
    () =>
      computeChampionsLeaderboard(
        matches,
        players,
        campaigns,
        registeredUsers,
        mode
      ),
    [campaigns, matches, mode, players, registeredUsers]
  );

  const sortedEntries = useMemo(() => {
    const copy = [...baseEntries];
    const mult = sortDir === "desc" ? 1 : -1;
    copy.sort((a, b) => {
      if (sortBy === "titles") {
        if (b.totalTitles !== a.totalTitles)
          return (b.totalTitles - a.totalTitles) * mult;
        if (b.finalsReached !== a.finalsReached)
          return (b.finalsReached - a.finalsReached) * mult;
        if (b.knockoutWins !== a.knockoutWins)
          return (b.knockoutWins - a.knockoutWins) * mult;
      } else if (sortBy === "knockout") {
        if (b.knockoutWins !== a.knockoutWins)
          return (b.knockoutWins - a.knockoutWins) * mult;
        if (b.totalTitles !== a.totalTitles)
          return (b.totalTitles - a.totalTitles) * mult;
      } else {
        if (b.winRate !== a.winRate) return (b.winRate - a.winRate) * mult;
        if (b.mundialitoWins !== a.mundialitoWins)
          return (b.mundialitoWins - a.mundialitoWins) * mult;
      }
      return a.name.localeCompare(b.name, "es-AR");
    });
    return copy;
  }, [baseEntries, sortBy, sortDir]);

  const podium = useMemo(() => baseEntries.slice(0, 3), [baseEntries]);
  const visibleRows = useMemo(
    () => (compact ? sortedEntries.slice(0, 8) : sortedEntries),
    [compact, sortedEntries]
  );

  const liveChampions2026 = useMemo(
    () => campaigns.filter((c) => c.status === "champion"),
    [campaigns]
  );

  const handleSort = (col: SortColumn) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const HeadingTag = headingLevel;

  const renderStars = (entry: ChampionLeaderboardEntry) => {
    if (entry.totalTitles === 0) {
      return (
        <span className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums">
          0 copas
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[var(--gold-surface)] border border-[var(--gold)] text-[var(--gold-muted)] font-mono-tech text-xs font-semibold tabular-nums"
        title={entry.editionsWon.join(" · ")}
      >
        <SolarIcon name="star" className="w-3.5 h-3.5 text-[var(--gold)]" />
        <span>
          {entry.totalTitles} {entry.totalTitles === 1 ? "copa" : "copas"}
        </span>
      </span>
    );
  };

  return (
    <section
      aria-labelledby="champions-leaderboard-heading"
      className="espn-card p-5 sm:p-6 flex flex-col gap-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <HeadingTag
              id="champions-leaderboard-heading"
              className="font-display text-3xl sm:text-4xl font-bold text-[var(--text)] leading-none"
            >
              Leaderboard de Campeones
            </HeadingTag>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[var(--gold-surface)] border border-[var(--gold)] text-[var(--gold-muted)] text-xs font-semibold">
              <SolarIcon name="crown" className="w-3.5 h-3.5 text-[var(--gold)]" />
              <span>
                {liveChampions2026.length +
                  (mode === "palmares_total" ? HISTORICAL_EDITIONS.length : 0)}{" "}
                ediciones computadas
              </span>
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Ranking oficial por copas levantadas, finales disputadas, cruces mano
            a mano ganados y efectividad en el Mundialito.
          </p>
        </div>

        <div
          role="group"
          aria-label=" Alcance del palmarés"
          className="inline-flex rounded-[8px] bg-[var(--surface-2)] p-1 border border-[var(--line-strong)] self-start"
        >
          <button
            type="button"
            aria-pressed={mode === "palmares_total"}
            onClick={() => setMode("palmares_total")}
            className={`min-h-[38px] px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors duration-150 cursor-pointer ${
              mode === "palmares_total"
                ? "bg-[var(--gold)] text-[var(--on-gold)]"
                : "text-[var(--text)] hover:text-[var(--gold)]"
            }`}
          >
            Palmarés Total
          </button>
          <button
            type="button"
            aria-pressed={mode === "temporada_2026"}
            onClick={() => setMode("temporada_2026")}
            className={`min-h-[38px] px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-colors duration-150 cursor-pointer ${
              mode === "temporada_2026"
                ? "bg-[var(--win)] text-[var(--on-win)]"
                : "text-[var(--text)] hover:text-[var(--win)]"
            }`}
          >
            Temporada 2026
          </button>
        </div>
      </div>

      {/* Podio Top 3 con Motion Primitives AnimatedGroup y React Bits TiltedCard 3D */}
      <div className="relative overflow-hidden rounded-2xl p-2 sm:p-3 border-b border-[var(--line)] pb-6">
        <AmbientSectionParticles theme="gold" densityDivisor={20000} />
        <div className="relative z-10">
          <AnimatedGroup
            preset="scale"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
        {podium.map((entry, idx) => {
          const rank = idx + 1;
          const isCurrentUser =
            activeUser?.linkedPlayerId === entry.playerId;
          const glareColor =
            rank === 1
              ? "#F59E0B"
              : rank === 2
              ? "#22C55E"
              : "#F97316";

          return (
            <TiltedCard
              key={entry.playerId}
              containerWidth="100%"
              containerHeight="auto"
              imageWidth="100%"
              imageHeight="auto"
              rotateAmplitude={12}
              scaleOnHover={1.03}
              radius={16}
              glare={0.4}
              glareColor={glareColor}
              shadow={0.35}
              parallax={1.2}
              showTooltip={true}
              captionText={`Puesto #${rank} · ${entry.name} (${formatPct(entry.winRate, 1)})`}
              className="w-full"
            >
              <div
                className={`w-full rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 border transition-colors ${
                  rank === 1
                    ? "bg-gradient-to-b from-[#231B0E]/95 via-[#18140B]/95 to-[#100D07]/95 border-amber-500/40 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]"
                    : rank === 2
                    ? "bg-gradient-to-b from-[#0F2316]/95 via-[#0C1B11]/95 to-[#08120C]/95 border-emerald-500/40 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]"
                    : "bg-gradient-to-b from-[#231B0E]/90 via-[#18150D]/90 to-[#100E08]/90 border-amber-600/35 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]"
                }`}
              >
                <TiltedCardLayer depth={28}>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] font-mono-tech text-xs font-bold ${
                        rank === 1
                          ? "bg-[var(--gold-surface)] border border-[var(--gold)] text-[var(--gold-muted)]"
                          : rank === 2
                          ? "bg-[var(--win-surface)] border border-[var(--win)] text-[var(--win-muted)]"
                          : "bg-[var(--draw-surface)] border border-[var(--draw)] text-[var(--draw-muted)]"
                      }`}
                    >
                      <SolarIcon
                        name={rank === 1 ? "crown" : "medal"}
                        className="w-3.5 h-3.5"
                      />
                      <span>PUESTO #{rank}</span>
                    </span>

                    {renderStars(entry)}
                  </div>
                </TiltedCardLayer>

                <TiltedCardLayer depth={18}>
                  <div className="flex items-baseline justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenPlayerId(entry.playerId)}
                      className="inline-flex items-baseline gap-2 text-left group cursor-pointer"
                    >
                      <span className="font-mono-tech text-sm text-[var(--win)] font-bold">
                        {entry.dorsal}
                      </span>
                      <span className="font-display text-2xl font-bold text-white group-hover:text-[var(--gold)] transition-colors underline decoration-white/30">
                        {entry.name}
                      </span>
                    </button>

                    <span className="font-display text-2xl font-black tabular-nums text-[var(--gold)]">
                      {formatPct(entry.winRate, 1)}
                    </span>
                  </div>

                  {entry.editionsWon.length > 0 ? (
                    <p className="text-xs text-gray-300 mt-1">
                      Campeón en: {entry.editionsWon.join(" · ")}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-300 mt-1">
                      {entry.finalsReached > 0
                        ? `${entry.finalsReached} final disputada en 2026`
                        : `${entry.knockoutWins} cruces directos ganados en 2026`}
                    </p>
                  )}
                </TiltedCardLayer>

                <TiltedCardLayer depth={10}>
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <span className="font-mono-tech text-gray-400 tabular-nums">
                      {entry.knockoutWins} cruces PG · {entry.mundialitoWins}/
                      {entry.mundialitoPlayed} en 2026
                    </span>

                    {entry.account ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <SolarIcon name="check" className="w-3.5 h-3.5" />
                        <span>
                          {isCurrentUser
                            ? `Tu cuenta (${entry.account.handle})`
                            : `${entry.account.handle} · ${
                                POSITION_LABELS[entry.account.position]
                              }`}
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openRegistrationModal(entry.playerId)}
                        className="text-[var(--gold)] hover:underline font-semibold cursor-pointer"
                      >
                        Reclamar dorsal {entry.dorsal}
                      </button>
                    )}
                  </div>
                </TiltedCardLayer>
              </div>
            </TiltedCard>
          );
        })}
          </AnimatedGroup>
        </div>
      </div>

      {/* Controles de ordenamiento */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--text-muted)]">Ordenar por:</span>
          {(
            [
              { id: "titles", label: "Copas y Finales" },
              { id: "knockout", label: "Cruces ganados" },
              { id: "winRate", label: "Efectividad 2026" },
            ] as const
          ).map((opt) => {
            const active = sortBy === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleSort(opt.id)}
                className={`min-h-[38px] px-3 py-1 rounded-[6px] text-xs font-semibold border inline-flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? "bg-[var(--surface-2)] text-[var(--gold)] border-[var(--gold)]"
                    : "bg-[var(--surface-2)] text-[var(--text)] border-[var(--line-strong)] hover:border-[var(--gold)]"
                }`}
              >
                <span>{opt.label}</span>
                {active && (
                  <SolarIcon
                    name={sortDir === "desc" ? "arrowDown" : "arrowUp"}
                    className="w-3.5 h-3.5"
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => openRegistrationModal(null)}
          className="min-h-[40px] px-3.5 py-1.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--win)] text-[var(--win)] hover:bg-[var(--win-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <SolarIcon name="userId" className="w-4 h-4" />
          <span>Registrar mi usuario o reclamar dorsal</span>
        </button>
      </div>

      {/* Tabla Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--line-strong)] text-xs text-[var(--text-muted)] uppercase">
              <th scope="col" className="py-3 pr-3 font-semibold w-12">
                #
              </th>
              <th scope="col" className="py-3 px-3 font-semibold">
                Jugador / Dorsal
              </th>
              <th
                scope="col"
                aria-sort={
                  sortBy === "titles"
                    ? sortDir === "desc"
                      ? "descending"
                      : "ascending"
                    : "none"
                }
                className="py-3 px-3 font-semibold"
              >
                <button
                  type="button"
                  onClick={() => handleSort("titles")}
                  className="inline-flex items-center gap-1 hover:text-[var(--text)] uppercase font-semibold cursor-pointer"
                >
                  <span>Palmarés</span>
                  <SolarIcon
                    name={
                      sortBy === "titles" && sortDir === "asc"
                        ? "arrowUp"
                        : "arrowDown"
                    }
                    className="w-3.5 h-3.5 text-[var(--gold)]"
                  />
                </button>
              </th>
              <th
                scope="col"
                aria-sort={
                  sortBy === "knockout"
                    ? sortDir === "desc"
                      ? "descending"
                      : "ascending"
                    : "none"
                }
                className="py-3 px-3 font-semibold text-right"
              >
                <button
                  type="button"
                  onClick={() => handleSort("knockout")}
                  className="inline-flex items-center gap-1 hover:text-[var(--text)] uppercase font-semibold cursor-pointer"
                >
                  <span>Cruces PG</span>
                  <SolarIcon
                    name={
                      sortBy === "knockout" && sortDir === "asc"
                        ? "arrowUp"
                        : "arrowDown"
                    }
                    className="w-3.5 h-3.5 text-[var(--win)]"
                  />
                </button>
              </th>
              <th scope="col" className="py-3 px-3 font-semibold text-right">
                Finales
              </th>
              <th
                scope="col"
                aria-sort={
                  sortBy === "winRate"
                    ? sortDir === "desc"
                      ? "descending"
                      : "ascending"
                    : "none"
                }
                className="py-3 px-3 font-semibold text-right"
              >
                <button
                  type="button"
                  onClick={() => handleSort("winRate")}
                  className="inline-flex items-center gap-1 hover:text-[var(--text)] uppercase font-semibold cursor-pointer"
                >
                  <span>WR 2026</span>
                  <SolarIcon
                    name={
                      sortBy === "winRate" && sortDir === "asc"
                        ? "arrowUp"
                        : "arrowDown"
                    }
                    className="w-3.5 h-3.5 text-[var(--win)]"
                  />
                </button>
              </th>
              <th scope="col" className="py-3 pl-3 font-semibold text-right">
                Cuenta / Perfil
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] text-sm">
            {visibleRows.map((entry, idx) => {
              const isCurrentUser =
                activeUser?.linkedPlayerId === entry.playerId;

              return (
                <tr
                  key={entry.playerId}
                  className={`hover:bg-[var(--surface-2)] transition-colors duration-150 ${
                    isCurrentUser ? "bg-[var(--win-surface)]/40" : ""
                  }`}
                >
                  <td className="py-3 pr-3 font-mono-tech text-xs text-[var(--text-muted)] tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setOpenPlayerId(entry.playerId)}
                        className="inline-flex items-center gap-1.5 font-semibold text-[var(--text)] hover:text-[var(--win)] cursor-pointer"
                      >
                        <span className="font-mono-tech text-xs text-[var(--win)]">
                          {entry.dorsal}
                        </span>
                        <span className="underline decoration-[var(--line-strong)]">
                          {entry.name}
                        </span>
                      </button>

                      {entry.badges.map((b) => (
                        <span
                          key={b}
                          className="px-1.5 py-0.5 rounded-[4px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-xs text-[var(--text-muted)]"
                        >
                          {BADGE_LABELS[b]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderStars(entry)}
                      {entry.editionsWon.length > 0 && (
                        <span className="text-xs text-[var(--text-muted)]">
                          {entry.editionsWon.join(" · ")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono-tech tabular-nums text-[var(--text)]">
                    {entry.knockoutWins}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-tech tabular-nums text-[var(--text-muted)]">
                    {entry.finalsReached}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-display text-lg font-bold tabular-nums ${
                        entry.winRate >= 75
                          ? "text-[var(--gold)]"
                          : entry.winRate >= 60
                          ? "text-[var(--win)]"
                          : entry.winRate >= 45
                          ? "text-[var(--draw)]"
                          : "text-[var(--loss)]"
                      }`}
                    >
                      {formatPct(entry.winRate, 1)}
                    </span>
                    <span className="font-mono-tech text-xs text-[var(--text-muted)] ml-1.5 tabular-nums">
                      ({entry.mundialitoWins}/{entry.mundialitoPlayed})
                    </span>
                  </td>
                  <td className="py-3 pl-3 text-right">
                    {entry.account ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[var(--win-surface)] border border-[var(--win)] text-[var(--win-muted)] text-xs font-semibold">
                        <SolarIcon
                          name="check"
                          className="w-3.5 h-3.5 text-[var(--win)]"
                        />
                        <span>
                          {isCurrentUser
                            ? `Activo (${entry.account.handle})`
                            : entry.account.handle}
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openRegistrationModal(entry.playerId)}
                        className="min-h-[36px] px-2.5 py-1 rounded-[4px] bg-[var(--surface-2)] border border-[var(--line-strong)] hover:border-[var(--gold)] text-xs font-semibold text-[var(--text)] hover:text-[var(--gold)] cursor-pointer"
                      >
                        Reclamar {entry.dorsal}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Lista Mobile */}
      <ul className="md:hidden divide-y divide-[var(--line)] border-t border-[var(--line)]">
        {visibleRows.map((entry, idx) => {
          const isCurrentUser = activeUser?.linkedPlayerId === entry.playerId;
          return (
            <li key={entry.playerId} className="py-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono-tech text-xs text-[var(--text-muted)] w-5 tabular-nums">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenPlayerId(entry.playerId)}
                    className="inline-flex items-center gap-1.5 font-semibold text-base text-[var(--text)] cursor-pointer"
                  >
                    <span className="font-mono-tech text-xs text-[var(--win)]">
                      {entry.dorsal}
                    </span>
                    <span className="underline decoration-[var(--line-strong)]">
                      {entry.name}
                    </span>
                  </button>
                </div>
                {renderStars(entry)}
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)] pl-7">
                <span className="font-mono-tech tabular-nums">
                  {entry.knockoutWins} cruces PG · {entry.finalsReached} finales ·{" "}
                  {formatPct(entry.winRate, 1)} WR
                </span>

                {entry.account ? (
                  <span className="text-[var(--win)] font-semibold">
                    {isCurrentUser
                      ? `Tu cuenta (${entry.account.handle})`
                      : entry.account.handle}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => openRegistrationModal(entry.playerId)}
                    className="text-[var(--gold)] font-semibold underline cursor-pointer"
                  >
                    Reclamar {entry.dorsal}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Pie de sección: enlace a tabla completa o desglose de finales */}
      {compact ? (
        <div className="pt-3 border-t border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]">
            Mostrando el Top {visibleRows.length} de {baseEntries.length}{" "}
            jugadores en el padrón del Mundialito.
          </p>
          <a
            href="#/campeones"
            onClick={(e) => {
              e.preventDefault();
              navigate("/campeones");
            }}
            className="min-h-[44px] px-4 py-2 rounded-[8px] bg-[var(--surface-2)] border border-[var(--gold)] text-[var(--gold)] text-xs font-semibold inline-flex items-center gap-2 hover:bg-[var(--gold-surface)] transition-colors duration-150"
          >
            <SolarIcon name="crown" className="w-4 h-4" />
            <span>Ver Leaderboard completo y finales ({baseEntries.length})</span>
          </a>
        </div>
      ) : (
        <div className="pt-5 border-t border-[var(--line)] flex flex-col gap-4">
          <h3 className="font-display text-2xl font-bold text-[var(--text)]">
            Historial de Copas y Finales Registradas
          </h3>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 border-t border-[var(--line)] pt-4">
            {liveChampions2026.map((camp) => {
              const campMatches = matches.filter((m) =>
                camp.matchIds.includes(m.id)
              );
              const finalMatch = campMatches[campMatches.length - 1];
              const champNames = Array.from(
                new Set(campMatches.flatMap((m) => m.teamPlayers))
              )
                .map(
                  (pid) =>
                    players.find((p) => p.id === pid)?.displayName ?? pid
                )
                .join(", ");

              return (
                <div
                  key={`camp-2026-${camp.index}`}
                  className="pt-3 md:pt-0 flex flex-col gap-1"
                >
                  <dt className="inline-flex items-center gap-2 font-display text-xl font-bold text-[var(--gold)]">
                    <SolarIcon name="trophy" className="w-4 h-4" />
                    <span>
                      Mundial {camp.index} (Temporada 2026 · Fulbo #
                      {finalMatch?.matchNumber ?? ""})
                    </span>
                  </dt>
                  <dd className="text-xs text-[var(--text)]">
                    Plantel campeón: {champNames}
                  </dd>
                </div>
              );
            })}

            {campaigns
              .filter(
                (c) =>
                  c.status !== "champion" &&
                  (c.reachedPhase === "final" || c.status === "active")
              )
              .map((camp) => (
                <div
                  key={`camp-active-${camp.index}`}
                  className="pt-3 md:pt-0 flex flex-col gap-1"
                >
                  <dt className="inline-flex items-center gap-2 font-display text-xl font-bold text-[var(--win)]">
                    <SolarIcon name="bolt" className="w-4 h-4" />
                    <span>
                      Mundial {camp.index} (2026 ·{" "}
                      {camp.status === "active"
                        ? `En juego en ${
                            PHASE_SHORT_LABELS[camp.nextPhase ?? "group"]
                          }`
                        : "Subcampeón en la Final"}
                      )
                    </span>
                  </dt>
                  <dd className="text-xs text-[var(--text-muted)]">
                    {camp.status === "active"
                      ? "Si ganás la Final de esta campaña, el plantel suma una estrella automática al Leaderboard."
                      : "Llegó hasta el partido definitorio (Fulbo #6) tras ganar 5 partidos seguidos."}
                  </dd>
                </div>
              ))}

            {mode === "palmares_total" &&
              HISTORICAL_EDITIONS.map((ed) => {
                const champNames = ed.championPlayerIds
                  .map(
                    (pid) =>
                      players.find((p) => p.id === pid)?.displayName ?? pid
                  )
                  .join(", ");
                return (
                  <div
                    key={ed.id}
                    className="pt-3 md:pt-0 flex flex-col gap-1"
                  >
                    <dt className="inline-flex items-center gap-2 font-display text-xl font-bold text-[var(--gold)]">
                      <SolarIcon name="star" className="w-4 h-4" />
                      <span>
                        {ed.title} ({ed.period} · Final {ed.finalScore})
                      </span>
                    </dt>
                    <dd className="text-xs text-[var(--text-muted)]">
                      Campeones: {champNames}
                    </dd>
                  </div>
                );
              })}
          </dl>
        </div>
      )}
    </section>
  );
};
