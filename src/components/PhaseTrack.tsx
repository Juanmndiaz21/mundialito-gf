import React from "react";
import type { Match, Phase } from "../domain/types";
import { PHASE_ORDER } from "../domain/campaigns";
import { PHASE_LABELS, PHASE_SHORT_LABELS, RESULT_LETTER } from "../domain/format";

interface LargePhaseTrackProps {
  size: "large";
  nextPhase: Phase | null;
  status: "active" | "eliminated" | "champion";
  groupMatches: Match[];
}

interface MiniPhaseTrackProps {
  size: "mini";
  currentPhase: Phase;
  result: "win" | "loss" | "draw";
}

export type PhaseTrackProps = LargePhaseTrackProps | MiniPhaseTrackProps;

export const PhaseTrack: React.FC<PhaseTrackProps> = (props) => {
  if (props.size === "mini") {
    const currentIdx = PHASE_ORDER.indexOf(props.currentPhase);
    return (
      <div
        className="inline-flex items-center gap-1"
        aria-label={`Fase jugada: ${PHASE_LABELS[props.currentPhase]}`}
      >
        {PHASE_ORDER.map((phase, idx) => {
          const isCurrent = idx === currentIdx;
          const isPast = idx < currentIdx;

          let bg =
            "bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--line-strong)]";
          if (isPast) {
            bg =
              "bg-[var(--win-surface)] text-[var(--win-muted)] border-[var(--win)] font-semibold";
          } else if (isCurrent) {
            if (phase === "final" && props.result === "win") {
              bg =
                "bg-[var(--gold)] text-[var(--on-gold)] border-[var(--gold)] font-bold";
            } else if (props.result === "win") {
              bg =
                "bg-[var(--win)] text-[var(--on-win)] border-[var(--win)] font-bold";
            } else if (props.result === "draw") {
              bg =
                "bg-[var(--draw)] text-[var(--on-draw)] border-[var(--draw)] font-bold";
            } else {
              bg =
                "bg-[var(--loss)] text-[var(--on-loss)] border-[var(--loss)] font-bold";
            }
          }

          return (
            <React.Fragment key={phase}>
              <span
                className={`px-1.5 py-0.5 text-[11px] leading-none rounded-[4px] border font-display tracking-wide ${bg}`}
              >
                {PHASE_SHORT_LABELS[phase]}
              </span>
              {idx < PHASE_ORDER.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`w-1.5 h-[2px] ${
                    idx < currentIdx ? "bg-[var(--win)]" : "bg-[var(--line-strong)]"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  const nextIdx = props.nextPhase
    ? PHASE_ORDER.indexOf(props.nextPhase)
    : PHASE_ORDER.length;

  return (
    <div
      className="w-full"
      role="group"
      aria-label="Progreso de fases del Mundial actual"
    >
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {PHASE_ORDER.map((phase, idx) => {
          const isCompleted =
            props.status === "champion" ||
            (props.nextPhase !== null && idx < nextIdx);
          const isNext =
            props.status === "active" && props.nextPhase === phase;
          const isFinalStage = phase === "final";

          let boxStyle =
            "bg-[var(--surface-2)] border border-[var(--line-strong)] text-[var(--text)]";
          let subTextStyle = "text-[var(--text-muted)]";
          let statusLabel = "Pendiente";

          if (isCompleted) {
            boxStyle =
              "bg-[var(--win)] border-2 border-[var(--win)] text-[var(--on-win)] font-bold";
            subTextStyle = "text-[var(--on-win)]";
            statusLabel = "Completada";
          } else if (isNext) {
            boxStyle =
              "bg-[var(--win-surface)] border-2 border-[var(--win)] text-[var(--win)] font-bold";
            subTextStyle = "text-[var(--win-muted)]";
            statusLabel = "Próxima fase";
          } else if (isFinalStage) {
            boxStyle =
              "bg-[var(--gold-surface)] border border-[var(--gold)] text-[var(--gold)] font-semibold";
            subTextStyle = "text-[var(--gold-muted)]";
            statusLabel = "Instancia decisiva";
          }

          return (
            <div key={phase} className="flex flex-col">
              <div
                className={`rounded-[8px] px-2 py-2.5 sm:px-3 sm:py-3 flex flex-col justify-between min-h-[60px] ${boxStyle}`}
                aria-label={`${PHASE_LABELS[phase]}: ${statusLabel}`}
              >
                <span
                  className={`text-[11px] sm:text-xs uppercase font-display tracking-wide ${subTextStyle}`}
                >
                  {isCompleted
                    ? "Adentro"
                    : isNext
                    ? "Siguiente"
                    : isFinalStage
                    ? "Copa"
                    : `Paso ${idx + 1}`}
                </span>
                <span className="font-display text-base sm:text-xl leading-tight">
                  {PHASE_SHORT_LABELS[phase]}
                </span>
              </div>

              {phase === "group" && props.groupMatches.length > 0 && (
                <div
                  className="mt-1.5 flex items-center gap-1 flex-wrap"
                  aria-label="Resultados en fase de grupos"
                >
                  {props.groupMatches.map((m) => (
                    <span
                      key={m.id}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-[4px] text-xs font-display font-bold ${
                        m.result === "win"
                          ? "bg-[var(--win)] text-[var(--on-win)]"
                          : "bg-[var(--loss)] text-[var(--on-loss)]"
                      }`}
                      title={`Fulbo #${m.matchNumber}: ${
                        m.result === "win" ? "Victoria" : "Derrota"
                      }`}
                    >
                      {RESULT_LETTER[m.result]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
