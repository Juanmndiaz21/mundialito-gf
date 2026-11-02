import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store/StoreContext";
import {
  FOOT_LABELS,
  POSITION_LABELS,
  type PlayerPosition,
  type PreferredFoot,
} from "../domain/leaderboard";
import { playerDorsal } from "../domain/format";
import { slugifyPlayerId } from "../domain/normalize";
import { SolarIcon } from "./SolarIcon";

export const UserRegistrationModal: React.FC = () => {
  const {
    players,
    registeredUsers,
    activeUser,
    setActiveUserId,
    registrationModalPlayerId,
    closeRegistrationModal,
    registerUserAccount,
  } = useStore();

  const isOpen = registrationModalPlayerId !== null;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [claimMode, setClaimMode] = useState<"existing" | "new">("existing");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [handle, setHandle] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [dorsal, setDorsal] = useState<number>(10);
  const [position, setPosition] = useState<PlayerPosition>("mediocampo");
  const [foot, setFoot] = useState<PreferredFoot>("diestro");

  const [nameError, setNameError] = useState<string | null>(null);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const unclaimedPlayers = useMemo(() => {
    const claimedIds = new Set(registeredUsers.map((u) => u.linkedPlayerId));
    return players.filter((p) => !claimedIds.has(p.id));
  }, [players, registeredUsers]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const targetPlayer =
      registrationModalPlayerId && registrationModalPlayerId !== "new"
        ? players.find((p) => p.id === registrationModalPlayerId) ?? null
        : unclaimedPlayers[0] ?? players[0] ?? null;

    if (
      registrationModalPlayerId &&
      registrationModalPlayerId !== "new" &&
      targetPlayer
    ) {
      setClaimMode("existing");
      setSelectedPlayerId(targetPlayer.id);
      const existingAcc = registeredUsers.find(
        (u) => u.linkedPlayerId === targetPlayer.id
      );
      const numDorsal = existingAcc
        ? existingAcc.dorsal
        : Number(playerDorsal(targetPlayer.id).replace("#", "")) || 10;
      setDisplayName(targetPlayer.displayName);
      setHandle(existingAcc?.handle ?? `@${targetPlayer.id}`);
      setEmail(existingAcc?.email ?? `${targetPlayer.id}@fulbo2026.club`);
      setDorsal(numDorsal);
      setPosition(existingAcc?.position ?? "mediocampo");
      setFoot(existingAcc?.foot ?? "diestro");
    } else if (unclaimedPlayers.length > 0) {
      const first = unclaimedPlayers[0];
      setClaimMode("existing");
      setSelectedPlayerId(first.id);
      const numDorsal = Number(playerDorsal(first.id).replace("#", "")) || 14;
      setDisplayName(first.displayName);
      setHandle(`@${first.id}`);
      setEmail(`${first.id}@fulbo2026.club`);
      setDorsal(numDorsal);
      setPosition("mediocampo");
      setFoot("diestro");
    } else {
      setClaimMode("new");
      setSelectedPlayerId("");
      setDisplayName("");
      setHandle("");
      setEmail("");
      setDorsal(19);
      setPosition("todoterreno");
      setFoot("diestro");
    }

    setNameError(null);
    setHandleError(null);
    setEmailError(null);

    const timer = window.setTimeout(() => {
      firstInputRef.current?.focus();
    }, 30);

    return () => window.clearTimeout(timer);
  }, [isOpen, players, registeredUsers, registrationModalPlayerId, unclaimedPlayers]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRegistrationModal();
        previousFocusRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeRegistrationModal, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    closeRegistrationModal();
    previousFocusRef.current?.focus();
  };

  const handleSelectExistingPlayer = (pid: string) => {
    setSelectedPlayerId(pid);
    const p = players.find((item) => item.id === pid);
    if (!p) return;
    const existingAcc = registeredUsers.find((u) => u.linkedPlayerId === pid);
    const numDorsal = existingAcc
      ? existingAcc.dorsal
      : Number(playerDorsal(pid).replace("#", "")) || 10;
    setDisplayName(p.displayName);
    setHandle(existingAcc?.handle ?? `@${p.id}`);
    setEmail(existingAcc?.email ?? `${p.id}@fulbo2026.club`);
    setDorsal(numDorsal);
    setPosition(existingAcc?.position ?? "mediocampo");
    setFoot(existingAcc?.foot ?? "diestro");
    setNameError(null);
    setHandleError(null);
    setEmailError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    const cleanName = displayName.trim();
    if (!cleanName) {
      setNameError("Escribí tu nombre o apodo de cancha.");
      valid = false;
    } else {
      setNameError(null);
    }

    const cleanHandle = handle.trim().replace(/^@/, "");
    if (cleanHandle.length < 2) {
      setHandleError("Elegí un usuario de al menos 2 letras (ej. @ciorci).");
      valid = false;
    } else {
      setHandleError(null);
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setEmailError("Ingresá un correo válido para vincular tu cuenta.");
      valid = false;
    } else {
      setEmailError(null);
    }

    if (!valid) return;

    registerUserAccount({
      email: cleanEmail,
      handle: `@${cleanHandle}`,
      displayName: cleanName,
      linkedPlayerId: claimMode === "existing" ? selectedPlayerId : null,
      dorsal: Math.max(1, Math.min(99, dorsal)),
      position,
      foot,
    });

    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-registration-modal-title"
        className="w-full max-w-xl rounded-2xl bg-white border border-[var(--line)] shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] p-5 sm:p-6 flex flex-col gap-5 my-auto max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-[var(--line)]">
          <div>
            <h2
              id="user-registration-modal-title"
              className="font-display text-3xl font-bold text-[var(--text)] leading-none"
            >
              Pasaporte de Jugador y Registro
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Reclamá tu dorsal del plantel o creá tu usuario. Tu correo queda
              reservado para cuando se active el acceso con Magic Link.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar ventana de registro"
            className="min-h-[44px] min-w-[44px] rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] inline-flex items-center justify-center text-[var(--text)] hover:border-[var(--win)] cursor-pointer"
          >
            <SolarIcon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Selector rápido de cuenta activa para probar sesiones */}
        <div className="pb-4 border-b border-[var(--line)] flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--text)]">
            Cuentas verificadas en este dispositivo ({registeredUsers.length}):
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {registeredUsers.map((u) => {
              const isCurrent = activeUser?.userId === u.userId;
              return (
                <button
                  key={u.userId}
                  type="button"
                  onClick={() => setActiveUserId(u.userId)}
                  className={`min-h-[36px] px-2.5 py-1 rounded-[6px] text-xs font-semibold border inline-flex items-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? "bg-[var(--win-surface)] border-[var(--win)] text-[var(--win-muted)]"
                      : "bg-[var(--surface-2)] border-[var(--line-strong)] text-[var(--text)] hover:border-[var(--win)]"
                  }`}
                >
                  <span className="font-mono-tech text-[var(--win)]">
                    #{String(u.dorsal).padStart(2, "0")}
                  </span>
                  <span>{u.displayName}</span>
                  {isCurrent && (
                    <SolarIcon name="check" className="w-3.5 h-3.5 text-[var(--win)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div
            role="group"
            aria-label="Tipo de registro"
            className="grid grid-cols-2 gap-2 p-1 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)]"
          >
            <button
              type="button"
              aria-pressed={claimMode === "existing"}
              onClick={() => {
                setClaimMode("existing");
                const first = unclaimedPlayers[0] ?? players[0];
                if (first) handleSelectExistingPlayer(first.id);
              }}
              className={`min-h-[40px] px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer ${
                claimMode === "existing"
                  ? "bg-[var(--win)] text-[var(--on-win)]"
                  : "text-[var(--text)]"
              }`}
            >
              Reclamar jugador del Excel
            </button>
            <button
              type="button"
              aria-pressed={claimMode === "new"}
              onClick={() => {
                setClaimMode("new");
                setSelectedPlayerId("");
                setDisplayName("");
                setHandle("");
                setEmail("");
                setDorsal(23);
              }}
              className={`min-h-[40px] px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer ${
                claimMode === "new"
                  ? "bg-[var(--gold)] text-[var(--on-gold)]"
                  : "text-[var(--text)]"
              }`}
            >
              Soy jugador nuevo
            </button>
          </div>

          {claimMode === "existing" && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="claim-player-select"
                className="text-xs font-semibold text-[var(--text)]"
              >
                Elegí tu nombre en el padrón histórico ({players.length} jugadores)
              </label>
              <select
                id="claim-player-select"
                value={selectedPlayerId}
                onChange={(e) => handleSelectExistingPlayer(e.target.value)}
                className="min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm text-[var(--text)]"
              >
                {players.map((p) => {
                  const acc = registeredUsers.find(
                    (u) => u.linkedPlayerId === p.id
                  );
                  return (
                    <option key={p.id} value={p.id}>
                      {p.displayName}{" "}
                      {acc
                        ? `(Cuenta activa: ${acc.handle} · #${String(
                            acc.dorsal
                          ).padStart(2, "0")})`
                        : `(Dorsal sugerido #${playerDorsal(p.id)} · Libre)`}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reg-display-name"
                className="text-xs font-semibold text-[var(--text)]"
              >
                Nombre o apodo en cancha
              </label>
              <input
                ref={firstInputRef}
                id="reg-display-name"
                type="text"
                value={displayName}
                onChange={(e) => {
                  const val = e.target.value;
                  setDisplayName(val);
                  if (claimMode === "new") {
                    const slug = slugifyPlayerId(val);
                    setHandle(slug ? `@${slug}` : "");
                    setEmail(slug ? `${slug}@fulbo2026.club` : "");
                  }
                }}
                placeholder="Ej. Ciorci"
                className="min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm text-[var(--text)]"
              />
              {nameError && (
                <p
                  role="alert"
                  className="text-xs px-2.5 py-1.5 rounded-[4px] bg-[var(--loss-surface)] border border-[var(--loss)] text-[var(--loss-muted)]"
                >
                  {nameError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reg-handle"
                className="text-xs font-semibold text-[var(--text)]"
              >
                Usuario único (@handle)
              </label>
              <input
                id="reg-handle"
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="Ej. @ciorci"
                className="min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] font-mono-tech text-sm text-[var(--text)]"
              />
              {handleError && (
                <p
                  role="alert"
                  className="text-xs px-2.5 py-1.5 rounded-[4px] bg-[var(--loss-surface)] border border-[var(--loss)] text-[var(--loss-muted)]"
                >
                  {handleError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label
                htmlFor="reg-email"
                className="text-xs font-semibold text-[var(--text)]"
              >
                Correo para acceso futuro (Magic Link / OAuth)
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jugador@correo.com"
                className="min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm text-[var(--text)]"
              />
              {emailError && (
                <p
                  role="alert"
                  className="text-xs px-2.5 py-1.5 rounded-[4px] bg-[var(--loss-surface)] border border-[var(--loss)] text-[var(--loss-muted)]"
                >
                  {emailError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reg-dorsal"
                className="text-xs font-semibold text-[var(--text)]"
              >
                Dorsal (1 a 99)
              </label>
              <input
                id="reg-dorsal"
                type="number"
                min={1}
                max={99}
                value={dorsal}
                onChange={(e) => setDorsal(Number(e.target.value) || 1)}
                className="min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] font-mono-tech text-sm text-[var(--text)] tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reg-position"
                className="text-xs font-semibold text-[var(--text)]"
              >
                Posición principal
              </label>
              <select
                id="reg-position"
                value={position}
                onChange={(e) => setPosition(e.target.value as PlayerPosition)}
                className="min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm text-[var(--text)]"
              >
                {(Object.keys(POSITION_LABELS) as PlayerPosition[]).map(
                  (pos) => (
                    <option key={pos} value={pos}>
                      {POSITION_LABELS[pos]}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="reg-foot"
                className="text-xs font-semibold text-[var(--text)]"
              >
                Perfil hábil
              </label>
              <select
                id="reg-foot"
                value={foot}
                onChange={(e) => setFoot(e.target.value as PreferredFoot)}
                className="min-h-[44px] px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm text-[var(--text)]"
              >
                {(Object.keys(FOOT_LABELS) as PreferredFoot[]).map((f) => (
                  <option key={f} value={f}>
                    {FOOT_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--line)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="min-h-[44px] px-4 py-2 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-xs font-semibold text-[var(--text)] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-[8px] bg-[var(--win)] text-[var(--on-win)] text-sm font-semibold inline-flex items-center gap-2 active:scale-[0.97] transition-transform duration-150 cursor-pointer"
            >
              <SolarIcon name="userId" className="w-4 h-4" />
              <span>Guardar pasaporte y activar cuenta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
