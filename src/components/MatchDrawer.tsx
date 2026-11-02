import React, { useMemo } from "react";
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
import { SolarIcon } from "./SolarIcon";
import { useFocusTrap } from "./useFocusTrap";

export const MatchDrawer: React.FC = () => {
  const {
    openMatchId,
    setOpenMatchId,
    matches,
    players,
    campaigns,
    setModal,
    setConfirmDialog,
    deleteMatch,
    setOpenPlayerId,
  } = useStore();

  const match = useMemo(
    () => matches.find((m) => m.id === openMatchId) ?? null,
    [matches, openMatchId]
  );

  const playersMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  const campaign = useMemo(
    () =>
      match
        ? campaigns.find((c) => c.matchIds.includes(match.id)) ?? null
        : null,
    [campaigns, match]
  );

  const trapRef = useFocusTrap<HTMLDivElement>(Boolean(match), () =>
    setOpenMatchId(null)
  );

  if (!match) return null;

  const isMun = match.tournamentType === "mundialito";
  const prefix = isMun ? "Fulbo" : "Mixto";

  return (
    <div
      className="fixed inset-0 z-30 flex items-end lg:items-stretch lg:justify-end bg-black/75"
      onClick={() => setOpenMatchId(null)}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-drawer-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="drawer-surface elevated-shadow w-full lg:w-[420px] max-h-[90dvh] lg:max-h-none bg-[var(--surface-2)] border-t lg:border-t-0 lg:border-l border-[var(--line-strong)] rounded-t-[12px] lg:rounded-none flex flex-col overflow-y-auto"
      >
        <div className="p-4 sm:p-5 border-b border-[var(--line-strong)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-8 h-8 rounded-[4px] inline-flex items-center justify-center font-display text-lg font-bold ${
                match.result === "win"
                  ? "bg-[var(--win)] text-[var(--on-win)]"
                  : match.result === "loss"
                  ? "bg-[var(--loss)] text-[var(--on-loss)]"
                  : "bg-[var(--draw)] text-[var(--on-draw)]"
              }`}
            >
              {RESULT_LETTER[match.result]}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-tech text-[11px] text-[var(--text-muted)]">
                  #{formatMatchCode(match.matchNumber)}
                </span>
                <h2
                  id="match-drawer-title"
                  className="font-display text-2xl font-bold leading-none text-[var(--text)]"
                >
                  {prefix} #{match.matchNumber}
                </h2>
              </div>
              <p className="font-mono-tech text-xs text-[var(--text-muted)] mt-0.5">
                {RESULT_LABEL[match.result]} · {formatMatchDate(match.date)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpenMatchId(null)}
            aria-label="Cerrar detalle del partido"
            className="min-w-[44px] min-h-[44px] rounded-[8px] inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] border border-[var(--line-strong)] cursor-pointer"
          >
            <SolarIcon name="close" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col gap-5">
          {isMun && match.phase && (
            <div className="pb-4 border-b border-[var(--line)] flex flex-col gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                Instancia en campaña
              </span>
              <PhaseTrack
                size="mini"
                currentPhase={match.phase}
                result={match.result}
              />
              <span className="text-sm font-semibold text-[var(--text)]">
                {PHASE_LABELS[match.phase]}
                {campaign ? ` · Mundial ${campaign.index}` : ""}
              </span>
            </div>
          )}

          {!isMun && match.score && (
            <div className="pb-4 border-b border-[var(--line)] flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Marcador</span>
              <span className="font-mono-tech text-2xl font-semibold tabular-nums text-[var(--text)]">
                {match.score.us} - {match.score.them}
              </span>
            </div>
          )}

          <dl className="grid grid-cols-2 divide-x divide-[var(--line)] border-b border-[var(--line)] pb-4">
            <div className="pr-4">
              <dt className="text-xs text-[var(--text-muted)]">Goles míos</dt>
              <dd className="font-display text-2xl font-bold tabular-nums text-[var(--text)] mt-1">
                {match.personalGoals === null
                  ? "Sin registrar"
                  : match.personalGoals}
              </dd>
            </div>
            <div className="pl-4">
              <dt className="text-xs text-[var(--text-muted)]">Importe cancha</dt>
              <dd className="font-mono-tech text-xl font-semibold tabular-nums text-[var(--text)] mt-1">
                {formatArs(match.cost)}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="text-xs text-[var(--text-muted)] mb-2.5">
              Compañeros ({match.teamPlayers.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {match.teamPlayers.map((pid) => {
                const player = playersMap.get(pid);
                return (
                  <PlayerChip
                    key={pid}
                    id={pid}
                    name={player ? player.displayName : pid}
                    onClick={() => {
                      setOpenMatchId(null);
                      setOpenPlayerId(pid);
                    }}
                  />
                );
              })}
            </div>
          </div>

          {match.notes && (
            <div className="pt-4 border-t border-[var(--line)]">
              <span className="text-xs text-[var(--text-muted)] block mb-1">
                Nota del partido
              </span>
              <p className="text-sm text-[var(--text)]">&ldquo;{match.notes}&rdquo;</p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 border-t border-[var(--line-strong)] flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const id = match.id;
              setOpenMatchId(null);
              setModal({ kind: "edit", matchId: id });
            }}
            className="flex-1 min-h-[44px] px-4 py-2 rounded-[8px] bg-[var(--surface)] border border-[var(--line-strong)] text-sm font-semibold text-[var(--text)] hover:border-[var(--win)] inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <SolarIcon name="edit" className="w-4 h-4" />
            <span>Editar partido</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setConfirmDialog({
                title: `Borrar ${prefix} #${match.matchNumber}`,
                message: `¿Seguro que querés borrar ${prefix} #${match.matchNumber} del ${formatMatchDate(
                  match.date
                )}? Se van a recalcular las campañas y los números de los partidos siguientes.`,
                confirmLabel: "Sí, borrar partido",
                onConfirm: () => deleteMatch(match.id),
              });
            }}
            className="min-h-[44px] px-4 py-2 rounded-[8px] bg-[var(--surface)] border border-[var(--loss)] text-sm font-semibold text-[var(--loss)] hover:bg-[var(--loss)] hover:text-[var(--on-loss)] inline-flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer"
          >
            <SolarIcon name="trash" className="w-4 h-4" />
            <span>Borrar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
