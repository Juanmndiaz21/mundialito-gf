import React, { useMemo, useState } from "react";
import { useStore } from "../store/StoreContext";
import {
  computePlayerStats,
  computePartnerStats,
  MIN_PJ_RANKING,
} from "../domain/stats";
import { formatPct, playerDorsal, playerTone } from "../domain/format";
import { ScopeSwitch } from "../components/ScopeSwitch";
import { BadgeTag } from "../components/PlayerDrawer";
import { SolarIcon } from "../components/SolarIcon";
import { SplitHeading } from "../components/SplitHeading";
import { useViewChoreography } from "../components/MotionSystem";

type SortColumn = "name" | "pj" | "wr";
type SortDir = "asc" | "desc";

export const FeelingView: React.FC = () => {
  const {
    matches,
    players,
    scope,
    setScope,
    setOpenPlayerId,
    activeUser,
    openSignInModal,
  } = useStore();
  const [viewMode, setViewMode] = useState<"personal" | "club">("personal");
  const [sortCol, setSortCol] = useState<SortColumn>("pj");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const viewRef = useViewChoreography<HTMLDivElement>([]);

  const isPersonal = Boolean(activeUser && viewMode === "personal");

  const stats = useMemo(() => {
    if (isPersonal && activeUser) {
      return computePartnerStats(
        matches,
        players,
        scope,
        activeUser.linkedPlayerId
      );
    }
    return computePlayerStats(matches, players, scope);
  }, [isPersonal, activeUser, matches, players, scope]);

  const sortedStats = useMemo(() => {
    const copy = [...stats];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortCol === "name") {
        cmp = a.name.localeCompare(b.name, "es-AR");
      } else if (sortCol === "pj") {
        cmp = a.matchesPlayed - b.matchesPlayed;
        if (cmp === 0) cmp = a.winRate - b.winRate;
      } else {
        cmp = a.winRate - b.winRate;
        if (cmp === 0) cmp = a.matchesPlayed - b.matchesPlayed;
      }
      if (cmp === 0) cmp = a.name.localeCompare(b.name, "es-AR");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [sortCol, sortDir, stats]);

  const maxPj = useMemo(
    () =>
      stats.length > 0 ? Math.max(...stats.map((s) => s.matchesPlayed)) : 0,
    [stats]
  );

  const hasEligibleForRanking = maxPj >= MIN_PJ_RANKING;

  const talisman = useMemo(
    () => stats.find((s) => s.badges.includes("talisman")) ?? null,
    [stats]
  );
  const mufa = useMemo(
    () => stats.find((s) => s.badges.includes("mufa")) ?? null,
    [stats]
  );
  const inseparable = useMemo(
    () => stats.find((s) => s.badges.includes("inseparable")) ?? null,
    [stats]
  );

  const userMatchesCount = useMemo(() => {
    if (!activeUser) return 0;
    return matches.filter((m) =>
      m.teamPlayers.includes(activeUser.linkedPlayerId)
    ).length;
  }, [activeUser, matches]);

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortCol(col);
      setSortDir(col === "name" ? "asc" : "desc");
    }
  };

  const getAriaSort = (
    col: SortColumn
  ): "ascending" | "descending" | "none" => {
    if (sortCol !== col) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  };

  const renderSortIcon = (col: SortColumn) => {
    const isCurrent = sortCol === col;
    const iconName =
      isCurrent && sortDir === "asc" ? "arrowUp" : "arrowDown";
    return (
      <SolarIcon
        name={iconName}
        className={`w-3.5 h-3.5 ${
          isCurrent ? "text-[var(--win)]" : "text-[var(--text-muted)]"
        }`}
      />
    );
  };

  return (
    <div ref={viewRef} className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SplitHeading
            as="h1"
            text={
              isPersonal
                ? `Feeling de ${activeUser?.displayName} con el plantel`
                : "Química y feeling del plantel"
            }
            className="font-display text-3xl sm:text-4xl font-bold text-[var(--text)]"
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {isPersonal
              ? `Química y duplas calculadas sobre los ${userMatchesCount} partidos disputados por ${activeUser?.displayName} (#${String(activeUser?.dorsal).padStart(2, "0")}).`
              : "Talismán y Mufa se calculan entre quienes jugaron 4 o más partidos en el club."}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {activeUser ? (
            <div
              role="group"
              aria-label="Selector de perspectiva de feeling"
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
                Compañeros de {activeUser.displayName} (#{String(activeUser.dorsal).padStart(2, "0")})
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
                Padrón General
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openSignInModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--espn-red)]/10 text-[var(--espn-red)] border border-[var(--espn-red)]/20 text-xs font-bold hover:bg-[var(--espn-red)]/20 cursor-pointer"
            >
              <SolarIcon name="userId" className="w-3.5 h-3.5" />
              <span>Sign In para ver química de duplas</span>
            </button>
          )}

          <ScopeSwitch value={scope} onChange={setScope} />
        </div>
      </div>

      {/* KPI Cards de duplas cuando está en modo personal */}
      {isPersonal && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="espn-card p-4 flex items-center justify-between border-l-4 border-l-[var(--gold)]">
            <div>
              <span className="text-[11px] font-bold text-[var(--gold)] uppercase tracking-wider flex items-center gap-1">
                <SolarIcon name="trophy" className="w-3.5 h-3.5" />
                Talismán de {activeUser?.displayName}
              </span>
              <p className="font-display text-xl font-black text-[var(--text)] mt-1">
                {talisman ? talisman.name : "Aún sin definir"}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {talisman
                  ? `${formatPct(talisman.winRate, 0)} efectividad en ${talisman.matchesPlayed} partidos en dupla`
                  : "Mínimo 4 partidos en dupla"}
              </p>
            </div>
          </div>

          <div className="espn-card p-4 flex items-center justify-between border-l-4 border-l-[var(--loss)]">
            <div>
              <span className="text-[11px] font-bold text-[var(--loss)] uppercase tracking-wider flex items-center gap-1">
                <SolarIcon name="bolt" className="w-3.5 h-3.5" />
                Mufa de {activeUser?.displayName}
              </span>
              <p className="font-display text-xl font-black text-[var(--text)] mt-1">
                {mufa ? mufa.name : "Aún sin definir"}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {mufa
                  ? `${formatPct(mufa.winRate, 0)} efectividad en ${mufa.matchesPlayed} partidos en dupla`
                  : "Mínimo 4 partidos en dupla"}
              </p>
            </div>
          </div>

          <div className="espn-card p-4 flex items-center justify-between border-l-4 border-l-[var(--win)]">
            <div>
              <span className="text-[11px] font-bold text-[var(--win)] uppercase tracking-wider flex items-center gap-1">
                <SolarIcon name="usersGroup" className="w-3.5 h-3.5" />
                Socio Más Frecuente
              </span>
              <p className="font-display text-xl font-black text-[var(--text)] mt-1">
                {inseparable ? inseparable.name : "Aún sin definir"}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {inseparable
                  ? `${inseparable.matchesPlayed} partidos compartidos en cancha`
                  : "Mayor cantidad de partidos en común"}
              </p>
            </div>
          </div>
        </div>
      )}

      {!hasEligibleForRanking && (
        <div
          role="status"
          className="rounded-[8px] bg-[var(--surface)] border border-[var(--line-strong)] p-4 text-sm text-[var(--text-muted)]"
        >
          Talismán y Mufa se determinan con un mínimo de 4 partidos disputados {isPersonal ? "en dupla" : "en el club"}. El registro actual es{" "}
          {maxPj}.
        </div>
      )}

      <div className="sm:hidden flex items-center gap-2">
        <span className="text-xs text-[var(--text-muted)]">Ordenar por:</span>
        {(
          [
            { col: "pj", label: "PJ" },
            { col: "wr", label: "Win rate" },
            { col: "name", label: "Compañero" },
          ] as const
        ).map((item) => {
          const active = sortCol === item.col;
          return (
            <button
              key={item.col}
              type="button"
              onClick={() => handleSort(item.col)}
              className={`min-h-[38px] px-3 py-1 rounded-[4px] border text-xs font-semibold inline-flex items-center gap-1 ${
                active
                  ? "bg-[var(--win)] text-[var(--on-win)] border-[var(--win)]"
                  : "bg-[var(--surface)] text-[var(--text)] border-[var(--line-strong)]"
              }`}
            >
              <span>{item.label}</span>
              {active && (
                <SolarIcon
                  name={sortDir === "asc" ? "arrowUp" : "arrowDown"}
                  className="w-3.5 h-3.5"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden sm:block espn-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--line-strong)] bg-[var(--surface-2)] text-xs text-[var(--text-muted)]">
              <th aria-sort={getAriaSort("name")} className="p-3.5 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="min-h-[36px] inline-flex items-center gap-1.5 text-[var(--text)] hover:text-[var(--win)] font-semibold cursor-pointer"
                >
                  <span>
                    {isPersonal
                      ? `Compañero con ${activeUser?.displayName}`
                      : "Compañero"}
                  </span>
                  {renderSortIcon("name")}
                </button>
              </th>
              <th aria-sort={getAriaSort("pj")} className="p-3.5 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort("pj")}
                  className="min-h-[36px] inline-flex items-center gap-1.5 text-[var(--text)] hover:text-[var(--win)] font-semibold cursor-pointer"
                >
                  <span>{isPersonal ? "PJ juntos" : "PJ"}</span>
                  {renderSortIcon("pj")}
                </button>
              </th>
              <th className="p-3.5 font-semibold">
                {isPersonal ? "PG juntos" : "PG"}
              </th>
              {scope !== "mundialito" && (
                <th className="p-3.5 font-semibold">
                  {isPersonal ? "PE juntos" : "PE"}
                </th>
              )}
              <th className="p-3.5 font-semibold">
                {isPersonal ? "PP juntos" : "PP"}
              </th>
              <th aria-sort={getAriaSort("wr")} className="p-3.5 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort("wr")}
                  className="min-h-[36px] inline-flex items-center gap-1.5 text-[var(--text)] hover:text-[var(--win)] font-semibold cursor-pointer"
                >
                  <span>{isPersonal ? "% Efectividad en dupla" : "Win rate"}</span>
                  {renderSortIcon("wr")}
                </button>
              </th>
              <th className="p-3.5 font-semibold">
                {isPersonal ? "Insignia en dupla" : "Insignias"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {sortedStats.map((s) => {
              const tone = playerTone(s.id);
              const dorsal = playerDorsal(s.id);
              const isSingle = s.matchesPlayed === 1;
              let barColor = "bg-[var(--win)]";
              let wrTextColor = "text-[var(--win)]";
              if (s.winRate >= 75) {
                barColor = "bg-[var(--gold)]";
                wrTextColor = "text-[var(--gold)]";
              } else if (s.winRate < 35) {
                barColor = "bg-[var(--loss)]";
                wrTextColor = "text-[var(--loss)]";
              } else if (s.winRate < 50) {
                barColor = "bg-[var(--draw)]";
                wrTextColor = "text-[var(--draw)]";
              }

              return (
                <tr
                  key={s.id}
                  className={`hover:bg-[var(--surface-2)] transition-colors duration-150 ${
                    isSingle ? "text-[var(--text-muted)]" : "text-[var(--text)]"
                  }`}
                >
                  <td className="p-3.5">
                    <button
                      type="button"
                      onClick={() => setOpenPlayerId(s.id)}
                      className="min-h-[44px] inline-flex items-center gap-2.5 text-left group cursor-pointer"
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          backgroundColor: tone.bg,
                          color: tone.text,
                          borderColor: tone.border,
                        }}
                        className="px-1.5 py-0.5 rounded-[3px] border inline-flex items-center justify-center font-mono-tech text-[11px] font-semibold shrink-0"
                      >
                        #{dorsal}
                      </span>
                      <span className="font-medium group-hover:text-[var(--win)] transition-colors duration-150">
                        {s.name}
                      </span>
                      {isSingle && (
                        <span className="text-xs text-[var(--text-muted)]">
                          (1 partido)
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="p-3.5 font-display text-lg font-bold tabular-nums">
                    {s.matchesPlayed}
                  </td>
                  <td className="p-3.5 font-display text-lg font-bold tabular-nums text-[var(--win)]">
                    {s.wins}
                  </td>
                  {scope !== "mundialito" && (
                    <td className="p-3.5 font-display text-lg font-bold tabular-nums text-[var(--text-muted)]">
                      {s.draws}
                    </td>
                  )}
                  <td className="p-3.5 font-display text-lg font-bold tabular-nums text-[var(--loss)]">
                    {s.losses}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <span
                        className={`font-display text-lg font-bold tabular-nums w-14 ${wrTextColor}`}
                      >
                        {formatPct(s.winRate, 1)}
                      </span>
                      <div
                        className="flex-1 h-2.5 rounded-[4px] bg-[var(--surface-2)] border border-[var(--line-strong)] overflow-hidden"
                        aria-hidden="true"
                      >
                        <div
                          className={`h-full ${barColor}`}
                          style={{ width: `${Math.round(s.winRate)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {s.badges.map((b) => (
                        <BadgeTag key={b} badge={b} />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden flex flex-col gap-2.5">
        {sortedStats.map((s) => {
          const tone = playerTone(s.id);
          const dorsal = playerDorsal(s.id);
          const isSingle = s.matchesPlayed === 1;
          let barColor = "bg-[var(--win)]";
          let wrTextColor = "text-[var(--win)]";
          if (s.winRate >= 75) {
            barColor = "bg-[var(--gold)]";
            wrTextColor = "text-[var(--gold)]";
          } else if (s.winRate < 35) {
            barColor = "bg-[var(--loss)]";
            wrTextColor = "text-[var(--loss)]";
          } else if (s.winRate < 50) {
            barColor = "bg-[var(--draw)]";
            wrTextColor = "text-[var(--draw)]";
          }

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setOpenPlayerId(s.id)}
              className={`w-full text-left rounded-[8px] bg-[var(--surface)] border border-[var(--line-strong)] p-3.5 flex flex-col gap-2 ${
                isSingle ? "text-[var(--text-muted)]" : "text-[var(--text)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    style={{
                      backgroundColor: tone.bg,
                      color: tone.text,
                      borderColor: tone.border,
                    }}
                    className="px-1.5 py-0.5 rounded-[3px] border inline-flex items-center justify-center font-mono-tech text-[11px] font-semibold shrink-0"
                  >
                    #{dorsal}
                  </span>
                  <span className="font-semibold text-base">{s.name}</span>
                  {isSingle && (
                    <span className="text-xs text-[var(--text-muted)]">
                      · 1 partido
                    </span>
                  )}
                </div>

                {s.badges.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {s.badges.map((b) => (
                      <BadgeTag key={b} badge={b} />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`font-display text-xl font-bold tabular-nums w-16 ${wrTextColor}`}
                >
                  {formatPct(s.winRate, 1)}
                </span>
                <div
                  className="flex-1 h-2.5 rounded-[4px] bg-[var(--surface-2)] border border-[var(--line-strong)] overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${Math.round(s.winRate)}%` }}
                  />
                </div>
              </div>

              <div className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums">
                {s.matchesPlayed} PJ · {s.wins} PG
                {scope !== "mundialito" && s.draws > 0 ? ` · ${s.draws} PE` : ""}{" "}
                · {s.losses} PP
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
