import React, { useMemo, useState } from "react";
import { useStore } from "../store/StoreContext";
import { computePlayerStats, MIN_PJ_RANKING } from "../domain/stats";
import { formatPct, playerDorsal, playerTone } from "../domain/format";
import { ScopeSwitch } from "../components/ScopeSwitch";
import { BadgeTag } from "../components/PlayerDrawer";
import { SolarIcon } from "../components/SolarIcon";
import { SplitHeading } from "../components/SplitHeading";
import { useViewChoreography } from "../components/MotionSystem";

type SortColumn = "name" | "pj" | "wr";
type SortDir = "asc" | "desc";

export const FeelingView: React.FC = () => {
  const { matches, players, scope, setScope, setOpenPlayerId } = useStore();
  const [sortCol, setSortCol] = useState<SortColumn>("pj");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const viewRef = useViewChoreography<HTMLDivElement>([]);

  const stats = useMemo(
    () => computePlayerStats(matches, players, scope),
    [matches, players, scope]
  );

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
            text="Feeling con tus compañeros"
            className="font-display text-3xl sm:text-4xl font-bold text-[var(--text)]"
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Talismán y Mufa se calculan entre quienes jugaron 4 o más partidos con vos.
          </p>
        </div>

        <ScopeSwitch value={scope} onChange={setScope} />
      </div>

      {!hasEligibleForRanking && (
        <div
          role="status"
          className="rounded-[8px] bg-[var(--surface)] border border-[var(--line-strong)] p-4 text-sm text-[var(--text-muted)]"
        >
          Talismán y Mufa aparecen cuando alguien juega 4 partidos con vos. Hoy el máximo es{" "}
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
                  <span>Compañero</span>
                  {renderSortIcon("name")}
                </button>
              </th>
              <th aria-sort={getAriaSort("pj")} className="p-3.5 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort("pj")}
                  className="min-h-[36px] inline-flex items-center gap-1.5 text-[var(--text)] hover:text-[var(--win)] font-semibold cursor-pointer"
                >
                  <span>PJ</span>
                  {renderSortIcon("pj")}
                </button>
              </th>
              <th className="p-3.5 font-semibold">PG</th>
              {scope !== "mundialito" && (
                <th className="p-3.5 font-semibold">PE</th>
              )}
              <th className="p-3.5 font-semibold">PP</th>
              <th aria-sort={getAriaSort("wr")} className="p-3.5 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort("wr")}
                  className="min-h-[36px] inline-flex items-center gap-1.5 text-[var(--text)] hover:text-[var(--win)] font-semibold cursor-pointer"
                >
                  <span>Win rate</span>
                  {renderSortIcon("wr")}
                </button>
              </th>
              <th className="p-3.5 font-semibold">Insignias</th>
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
