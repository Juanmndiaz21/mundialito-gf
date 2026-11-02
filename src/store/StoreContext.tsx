import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type {
  Campaign,
  Match,
  PersistedState,
  Player,
  Scope,
  TournamentType,
} from "../domain/types";
import { recomputePhases } from "../domain/campaigns";
import { PHASE_LABELS } from "../domain/format";
import { slugifyPlayerId } from "../domain/normalize";
import {
  createSeedAccountsState,
  loadAccountsState,
  saveAccountsState,
  type PlayerPosition,
  type PreferredFoot,
  type RegisteredUser,
} from "../domain/leaderboard";
import {
  createSeedState,
  createEmptyState,
  loadPersistedState,
  loadUiPrefs,
  parseImportedBackup,
  savePersistedState,
  saveUiPrefs,
} from "./storage";
import {
  buildHash,
  EMPTY_FILTERS,
  parseHash,
  type MatchFilters,
  type RoutePath,
} from "./router";
import {
  fetchMatchesFromNeon,
  insertMatchToNeon,
  deleteMatchFromNeon,
  clearAllMatchesFromNeon,
} from "../services/neonDb";

export type ModalState =
  | { kind: "add"; defaultTournament?: TournamentType }
  | { kind: "edit"; matchId: string }
  | null;

export interface ToastData {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

type DataAction =
  | {
      type: "ADD_MATCH";
      id: string;
      match: Omit<Match, "id" | "matchNumber" | "phase">;
      newPlayers: Player[];
    }
  | {
      type: "UPDATE_MATCH";
      match: Match;
      newPlayers: Player[];
    }
  | { type: "DELETE_MATCH"; id: string }
  | { type: "ADD_PLAYER"; player: Player }
  | { type: "IMPORT_STATE"; state: PersistedState }
  | { type: "RESET_TO_SEED" }
  | { type: "RESET_TO_EMPTY" };

function dataReducer(state: PersistedState, action: DataAction): PersistedState {
  switch (action.type) {
    case "ADD_MATCH": {
      const mergedPlayers = [...state.players];
      for (const np of action.newPlayers) {
        if (!mergedPlayers.some((p) => p.id === np.id)) {
          mergedPlayers.push(np);
        }
      }
      const maxNum = state.matches
        .filter((m) => m.tournamentType === action.match.tournamentType)
        .reduce((max, m) => Math.max(max, m.matchNumber), 0);
      const draft: Match = {
        ...action.match,
        id: action.id,
        matchNumber: maxNum + 1,
        phase: null,
      };
      const { matches } = recomputePhases([...state.matches, draft]);
      return {
        schemaVersion: 1,
        players: mergedPlayers,
        matches,
        updatedAt: new Date().toISOString(),
      };
    }
    case "UPDATE_MATCH": {
      const mergedPlayers = [...state.players];
      for (const np of action.newPlayers) {
        if (!mergedPlayers.some((p) => p.id === np.id)) {
          mergedPlayers.push(np);
        }
      }
      const updatedList = state.matches.map((m) =>
        m.id === action.match.id ? { ...action.match } : m
      );
      const { matches } = recomputePhases(updatedList);
      return {
        schemaVersion: 1,
        players: mergedPlayers,
        matches,
        updatedAt: new Date().toISOString(),
      };
    }
    case "DELETE_MATCH": {
      const filtered = state.matches.filter((m) => m.id !== action.id);
      const { matches } = recomputePhases(filtered);
      return {
        ...state,
        matches,
        updatedAt: new Date().toISOString(),
      };
    }
    case "ADD_PLAYER": {
      if (state.players.some((p) => p.id === action.player.id)) return state;
      return {
        ...state,
        players: [...state.players, action.player],
        updatedAt: new Date().toISOString(),
      };
    }
    case "IMPORT_STATE": {
      const { matches } = recomputePhases(action.state.matches);
      return {
        schemaVersion: 1,
        players: action.state.players,
        matches,
        updatedAt: new Date().toISOString(),
      };
    }
    case "RESET_TO_SEED": {
      return createSeedState();
    }
    case "RESET_TO_EMPTY": {
      return createEmptyState();
    }
  }
}

function buildPostSaveMessage(
  savedId: string,
  matches: Match[],
  campaigns: Campaign[]
): string {
  const saved = matches.find((m) => m.id === savedId);
  if (!saved) return "Partido guardado.";
  if (saved.tournamentType === "mixto") {
    return `Mixto #${saved.matchNumber} guardado.`;
  }
  const camp = campaigns.find((c) => c.matchIds.includes(saved.id));
  if (!camp) {
    return `Fulbo #${saved.matchNumber} guardado.`;
  }
  if (camp.status === "champion") {
    return `Fulbo #${saved.matchNumber} guardado. Saliste campeón del Mundial ${camp.index}.`;
  }
  if (camp.status === "eliminated" && camp.eliminatedAt) {
    return `Fulbo #${saved.matchNumber} guardado. Afuera en ${PHASE_LABELS[camp.eliminatedAt]}. Arranca el Mundial ${camp.index + 1}.`;
  }
  if (camp.nextPhase && camp.nextPhase !== saved.phase) {
    return `Fulbo #${saved.matchNumber} guardado. Pasás a ${PHASE_LABELS[camp.nextPhase]}.`;
  }
  if (camp.nextPhase) {
    return `Fulbo #${saved.matchNumber} guardado. Seguís en ${PHASE_LABELS[camp.nextPhase]}.`;
  }
  return `Fulbo #${saved.matchNumber} guardado.`;
}

interface StoreContextValue {
  players: Player[];
  matches: Match[];
  campaigns: Campaign[];
  scope: Scope;
  setScope: (scope: Scope) => void;
  lastTournament: TournamentType;
  route: RoutePath;
  filters: MatchFilters;
  navigate: (path: RoutePath, filters?: Partial<MatchFilters>) => void;
  setFilters: (next: Partial<MatchFilters>) => void;
  clearFilters: () => void;
  openMatchId: string | null;
  setOpenMatchId: (id: string | null) => void;
  openPlayerId: string | null;
  setOpenPlayerId: (id: string | null) => void;
  modal: ModalState;
  setModal: (modal: ModalState) => void;
  confirmDialog: ConfirmDialogData | null;
  setConfirmDialog: (dialog: ConfirmDialogData | null) => void;
  toast: ToastData | null;
  dismissToast: () => void;
  showToast: (toast: ToastData) => void;
  corruptedRaw: string | null;
  isImporting: boolean;
  isNeonConnected: boolean;
  addMatch: (
    match: Omit<Match, "id" | "matchNumber" | "phase">,
    newPlayers: Player[]
  ) => void;
  updateMatch: (match: Match, newPlayers: Player[]) => void;
  deleteMatch: (id: string) => void;
  exportBackup: () => void;
  importBackupFile: (file: File) => Promise<void>;
  downloadCorruptedRaw: () => void;
  resetToSeed: () => void;
  resetToEmpty: () => void;
  registeredUsers: RegisteredUser[];
  activeUser: RegisteredUser | null;
  setActiveUserId: (userId: string | null) => void;
  isSignInModalOpen: boolean;
  openSignInModal: () => void;
  closeSignInModal: () => void;
  registrationModalPlayerId: string | null;
  openRegistrationModal: (preselectedPlayerId?: string | null) => void;
  closeRegistrationModal: () => void;
  registerUserAccount: (input: {
    email: string;
    handle: string;
    displayName: string;
    linkedPlayerId: string | null;
    dorsal: number;
    position: PlayerPosition;
    foot: PreferredFoot;
  }) => RegisteredUser;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialLoad = useMemo(() => loadPersistedState(), []);
  const initialPrefs = useMemo(() => loadUiPrefs(), []);
  const initialAccounts = useMemo(() => loadAccountsState(), []);

  const [corruptedRaw, setCorruptedRaw] = useState<string | null>(
    initialLoad.status === "corrupted" ? initialLoad.raw : null
  );

  const [state, dispatch] = useReducer(
    dataReducer,
    initialLoad.status === "ok" ? initialLoad.state : createEmptyState()
  );

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(
    initialAccounts.users
  );
  const [activeUserId, setActiveUserIdState] = useState<string | null>(
    initialAccounts.activeUserId
  );

  const activeUser = useMemo(
    () =>
      activeUserId
        ? registeredUsers.find((u) => u.userId === activeUserId) ?? null
        : null,
    [activeUserId, registeredUsers]
  );

  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [registrationModalPlayerId, setRegistrationModalPlayerId] = useState<
    string | null
  >(null);

  const [scope, setScopeState] = useState<Scope>(initialPrefs.scope);
  const [lastTournament, setLastTournament] = useState<TournamentType>(
    initialPrefs.lastTournament
  );

  const [parsedRoute, setParsedRoute] = useState(() =>
    parseHash(window.location.hash)
  );
  const [openMatchId, setOpenMatchId] = useState<string | null>(null);
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogData | null>(
    null
  );
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isNeonConnected, setIsNeonConnected] = useState(false);

  const { matches, campaigns } = useMemo(
    () => recomputePhases(state.matches),
    [state.matches]
  );

  useEffect(() => {
    let active = true;
    fetchMatchesFromNeon()
      .then((neonMatches) => {
        if (!active) return;
        if (neonMatches !== null) {
          setIsNeonConnected(true);

          if (neonMatches.length === 0) {
            // Neon esta reseteado a cero; sincronizar cliente local a cero
            dispatch({ type: "RESET_TO_EMPTY" });
            savePersistedState(createEmptyState());
            return;
          }

          // Neon es la fuente de verdad del club
          dispatch({
            type: "IMPORT_STATE",
            state: {
              schemaVersion: 1,
              players: state.players,
              matches: neonMatches,
              updatedAt: new Date().toISOString(),
            },
          });
          savePersistedState({
            schemaVersion: 1,
            players: state.players,
            matches: neonMatches,
            updatedAt: new Date().toISOString(),
          });
        }
      })
      .catch((err) => {
        console.warn("Neon inicializacion:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setParsedRoute(parseHash(window.location.hash));
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Re-check localStorage when window regains focus or receives storage events so manual corruption is caught immediately.
  useEffect(() => {
    const checkStorageIntegrity = () => {
      const check = loadPersistedState();
      if (check.status === "corrupted") {
        setCorruptedRaw(check.raw);
      }
    };
    window.addEventListener("storage", checkStorageIntegrity);
    return () => window.removeEventListener("storage", checkStorageIntegrity);
  }, []);

  useEffect(() => {
    if (!toast || toast.actionLabel) return;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((next: ToastData) => {
    setToast(next);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const exportBackup = useCallback(() => {
    const payload: PersistedState = {
      schemaVersion: 1,
      players: state.players,
      matches,
      updatedAt: state.updatedAt,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fulbo-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [matches, state.players, state.updatedAt]);

  const persistOrWarn = useCallback(
    (nextState: PersistedState) => {
      if (corruptedRaw !== null) return;
      const ok = savePersistedState(nextState);
      if (!ok) {
        showToast({
          message:
            "No se pudo guardar en este navegador. Exportá una copia para no perder el partido.",
          actionLabel: "Exportar ahora",
          onAction: exportBackup,
        });
      }
    },
    [corruptedRaw, exportBackup, showToast]
  );

  const setScope = useCallback(
    (nextScope: Scope) => {
      setScopeState(nextScope);
      saveUiPrefs({ scope: nextScope, lastTournament });
    },
    [lastTournament]
  );

  const navigate = useCallback(
    (path: RoutePath, nextFilters?: Partial<MatchFilters>) => {
      const merged: MatchFilters =
        path === "/partidos"
          ? {
              ...EMPTY_FILTERS,
              ...nextFilters,
            }
          : EMPTY_FILTERS;
      const targetHash = buildHash(path, merged);
      setParsedRoute(parseHash(targetHash));
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    },
    []
  );

  const setFilters = useCallback(
    (partial: Partial<MatchFilters>) => {
      const merged: MatchFilters = {
        ...parsedRoute.filters,
        ...partial,
      };
      const targetHash = buildHash("/partidos", merged);
      setParsedRoute(parseHash(targetHash));
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    },
    [parsedRoute.filters]
  );

  const clearFilters = useCallback(() => {
    setParsedRoute(parseHash("#/partidos"));
    if (window.location.hash !== "#/partidos") {
      window.location.hash = "#/partidos";
    }
  }, []);

  const addMatch = useCallback(
    (
      matchInput: Omit<Match, "id" | "matchNumber" | "phase">,
      newPlayers: Player[]
    ) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${matchInput.tournamentType}-${Date.now()}`;
      const action: DataAction = {
        type: "ADD_MATCH",
        id,
        match: matchInput,
        newPlayers,
      };
      const nextState = dataReducer(state, action);
      dispatch(action);
      setLastTournament(matchInput.tournamentType);
      saveUiPrefs({ scope, lastTournament: matchInput.tournamentType });
      persistOrWarn(nextState);

      const createdDraft: Match = {
        ...matchInput,
        id,
        matchNumber:
          nextState.matches.find((m) => m.id === id)?.matchNumber || 1,
        phase: null,
      };
      insertMatchToNeon(createdDraft, { userId: activeUser?.userId }).catch((err) => {
        console.warn("Neon sync addMatch:", err);
      });

      const recomputed = recomputePhases(nextState.matches);
      showToast({
        message: buildPostSaveMessage(
          id,
          recomputed.matches,
          recomputed.campaigns
        ),
      });
    },
    [activeUser, persistOrWarn, scope, showToast, state]
  );

  const updateMatch = useCallback(
    (match: Match, newPlayers: Player[]) => {
      const action: DataAction = {
        type: "UPDATE_MATCH",
        match,
        newPlayers,
      };
      const nextState = dataReducer(state, action);
      dispatch(action);
      persistOrWarn(nextState);

      insertMatchToNeon(match, { userId: activeUser?.userId }).catch((err) => {
        console.warn("Neon sync updateMatch:", err);
      });

      const recomputed = recomputePhases(nextState.matches);
      showToast({
        message: buildPostSaveMessage(
          match.id,
          recomputed.matches,
          recomputed.campaigns
        ),
      });
    },
    [activeUser, persistOrWarn, showToast, state]
  );

  const deleteMatch = useCallback(
    (id: string) => {
      const target = matches.find((m) => m.id === id);
      const action: DataAction = { type: "DELETE_MATCH", id };
      const nextState = dataReducer(state, action);
      dispatch(action);
      persistOrWarn(nextState);

      deleteMatchFromNeon(id).catch((err) => {
        console.warn("Neon sync deleteMatch:", err);
      });
      if (openMatchId === id) {
        setOpenMatchId(null);
      }
      showToast({
        message: target
          ? `Partido #${target.matchNumber} eliminado.`
          : "Partido eliminado.",
      });
    },
    [matches, openMatchId, persistOrWarn, showToast, state]
  );

  const importBackupFile = useCallback(
    async (file: File) => {
      setIsImporting(true);
      try {
        await new Promise((r) => setTimeout(r, 150));
        const text = await file.text();
        const imported = parseImportedBackup(text);
        dispatch({ type: "IMPORT_STATE", state: imported });
        setCorruptedRaw(null);
        savePersistedState(imported);
        showToast({
          message: `Copia importada (${imported.matches.length} partidos).`,
        });
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "El archivo no es una copia de Fulbo Tracker.";
        showToast({ message: msg });
      } finally {
        setIsImporting(false);
      }
    },
    [showToast]
  );

  const downloadCorruptedRaw = useCallback(() => {
    const content = corruptedRaw ?? "";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fulbo-tracker-datos-guardados-raw.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [corruptedRaw]);

  const resetToSeed = useCallback(() => {
    const seed = createSeedState();
    const seedAccounts = createSeedAccountsState();
    dispatch({ type: "RESET_TO_SEED" });
    setCorruptedRaw(null);
    setRegisteredUsers(seedAccounts.users);
    setActiveUserIdState(seedAccounts.activeUserId);
    savePersistedState(seed);
    saveAccountsState(seedAccounts);
    for (const m of seed.matches) {
      insertMatchToNeon(m).catch(() => {});
    }
    showToast({
      message: "Datos restaurados a la planilla Excel original (25 partidos).",
    });
  }, [showToast]);

  const resetToEmpty = useCallback(() => {
    const empty = createEmptyState();
    dispatch({ type: "RESET_TO_EMPTY" });
    setCorruptedRaw(null);
    savePersistedState(empty);
    clearAllMatchesFromNeon().catch((e) => {
      console.warn("Error vaciando Neon:", e);
    });
    showToast({
      message: "Todas las estadísticas se reiniciaron a cero (0 partidos).",
    });
  }, [showToast]);


  const setActiveUserId = useCallback(
    (nextId: string | null) => {
      setActiveUserIdState(nextId);
      saveAccountsState({
        schemaVersion: 1,
        activeUserId: nextId,
        users: registeredUsers,
      });
    },
    [registeredUsers]
  );

  const openSignInModal = useCallback(() => {
    setIsSignInModalOpen(true);
  }, []);

  const closeSignInModal = useCallback(() => {
    setIsSignInModalOpen(false);
  }, []);

  const openRegistrationModal = useCallback(
    (preselectedPlayerId?: string | null) => {
      setRegistrationModalPlayerId(preselectedPlayerId ?? "new");
    },
    []
  );

  const closeRegistrationModal = useCallback(() => {
    setRegistrationModalPlayerId(null);
  }, []);

  const registerUserAccount = useCallback(
    (input: {
      email: string;
      handle: string;
      displayName: string;
      linkedPlayerId: string | null;
      dorsal: number;
      position: PlayerPosition;
      foot: PreferredFoot;
    }): RegisteredUser => {
      const trimmedName = input.displayName.trim();
      let resolvedPlayerId: string;

      if (!input.linkedPlayerId) {
        const slug = slugifyPlayerId(trimmedName) || `jugador-${Date.now()}`;
        const existing = state.players.find((p) => p.id === slug);
        resolvedPlayerId = existing ? existing.id : slug;
        if (!existing) {
          const newPlayer: Player = {
            id: resolvedPlayerId,
            displayName: trimmedName,
            aliases: [],
          };
          const action: DataAction = { type: "ADD_PLAYER", player: newPlayer };
          const nextState = dataReducer(state, action);
          dispatch(action);
          persistOrWarn(nextState);
        }
      } else {
        resolvedPlayerId = input.linkedPlayerId;
      }

      const cleanHandle = input.handle.trim().startsWith("@")
        ? input.handle.trim().toLowerCase()
        : `@${input.handle.trim().toLowerCase()}`;

      const existingIdx = registeredUsers.findIndex(
        (u) => u.linkedPlayerId === resolvedPlayerId
      );

      const newUser: RegisteredUser = {
        userId:
          existingIdx >= 0
            ? registeredUsers[existingIdx].userId
            : `usr-${resolvedPlayerId}`,
        email: input.email.trim().toLowerCase(),
        handle: cleanHandle,
        displayName: trimmedName,
        linkedPlayerId: resolvedPlayerId,
        dorsal: input.dorsal,
        position: input.position,
        foot: input.foot,
        authStatus: "magic_link_ready",
        createdAt: new Date().toISOString(),
      };

      const nextUsers =
        existingIdx >= 0
          ? registeredUsers.map((u, idx) => (idx === existingIdx ? newUser : u))
          : [...registeredUsers, newUser];

      setRegisteredUsers(nextUsers);
      setActiveUserIdState(newUser.userId);
      saveAccountsState({
        schemaVersion: 1,
        activeUserId: newUser.userId,
        users: nextUsers,
      });

      showToast({
        message: `Dorsal #${String(newUser.dorsal).padStart(
          2,
          "0"
        )} reclamado para ${newUser.displayName} (${newUser.handle}).`,
      });

      return newUser;
    },
    [persistOrWarn, registeredUsers, showToast, state]
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      players: state.players,
      matches,
      campaigns,
      scope,
      setScope,
      lastTournament,
      route: parsedRoute.path,
      filters: parsedRoute.filters,
      navigate,
      setFilters,
      clearFilters,
      openMatchId,
      setOpenMatchId,
      openPlayerId,
      setOpenPlayerId,
      modal,
      setModal,
      confirmDialog,
      setConfirmDialog,
      toast,
      dismissToast,
      showToast,
      corruptedRaw,
      isImporting,
      isNeonConnected,
      addMatch,
      updateMatch,
      deleteMatch,
      exportBackup,
      importBackupFile,
      downloadCorruptedRaw,
      resetToSeed,
      resetToEmpty,
      registeredUsers,
      activeUser,
      setActiveUserId,
      isSignInModalOpen,
      openSignInModal,
      closeSignInModal,
      registrationModalPlayerId,
      openRegistrationModal,
      closeRegistrationModal,
      registerUserAccount,
    }),
    [
      state.players,
      matches,
      campaigns,
      scope,
      setScope,
      lastTournament,
      parsedRoute.path,
      parsedRoute.filters,
      navigate,
      setFilters,
      clearFilters,
      openMatchId,
      openPlayerId,
      modal,
      confirmDialog,
      toast,
      dismissToast,
      showToast,
      corruptedRaw,
      isImporting,
      isNeonConnected,
      addMatch,
      updateMatch,
      deleteMatch,
      exportBackup,
      importBackupFile,
      downloadCorruptedRaw,
      resetToSeed,
      resetToEmpty,
      registeredUsers,
      activeUser,
      setActiveUserId,
      isSignInModalOpen,
      openSignInModal,
      closeSignInModal,
      registrationModalPlayerId,
      openRegistrationModal,
      closeRegistrationModal,
      registerUserAccount,
    ]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore debe usarse dentro de StoreProvider");
  }
  return ctx;
}

