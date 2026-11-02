import React from "react";
import { Match } from "../domain/types";
import { PHASE_LABELS } from "../domain/format";

interface LatestResultsShowcaseProps {
  latestMatch?: Match;
  onNavigateToMatches?: () => void;
}

export const LatestResultsShowcase: React.FC<LatestResultsShowcaseProps> = ({
  latestMatch,
}) => {
  if (!latestMatch) {
    return (
      <section aria-label="Último Resultado Oficial" className="w-full">
        <div className="relative bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">⚽</span>
          <h3 className="font-display text-xl font-bold text-gray-800 uppercase">
            Aún no hay partidos registrados
          </h3>
          <p className="text-xs text-gray-500 max-w-sm">
            Los resultados de las próximas fechas aparecerán aquí automáticamente en cuanto se carguen.
          </p>
        </div>
      </section>
    );
  }

  const isWin = latestMatch.result === "win";
  const isLoss = latestMatch.result === "loss";
  const phaseLabel = latestMatch.phase ? PHASE_LABELS[latestMatch.phase] : "Fase regular";
  const tournamentName =
    latestMatch.tournamentType === "mundialito" ? "Fútbol 2026 · Mundialito" : "Torneo Mixto";

  // Marcador real o representativo según resultado oficial
  const score1 = latestMatch.score
    ? latestMatch.score.us
    : isWin
    ? 3
    : isLoss
    ? 1
    : 2;

  const score2 = latestMatch.score
    ? latestMatch.score.them
    : isWin
    ? 1
    : isLoss
    ? 3
    : 2;

  const watermarkText = isWin ? "GANADORES" : isLoss ? "PARTIDO" : "EMPATE";

  const formattedPlayers = latestMatch.teamPlayers
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(", ");

  const commentaryText =
    latestMatch.notes && latestMatch.notes.trim().length > 0
      ? latestMatch.notes
      : isWin
      ? `Victoria decisiva por ${score1} a ${score2} en ${phaseLabel} con participación de ${formattedPlayers}. Máxima concentración defensiva y efectividad en ataque para asegurar el pase en el torneo.`
      : isLoss
      ? `Ajustada caída por ${score1} a ${score2} en ${phaseLabel}. Pese al esfuerzo colectivo de ${formattedPlayers}, el resultado adverso exige replantear la táctica para la próxima fecha.`
      : `Intenso empate ${score1} a ${score2} en ${tournamentName}. Choque de ida y vuelta con paridad absoluta entre ambos conjuntos.`;

  return (
    <section
      aria-label="Último Resultado Oficial"
      className="w-full"
    >
      {/* Contenedor con ancho 100% igual al resto de las secciones */}
      <div className="relative bg-white rounded-2xl shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] border border-gray-100 p-6 sm:p-10 w-full">
        
        {/* Línea superior roja interrumpida por el título central */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="h-[2px] bg-[#e53935] flex-1 rounded-full" />
          <div className="text-center shrink-0">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#111827] tracking-wider uppercase leading-none">
              ÚLTIMOS RESULTADOS
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-gray-700 tracking-wide mt-2">
              El partido más destacado · {tournamentName} · {phaseLabel}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 font-mono-tech mt-1">
              Fecha oficial: {latestMatch.date} | Partido #{latestMatch.matchNumber}
            </p>
          </div>
          <div className="h-[2px] bg-[#e53935] flex-1 rounded-full" />
        </div>

        {/* Marco lateral delimitado en rojo oficial */}
        <div className="relative my-8 border-x-2 border-[#e53935] px-4 sm:px-8 py-6">
          
          {/* Franja central del partido (Scoreboard horizontal de ancho completo) */}
          <div className="relative bg-[#f4f4f5] border border-gray-200/80 rounded-xl overflow-hidden py-6 sm:py-8 px-4 sm:px-10 shadow-xs">
            
            {/* Marca de agua en el fondo */}
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-10 text-[#111827] font-black text-5xl sm:text-7xl md:text-8xl tracking-[0.25em]"
            >
              {watermarkText}
            </div>

            {/* Contenido del enfrentamiento */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10">
              
              {/* Equipo Local / Ganador (Izquierda) */}
              <div className="flex items-center gap-3 sm:gap-5 flex-1 justify-center md:justify-end">
                {/* Escudo rojo F5 */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#e53935] to-[#c62828] p-1 flex items-center justify-center shadow-md shrink-0 border-2 border-black">
                  <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center text-center">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 text-[#e53935]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="12 6 15 9 14 13 10 13 9 9" fill="currentColor" />
                    </svg>
                    <span className="text-[7px] sm:text-[8px] font-black tracking-tighter text-[#e53935] uppercase -mt-0.5">
                      F5
                    </span>
                  </div>
                </div>

                <div className="flex flex-col text-center items-center md:items-end">
                  <span className="font-display text-xl sm:text-2xl lg:text-3xl font-black text-[#111827] tracking-wider uppercase text-center">
                    NUESTRO EQUIPO
                  </span>
                  <span className="text-[11px] font-mono-tech text-gray-500 uppercase tracking-tight text-center">
                    Fulbo #{latestMatch.matchNumber}
                  </span>
                </div>
              </div>

              {/* Marcador Central Dividido */}
              <div className="flex items-center justify-center shrink-0 my-2 md:my-0">
                <div className="inline-flex items-center rounded-lg overflow-hidden shadow-md border border-gray-900/10">
                  {/* Lado rojo oficial (Goles Equipo Local) */}
                  <div className="bg-[#e53935] text-white font-display font-black text-3xl sm:text-4xl lg:text-5xl min-w-[58px] sm:min-w-[72px] h-14 sm:h-16 flex items-center justify-center px-4">
                    {score1}
                  </div>

                  {/* Insignia VS central */}
                  <div className="bg-black text-[#e53935] font-mono-tech text-[10px] sm:text-xs font-black px-2.5 h-14 sm:h-16 flex items-center justify-center border-x border-black/20">
                    VS
                  </div>

                  {/* Lado negro (Goles Rival) */}
                  <div className="bg-[#111827] text-white font-display font-black text-3xl sm:text-4xl lg:text-5xl min-w-[58px] sm:min-w-[72px] h-14 sm:h-16 flex items-center justify-center px-4">
                    {score2}
                  </div>
                </div>
              </div>

              {/* Equipo Rival (Derecha) */}
              <div className="flex items-center gap-3 sm:gap-5 flex-1 justify-center md:justify-start">
                <div className="flex flex-col text-center items-center md:items-start order-2 md:order-1">
                  <span className="font-display text-xl sm:text-2xl lg:text-3xl font-black text-[#111827] tracking-wider uppercase text-center">
                    EQUIPO RIVAL
                  </span>
                  <span className="text-[11px] font-mono-tech text-gray-500 uppercase tracking-tight text-center">
                    {latestMatch.tournamentType === "mundialito" ? "Rival de Fase" : "Equipo Rival"}
                  </span>
                </div>

                {/* Escudo rival */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-neutral-800 to-black p-1 flex items-center justify-center shadow-md shrink-0 border-2 border-gray-400 order-1 md:order-2">
                  <div className="w-full h-full rounded-full bg-black flex flex-col items-center justify-center text-center">
                    <span className="text-[6px] sm:text-[7px] font-black tracking-widest text-white uppercase leading-none">
                      FÚTBOL
                    </span>
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 my-0.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Crónica deportiva o notas oficiales (centrado absoluto) */}
          <div className="w-full max-w-3xl mx-auto mt-6 flex flex-col items-center justify-center text-center px-2">
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans text-center mx-auto">
              {commentaryText}
            </p>
          </div>

        </div>

        {/* Línea inferior roja continua */}
        <div className="h-[2px] bg-[#e53935] rounded-full w-full mt-4" />

      </div>
    </section>
  );
};
