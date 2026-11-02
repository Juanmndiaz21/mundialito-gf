import React from "react";
import { useStore } from "../store/StoreContext";
import { SolarIcon } from "./SolarIcon";
import { useFocusTrap } from "./useFocusTrap";

export const ConfirmDialog: React.FC = () => {
  const { confirmDialog, setConfirmDialog } = useStore();
  const trapRef = useFocusTrap<HTMLDivElement>(Boolean(confirmDialog), () =>
    setConfirmDialog(null)
  );

  if (!confirmDialog) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={() => setConfirmDialog(null)}
    >
      <div
        ref={trapRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="modal-surface elevated-shadow w-full max-w-md rounded-[12px] bg-[var(--surface)] border border-[var(--line-strong)] p-5 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2.5">
          <SolarIcon name="danger" className="w-6 h-6 text-[var(--loss)]" />
          <h2
            id="confirm-dialog-title"
            className="font-display text-2xl font-bold text-[var(--text)]"
          >
            {confirmDialog.title}
          </h2>
        </div>
        <p id="confirm-dialog-desc" className="text-sm text-[var(--text-muted)]">
          {confirmDialog.message}
        </p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setConfirmDialog(null)}
            className="min-h-[44px] px-4 py-2 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm font-medium text-[var(--text)] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              const fn = confirmDialog.onConfirm;
              setConfirmDialog(null);
              fn();
            }}
            className="min-h-[44px] px-4 py-2 rounded-[8px] bg-[var(--loss)] text-[var(--on-loss)] text-sm font-semibold cursor-pointer"
          >
            {confirmDialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Toast: React.FC = () => {
  const { toast, dismissToast } = useStore();
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="toast-surface elevated-shadow fixed bottom-20 lg:bottom-6 left-4 right-4 sm:right-auto sm:left-6 sm:max-w-md z-40 rounded-[8px] bg-[var(--surface-2)] border-2 border-[var(--win)] p-3.5 flex items-center justify-between gap-3"
    >
      <span className="text-sm font-medium text-[var(--text)]">
        {toast.message}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {toast.actionLabel && toast.onAction && (
          <button
            type="button"
            onClick={() => {
              toast.onAction?.();
              dismissToast();
            }}
            className="min-h-[38px] px-3 py-1 rounded-[4px] bg-[var(--win)] text-[var(--on-win)] text-xs font-semibold cursor-pointer"
          >
            {toast.actionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={dismissToast}
          aria-label="Cerrar aviso"
          className="min-w-[38px] min-h-[38px] rounded-[4px] inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--line-strong)] cursor-pointer"
        >
          <SolarIcon name="close" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const CorruptedStorageScreen: React.FC = () => {
  const {
    corruptedRaw,
    downloadCorruptedRaw,
    resetToSeed,
    setConfirmDialog,
  } = useStore();

  if (corruptedRaw === null) return null;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center p-4">
      <div
        role="alert"
        className="w-full max-w-lg rounded-[12px] bg-[var(--surface)] border-2 border-[var(--loss)] p-6 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2.5">
          <SolarIcon name="danger" className="w-7 h-7 text-[var(--loss)]" />
          <h1 className="font-display text-3xl font-bold text-[var(--text)]">
            No pudimos leer tus datos guardados.
          </h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          El contenido guardado en este navegador tiene un formato inválido o corresponde a otra versión. No sobrescribimos nada para que puedas descargar lo que había antes de restaurar la planilla.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={downloadCorruptedRaw}
            className="min-h-[44px] px-4 py-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm font-semibold text-[var(--text)] hover:border-[var(--win)] cursor-pointer"
          >
            Descargar lo guardado tal cual
          </button>
          <button
            type="button"
            onClick={() =>
              setConfirmDialog({
                title: "Restaurar datos del Excel",
                message:
                  "Se van a cargar los 25 partidos originales de FUTBOL 2026.xlsx en este navegador.",
                confirmLabel: "Restaurar datos del Excel",
                onConfirm: resetToSeed,
              })
            }
            className="min-h-[44px] px-4 py-2.5 rounded-[8px] bg-[var(--win)] text-[var(--on-win)] text-sm font-semibold cursor-pointer"
          >
            Restaurar datos del Excel
          </button>
        </div>
      </div>
    </main>
  );
};
