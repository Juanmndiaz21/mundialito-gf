import React, { useMemo, useState } from "react";
import { useStore } from "../store/StoreContext";
import { formatArs } from "../domain/format";
import { SolarIcon } from "./SolarIcon";

export type CompetitionFilter = "all" | "mundialito" | "mixto";
export type FeelingType = "en_racha" | "en_forma" | "regular" | "cansado" | "recuperacion";

interface FeelingConfigItem {
  label: string;
  badge: string;
  bg: string;
  text: string;
  border: string;
  description: string;
}

const FEELINGS: Record<FeelingType, FeelingConfigItem> = {
  en_racha: {
    label: "En racha",
    badge: "🔥",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/30",
    description: "Confianza máxima y racha goleadora positiva",
  },
  en_forma: {
    label: "En forma",
    badge: "💪",
    bg: "bg-green-500/10",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-500/30",
    description: "Buen ritmo físico y regularidad táctica",
  },
  regular: {
    label: "Regular",
    badge: "⚖️",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/30",
    description: "Rendimiento parejo con margen de mejora",
  },
  cansado: {
    label: "Cansado",
    badge: "🔋",
    bg: "bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-500/30",
    description: "Fatiga muscular acumulada de la semana",
  },
  recuperacion: {
    label: "En recuperación",
    badge: "🩹",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/30",
    description: "Regresando de molestia física o golpe",
  },
};

export const UserStatsDashboard: React.FC = () => {
  const { matches, activeUser, openRegistrationModal } = useStore();
  const [filter, setFilter] = useState<CompetitionFilter>("all");
  const [currentFeeling, setCurrentFeeling] = useState<FeelingType>("en_racha");

  // Filtrar partidos del usuario activo según categoría
  const userMatches = useMemo(() => {
    if (!activeUser) return [];
    const targetPlayerId = activeUser.linkedPlayerId;

    return matches.filter((m) => {
      // Filtrar por pertenencia del jugador
      const played = m.teamPlayers.includes(targetPlayerId);
      if (!played) return false;

      // Filtrar por competición
      if (filter === "all") return true;
      return m.tournamentType === filter;
    });
  }, [matches, activeUser, filter]);

  // Cálculos agregados
  const stats = useMemo(() => {
    const totalMatches = userMatches.length;
    let totalWins = 0;
    let totalDraws = 0;
    let totalLosses = 0;
    let totalSpent = 0;
    let totalGoals = 0;

    for (const m of userMatches) {
      if (m.result === "win") totalWins += 1;
      else if (m.result === "draw") totalDraws += 1;
      else totalLosses += 1;

      totalSpent += m.cost;
      if (typeof m.personalGoals === "number") {
        totalGoals += m.personalGoals;
      }
    }

    const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
    const avgGoals = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : "0.0";

    return {
      totalMatches,
      totalWins,
      totalDraws,
      totalLosses,
      totalSpent,
      totalGoals,
      winRate,
      avgGoals,
    };
  }, [userMatches]);

  // Si no hay usuario autenticado / seleccionado
  if (!activeUser) {
    return (
      <section
        aria-label="Panel de Métricas Personales"
        className="w-full bg-white rounded-2xl border border-gray-100 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-[var(--espn-red)]/10 text-[var(--espn-red)] flex items-center justify-center shrink-0">
              <SolarIcon name="userId" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-black text-gray-900 uppercase">
                Métricas Personales de Jugador
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Reclamá tu dorsal o iniciá sesión para ver tu inversión en cancha, goles y estado físico.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openRegistrationModal(null)}
            className="min-h-[44px] px-6 py-2.5 rounded-full bg-[var(--espn-red)] hover:bg-[var(--espn-red-hover)] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            Reclamar mi dorsal
          </button>
        </div>
      </section>
    );
  }

  const activeFeelingConfig = FEELINGS[currentFeeling];

  return (
    <section
      aria-label={`Métricas personales de ${activeUser.displayName}`}
      className="w-full bg-white rounded-2xl border border-gray-100 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] p-6 sm:p-8 flex flex-col gap-6"
    >
      {/* Cabecera del Usuario con Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[var(--espn-red)] text-white flex flex-col items-center justify-center font-display font-black text-sm shrink-0 shadow-sm">
            <span>#{String(activeUser.dorsal).padStart(2, "0")}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">
                {activeUser.displayName}
              </h2>
              <span className="text-xs font-mono-tech text-gray-400 font-bold">
                {activeUser.handle}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono-tech">
                {activeUser.position}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Panel táctico personal y telemetría de rendimiento acumulado
            </p>
          </div>
        </div>

        {/* Segmentación por competición */}
        <div
          role="tablist"
          aria-label="Filtrar estadísticas por torneo"
          className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl self-start md:self-auto"
        >
          {[
            { id: "all", label: "General" },
            { id: "mundialito", label: "Mundialito" },
            { id: "mixto", label: "Mixto" },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id as CompetitionFilter)}
                className={`min-h-[36px] px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de 4 KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Feeling / Rendimiento Percibido */}
        <div className="bg-[#f8f9fa] rounded-xl border border-gray-200/70 p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono-tech">
              Feeling Actual
            </span>
            <span className="text-base">{activeFeelingConfig.badge}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${activeFeelingConfig.bg} ${activeFeelingConfig.text} ${activeFeelingConfig.border}`}
              >
                <span>{activeFeelingConfig.badge}</span>
                <span>{activeFeelingConfig.label}</span>
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 leading-snug">
              {activeFeelingConfig.description}
            </p>
          </div>

          {/* Selector interactivo de Feeling */}
          <div className="pt-2 border-t border-gray-200/50 flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-mono-tech uppercase mr-1">Cambiar:</span>
            {(["en_racha", "en_forma", "regular", "cansado", "recuperacion"] as FeelingType[]).map((f) => (
              <button
                key={f}
                type="button"
                title={FEELINGS[f].label}
                onClick={() => setCurrentFeeling(f)}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition-transform cursor-pointer ${
                  currentFeeling === f ? "scale-115 bg-white shadow-xs border border-gray-300" : "opacity-60 hover:opacity-100"
                }`}
              >
                {FEELINGS[f].badge}
              </button>
            ))}
          </div>
        </div>

        {/* KPI 2: Inversión en Cancha */}
        <div className="bg-[#f8f9fa] rounded-xl border border-gray-200/70 p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono-tech">
              Inversión en Cancha
            </span>
            <span className="text-base text-emerald-600 font-bold">$</span>
          </div>
          <div>
            <span className="font-display font-black text-2xl sm:text-3xl text-gray-900 tracking-tight font-mono-tech">
              {formatArs(stats.totalSpent)}
            </span>
            <p className="text-[11px] text-gray-500 mt-1">
              Gasto total en cuotas de alquiler
            </p>
          </div>
          <div className="text-[11px] font-mono-tech text-gray-400">
            {stats.totalMatches > 0
              ? `Promedio: ${formatArs(stats.totalSpent / stats.totalMatches)} / cotejo`
              : "Sin gastos"}
          </div>
        </div>

        {/* KPI 3: Partidos Computados */}
        <div className="bg-[#f8f9fa] rounded-xl border border-gray-200/70 p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono-tech">
              Partidos Jugados
            </span>
            <SolarIcon name="matches" className="w-4 h-4 text-[var(--espn-red)]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl sm:text-4xl text-[var(--espn-red)] leading-none">
                {stats.totalMatches}
              </span>
              <span className="text-xs text-gray-500 font-mono-tech">
                ({stats.totalWins}V · {stats.totalDraws}E · {stats.totalLosses}D)
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Efectividad oficial: <strong className="text-gray-800">{stats.winRate.toFixed(1)}%</strong>
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[var(--espn-red)] h-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, stats.winRate))}%` }}
            />
          </div>
        </div>

        {/* KPI 4: Goles Personales Anotados */}
        <div className="bg-[#f8f9fa] rounded-xl border border-gray-200/70 p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono-tech">
              Goles Anotados
            </span>
            <SolarIcon name="football" className="w-4 h-4 text-gray-700" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl sm:text-4xl text-gray-900 leading-none">
                {stats.totalGoals}
              </span>
              <span className="text-xs text-gray-500 font-mono-tech">tantos</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Promedio de gol: <strong className="text-gray-800">{stats.avgGoals}</strong> por partido
            </p>
          </div>
          <div className="text-[11px] font-mono-tech text-gray-400">
            {stats.totalGoals > 0 ? "Aporte ofensivo regular" : "Rol defensivo / arquero"}
          </div>
        </div>

      </div>
    </section>
  );
};

