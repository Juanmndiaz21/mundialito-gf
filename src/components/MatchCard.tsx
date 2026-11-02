import React from "react";
import { type Match, type Player, getPlayerGoalsInMatch } from "../domain/types";
import { useStore } from "../store/StoreContext";
import {
  formatArs,
  formatMatchCode,
  formatMatchDate,
  PHASE_LABELS,
  RESULT_LABEL,
  RESULT_LETTER,
} from "../domain/format";
import { PhaseTrack } from "./PhaseTrack";
import { PlayerChip } from "./PlayerChip";

interface MatchCardProps {
  match: Match;
  campaignIndex?: number;
  playersMap: Map<string, Player>;
  onOpenMatch: (matchId: string) => void;
  onOpenPlayer: (playerId: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  campaignIndex,
  playersMap,
  onOpenMatch,
  onOpenPlayer,
}) => {
  const isMun = match.tournamentType === "mundialito";
  const prefix = isMun ? "Fulbo" : "Mixto";

  let stripeClass = "bg-[var(--draw)] text-[var(--on-draw)]";
  let scoreBadgeClass =
    "bg-[var(--draw-surface)] border-[var(--draw)] text-[var(--draw-muted)]";
  if (match.result === "win") {
    stripeClass = "bg-[var(--win)] text-[var(--on-win)]";
    scoreBadgeClass =
      "bg-[var(--win-surface)] border-[var(--win)] text-[var(--win-muted)]";
  } else if (match.result === "loss") {
    stripeClass = "bg-[var(--loss)] text-[var(--on-loss)]";
    scoreBadgeClass =
      "bg-[var(--loss-surface)] border-[var(--loss)] text-[var(--loss-muted)]";
  }

  const { activeUser } = useStore();
  const effectiveGoals = getPlayerGoalsInMatch(match, activeUser?.linkedPlayerId);

  const goalsText =
    effectiveGoals === null
      ? "Goles sin registrar"
      : effectiveGoals === 1
      ? "1 gol"
      : `${effectiveGoals} goles`;

  const isGoalPeak = (effectiveGoals ?? 0) >= 4;

  return (
    <article
      data-animate="card"
      className="flex rounded-xl bg-white border border-[var(--line)] shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] hover:border-[var(--espn-red)] hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] transition-all duration-150 overflow-hidden"
    >
      <div
        className={`w-10 shrink-0 flex flex-col items-center justify-center font-display text-xl font-bold ${stripeClass}`}
        aria-label={`Resultado: ${RESULT_LABEL[match.result]}`}
      >
        <span>{RESULT_LETTER[match.result]}</span>
      </div>

      <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => onOpenMatch(match.id)}
          className="w-full text-left rounded-[4px] min-h-[44px] flex flex-col gap-1.5 group cursor-pointer"
          aria-label={`Ver detalle de ${prefix} #${match.matchNumber}, ${
            RESULT_LABEL[match.result]
          }`}
        >
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="font-mono-tech text-xs text-[var(--text-muted)]">
                [{formatMatchCode(match.matchNumber)}]
              </span>
              <span className="font-display text-xl font-bold text-[var(--text)] group-hover:text-[var(--win)] transition-colors duration-150">
                {prefix} #{match.matchNumber}
              </span>
              <span className="font-mono-tech text-xs text-[var(--text-muted)]">
                · {formatMatchDate(match.date)}
              </span>
              {!isMun && match.score && (
                <span
                  className={`px-2 py-0.5 rounded-[4px] border font-mono-tech text-sm font-semibold tabular-nums ${scoreBadgeClass}`}
                >
                  {match.score.us} - {match.score.them}
                </span>
              )}
            </div>
            <span className="font-mono-tech text-sm font-semibold tabular-nums text-[var(--text)]">
              {formatArs(match.cost)}
            </span>
          </div>

          {isMun && match.phase && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <PhaseTrack
                size="mini"
                currentPhase={match.phase}
                result={match.result}
              />
              <span className="text-xs text-[var(--text-muted)]">
                {PHASE_LABELS[match.phase]}
                {campaignIndex ? ` · Mundial ${campaignIndex}` : ""}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap text-sm">
            <span
              className={
                match.personalGoals === null
                  ? "text-[var(--text-muted)]"
                  : isGoalPeak
                  ? "px-2 py-0.5 rounded-[4px] bg-[var(--gold-surface)] border border-[var(--gold)] font-semibold text-[var(--gold-muted)] text-xs"
                  : "font-semibold text-[var(--text)]"
              }
            >
              {goalsText}
            </span>
            {match.notes && (
              <span className="text-[var(--text-muted)]">
                &ldquo;{match.notes}&rdquo;
              </span>
            )}
          </div>
        </button>

        <div
          className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[var(--line)]"
          aria-label="Compañeros del partido"
        >
          {match.teamPlayers.map((pid) => {
            const player = playersMap.get(pid);
            const displayName = player ? player.displayName : pid;
            return (
              <PlayerChip
                key={pid}
                id={pid}
                name={displayName}
                onClick={() => onOpenPlayer(pid)}
              />
            );
          })}
        </div>
      </div>
    </article>
  );
};
