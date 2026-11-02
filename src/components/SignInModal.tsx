import React, { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../store/StoreContext";
import { POSITION_LABELS } from "../domain/leaderboard";
import { SolarIcon } from "./SolarIcon";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const {
    registeredUsers,
    activeUser,
    setActiveUserId,
    matches,
    openRegistrationModal,
    showToast,
  } = useStore();

  const modalRef = useRef<HTMLDivElement | null>(null);

  // Cantidad de partidos jugados por usuario registrado
  const userMatchCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of registeredUsers) {
      const matchCount = matches.filter((m) =>
        m.teamPlayers.includes(u.linkedPlayerId)
      ).length;
      counts.set(u.userId, matchCount);
    }
    return counts;
  }, [matches, registeredUsers]);

  // Manejo de tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelectUser = (userId: string) => {
    const selected = registeredUsers.find((u) => u.userId === userId);
    setActiveUserId(userId);
    onClose();
    if (selected) {
      showToast({
        message: `Sesión activa: ${selected.displayName} (#${String(selected.dorsal).padStart(2, "0")}). Toda la web se adaptó a tus estadísticas.`,
      });
    }
  };

  const handleSignOut = () => {
    setActiveUserId(null);
    onClose();
    showToast({
      message: "Sesión cerrada. Mostrando estadísticas globales del club.",
    });
  };

  const handleOpenRegistration = () => {
    onClose();
    openRegistrationModal(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="signin-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          {/* Backdrop dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative z-10 w-full max-w-lg rounded-2xl bg-[#1E2022] border border-white/15 p-6 shadow-2xl flex flex-col gap-5 text-white max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--espn-red)] flex items-center justify-center text-white shrink-0 shadow-md">
                  <SolarIcon name="userId" className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="signin-modal-title"
                    className="font-display text-2xl font-black text-white leading-tight"
                  >
                    Iniciar Sesión
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Elegí con cuál usuario entrar para adaptar toda la web a tus números
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar modal"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <SolarIcon name="close" className="w-4 h-4" />
              </button>
            </div>

            {/* User List */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Usuarios disponibles ({registeredUsers.length})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {registeredUsers.map((user) => {
                  const isCurrent = activeUser?.userId === user.userId;
                  const matchCount = userMatchCounts.get(user.userId) || 0;

                  return (
                    <button
                      key={user.userId}
                      type="button"
                      onClick={() => handleSelectUser(user.userId)}
                      className={`relative text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 group ${
                        isCurrent
                          ? "bg-[var(--espn-red)]/15 border-[var(--espn-red)] ring-1 ring-[var(--espn-red)]"
                          : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono-tech font-bold ${
                              isCurrent
                                ? "bg-[var(--espn-red)] text-white"
                                : "bg-white/10 text-amber-300 group-hover:bg-amber-400/20"
                            }`}
                          >
                            #{String(user.dorsal).padStart(2, "0")}
                          </span>
                          <span className="font-display text-base font-bold text-white group-hover:text-amber-200 transition-colors">
                            {user.displayName}
                          </span>
                        </div>

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Activo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{POSITION_LABELS[user.position]}</span>
                        <span className="font-mono-tech font-semibold text-gray-300">
                          {matchCount} {matchCount === 1 ? "partido" : "partidos"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={handleOpenRegistration}
                className="text-amber-300 hover:text-amber-200 hover:underline font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <SolarIcon name="plus" className="w-3.5 h-3.5" />
                <span>Reclamar otro dorsal / Nuevo usuario</span>
              </button>

              {activeUser && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-red-400 hover:underline font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <SolarIcon name="close" className="w-3.5 h-3.5" />
                  <span>Cerrar sesión (Ver club global)</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

