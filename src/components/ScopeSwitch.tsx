import React from "react";
import type { Scope } from "../domain/types";
import { SCOPE_LABELS } from "../domain/format";

interface ScopeSwitchProps {
  value: Scope;
  onChange: (next: Scope) => void;
}

const SCOPES: Scope[] = ["mundialito", "mixto", "all"];

export const ScopeSwitch: React.FC<ScopeSwitchProps> = ({ value, onChange }) => {
  return (
    <div
      role="group"
      aria-label="Alcance de estadísticas"
      className="inline-flex rounded-[8px] bg-[var(--surface-2)] p-1 border border-[var(--line-strong)] gap-1"
    >
      {SCOPES.map((s) => {
        const active = value === s;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(s)}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-[4px] text-sm font-medium transition-colors duration-150 ${
              active
                ? "bg-[var(--win)] text-[var(--on-win)] font-semibold"
                : "text-[var(--text)] hover:bg-[var(--surface)]"
            }`}
          >
            {SCOPE_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
};

