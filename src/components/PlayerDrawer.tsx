import React, { useMemo, useState } from "react";
import { useStore } from "../store/StoreContext";
import { computePlayerStats } from "../domain/stats";
import type { BadgeId, Scope } from "../domain/types";
import {
  BADGE_LABELS,
  formatMatchDate,
  formatPct,
  PHASE_SHORT_LABELS,
  playerDorsal,
  playerTone,
  RESULT_LETTER,
} from "../domain/format";
import { ScopeSwitch } from "./ScopeSwitch";
import { SolarIcon, type SolarIconName } from "./SolarIcon";
import { useFocusTrap } from "./useFocusTrap";

export const BadgeTag: React.FC<{ badge: BadgeId }> = ({ badge }) => {
  let colorClass =
    "border-[var(--win)] text-[var(--win-muted)] bg-[var(--win-surface)]";
  let iconName: SolarIconName = "bolt";
  if (badge === "talisman") {
    colorClass =
      "border-[var(--gold)] text-[var(--gold-muted)] bg-[var(--gold-surface)]";
    iconName = "trophy";
  } else if (badge === "invicto") {
    colorClass =
      "border-[var(--gold)] text-[var(--gold-muted)] bg-[var(--gold-surface)]";
    iconName = "shield";
  } else if (badge === "mufa") {
    colorClass =
      "border-[var(--loss)] text-[var(--loss-muted)] bg-[var(--loss-surface)]";
    iconName = "danger";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs uppercase rounded-[4px] border font-medium ${colorClass}`}
    >
      <SolarIcon name={iconName} className="w-3.5 h-3.5 shrink-0" />
      <span>{BADGE_LABELS[badge]}</span>
    </span>
  );
};

export const PlayerDrawer: React.FC = () => {
  const {
    openPlayerId,
    setOpenPlayerId,
    players,
    matches,
    scope: globalScope,
    navigate,
    setOpenMatchId,
  } = useStore();

  const [drawerScope, setDrawerScope] = useState<Scope>(globalScope);

  const player = useMemo(
    () => players.find((p) => p.id === openPlayerId) ?? null,
    [players, openPlayerId]
  );

  const stat = useMemo(() => {
    if (!player) return null;
    const allStats = computePlayerStats(matches, players, drawerScope);
    return (
      allStats.find((s) => s.id === player.id) ?? {
        id: player.id,
        name: player.displayName,
        scope: drawerScope,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        winRate: 0,
        badges: [],
      }
    );
  }, [drawerScope, matches, player, players]);

  const sharedMatches = useMemo(() => {
    if (!player) return [];
    return matches
      .filter(
        (m) =>
          (drawerScope === "all" || m.tournamentType === drawerScope) &&
          m.teamPlayers.includes(player.id)
      )
      .sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.matchNumber - a.matchNumber;
      });
  }, [drawerScope, matches, player]);

  const trapRef = useFocusTrap<HTMLDivElement>(Boolean(player), () =>
    setOpenPlayerId(null)
  );

  if (!player || !stat) return null;

  const tone = playerTone(player.id);
  const dorsal = playerDorsal(player.id);

  return (
    <div
      className="fixed inset-0 z-30 flex items-end lg:items-stretch lg:justify-end bg-black/75"
      onClick={() => setOpenPlayerId(null)}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-drawer-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="drawer-surface elevated-shadow w-full lg:w-[420px] max-h-[90dvh] lg:max-h-none bg-[var(--surface-2)] border-t lg:border-t-0 lg:border-l border-[var(--line-strong)] rounded-t-[12px] lg:rounded-none flex flex-col overflow-y-auto"
      >
        <div className="p-4 sm:p-5 border-b border-[var(--line-strong)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              style={{
                backgroundColor: tone.bg,
                color: tone.text,
                borderColor: tone.border,
              }}
              className="px-2.5 py-1.5 rounded-[4px] border inline-flex items-center justify-center font-mono-tech text-sm font-semibold shrink-0"
            >
              #{dorsal}
            </span>
            <div>
              <h2
                id="player-drawer-title"
                className="font-display text-2xl font-bold leading-none text-[var(--text)]"
              >
                {player.displayName}
              </h2>
              {stat.badges.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  {stat.badges.map((b) => (
                    <BadgeTag key={b} badge={b} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpenPlayerId(null)}
            aria-label="Cerrar ficha de compañero"
            className="min-w-[44px] min-h-[44px] rounded-[8px] inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] border border-[var(--line-strong)] cursor-pointer"
          >
            <SolarIcon name="close" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col gap-5">
          <ScopeSwitch value={drawerScope} onChange={setDrawerScope} />

          <dl className="grid grid-cols-4 divide-x divide-[var(--line)] border-y border-[var(--line)] py-3.5">
            <div className="pr-3">
              <dt className="text-xs text-[var(--text-muted)]">PJ</dt>
              <dd className="font-display text-2xl font-bold tabular-nums text-[var(--text)] mt-0.5">
                {stat.matchesPlayed}
              </dd>
            </div>
            <div className="px-3">
              <dt className="text-xs text-[var(--text-muted)]">PG</dt>
              <dd className="font-display text-2xl font-bold tabular-nums text-[var(--win)] mt-0.5">
                {stat.wins}
              </dd>
            </div>
            <div className="px-3">
              <dt className="text-xs text-[var(--text-muted)]">PP</dt>
              <dd className="font-display text-2xl font-bold tabular-nums text-[var(--loss)] mt-0.5">
                {stat.losses}
              </dd>
            </div>
            <div className="pl-3">
              <dt className="text-xs text-[var(--text-muted)]">Win rate</dt>
              <dd className="font-display text-xl font-bold tabular-nums text-[var(--text)] mt-0.5">
                {stat.matchesPlayed > 0 ? formatPct(stat.winRate, 1) : "0,0 %"}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="text-xs text-[var(--text-muted)] mb-2">
              Partidos jugados juntos ({sharedMatches.length})
            </h3>
            {sharedMatches.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-3 border-t border-[var(--line)]">
                Sin partidos registrados en este torneo.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {sharedMatches.map((m) => {
                  const isMun = m.tournamentType === "mundialito";
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenPlayerId(null);
                          setOpenMatchId(m.id);
                        }}
                        className="w-full min-h-[44px] px-2 py-2.5 hover:bg-[var(--surface)] rounded-[4px] flex items-center justify-between gap-2 text-left transition-colors duration-150 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
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
                          <span className="font-display font-bold text-base text-[var(--text)]">
                            {isMun ? "Fulbo" : "Mixto"} #{m.matchNumber}
                          </span>
                          <span className="font-mono-tech text-xs text-[var(--text-muted)]">
                            · {formatMatchDate(m.date)}
                          </span>
                        </div>
                        <span className="font-mono-tech text-xs text-[var(--text-muted)]">
                          {isMun && m.phase
                            ? PHASE_SHORT_LABELS[m.phase]
                            : m.score
                            ? `${m.score.us}-${m.score.them}`
                            : "Mixto"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-[var(--line-strong)]">
          <button
            type="button"
            onClick={() => {
              const id = player.id;
              setOpenPlayerId(null);
              navigate("/partidos", { players: [id] });
            }}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-[8px] bg-[var(--win)] text-[var(--on-win)] font-semibold text-sm hover:opacity-95 active:scale-[0.97] transition-all duration-150 cursor-pointer"
          >
            Ver partidos juntos en Fútbol 2026
          </button>
        </div>
      </div>
    </div>
  );
};
