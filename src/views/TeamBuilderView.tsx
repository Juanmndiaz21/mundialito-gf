import React, { useMemo, useState } from "react";
import { useStore } from "../store/StoreContext";
import {
  generateTeamDraft,
  formatWhatsAppRoster,
  calculateParity,
  type BalancingCriteria,
  type TeamDraftResult,
} from "../domain/teamBuilder";
import { playerDorsal } from "../domain/format";
import { computePlayerStats } from "../domain/stats";
import { SolarIcon } from "../components/SolarIcon";
import { useViewChoreography } from "../components/MotionSystem";

export const TeamBuilderView: React.FC = () => {
  const { matches, players, setModal, showToast } = useStore();
  const viewRef = useViewChoreography<HTMLDivElement>([]);

  const stats = useMemo(
    () => computePlayerStats(matches, players, "mundialito"),
    [matches, players]
  );

  // Default selection: top 10 players by matches played
  const top10Ids = useMemo(() => {
    return stats.slice(0, 10).map((s) => s.id);
  }, [stats]);

  const [selectedIds, setSelectedIds] = useState<string[]>(top10Ids);
  const [criteria, setCriteria] = useState<BalancingCriteria>("wins");
  const [salt, setSalt] = useState<number>(0);
  const [selectedSwapA, setSelectedSwapA] = useState<string | null>(null);
  const [selectedSwapB, setSelectedSwapB] = useState<string | null>(null);
  const [manualSwaps, setManualSwaps] = useState<Record<string, "A" | "B">>({});

  // Generate base draft
  const baseDraft = useMemo(() => {
    return generateTeamDraft(selectedIds, matches, players, criteria, salt);
  }, [criteria, matches, players, salt, selectedIds]);

  // Apply any manual player swaps
  const draft = useMemo<TeamDraftResult>(() => {
    if (Object.keys(manualSwaps).length === 0) return baseDraft;

    const all = [...baseDraft.teamA.players, ...baseDraft.teamB.players];
    const newA = all.filter((p) => {
      const override = manualSwaps[p.id];
      if (override) return override === "A";
      return baseDraft.teamA.players.some((item) => item.id === p.id);
    });
    const newB = all.filter((p) => {
      const override = manualSwaps[p.id];
      if (override) return override === "B";
      return baseDraft.teamB.players.some((item) => item.id === p.id);
    });

    const squadA = {
      ...baseDraft.teamA,
      players: newA,
      totalWins: newA.reduce((acc, p) => acc + p.wins, 0),
      totalMatches: newA.reduce((acc, p) => acc + p.matchesPlayed, 0),
      avgWinRate:
        newA.length > 0
          ? Number(
              (
                newA.reduce((acc, p) => acc + p.winRate, 0) / newA.length
              ).toFixed(1)
            )
          : 0,
    };

    const squadB = {
      ...baseDraft.teamB,
      players: newB,
      totalWins: newB.reduce((acc, p) => acc + p.wins, 0),
      totalMatches: newB.reduce((acc, p) => acc + p.matchesPlayed, 0),
      avgWinRate:
        newB.length > 0
          ? Number(
              (
                newB.reduce((acc, p) => acc + p.winRate, 0) / newB.length
              ).toFixed(1)
            )
          : 0,
    };

    const { parityScore, diffWins, diffWinRate } = calculateParity(
      squadA,
      squadB
    );

    return {
      teamA: squadA,
      teamB: squadB,
      parityScore,
      diffWins,
      diffWinRate,
      criteria,
      unselectedPlayers: baseDraft.unselectedPlayers,
    };
  }, [baseDraft, criteria, manualSwaps]);

  const togglePlayerSelection = (id: string) => {
    setManualSwaps({});
    setSelectedSwapA(null);
    setSelectedSwapB(null);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectTop10 = () => {
    setManualSwaps({});
    setSelectedSwapA(null);
    setSelectedSwapB(null);
    setSelectedIds(top10Ids);
  };

  const handleClearAll = () => {
    setManualSwaps({});
    setSelectedSwapA(null);
    setSelectedSwapB(null);
    setSelectedIds([]);
  };

  const handleReroll = () => {
    setManualSwaps({});
    setSelectedSwapA(null);
    setSelectedSwapB(null);
    setSalt((s) => s + 1);
  };

  const handleSwapPlayer = (id: string, currentTeam: "A" | "B") => {
    if (currentTeam === "A") {
      if (selectedSwapA === id) {
        setSelectedSwapA(null);
      } else {
        setSelectedSwapA(id);
        if (selectedSwapB) {
          executeSwap(id, selectedSwapB);
        }
      }
    } else {
      if (selectedSwapB === id) {
        setSelectedSwapB(null);
      } else {
        setSelectedSwapB(id);
        if (selectedSwapA) {
          executeSwap(selectedSwapA, id);
        }
      }
    }
  };

  const executeSwap = (playerAId: string, playerBId: string) => {
    setManualSwaps((prev) => ({
      ...prev,
      [playerAId]: "B",
      [playerBId]: "A",
    }));
    setSelectedSwapA(null);
    setSelectedSwapB(null);
    showToast({
      message: "Jugadores intercambiados entre equipos.",
    });
  };

  const handleCopyWhatsApp = () => {
    const text = formatWhatsAppRoster(draft);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          showToast({
            message: "Formación copiada al portapapeles para WhatsApp.",
          });
        })
        .catch(() => {
          showToast({
            message: "Formación lista para WhatsApp.",
          });
        });
    } else {
      showToast({
        message: "Copiá la formación manualmente desde pantalla.",
      });
    }
  };

  const handleStartMatchWithTeam = (teamTag: "A" | "B") => {
    const chosenSquad = teamTag === "A" ? draft.teamA : draft.teamB;
    // Preload teammates
    setModal({
      kind: "add",
      defaultTournament: "mundialito",
    });
    showToast({
      message: `Cargando partido con los jugadores de ${chosenSquad.name}.`,
    });
  };

  return (
    <div ref={viewRef} className="flex flex-col gap-8 sm:gap-10">
      {/* 1. Header con estilo Match Center */}
      <section
        data-animate="hero"
        aria-labelledby="builder-hero-heading"
        className="espn-card p-5 sm:p-7 flex flex-col gap-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--espn-red-dark)]">
              <SolarIcon name="football" className="w-4 h-4 text-[var(--espn-red)]" />
              <span>Armador Táctico Oficial · Match Center</span>
            </div>
            <h1
              id="builder-hero-heading"
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--espn-red)] leading-none uppercase"
            >
              Creador de Equipos Equilibrados
            </h1>
            <p className="text-sm text-[var(--text-muted)] max-w-2xl">
              Seleccioná los jugadores que van a jugar la fecha y armá dos
              equipos con paridad matemática de partidos ganados o mezclá al
              azar para jugar sin ventajas.
            </p>
          </div>

          {/* Medidor de Paridad Deportivo */}
          <div
            id="team-parity-gauge"
            aria-label="Medidor de paridad deportiva"
            className="rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] p-4 flex flex-col items-center justify-center gap-1.5 self-start lg:self-auto min-w-[200px]"
          >
            <span className="text-xs uppercase font-semibold text-[var(--text-muted)]">
              Nivel de Paridad
            </span>
            <span
              className={`font-display text-4xl font-bold tabular-nums ${
                draft.parityScore >= 90
                  ? "text-[var(--win)]"
                  : draft.parityScore >= 75
                  ? "text-[var(--gold)]"
                  : "text-[var(--club-orange-bright)]"
              }`}
            >
              {draft.parityScore} %
            </span>
            <span className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums">
              Diferencia: {draft.diffWins}{" "}
              {draft.diffWins === 1 ? "victoria" : "victorias"}
            </span>
          </div>
        </div>

        {/* Barra de Controles y Criterio */}
        <div className="pt-4 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[var(--text)]">
              Modo de reparto:
            </span>
            <div
              role="group"
              aria-label="Criterio de armado"
              className="inline-flex rounded-[8px] bg-[var(--surface-2)] p-1 border border-[var(--line-strong)]"
            >
              <button
                type="button"
                aria-pressed={criteria === "wins"}
                onClick={() => {
                  setManualSwaps({});
                  setSelectedSwapA(null);
                  setSelectedSwapB(null);
                  setCriteria("wins");
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-[6px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  criteria === "wins"
                    ? "bg-[var(--win)] text-[var(--on-win)]"
                    : "text-[var(--text)] hover:text-[var(--win)]"
                }`}
              >
                <SolarIcon name="trophy" className="w-3.5 h-3.5" />
                <span>Equilibrado por Victorias (PG)</span>
              </button>
              <button
                type="button"
                aria-pressed={criteria === "random"}
                onClick={() => {
                  setManualSwaps({});
                  setSelectedSwapA(null);
                  setSelectedSwapB(null);
                  setCriteria("random");
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-[6px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  criteria === "random"
                    ? "bg-[var(--gold)] text-[var(--on-gold)]"
                    : "text-[var(--text)] hover:text-[var(--gold)]"
                }`}
              >
                <SolarIcon name="shuffle" className="w-3.5 h-3.5" />
                <span>Aleatorio (Random)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleReroll}
              className="min-h-[40px] px-3.5 py-1.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] hover:border-[var(--win)] text-xs font-semibold text-[var(--text)] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <SolarIcon name="restart" className="w-4 h-4 text-[var(--win)]" />
              <span>Re-sortear</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="club-btn-orange min-h-[42px] px-4 py-2 rounded-[8px] text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <SolarIcon name="copy" className="w-4 h-4" />
              <span>Copiar para WhatsApp</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Formación Táctica: Dos Equipos (Cancha en Paralelo) */}
      <section
        aria-label="Cancha de juego y alineaciones"
        className="espn-card p-5 sm:p-6 flex flex-col gap-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--line)]">
          <div className="club-section-header">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text)]">
              Alineaciones en Cancha (5 vs 5)
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Tocá un jugador en cada equipo para intercambiarlos de camiseta
              manualmente si alguien prefiere jugar en el otro bando.
            </p>
          </div>

          {(selectedSwapA || selectedSwapB) && (
            <div className="px-3 py-1.5 rounded-[6px] bg-[var(--club-orange-surface)] border border-[var(--club-orange)] text-[var(--club-orange-muted)] text-xs font-semibold inline-flex items-center gap-2">
              <SolarIcon name="shuffle" className="w-4 h-4 text-[var(--club-orange-bright)]" />
              <span>
                {selectedSwapA && !selectedSwapB && "Elegí jugador de Equipo Naranja para cambiar"}
                {!selectedSwapA && selectedSwapB && "Elegí jugador de Equipo Blanco para cambiar"}
                {selectedSwapA && selectedSwapB && "Listo para cambiar"}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* EQUIPO BLANCO */}
          <div
            className={`rounded-[10px] border-2 p-5 flex flex-col justify-between gap-4 transition-all duration-150 ${
              selectedSwapA
                ? "border-[var(--club-orange-bright)] bg-[var(--surface-2)]"
                : "border-zinc-300/40 bg-[var(--surface-2)]"
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-white border border-zinc-400" />
                  <span className="font-display text-2xl font-bold text-white tracking-wide">
                    {draft.teamA.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-[4px] bg-white/10 text-zinc-300 font-semibold">
                    {draft.teamA.players.length} jugadores
                  </span>
                </div>

                <div className="text-right font-mono-tech text-xs tabular-nums text-zinc-300">
                  <span className="text-[var(--win)] font-bold text-base">
                    {draft.teamA.totalWins} PG
                  </span>{" "}
                  · {draft.teamA.avgWinRate}% WR
                </div>
              </div>

              <ul className="divide-y divide-[var(--line)]">
                {draft.teamA.players.map((p) => {
                  const isSelectedForSwap = selectedSwapA === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        aria-label={`Intercambiar a ${p.name}`}
                        onClick={() => handleSwapPlayer(p.id, "A")}
                        className={`w-full text-left py-2.5 px-2 rounded-[6px] flex items-center justify-between gap-3 transition-colors duration-150 cursor-pointer ${
                          isSelectedForSwap
                            ? "bg-[var(--club-orange-surface)] text-[var(--club-orange-bright)] ring-1 ring-[var(--club-orange-bright)]"
                            : "hover:bg-white/5 text-[var(--text)]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono-tech text-xs px-1.5 py-0.5 rounded-[4px] bg-white text-zinc-950 font-bold tabular-nums">
                            #{playerDorsal(p.id)}
                          </span>
                          <span className="font-semibold text-sm">{p.name}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono-tech tabular-nums">
                          <span className="text-zinc-400">{p.matchesPlayed} PJ</span>
                          <span className="text-[var(--win)] font-bold">
                            {p.wins} PG
                          </span>
                          <span className="text-zinc-300">{p.winRate.toFixed(1)}%</span>
                          <span className="text-xs text-zinc-500 hover:text-[var(--club-orange-bright)]">
                            ⇄
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleStartMatchWithTeam("A")}
              className="min-h-[40px] px-3.5 py-2 rounded-[8px] bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-colors duration-150 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <SolarIcon name="plus" className="w-4 h-4 text-zinc-950" />
              <span>Cargar partido como Equipo Blanco</span>
            </button>
          </div>

          {/* EQUIPO NARANJA */}
          <div
            className={`rounded-[10px] border-2 p-5 flex flex-col justify-between gap-4 transition-all duration-150 ${
              selectedSwapB
                ? "border-[var(--club-orange-bright)] bg-[var(--surface-2)]"
                : "border-[var(--club-orange)]/60 bg-[var(--surface-2)]"
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[var(--club-orange-bright)] border border-orange-300" />
                  <span className="font-display text-2xl font-bold text-[var(--club-orange-bright)] tracking-wide">
                    {draft.teamB.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-[4px] bg-orange-500/10 text-orange-200 font-semibold">
                    {draft.teamB.players.length} jugadores
                  </span>
                </div>

                <div className="text-right font-mono-tech text-xs tabular-nums text-orange-200">
                  <span className="text-[var(--club-orange-bright)] font-bold text-base">
                    {draft.teamB.totalWins} PG
                  </span>{" "}
                  · {draft.teamB.avgWinRate}% WR
                </div>
              </div>

              <ul className="divide-y divide-[var(--line)]">
                {draft.teamB.players.map((p) => {
                  const isSelectedForSwap = selectedSwapB === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        aria-label={`Intercambiar a ${p.name}`}
                        onClick={() => handleSwapPlayer(p.id, "B")}
                        className={`w-full text-left py-2.5 px-2 rounded-[6px] flex items-center justify-between gap-3 transition-colors duration-150 cursor-pointer ${
                          isSelectedForSwap
                            ? "bg-[var(--club-orange-surface)] text-[var(--club-orange-bright)] ring-1 ring-[var(--club-orange-bright)]"
                            : "hover:bg-orange-500/5 text-[var(--text)]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono-tech text-xs px-1.5 py-0.5 rounded-[4px] bg-[var(--club-orange-bright)] text-white font-bold tabular-nums">
                            #{playerDorsal(p.id)}
                          </span>
                          <span className="font-semibold text-sm">{p.name}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono-tech tabular-nums">
                          <span className="text-zinc-400">{p.matchesPlayed} PJ</span>
                          <span className="text-[var(--club-orange-bright)] font-bold">
                            {p.wins} PG
                          </span>
                          <span className="text-zinc-300">{p.winRate.toFixed(1)}%</span>
                          <span className="text-xs text-zinc-500 hover:text-[var(--club-orange-bright)]">
                            ⇄
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleStartMatchWithTeam("B")}
              className="club-btn-orange min-h-[40px] px-3.5 py-2 rounded-[8px] text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <SolarIcon name="plus" className="w-4 h-4" />
              <span>Cargar partido como Equipo Naranja</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Selector de Convocados (Padrón de Jugadores Disponibles) */}
      <section
        aria-labelledby="roster-selector-heading"
        className="espn-card p-5 sm:p-6 flex flex-col gap-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--line)]">
          <div className="club-section-header">
            <h2
              id="roster-selector-heading"
              className="font-display text-2xl font-bold text-[var(--text)]"
            >
              Convocados para la Fecha ({selectedIds.length} jugadores seleccionados)
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Marcá quiénes vienen a jugar hoy. Para fútbol 5 se recomiendan 10
              jugadores (5 por equipo).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectTop10}
              className="min-h-[38px] px-3 py-1.5 rounded-[6px] bg-[var(--surface-2)] border border-[var(--line-strong)] hover:border-[var(--win)] text-xs font-semibold text-[var(--text)] cursor-pointer"
            >
              10 más habituales
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="min-h-[38px] px-3 py-1.5 rounded-[6px] bg-[var(--surface-2)] border border-[var(--line-strong)] hover:border-[var(--loss)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {stats.map((s) => {
            const isSelected = selectedIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => togglePlayerSelection(s.id)}
                className={`min-h-[44px] px-3 py-2 rounded-[8px] border text-left flex items-center justify-between gap-2 transition-colors duration-150 cursor-pointer ${
                  isSelected
                    ? "bg-[var(--win-surface)] border-[var(--win)] text-[var(--win-muted)] font-semibold"
                    : "bg-[var(--surface-2)] border-[var(--line-strong)] text-[var(--text)] hover:border-zinc-500"
                }`}
              >
                <div className="flex items-baseline gap-1.5 truncate">
                  <span className="font-mono-tech text-xs text-[var(--win)] font-bold">
                    #{playerDorsal(s.id)}
                  </span>
                  <span className="truncate text-sm">{s.name}</span>
                </div>
                <span className="font-mono-tech text-xs tabular-nums text-zinc-400 shrink-0">
                  {s.wins}V
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
