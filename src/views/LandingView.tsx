import React, { useMemo, useState } from "react";
import { useStore } from "../store/StoreContext";
import { computeMetrics } from "../domain/stats";
import { winsNeededForTitle } from "../domain/campaigns";
import {
  computeChampionsLeaderboard,
} from "../domain/leaderboard";
import { formatArs, formatPct, PHASE_LABELS } from "../domain/format";
import { SplitHeading } from "../components/SplitHeading";
import { TacticalPitchCanvas } from "../components/TacticalPitchCanvas";
import { ChampionsLeaderboardSection } from "../components/ChampionsLeaderboardSection";
import { SolarIcon } from "../components/SolarIcon";
import { useViewChoreography } from "../components/MotionSystem";
import { Spotlight } from "../components/ui/Spotlight";
import { CardSpotlight } from "../components/ui/CardSpotlight";
import { BlurText } from "../components/ui/BlurText";
import { CountUp } from "../components/ui/CountUp";
import { Magnet } from "../components/ui/Magnet";
import { AnimatedGroup } from "../components/ui/AnimatedGroup";
import { InView } from "../components/ui/InView";
import { LatestResultsShowcase } from "../components/LatestResultsShowcase";

interface FaqItem {
  question: string;
  answer: string;
}

type NewsTab = "hot" | "mundial" | "mixto" | "tactica";

interface NewsItemContent {
  sub: string;
  title: string;
  desc: string;
}

const NEWS_DATA: Record<NewsTab, NewsItemContent> = {
  mundial: {
    sub: "Esta semana · MUNDIALITO",
    title: "Estadísticas oficiales y fixture en vivo del club",
    desc: "Toda la información del torneo, tablas de posiciones y rendimientos se actualizan automáticamente en cada jornada.",
  },
  hot: {
    sub: "En vivo · TENDENCIA DEL CLUB",
    title: "Definición de grupos al rojo vivo: un solo pasaje a Octavos",
    desc: "La última fecha de fase clasificatoria dejó 3 equipos empatados en diferencia de gol con definición por desempate olímpico.",
  },
  mixto: {
    sub: "Domingos · TORNEO MIXTO",
    title: "Planilla de marcadores completos y cálculo de efectividad",
    desc: "Noche de goles y empates vibrantes: 11 a 11 en cancha 1 y victoria agónica por la mínima en el cierre de la jornada.",
  },
  tactica: {
    sub: "Laboratorio F5 · RENDIMIENTO",
    title: "Química de duplas: Talismán y Mufa al descubierto",
    desc: "El balance matemático detecta qué parejas potencian el porcentaje de victorias colectivas por encima del 75 %.",
  },
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "¿Cómo se suma una estrella en el Leaderboard de Campeones?",
    answer:
      "Cada Mundialito exige superar la Fase de grupos (2 victorias antes de sumar 2 derrotas) y ganar 4 cruces directos consecutivos: Octavos, Cuartos, Semifinal y Final. Cuando se gana la Final, todos los compañeros que integraron esa campaña suman una estrella oficial en el Leaderboard.",
  },
  {
    question:
      "¿Por qué conviene reclamar mi dorsal ahora si el registro obligatorio llega más adelante?",
    answer:
      "Al reclamar tu dorsal hoy, tu @usuario, número de camiseta, posición y correo quedan vinculados al ID histórico de tus partidos del Excel. Cuando se active el inicio de sesión con Magic Link, entrás con tu correo y conservás todas tus copas, goles y porcentaje sin migraciones manuales.",
  },
  {
    question:
      "¿Puedo vincular mi cuenta con los partidos que ya jugué en la planilla?",
    answer:
      "Sí. Al abrir el registro podés elegir 'Reclamar jugador del Excel' y seleccionar tu nombre entre los 30 jugadores cargados. Tu pasaporte absorbe al instante todos tus partidos en Fútbol 2026 y Torneo Mixto.",
  },
  {
    question: "¿Qué pasa cuando perdemos un partido de eliminación directa?",
    answer:
      "En Octavos, Cuartos, Semifinal o Final no hay margen de error: una derrota cierra esa campaña como eliminada (o subcampeona si fue en la Final) y el partido siguiente abre automáticamente el próximo Mundialito desde Fase de grupos.",
  },
  {
    question: "¿Por qué Talismán y Mufa piden al menos 4 partidos compartidos?",
    answer:
      "Un único triunfo o una sola derrota distorsiona cualquier tabla con 100 % o 0 %. El umbral mínimo de 4 partidos jugados juntos garantiza que las insignias reflejen química real en cancha.",
  },
  {
    question: "¿Dónde se guardan los datos y cómo los respaldamos entre amigos?",
    answer:
      "Todos los partidos y pasaportes se guardan en el almacenamiento local del navegador y funcionan incluso sin conexión. Desde el pie de Inicio podés exportar e importar un archivo JSON completo en un clic para compartir la base actualizada por WhatsApp.",
  },
];

export const LandingView: React.FC = () => {
  const {
    matches,
    players,
    campaigns,
    registeredUsers,
    activeUser,
    navigate,
    openRegistrationModal,
    setOpenMatchId,
  } = useStore();

  const viewRef = useViewChoreography<HTMLDivElement>([]);
  const [activeNewsTab, setActiveNewsTab] = useState<NewsTab>("mundial");

  const userMatches = useMemo(() => {
    if (!activeUser?.linkedPlayerId) return matches;
    return matches.filter((m) =>
      m.teamPlayers.includes(activeUser.linkedPlayerId)
    );
  }, [matches, activeUser]);

  const metricsAll = useMemo(
    () =>
      computeMetrics(
        activeUser ? userMatches : matches,
        "all",
        activeUser?.linkedPlayerId
      ),
    [matches, activeUser, userMatches]
  );

  const activeCampaign = useMemo(() => {
    const last = campaigns[campaigns.length - 1];
    return last && last.status === "active" ? last : null;
  }, [campaigns]);

  const leaderboard = useMemo(
    () =>
      computeChampionsLeaderboard(
        matches,
        players,
        campaigns,
        registeredUsers,
        "palmares_total"
      ),
    [campaigns, matches, players, registeredUsers]
  );

  const activePassportEntry = useMemo(() => {
    if (activeUser) {
      const found = leaderboard.find(
        (e) => e.playerId === activeUser.linkedPlayerId
      );
      if (found) return found;
    }
    return leaderboard[0] ?? null;
  }, [activeUser, leaderboard]);

  const winsToTitle = winsNeededForTitle(activeCampaign ?? undefined);
  const nextCampaignNumber = activeCampaign
    ? activeCampaign.index
    : campaigns.length + 1;
  const nextPhaseLabel =
    activeCampaign && activeCampaign.nextPhase
      ? PHASE_LABELS[activeCampaign.nextPhase]
      : "Fase de grupos";

  const recentMatches = useMemo(() => matches.slice(-3).reverse(), [matches]);

  return (
    <div ref={viewRef} className="flex flex-col gap-10 sm:gap-14 pb-10">
      {/* 1. HERO SECTION EDITORIAL (Soccer Club Match Center Style) */}
      <section
        data-animate="hero"
        aria-labelledby="landing-hero-heading"
        className="espn-card p-6 sm:p-8 lg:p-10 flex flex-col gap-8 relative overflow-hidden"
      >
        {/* Aceternity UI Spotlight: Stadium Floodlight Beam */}
        <Spotlight
          className="-top-36 left-0 md:left-48 md:-top-24 opacity-80"
          fill="#E53935"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
          {/* Lado izquierdo: Cutout Atleta sobre fondo Estadio B&W + Canvas Táctico */}
          <div className="lg:col-span-5 flex flex-col gap-4 order-2 lg:order-1">
            <div className="relative rounded-2xl bg-[#111827] border border-gray-200 p-5 overflow-hidden shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] flex flex-col justify-between min-h-[340px]">
              {/* Estadio de fondo con patrón deportivo */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"
              />

              {/* Badge flotante de torneo */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="badge-hot shadow-xs">
                  EN CURSO · MUNDIAL {nextCampaignNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-mono-tech tabular-nums">
                  {nextPhaseLabel}
                </span>
              </div>

              {/* Canvas Táctico de Cancha de Fútbol */}
              <div className="relative z-10 my-auto py-2">
                <TacticalPitchCanvas
                  nextPhase={activeCampaign?.nextPhase ?? "group"}
                  campaignIndex={nextCampaignNumber}
                  winsToTitle={winsToTitle}
                />
              </div>

              {/* Indicador de slider en esquina inferior izquierda (3 dots) + dorsal activo */}
              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
                <div className="flex items-center gap-1.5" aria-label="Indicador de carrusel">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--espn-red)]" />
                  <span className="w-2 h-2 rounded-full bg-white/30" />
                  <span className="w-2 h-2 rounded-full bg-white/30" />
                </div>

                {activePassportEntry && (
                  <span className="font-mono-tech font-bold text-white flex items-center gap-1">
                    <span className="text-[var(--gold)]">★</span>
                    <span>#{activePassportEntry.dorsal} {activePassportEntry.name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Lado derecho: Titular apilado en rojo + Bajada + Acciones */}
          <div className="lg:col-span-7 flex flex-col gap-5 order-1 lg:order-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-[4px] bg-[var(--espn-red)] text-white text-[11px] font-black uppercase tracking-widest">
                TEMPORADA 2026
              </span>
              <BlurText
                text="MATCH CENTER DE FÚTBOL 5"
                delay={40}
                className="text-xs font-bold uppercase tracking-wider text-[var(--espn-red-dark)]"
              />
            </div>

            <SplitHeading
              as="h1"
              id="landing-hero-heading"
              text="Convertí el fútbol 5 de los jueves en tu propio Mundialito"
              className="stacked-heading text-4xl sm:text-5xl lg:text-[54px] font-black text-[var(--espn-red)] tracking-tight leading-[1.05]"
            />

            <p className="text-base sm:text-lg text-[var(--text-body)] leading-relaxed max-w-xl">
              Anotá cada partido en 20 segundos, avanzá desde Fase de grupos
              hasta la Final y competí por las estrellas del Leaderboard de
              Campeones con tu dorsal verificado.
            </p>

            <div className="flex items-center gap-3 flex-wrap pt-2">
              <Magnet>
                <button
                  type="button"
                  onClick={() => openRegistrationModal(null)}
                  className="btn-espn-solid inline-flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <SolarIcon name="userId" className="w-4 h-4 text-white" />
                  <span>Reclamar mi dorsal</span>
                </button>
              </Magnet>

              <Magnet>
                <a
                  href="#/torneo"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/torneo");
                  }}
                  className="btn-espn-ghost inline-flex items-center gap-2"
                >
                  <span>Ver Torneo y Camino</span>
                  <span className="font-mono">→</span>
                </a>
              </Magnet>

              <Magnet>
                <a
                  href="#/equipos"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/equipos");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] text-sm font-bold text-[var(--text)] hover:border-[var(--espn-red)] transition-colors"
                >
                  <SolarIcon name="usersGroup" className="w-4 h-4 text-[var(--espn-red)]" />
                  <span>Armar Equipos</span>
                </a>
              </Magnet>
            </div>

            {/* Fila de 3 tarjetas flotantes destacadas con Aceternity CardSpotlight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <CardSpotlight
                radius={200}
                color="rgba(229, 57, 53, 0.12)"
                className="rounded-xl p-3.5 bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--espn-red)] transition-colors shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
              >
                <a
                  href="#/torneo"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/torneo");
                  }}
                  className="flex flex-col justify-between gap-1 h-full cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Próximo Cruce
                    </span>
                    <span className="text-xs text-[var(--espn-red)] group-hover:translate-x-0.5 transition-transform font-mono">→</span>
                  </div>
                  <span className="font-display text-xl font-bold text-[var(--espn-red)] leading-tight">
                    {nextPhaseLabel}
                  </span>
                  <span className="text-xs text-gray-500 font-mono-tech">
                    Mundial #{nextCampaignNumber} · Ver Torneo
                  </span>
                </a>
              </CardSpotlight>

              <CardSpotlight
                radius={200}
                color="rgba(229, 57, 53, 0.12)"
                className="rounded-xl p-3.5 bg-[var(--surface-2)] border border-[var(--line)] flex flex-col justify-between gap-1 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {activeUser ? `Goles de ${activeUser.displayName}` : "Goles Individuales"}
                </span>
                <span className="font-display text-xl font-bold text-[var(--text)] leading-tight">
                  <CountUp to={metricsAll.totalGoals} duration={1.2} suffix=" tantos" />
                </span>
                <span className="text-xs text-gray-500 font-mono-tech">
                  Récord: {metricsAll.maxGoalsInMatch} en una noche
                </span>
              </CardSpotlight>

              <CardSpotlight
                radius={200}
                color="rgba(234, 179, 8, 0.15)"
                className="rounded-xl p-3.5 bg-[var(--surface-2)] border border-[var(--line)] flex flex-col justify-between gap-1 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Líder de Copas
                </span>
                {leaderboard.length > 0 && leaderboard[0].totalTitles > 0 ? (
                  <>
                    <span className="font-display text-xl font-bold text-[var(--gold)] leading-tight flex items-center gap-1">
                      <span>{leaderboard[0].name}</span>
                      <span>{"★".repeat(Math.min(leaderboard[0].totalTitles, 5))}</span>
                    </span>
                    <span className="text-xs text-gray-500 font-mono-tech">
                      {formatPct(leaderboard[0].winRate, 1)} Win Rate
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-display text-lg font-bold text-[var(--text-muted)] leading-tight">
                      Aún sin definir
                    </span>
                    <span className="text-xs text-gray-500 font-mono-tech">
                      0 copas disputadas
                    </span>
                  </>
                )}
              </CardSpotlight>
            </div>
          </div>
        </div>

        {/* Cinta métrica de auditoría con React Bits CountUp */}
        <dl
          aria-label="Métricas reales auditadas del club"
          className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)] border-t border-[var(--line)] pt-5 mt-2 relative z-10"
        >
          <div className="py-2 sm:py-0 sm:pr-5">
            <dt className="text-xs text-[var(--text-muted)]">
              Partidos computados
            </dt>
            <dd className="font-display text-3xl font-bold tabular-nums text-[var(--text)] mt-0.5">
              <CountUp to={metricsAll.totalMatches} duration={1.1} />
            </dd>
            <dd className="font-mono-tech text-xs text-[var(--win)] tabular-nums">
              En curso: {nextPhaseLabel} (M{nextCampaignNumber})
            </dd>
          </div>

          <div className="py-2 sm:py-0 sm:px-5">
            <dt className="text-xs text-[var(--text-muted)]">
              {activeUser ? `Goles de ${activeUser.displayName}` : "Goles individuales anotados"}
            </dt>
            <dd className="font-display text-3xl font-bold tabular-nums text-[var(--win)] mt-0.5">
              <CountUp to={metricsAll.totalGoals} duration={1.3} />
            </dd>
            <dd className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums">
              Récord de {metricsAll.maxGoalsInMatch} en una noche
            </dd>
          </div>

          <div className="py-2 sm:py-0 sm:px-5">
            <dt className="text-xs text-[var(--text-muted)]">
              Jugadores en padrón
            </dt>
            <dd className="font-display text-3xl font-bold tabular-nums text-[var(--gold)] mt-0.5">
              <CountUp to={players.length} duration={1.1} />
            </dd>
            <dd className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums">
              {registeredUsers.length} cuentas ya vinculadas
            </dd>
          </div>

          <div className="py-2 sm:py-0 sm:pl-5">
            <dt className="text-xs text-[var(--text-muted)]">
              Inversión en cancha
            </dt>
            <dd className="font-display text-3xl font-bold tabular-nums text-[var(--text)] mt-0.5">
              <CountUp
                to={metricsAll.totalSpent}
                prefix="$ "
                thousandSeparator="."
                duration={1.4}
              />
            </dd>
            <dd className="font-mono-tech text-xs text-[var(--text-muted)] tabular-nums">
              Promedio {formatArs(metricsAll.avgCost)} x fecha
            </dd>
          </div>
        </dl>
      </section>

      {/* 2. 4 TARJETAS INSTITUCIONALES SOCCER CLUB con Aceternity CardSpotlight */}
      <section aria-label="Secciones destacadas del Club" className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F1F]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] font-mono-tech">
              SERVICIOS & ESTRUCTURA DEL CLUB
            </span>
          </div>

          <div className="flex items-center gap-1.5" aria-label="Controles de navegación de secciones">
            <button
              type="button"
              aria-label="Sección anterior"
              className="w-8 h-8 rounded-lg bg-[#2B2C2D] border border-white/10 text-white flex items-center justify-center hover:bg-[#FF5F1F] transition-colors cursor-pointer text-xs"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Sección siguiente"
              className="w-8 h-8 rounded-lg bg-[#2B2C2D] border border-white/10 text-white flex items-center justify-center hover:bg-[#FF5F1F] transition-colors cursor-pointer text-xs"
            >
              →
            </button>
          </div>
        </div>

        <AnimatedGroup
          preset="slide"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          {/* Card 1: Nuestro Equipo (Our Team) */}
          <CardSpotlight
            radius={220}
            color="rgba(255, 95, 31, 0.16)"
            className="rounded-2xl bg-[#1D2125] border border-white/10 p-6 flex flex-col justify-between items-center text-center gap-5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] hover:border-[#FF5F1F]/40 transition-colors group"
          >
            <div className="flex flex-col items-center gap-3 relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-gray-100 to-gray-400 p-0.5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                ⚽
              </div>
              <h3 className="font-display text-xl font-bold text-white tracking-wide uppercase">
                Plantel del Club
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed max-w-xs">
                Plantel histórico de {players.length} jugadores con dorsales oficiales del #01 al #30 y registro de convocatorias por fecha.
              </p>
            </div>

            <Magnet>
              <a
                href="#/feeling"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/feeling");
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FF5F1F] hover:bg-[#E54D0E] text-white text-xs font-bold uppercase tracking-wider shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] transition-all cursor-pointer"
              >
                <span>Detalles</span>
                <span className="font-mono">→</span>
              </a>
            </Magnet>
          </CardSpotlight>

          {/* Card 2: Palmarés y Copas (Awards) */}
          <CardSpotlight
            radius={220}
            color="rgba(234, 179, 8, 0.18)"
            className="rounded-2xl bg-[#1D2125] border border-white/10 p-6 flex flex-col justify-between items-center text-center gap-5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] hover:border-amber-400/40 transition-colors group"
          >
            <div className="flex flex-col items-center gap-3 relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-200 to-amber-500 p-0.5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                🏆
              </div>
              <h3 className="font-display text-xl font-bold text-white tracking-wide uppercase">
                Palmarés y Copas
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed max-w-xs">
                Leaderboard oficial por copas levantadas, finales disputadas y estrellas consagradas en cada Mundialito.
              </p>
            </div>

            <Magnet>
              <a
                href="#/campeones"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/campeones");
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FF5F1F] hover:bg-[#E54D0E] text-white text-xs font-bold uppercase tracking-wider shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] transition-all cursor-pointer"
              >
                <span>Detalles</span>
                <span className="font-mono">→</span>
              </a>
            </Magnet>
          </CardSpotlight>

          {/* Card 3: Dirección Técnica (Coaches) */}
          <CardSpotlight
            radius={220}
            color="rgba(34, 197, 94, 0.16)"
            className="rounded-2xl bg-[#1D2125] border border-white/10 p-6 flex flex-col justify-between items-center text-center gap-5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] hover:border-emerald-400/40 transition-colors group"
          >
            <div className="flex flex-col items-center gap-3 relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-slate-200 to-slate-400 p-0.5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                📋
              </div>
              <h3 className="font-display text-xl font-bold text-white tracking-wide uppercase">
                Táctica y Duplas
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed max-w-xs">
                Medición de química colectiva: Talismán y Mufa para duplas con al menos 4 partidos compartidos en cancha.
              </p>
            </div>

            <Magnet>
              <a
                href="#/feeling"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/feeling");
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FF5F1F] hover:bg-[#E54D0E] text-white text-xs font-bold uppercase tracking-wider shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] transition-all cursor-pointer"
              >
                <span>Detalles</span>
                <span className="font-mono">→</span>
              </a>
            </Magnet>
          </CardSpotlight>

          {/* Card 4: Reglamento (Rules) */}
          <CardSpotlight
            radius={220}
            color="rgba(239, 68, 68, 0.16)"
            className="rounded-2xl bg-[#1D2125] border border-white/10 p-6 flex flex-col justify-between items-center text-center gap-5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] hover:border-red-400/40 transition-colors group"
          >
            <div className="flex flex-col items-center gap-3 relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-red-400 to-amber-400 p-0.5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                🟨🟥
              </div>
              <h3 className="font-display text-xl font-bold text-white tracking-wide uppercase">
                Reglamento
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed max-w-xs">
                Formato de 5 fases eliminatorias: Grupos (2 triunfos), Octavos, Cuartos, Semifinal y la Gran Final.
              </p>
            </div>

            <Magnet>
              <a
                href="#/torneo"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/torneo");
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FF5F1F] hover:bg-[#E54D0E] text-white text-xs font-bold uppercase tracking-wider shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] transition-all cursor-pointer"
              >
                <span>Detalles</span>
                <span className="font-mono">→</span>
              </a>
            </Magnet>
          </CardSpotlight>
        </AnimatedGroup>
      </section>

      {/* LATEST RESULTS SHOWCASE (ÚLTIMO PARTIDO CARGADO) */}
      <LatestResultsShowcase
        latestMatch={matches[matches.length - 1]}
        onNavigateToMatches={() => navigate("/partidos")}
      />

      {/* 4. MATCH SCHEDULE (Franja Roja #E53935) */}
      <section
        aria-label="Match Schedule oficial"
        className="espn-schedule-banner text-white rounded-2xl p-6 sm:p-10 shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Lado izquierdo: Título apilado blanco (1/4 - 4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-5">
            <div className="flex flex-col leading-none">
              <span className="stacked-heading text-4xl sm:text-5xl font-black text-white/90">
                MATCH
              </span>
              <span className="stacked-heading text-4xl sm:text-5xl font-black text-white">
                SCHEDULE
              </span>
            </div>

            <p className="text-sm text-white/90 leading-relaxed">
              El calendario deportivo oficial de la temporada. Resultados
              cerrados, marcadores oficiales y el próximo cruce decisivo camino a
              la Copa.
            </p>

            <div>
              <a
                href="#/partidos"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/partidos");
                }}
                className="btn-espn-ghost-white inline-flex items-center gap-2"
              >
                <span>More Partidos</span>
                <span className="font-mono">→</span>
              </a>
            </div>
          </div>

          {/* Lado derecho: Grid de 3 tarjetas de partido en blanco puro con Motion Primitives AnimatedGroup */}
          <AnimatedGroup
            preset="slide"
            className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {recentMatches.map((m) => {
              const phaseName =
                m.phase !== null ? PHASE_LABELS[m.phase] : "Amistoso";
              const isWin = m.result === "win";
              const isLoss = m.result === "loss";

              return (
                <div
                  key={m.id}
                  className="bg-white text-[#111827] rounded-2xl p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] border border-gray-100 flex flex-col justify-between gap-4 hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] transition-all duration-200"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[var(--espn-red-light)] border border-[var(--espn-red)] flex items-center justify-center text-[var(--espn-red-dark)] font-bold text-xs font-mono-tech">
                        F5
                      </span>
                      <span className="text-xs font-bold text-gray-500 font-mono-tech uppercase">
                        VS
                      </span>
                      <span className="w-7 h-7 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs font-mono-tech">
                        RV
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase font-mono-tech ${
                        isWin
                          ? "bg-[var(--win-surface)] text-[var(--win)]"
                          : isLoss
                          ? "bg-[var(--loss-surface)] text-[var(--loss)]"
                          : "bg-[var(--draw-surface)] text-[var(--draw)]"
                      }`}
                    >
                      {isWin ? "Victoria" : isLoss ? "Derrota" : "Empate"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="font-display text-lg font-bold text-[#111827] leading-tight">
                      {m.tournamentType === "mundialito" ? "Fulbo" : "Mixto"} #{m.matchNumber} · {phaseName}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {m.tournamentType === "mundialito"
                        ? "Fútbol 2026 · Mundialito"
                        : "Torneo Mixto de Domingos"}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono-tech mt-1">
                      Cancha El Templo · {m.date}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setOpenMatchId(m.id)}
                      className="btn-preview-circle cursor-pointer"
                    >
                      <span>Preview</span>
                      <span className="circle-arrow">→</span>
                    </button>

                    <span className="font-mono-tech text-xs text-gray-400">
                      {m.personalGoals} goles
                    </span>
                  </div>
                </div>
              );
            })}
          </AnimatedGroup>
        </div>
      </section>

      {/* 5. MÓDULO EDITORIAL SOCCER CLUB EN 3 COLUMNAS (Bienvenidos al Club, Últimas Novedades, Qué Hacemos) */}
      <section
        aria-label="Información institucional y novedades del Club"
        className="rounded-2xl bg-[#181A1D] border border-white/10 p-6 sm:p-8 lg:p-10 text-white flex flex-col gap-8 shadow-xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          {/* Columna 1: BIENVENIDOS AL CLUB (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
                Bienvenidos al Club
              </h2>
              <div className="w-12 h-1 bg-[var(--espn-red)] rounded-full" />
            </div>

            {/* 2 Miniaturas lado a lado como en la referencia */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[#1E293B]/70 to-[#0F172A]/90 border border-white/10 p-3 flex flex-col justify-between group overflow-hidden relative shadow-sm">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-purple-950/20 pointer-events-none"
                />
                <span className="relative z-10 text-[10px] font-mono-tech px-2 py-0.5 rounded-full bg-black/60 text-white self-start">
                  ARQUERO
                </span>
                <div className="relative z-10 flex items-center justify-center text-3xl my-auto drop-shadow-md">
                  🧤
                </div>
                <span className="relative z-10 text-[11px] font-bold text-gray-200">
                  Defensa bajo los tres palos
                </span>
              </div>

              <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-[#1E293B]/70 to-[#0F172A]/90 border border-white/10 p-3 flex flex-col justify-between group overflow-hidden relative shadow-sm">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-blue-950/20 pointer-events-none"
                />
                <span className="relative z-10 text-[10px] font-mono-tech px-2 py-0.5 rounded-full bg-black/60 text-white self-start">
                  CÉSPED
                </span>
                <div className="relative z-10 flex items-center justify-center text-3xl my-auto drop-shadow-md">
                  ⚽
                </div>
                <span className="relative z-10 text-[11px] font-bold text-gray-200">
                  Fútbol 5 con ritmo nocturno
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed pt-1">
              <strong className="text-white">Somos el match center definitivo para el fútbol entre amigos.</strong> Cada jueves y domingo transformamos el partido semanal en una experiencia de transmisión profesional con estadísticas oficiales, tabla de goleadores y coronas de copa.
            </p>

            <div className="pt-1">
              <a
                href="#/torneo"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/torneo");
                }}
                className="text-xs text-[var(--espn-red)] hover:underline font-bold inline-flex items-center gap-1 font-mono-tech"
              >
                <span>Leer más sobre el torneo</span>
                <span>→</span>
              </a>
            </div>
          </div>

          {/* Columna 2: ÚLTIMAS NOVEDADES (4 cols) */}
          <div className="lg:col-span-4 lg:pl-8 flex flex-col gap-4 pt-6 lg:pt-0">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
                Últimas Novedades
              </h2>
              <div className="w-12 h-1 bg-[var(--espn-red)] rounded-full" />
            </div>

            {/* Pestañas de categoría segmentadas */}
            <div
              role="tablist"
              aria-label="Categorías de novedades"
              className="flex items-center gap-1.5 flex-wrap pt-1"
            >
              {(
                [
                  { id: "hot", label: "HOT" },
                  { id: "mundial", label: "MUNDIAL" },
                  { id: "mixto", label: "MIXTO" },
                  { id: "tactica", label: "TÁCTICA" },
                ] as const
              ).map((tab) => {
                const isActive = activeNewsTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveNewsTab(tab.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-mono-tech font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[var(--espn-red)] text-white shadow-xs"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Contenido interactivo según pestaña seleccionada */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-[11px] font-mono-tech text-gray-400 uppercase tracking-wider">
                {NEWS_DATA[activeNewsTab].sub}
              </span>
              <h3 className="font-display text-base sm:text-lg font-bold text-[var(--espn-red)] leading-snug">
                {NEWS_DATA[activeNewsTab].title}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                {NEWS_DATA[activeNewsTab].desc}
              </p>
            </div>

            <div className="pt-2">
              <a
                href="#/partidos"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/partidos");
                }}
                className="text-xs text-gray-300 hover:text-[var(--espn-red)] font-bold inline-flex items-center gap-1 font-mono-tech"
              >
                <span>Archivo de novedades</span>
                <span>→</span>
              </a>
            </div>
          </div>

          {/* Columna 3: QUÉ HACEMOS (4 cols) */}
          <div className="lg:col-span-4 lg:pl-8 flex flex-col gap-4 pt-6 lg:pt-0">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
                Qué Hacemos
              </h2>
              <div className="w-12 h-1 bg-[var(--espn-red)] rounded-full" />
            </div>

            <div className="flex flex-col gap-3.5 pt-1">
              {[
                {
                  icon: "🏆",
                  title: "Mundialito de 5 Fases",
                  desc: "Grupos, Octavos, Cuartos, Semifinal y Final consecutiva.",
                },
                {
                  icon: "⚽",
                  title: "Torneo Mixto de Domingos",
                  desc: "Planilla de marcadores completos y cálculo de efectividad.",
                },
                {
                  icon: "⚖️",
                  title: "Armador Equilibrado 5 vs 5",
                  desc: "Balance matemático por partidos ganados y medidor al 99%.",
                },
                {
                  icon: "🎖️",
                  title: "Dorsales & Pasaportes",
                  desc: "Reserva de camiseta oficial con ID asociado al futuro login.",
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-base group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-sm font-bold text-white leading-tight">
                      {item.title}
                    </span>
                    <span className="text-xs text-gray-300 leading-snug mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LEADERBOARD DE CAMPEONES EN VIVO */}
      <ChampionsLeaderboardSection compact={true} headingLevel="h2" />

      {/* 6. ARMADOR TÁCTICO & CREACIÓN DE EQUIPOS con Aceternity CardSpotlight */}
      <CardSpotlight
        radius={360}
        color="rgba(229, 57, 53, 0.12)"
        className="espn-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
      >
        <div className="flex flex-col gap-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="badge-hot">NOVEDAD TÁCTICA</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono-tech">
              PARIDAD MATEMÁTICA
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[var(--text)] uppercase tracking-wide">
            Creador de Equipos 5 vs 5 con balance exacto
          </h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Elegí a los 10 jugadores de la fecha y dejá que el algoritmo divida
            el partido minimizando la diferencia de partidos ganados. Con
            medidor de paridad 99% y copiado listo para WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <Magnet>
            <a
              href="#/equipos"
              onClick={(e) => {
                e.preventDefault();
                navigate("/equipos");
              }}
              className="btn-espn-solid inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <SolarIcon name="usersGroup" className="w-4 h-4 text-white" />
              <span>Abrir Armador de Equipos</span>
            </a>
          </Magnet>
        </div>
      </CardSpotlight>

      {/* 7. PROBLEMA -> SOLUCIÓN con Motion Primitives InView */}
      <InView
        viewOptions={{ once: true, amount: 0.15 }}
        className="espn-card p-6 sm:p-8 flex flex-col gap-6"
      >
        <div className="pb-4 border-b border-[var(--line)]">
          <h2
            id="problem-solution-heading"
            className="font-display text-3xl font-black text-[var(--text)] uppercase tracking-wide"
          >
            Del Excel perdido en el chat al vestuario con estadísticas oficiales
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Lo que cambia cuando el grupo pasa de anotar partidos sueltos a
            competir con formato de copa y dorsales verificados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--line)] gap-6 md:gap-0">
          <div className="pb-5 md:pb-0 md:pr-6 flex flex-col gap-3">
            <h3 className="font-display text-xl font-bold text-[var(--loss)] inline-flex items-center gap-2">
              <SolarIcon name="danger" className="w-5 h-5" />
              <span>Planilla suelta y memoria de WhatsApp</span>
            </h3>
            <ul className="space-y-2.5 text-sm text-[var(--text-muted)]">
              <li>
                Nadie se acuerda si faltaba ganar uno o dos partidos para pasar
                de ronda ni en qué instancia quedó afuera el Mundial anterior.
              </li>
              <li>
                Un amigo que jugó 1 solo partido y ganó reclama 100 % de
                efectividad frente a los que jugaron 12 fechas.
              </li>
              <li>
                Los partidos del Mixto con empate alteran el promedio del torneo
                principal y mezclan la caja de cancha.
              </li>
              <li>
                No existe identidad por jugador: si se rompe el archivo, nadie
                tiene su propio pasaporte ni sus copas registradas.
              </li>
            </ul>
          </div>

          <div className="pt-5 md:pt-0 md:pl-6 flex flex-col gap-3">
            <h3 className="font-display text-xl font-bold text-[var(--win)] inline-flex items-center gap-2">
              <SolarIcon name="check" className="w-5 h-5" />
              <span>Fulbo Tracker 2026 con cuentas reclamables</span>
            </h3>
            <ul className="space-y-2.5 text-sm text-[var(--text)]">
              <li>
                <strong>Motor de 5 fases automático:</strong> calcula Grupos,
                Octavos, Cuartos, Semifinal y Final apenas guardás el partido.
              </li>
              <li>
                <strong>Mínimo de 4 PJ para insignias:</strong> Talismán y Mufa
                se otorgan solo a quienes sostienen el rendimiento en el tiempo.
              </li>
              <li>
                <strong>Torneo Mixto separado:</strong> marcadores exactos (11 -
                11, 9 - 12), empates en ámbar y filtro de alcance en 1 clic.
              </li>
              <li>
                <strong>Pasaporte listo para login:</strong> cada amigo reclama
                su dorsal y deja su correo asociado para el acceso multi-usuario.
              </li>
            </ul>
          </div>
        </div>
      </InView>

      {/* 8. PREGUNTAS FRECUENTES (FAQ) con Motion Primitives InView */}
      <InView
        viewOptions={{ once: true, amount: 0.15 }}
        className="espn-card p-6 sm:p-8 flex flex-col gap-5"
      >
        <div className="pb-4 border-b border-[var(--line)]">
          <h2
            id="faq-heading"
            className="font-display text-3xl font-black text-[var(--text)] uppercase tracking-wide"
          >
            Preguntas frecuentes sobre el Mundialito y las cuentas
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Todo sobre el cálculo de campeones, el reclamo de dorsales y el
            futuro acceso multi-usuario.
          </p>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {FAQ_ITEMS.map((item, idx) => (
            <details key={idx} open={idx === 0} className="group py-3.5">
              <summary className="font-display text-xl font-bold text-[var(--text)] cursor-pointer list-none flex items-center justify-between gap-4 min-h-[36px]">
                <span>{item.question}</span>
                <span className="font-mono-tech text-xs text-[var(--espn-red-dark)] shrink-0 font-bold">
                  Ver respuesta
                </span>
              </summary>
              <p className="text-sm text-[var(--text-muted)] mt-2 max-w-3xl leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </InView>

      {/* 9. REVERSIÓN DE RIESGO + CTA FINAL con Motion Primitives InView y React Bits Magnet */}
      <InView
        viewOptions={{ once: true, amount: 0.15 }}
        className="rounded-2xl bg-[var(--espn-red-light)] border-2 border-[var(--espn-red)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex flex-col gap-2 max-w-2xl">
          <h2
            id="final-cta-heading"
            className="font-display text-3xl sm:text-4xl font-black text-[var(--espn-red-dark)] leading-tight uppercase"
          >
            Reservá tu camiseta hoy y dejá tu historial listo para el login
          </h2>
          <p className="text-sm text-[var(--text-body)]">
            Gratis para todo el grupo, sin instalar nada y con respaldo JSON
            instantáneo. Reclamá tu dorsal en 20 segundos o entrá directo al
            tablero del Mundial 5.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <Magnet>
            <button
              type="button"
              onClick={() => openRegistrationModal(null)}
              className="btn-espn-solid inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <SolarIcon name="userId" className="w-5 h-5 text-white" />
              <span>Reclamar mi dorsal gratis</span>
            </button>
          </Magnet>

          <Magnet>
            <a
              href="#/campeones"
              onClick={(e) => {
                e.preventDefault();
                navigate("/campeones");
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-[8px] bg-white border border-[var(--gold)] text-[var(--gold)] font-bold text-sm inline-flex items-center gap-2 shadow-xs hover:bg-amber-50 transition-colors"
            >
              <SolarIcon name="crown" className="w-4 h-4" />
              <span>Ver Leaderboard de Campeones</span>
            </a>
          </Magnet>
        </div>
      </InView>
    </div>
  );
};
