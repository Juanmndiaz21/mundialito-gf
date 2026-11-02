import React from "react";
import { playerDorsal, playerTone } from "../domain/format";
import { SolarIcon } from "./SolarIcon";

interface PlayerChipProps {
  id: string;
  name: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onRemove?: () => void;
}

export const PlayerChip: React.FC<PlayerChipProps> = ({
  id,
  name,
  onClick,
  onRemove,
}) => {
  const dorsal = playerDorsal(id);
  const tone = playerTone(id);

  if (onRemove) {
    return (
      <span className="inline-flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-[4px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm text-[var(--text)]">
        <span
          aria-hidden="true"
          style={{
            backgroundColor: tone.bg,
            color: tone.text,
            borderColor: tone.border,
          }}
          className="px-1.5 py-0.5 rounded-[3px] border inline-flex items-center justify-center font-mono-tech text-[11px] font-semibold shrink-0"
        >
          #{dorsal}
        </span>
        <span className="font-medium">{name}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar a ${name}`}
          className="min-w-[32px] min-h-[32px] inline-flex items-center justify-center rounded-[4px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer"
        >
          <SolarIcon name="close" className="w-4 h-4" />
        </button>
      </span>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 min-h-[44px] py-1 rounded-[4px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm text-[var(--text)] hover:border-[var(--win)] transition-colors duration-150 cursor-pointer"
      >
        <span
          aria-hidden="true"
          style={{
            backgroundColor: tone.bg,
            color: tone.text,
            borderColor: tone.border,
          }}
          className="px-1.5 py-0.5 rounded-[3px] border inline-flex items-center justify-center font-mono-tech text-[11px] font-semibold shrink-0"
        >
          #{dorsal}
        </span>
        <span className="font-medium">{name}</span>
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-[4px] bg-[var(--surface-2)] border border-[var(--line-strong)] text-sm text-[var(--text)]">
      <span
        aria-hidden="true"
        style={{
          backgroundColor: tone.bg,
          color: tone.text,
          borderColor: tone.border,
        }}
        className="px-1.5 py-0.5 rounded-[3px] border inline-flex items-center justify-center font-mono-tech text-[11px] font-semibold shrink-0"
      >
        #{dorsal}
      </span>
      <span className="font-medium">{name}</span>
    </span>
  );
};
