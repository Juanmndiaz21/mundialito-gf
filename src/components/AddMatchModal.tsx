import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "../store/StoreContext";
import { SolarIcon } from "./SolarIcon";
import {
  type Match,
  type MatchResult,
  type Player,
  type Score,
  type TournamentType,
  getPlayerGoalsInMatch,
} from "../domain/types";
import { previewPhase, recomputePhases } from "../domain/campaigns";
import {
  findOrCreatePlayer,
  normalizePlayerKey,
} from "../domain/normalize";
import { PHASE_LABELS, todayIsoLocal } from "../domain/format";
import { PlayerChip } from "./PlayerChip";
import { useFocusTrap } from "./useFocusTrap";

function getLastCostForTournament(
  matches: Match[],
  tournament: TournamentType
): number {
  const list = matches
    .filter((m) => m.tournamentType === tournament)
    .sort((a, b) => b.matchNumber - a.matchNumber);
  return list.length > 0 ? list[0].cost : 5500;
}

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return false;
  }
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  return dt.getTime() <= tomorrow.getTime();
}

export const AddMatchModal: React.FC = () => {
  const {
    modal,
    setModal,
    matches,
    players,
    lastTournament,
    addMatch,
    updateMatch,
    activeUser,
  } = useStore();

  const editingMatch = useMemo(() => {
    if (!modal || modal.kind !== "edit") return null;
    return matches.find((m) => m.id === modal.matchId) ?? null;
  }, [matches, modal]);

  const initialTournament: TournamentType = editingMatch
    ? editingMatch.tournamentType
    : modal?.kind === "add" && modal.defaultTournament
    ? modal.defaultTournament
    : lastTournament;

  const [tournament, setTournament] =
    useState<TournamentType>(initialTournament);
  const [result, setResult] = useState<MatchResult | null>(
    editingMatch ? editingMatch.result : null
  );
  const initialGoals = editingMatch
    ? getPlayerGoalsInMatch(editingMatch, activeUser?.linkedPlayerId)
    : 1;

  const [goalsStr, setGoalsStr] = useState<string>(
    initialGoals === null ? "" : String(initialGoals)
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    editingMatch ? editingMatch.teamPlayers : []
  );
  const [pendingNewPlayers, setPendingNewPlayers] = useState<Player[]>([]);
  const [playerQuery, setPlayerQuery] = useState("");
  const [costStr, setCostStr] = useState<string>(
    editingMatch
      ? String(editingMatch.cost)
      : String(getLastCostForTournament(matches, initialTournament))
  );
  const [date, setDate] = useState<string>(
    editingMatch ? editingMatch.date : todayIsoLocal()
  );
  const [scoreUsStr, setScoreUsStr] = useState<string>(
    editingMatch?.score ? String(editingMatch.score.us) : ""
  );
  const [scoreThemStr, setScoreThemStr] = useState<string>(
    editingMatch?.score ? String(editingMatch.score.them) : ""
  );
  const [notes, setNotes] = useState<string>(editingMatch?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!modal) return;
    if (editingMatch) {
      setTournament(editingMatch.tournamentType);
      setResult(editingMatch.result);
      setGoalsStr(
        editingMatch.personalGoals === null
          ? ""
          : String(editingMatch.personalGoals)
      );
      setSelectedIds(editingMatch.teamPlayers);
      setPendingNewPlayers([]);
      setPlayerQuery("");
      setCostStr(String(editingMatch.cost));
      setDate(editingMatch.date);
      setScoreUsStr(editingMatch.score ? String(editingMatch.score.us) : "");
      setScoreThemStr(
        editingMatch.score ? String(editingMatch.score.them) : ""
      );
      setNotes(editingMatch.notes ?? "");
      setErrors({});
    } else {
      const t =
        modal.kind === "add" && modal.defaultTournament
          ? modal.defaultTournament
          : lastTournament;
      setTournament(t);
      setResult(null);
      setGoalsStr("1");
      setSelectedIds([]);
      setPendingNewPlayers([]);
      setPlayerQuery("");
      setCostStr(String(getLastCostForTournament(matches, t)));
      setDate(todayIsoLocal());
      setScoreUsStr("");
      setScoreThemStr("");
      setNotes("");
      setErrors({});
    }
  }, [editingMatch, lastTournament, matches, modal]);

  const allKnownPlayers = useMemo(
    () => [...players, ...pendingNewPlayers],
    [pendingNewPlayers, players]
  );

  const playersMap = useMemo(
    () => new Map(allKnownPlayers.map((p) => [p.id, p])),
    [allKnownPlayers]
  );

  const phasePreviewInfo = useMemo(() => {
    if (tournament !== "mundialito") return null;
    if (editingMatch && editingMatch.tournamentType === "mundialito") {
      const { campaigns } = recomputePhases(matches);
      const camp = campaigns.find((c) => c.matchIds.includes(editingMatch.id));
      return {
        phase: editingMatch.phase ?? "group",
        campaignIndex: camp ? camp.index : 1,
      };
    }
    return previewPhase(matches);
  }, [editingMatch, matches, tournament]);

  const playCountById = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of matches) {
      for (const pid of m.teamPlayers) {
        counts.set(pid, (counts.get(pid) ?? 0) + 1);
      }
    }
    return counts;
  }, [matches]);

  const suggestions = useMemo(() => {
    const q = normalizePlayerKey(playerQuery);
    const available = allKnownPlayers
      .filter((p) => !selectedIds.includes(p.id))
      .sort((a, b) => {
        const diff =
          (playCountById.get(b.id) ?? 0) - (playCountById.get(a.id) ?? 0);
        if (diff !== 0) return diff;
        return a.displayName.localeCompare(b.displayName, "es-AR");
      });
    if (!q) return available.slice(0, 8);
    return available
      .filter(
        (p) =>
          normalizePlayerKey(p.displayName).includes(q) ||
          p.id.includes(q) ||
          p.aliases.some((a) => normalizePlayerKey(a).includes(q))
      )
      .slice(0, 8);
  }, [allKnownPlayers, playCountById, playerQuery, selectedIds]);

  const exactPlayerMatch = useMemo(() => {
    const q = normalizePlayerKey(playerQuery);
    if (!q) return null;
    return (
      allKnownPlayers.find(
        (p) =>
          p.id === q ||
          normalizePlayerKey(p.displayName) === q ||
          p.aliases.some((a) => normalizePlayerKey(a) === q)
      ) ?? null
    );
  }, [allKnownPlayers, playerQuery]);

  const trapRef = useFocusTrap<HTMLDivElement>(Boolean(modal), () =>
    setModal(null)
  );

  if (!modal) return null;

  const handleTournamentChange = (next: TournamentType) => {
    setTournament(next);
    if (next === "mundialito" && result === "draw") {
      setResult(null);
    }
    if (!editingMatch) {
      setCostStr(String(getLastCostForTournament(matches, next)));
    }
  };

  const handleAddPlayerId = (pid: string) => {
    if (selectedIds.includes(pid) || selectedIds.length >= 5) return;
    setSelectedIds([...selectedIds, pid]);
    setPlayerQuery("");
  };

  const handleCreateOrSelectPlayer = (rawName: string) => {
    if (!rawName.trim() || selectedIds.length >= 5) return;
    const { player, created } = findOrCreatePlayer(rawName, allKnownPlayers);
    if (created) {
      setPendingNewPlayers([...pendingNewPlayers, player]);
    }
    if (!selectedIds.includes(player.id)) {
      setSelectedIds([...selectedIds, player.id]);
    }
    setPlayerQuery("");
  };

  const adjustGoals = (delta: number) => {
    const current = goalsStr.trim() === "" ? 0 : Number(goalsStr);
    const base = Number.isNaN(current) ? 0 : current;
    const next = Math.max(0, Math.min(30, base + delta));
    setGoalsStr(String(next));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!isValidDateString(date)) {
      nextErrors.date = "Poné la fecha del partido.";
    }

    if (!result || (tournament === "mundialito" && result === "draw")) {
      nextErrors.result = "Elegí cómo salió.";
    }

    const costNum = Number(costStr);
    if (
      costStr.trim() === "" ||
      !Number.isInteger(costNum) ||
      costNum < 0 ||
      costNum > 100000
    ) {
      nextErrors.cost = "El importe va en pesos, sin centavos.";
    }

    let parsedGoals: number | null = null;
    if (goalsStr.trim() !== "") {
      const gNum = Number(goalsStr);
      if (!Number.isInteger(gNum) || gNum < 0 || gNum > 30) {
        nextErrors.goals = "Los goles van de 0 a 30, o dejar en blanco.";
      } else {
        parsedGoals = gNum;
      }
    }

    if (selectedIds.length < 1 || selectedIds.length > 5) {
      nextErrors.players = "Seleccionar al menos un jugador para la nómina.";
    }

    let parsedScore: Score | null = null;
    if (tournament === "mixto") {
      const hasUs = scoreUsStr.trim() !== "";
      const hasThem = scoreThemStr.trim() !== "";
      if (hasUs !== hasThem) {
        nextErrors.score = "El marcador no coincide con el resultado.";
      } else if (hasUs && hasThem) {
        const us = Number(scoreUsStr);
        const them = Number(scoreThemStr);
        if (
          !Number.isInteger(us) ||
          !Number.isInteger(them) ||
          us < 0 ||
          them < 0
        ) {
          nextErrors.score = "El marcador no coincide con el resultado.";
        } else if (
          (result === "win" && us <= them) ||
          (result === "loss" && us >= them) ||
          (result === "draw" && us !== them)
        ) {
          nextErrors.score = "El marcador no coincide con el resultado.";
        } else {
          parsedScore = { us, them };
        }
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const cleanNotes = notes.trim().slice(0, 140) || null;

    const userPlayerId = activeUser?.linkedPlayerId;
    const nextPlayerGoals: Record<string, number> = {
      ...(editingMatch?.playerGoals ?? {}),
    };
    if (userPlayerId) {
      if (parsedGoals !== null) {
        nextPlayerGoals[userPlayerId] = parsedGoals;
      } else {
        delete nextPlayerGoals[userPlayerId];
      }
    }

    if (editingMatch) {
      updateMatch(
        {
          ...editingMatch,
          tournamentType: tournament,
          date,
          cost: costNum,
          result: result!,
          personalGoals: parsedGoals,
          playerGoals: nextPlayerGoals,
          teamPlayers: selectedIds,
          notes: cleanNotes,
          score: tournament === "mixto" ? parsedScore : null,
        },
        pendingNewPlayers
      );
    } else {
      addMatch(
        {
          tournamentType: tournament,
          date,
          cost: costNum,
          result: result!,
          personalGoals: parsedGoals,
          playerGoals: nextPlayerGoals,
          teamPlayers: selectedIds,
          notes: cleanNotes,
          score: tournament === "mixto" ? parsedScore : null,
        },
        pendingNewPlayers
      );
    }
    setModal(null);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 overflow-y-auto"
      onClick={() => setModal(null)}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-match-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="modal-surface elevated-shadow w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto bg-[var(--surface)] border border-[var(--line-strong)] rounded-t-[12px] sm:rounded-[12px] flex flex-col"
      >
        <div className="p-4 sm:p-5 border-b border-[var(--line-strong)] flex items-center justify-between">
          <h2
            id="add-match-modal-title"
            className="font-display text-2xl font-bold text-[var(--text)]"
          >
            {editingMatch
              ? `Editar ${
                  editingMatch.tournamentType === "mundialito" ? "Fulbo" : "Mixto"
                } #${editingMatch.matchNumber}`
              : "Cargar partido"}
          </h2>
          <button
            type="button"
            onClick={() => setModal(null)}
            aria-label="Cerrar ventana"
            className="min-w-[44px] min-h-[44px] rounded-[8px] inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] border border-[var(--line-strong)] cursor-pointer"
          >
            <SolarIcon name="close" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-5 flex flex-col gap-4 pb-8">
          <div>
            <span className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Torneo
            </span>
            <div
              role="group"
              aria-label="Torneo"
              className="grid grid-cols-2 gap-2 p-1 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)]"
            >
              {(["mundialito", "mixto"] as const).map((t) => {
                const active = tournament === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleTournamentChange(t)}
                    className={`min-h-[44px] rounded-[4px] text-sm font-semibold transition-colors duration-150 ${
                      active
                        ? "bg-[var(--win)] text-[var(--on-win)]"
                        : "text-[var(--text)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    {t === "mundialito" ? "Fútbol 2026" : "Mixto"}
                  </button>
                );
              })}
            </div>
            {phasePreviewInfo && (
              <p className="mt-2 text-xs text-[var(--win)] font-medium">
                Este partido cuenta como {PHASE_LABELS[phasePreviewInfo.phase]} del Mundial{" "}
                {phasePreviewInfo.campaignIndex}.
              </p>
            )}
          </div>

          <div>
            <span className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Resultado
            </span>
            <div
              role="group"
              aria-label="Resultado del partido"
              className={`grid gap-2 ${
                tournament === "mixto" ? "grid-cols-3" : "grid-cols-2"
              }`}
            >
              <button
                type="button"
                aria-pressed={result === "win"}
                onClick={() => setResult("win")}
                className={`min-h-[44px] rounded-[8px] border text-sm font-semibold transition-colors duration-150 ${
                  result === "win"
                    ? "bg-[var(--win)] text-[var(--on-win)] border-[var(--win)]"
                    : "bg-[var(--surface-2)] text-[var(--text)] border-[var(--line-strong)] hover:border-[var(--win)]"
                }`}
              >
                Victoria
              </button>
              {tournament === "mixto" && (
                <button
                  type="button"
                  aria-pressed={result === "draw"}
                  onClick={() => setResult("draw")}
                  className={`min-h-[44px] rounded-[8px] border text-sm font-semibold transition-colors duration-150 ${
                    result === "draw"
                      ? "bg-[var(--draw)] text-[var(--on-draw)] border-[var(--draw)]"
                      : "bg-[var(--surface-2)] text-[var(--text)] border-[var(--line-strong)] hover:border-[var(--draw)]"
                  }`}
                >
                  Empate
                </button>
              )}
              <button
                type="button"
                aria-pressed={result === "loss"}
                onClick={() => setResult("loss")}
                className={`min-h-[44px] rounded-[8px] border text-sm font-semibold transition-colors duration-150 ${
                  result === "loss"
                    ? "bg-[var(--loss)] text-[var(--on-loss)] border-[var(--loss)]"
                    : "bg-[var(--surface-2)] text-[var(--text)] border-[var(--line-strong)] hover:border-[var(--loss)]"
                }`}
              >
                Derrota
              </button>
            </div>
            {errors.result && (
              <p role="alert" className="text-xs text-[var(--loss)] mt-1">
                {errors.result}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="match-goals-input"
              className="block text-xs font-medium text-[var(--text-muted)] mb-1.5"
            >
              {activeUser
                ? `Goles de ${activeUser.displayName} (dejar vacío si no se registraron)`
                : "Goles individuales (dejar vacío si no se registraron)"}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustGoals(-1)}
                aria-label="Restar un gol"
                className="min-w-[44px] min-h-[44px] rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] inline-flex items-center justify-center text-[var(--text)] hover:border-[var(--win)] cursor-pointer"
              >
                <SolarIcon name="minus" className="w-5 h-5" />
              </button>
              <input
                id="match-goals-input"
                type="number"
                min={0}
                max={30}
                inputMode="numeric"
                value={goalsStr}
                onChange={(e) => setGoalsStr(e.target.value)}
                placeholder="Sin dato"
                className="w-28 min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-center font-display text-xl font-bold tabular-nums text-[var(--text)] placeholder:text-sm placeholder:font-sans placeholder:text-[var(--text-muted)]"
              />
              <button
                type="button"
                onClick={() => adjustGoals(1)}
                aria-label="Sumar un gol"
                className="min-w-[44px] min-h-[44px] rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] inline-flex items-center justify-center text-[var(--text)] hover:border-[var(--win)] cursor-pointer"
              >
                <SolarIcon name="plus" className="w-5 h-5" />
              </button>
              {goalsStr !== "" && (
                <button
                  type="button"
                  onClick={() => setGoalsStr("")}
                  className="min-h-[44px] px-3 rounded-[8px] text-xs text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--line-strong)] bg-[var(--surface-2)]"
                >
                  Dejar sin dato
                </button>
              )}
            </div>
            {errors.goals && (
              <p role="alert" className="text-xs text-[var(--loss)] mt-1">
                {errors.goals}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="player-combobox-input"
              className="block text-xs font-medium text-[var(--text-muted)] mb-1.5"
            >
              Compañeros ({selectedIds.length}/5)
            </label>

            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedIds.map((pid) => {
                  const p = playersMap.get(pid);
                  return (
                    <PlayerChip
                      key={pid}
                      id={pid}
                      name={p ? p.displayName : pid}
                      onRemove={() =>
                        setSelectedIds(selectedIds.filter((id) => id !== pid))
                      }
                    />
                  );
                })}
              </div>
            )}

            {selectedIds.length < 5 && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    id="player-combobox-input"
                    type="text"
                    value={playerQuery}
                    onChange={(e) => setPlayerQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (suggestions.length > 0) {
                          handleAddPlayerId(suggestions[0].id);
                        } else if (playerQuery.trim()) {
                          handleCreateOrSelectPlayer(playerQuery);
                        }
                      }
                    }}
                    placeholder="Buscar o escribir nombre de compañero"
                    className="flex-1 min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
                  />
                  {playerQuery.trim() !== "" && !exactPlayerMatch && (
                    <button
                      type="button"
                      onClick={() => handleCreateOrSelectPlayer(playerQuery)}
                      className="min-h-[44px] px-3 rounded-[8px] bg-[var(--win)] text-[var(--on-win)] text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <SolarIcon name="plus" className="w-4 h-4" />
                      <span>Sumar a {playerQuery.trim()}</span>
                    </button>
                  )}
                </div>

                {suggestions.length > 0 && (
                  <div
                    role="group"
                    aria-label="Compañeros sugeridos"
                    className="flex flex-wrap gap-1.5"
                  >
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddPlayerId(p.id)}
                        className="min-h-[38px] px-2.5 py-1 rounded-[4px] bg-[var(--surface-2)] border border-[var(--line-strong)] hover:border-[var(--win)] text-xs text-[var(--text)] transition-colors duration-150"
                      >
                        + {p.displayName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {errors.players && (
              <p role="alert" className="text-xs text-[var(--loss)] mt-1">
                {errors.players}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="match-cost-input"
                className="block text-xs font-medium text-[var(--text-muted)] mb-1.5"
              >
                Importe individual (ARS)
              </label>
              <input
                id="match-cost-input"
                type="number"
                min={0}
                max={100000}
                step={100}
                inputMode="numeric"
                value={costStr}
                onChange={(e) => setCostStr(e.target.value)}
                placeholder="5500"
                className="w-full min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] font-display text-lg font-bold tabular-nums text-[var(--text)]"
              />
              {errors.cost && (
                <p role="alert" className="text-xs text-[var(--loss)] mt-1">
                  {errors.cost}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="match-date-input"
                className="block text-xs font-medium text-[var(--text-muted)] mb-1.5"
              >
                Fecha
              </label>
              <input
                id="match-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm text-[var(--text)]"
              />
              {errors.date && (
                <p role="alert" className="text-xs text-[var(--loss)] mt-1">
                  {errors.date}
                </p>
              )}
            </div>
          </div>

          {tournament === "mixto" && (
            <div>
              <span className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Marcador del equipo (opcional)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="score-us-input"
                    className="block text-[11px] text-[var(--text-muted)] mb-1"
                  >
                    Equipo (A favor)
                  </label>
                  <input
                    id="score-us-input"
                    type="number"
                    min={0}
                    max={50}
                    inputMode="numeric"
                    value={scoreUsStr}
                    onChange={(e) => setScoreUsStr(e.target.value)}
                    placeholder="Goles a favor"
                    className="w-full min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] font-display text-lg font-bold tabular-nums text-[var(--text)] placeholder:text-xs placeholder:font-sans placeholder:text-[var(--text-muted)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="score-them-input"
                    className="block text-[11px] text-[var(--text-muted)] mb-1"
                  >
                    Rival (En contra)
                  </label>
                  <input
                    id="score-them-input"
                    type="number"
                    min={0}
                    max={50}
                    inputMode="numeric"
                    value={scoreThemStr}
                    onChange={(e) => setScoreThemStr(e.target.value)}
                    placeholder="Goles en contra"
                    className="w-full min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] font-display text-lg font-bold tabular-nums text-[var(--text)] placeholder:text-xs placeholder:font-sans placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>
              {errors.score && (
                <p role="alert" className="text-xs text-[var(--loss)] mt-1">
                  {errors.score}
                </p>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="match-notes-input"
                className="text-xs font-medium text-[var(--text-muted)]"
              >
                Nota o anécdota (opcional)
              </label>
              <span className="text-xs text-[var(--text-muted)] tabular-nums">
                {notes.length}/140
              </span>
            </div>
            <input
              id="match-notes-input"
              type="text"
              maxLength={140}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: cancha techada, x2 el precio..."
              className="w-full min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-[8px] bg-[var(--win)] text-[var(--on-win)] font-semibold text-sm hover:opacity-95 active:scale-[0.97] transition-all duration-150 cursor-pointer"
            >
              Guardar partido
            </button>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="min-h-[44px] px-4 py-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm font-medium text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

