import React from "react";
import { useStore } from "../store/StoreContext";
import { ChampionsLeaderboardSection } from "../components/ChampionsLeaderboardSection";
import { FOOT_LABELS, POSITION_LABELS } from "../domain/leaderboard";
import { SolarIcon } from "../components/SolarIcon";
import { useViewChoreography } from "../components/MotionSystem";

export const ChampionsView: React.FC = () => {
  const {
    players,
    registeredUsers,
    activeUser,
    setActiveUserId,
    openRegistrationModal,
    setOpenPlayerId,
  } = useStore();

  const viewRef = useViewChoreography<HTMLDivElement>([]);
  const unclaimedCount = Math.max(0, players.length - registeredUsers.length);

  return (
    <div ref={viewRef} className="flex flex-col gap-10">
      <ChampionsLeaderboardSection compact={false} headingLevel="h1" />

      <section
        aria-labelledby="roster-accounts-heading"
        className="espn-card p-5 sm:p-6 flex flex-col gap-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--line)]">
          <div>
            <h2
              id="roster-accounts-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-[var(--text)]"
            >
              Padrón de Usuarios y Dorsales Reclamados
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {registeredUsers.length} cuentas activas listas para el futuro
              acceso con correo · {unclaimedCount} dorsales históricos libres
              para reclamar.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openRegistrationModal(null)}
            className="min-h-[44px] px-4 py-2 rounded-[8px] bg-[var(--win)] text-[var(--on-win)] text-sm font-semibold inline-flex items-center gap-2 self-start cursor-pointer"
          >
            <SolarIcon name="userId" className="w-4 h-4" />
            <span>Reclamar dorsal o crear usuario</span>
          </button>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--line)]">
          {registeredUsers.map((u, idx) => {
            const isCurrent = activeUser?.userId === u.userId;
            return (
              <li
                key={u.userId}
                className={`py-3 sm:py-1 flex flex-col justify-between gap-2 ${
                  idx === 0
                    ? "sm:pr-4"
                    : idx === registeredUsers.length - 1
                    ? "sm:pl-4"
                    : "sm:px-4"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenPlayerId(u.linkedPlayerId)}
                    className="inline-flex items-baseline gap-1.5 font-display text-xl font-bold text-[var(--text)] hover:text-[var(--win)] cursor-pointer"
                  >
                    <span className="font-mono-tech text-xs text-[var(--win)]">
                      #{String(u.dorsal).padStart(2, "0")}
                    </span>
                    <span className="underline decoration-[var(--line-strong)]">
                      {u.displayName}
                    </span>
                  </button>

                  {isCurrent ? (
                    <span className="px-2 py-0.5 rounded-[4px] bg-[var(--win-surface)] border border-[var(--win)] text-[var(--win-muted)] text-xs font-semibold">
                      Sesión activa
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveUserId(u.userId)}
                      className="text-xs text-[var(--gold)] hover:underline font-semibold cursor-pointer"
                    >
                      Usar perfil
                    </button>
                  )}
                </div>

                <div className="text-xs text-[var(--text-muted)] flex flex-col gap-0.5">
                  <span className="font-mono-tech text-[var(--text)]">
                    {u.handle} · {POSITION_LABELS[u.position]} ·{" "}
                    {FOOT_LABELS[u.foot]}
                  </span>
                  <span className="truncate">{u.email}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

