import React from "react";
import { useStore } from "../store/StoreContext";

export const Footer: React.FC = () => {
  const { navigate } = useStore();

  return (
    <footer className="mt-auto relative bg-[#181B1E] text-gray-300 border-t border-white/10">
      {/* Tira superior de césped iluminado como en la referencia Soccer Club */}
      <div
        aria-hidden="true"
        className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 shadow-[0_0_12px_rgba(34,197,94,0.4)]"
      />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-10 lg:py-14 flex flex-col gap-10">
        {/* Fila principal con columnas */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Bloque de marca SOCCER CLUB */}
          <div className="md:col-span-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl shadow-xs">
                ⚽
              </span>
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl font-black tracking-wide text-white uppercase">
                  SOCCER CLUB
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF5F1F]">
                  MATCH CENTER & TELEMETRÍA 2026
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-sm">
              Plataforma deportiva de alto rendimiento para el fútbol 5 de los
              jueves y el torneo Mixto de los domingos. Registro de partidos en
              20 segundos, algoritmo de paridad y leaderboard oficial de campeones.
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono-tech">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Temporada 2026 en curso · Match Center Oficial</span>
            </div>
          </div>

          {/* Columna 1: Navegación */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Competición
            </span>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              <li>
                <a
                  href="#/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/");
                  }}
                  className="hover:text-[#FF5F1F] transition-colors"
                >
                  Inicio / Club
                </a>
              </li>
              <li>
                <a
                  href="#/torneo"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/torneo");
                  }}
                  className="hover:text-[#FF5F1F] transition-colors"
                >
                  Torneo y Camino
                </a>
              </li>
              <li>
                <a
                  href="#/partidos"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/partidos");
                  }}
                  className="hover:text-[#FF5F1F] transition-colors"
                >
                  Historial de Partidos
                </a>
              </li>
              <li>
                <a
                  href="#/equipos"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/equipos");
                  }}
                  className="hover:text-[#FF5F1F] transition-colors"
                >
                  Armador de Equipos
                </a>
              </li>
              <li>
                <a
                  href="#/campeones"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/campeones");
                  }}
                  className="hover:text-[#FF5F1F] transition-colors"
                >
                  Leaderboard Campeones
                </a>
              </li>
              <li>
                <a
                  href="#/feeling"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/feeling");
                  }}
                  className="hover:text-[#FF5F1F] transition-colors"
                >
                  Feeling & Duplas
                </a>
              </li>
              <li>
                <a
                  href="#/mixto"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/mixto");
                  }}
                  className="hover:text-[#FF5F1F] transition-colors"
                >
                  Torneo Mixto
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 2: Sistema */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Reglamentos
            </span>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              <li>
                <a
                  href="#/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/");
                  }}
                  className="hover:text-[#FF5F1F] transition-colors"
                >
                  Reglas de Copa (5 Fases)
                </a>
              </li>
              <li>
                <span className="text-gray-400">Paridad por PG</span>
              </li>
              <li>
                <span className="text-gray-400">Umbral 4 PJ (Insignias)</span>
              </li>
              <li>
                <span className="text-gray-400">Pasaporte Digital</span>
              </li>
              <li>
                <span className="text-gray-400">Respaldos JSON</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea inferior de copyright */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400">
          <p>© 2026 SOCCER CLUB · Fulbo Tracker Edition. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
              className="hover:underline text-gray-400 hover:text-white"
            >
              Términos de Torneo
            </a>
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
              className="hover:underline text-gray-400 hover:text-white"
            >
              Privacidad de Datos
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
