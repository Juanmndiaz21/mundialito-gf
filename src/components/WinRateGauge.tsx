import React from "react";
import { formatPct } from "../domain/format";
import { CometDial } from "./ui/CometDial";

interface WinRateGaugeProps {
  winRate: number;
  wins: number;
  total: number;
}

export const WinRateGauge: React.FC<WinRateGaugeProps> = ({
  winRate,
  wins,
  total,
}) => {
  const clamped = Math.max(0, Math.min(100, winRate));
  const formattedPct = formatPct(clamped, 1);

  let accentColor = "#15803D"; // Win green
  if (clamped >= 75) {
    accentColor = "#EAB308"; // Gold
  } else if (clamped < 35) {
    accentColor = "#DC2626"; // Loss red
  } else if (clamped < 50) {
    accentColor = "#D97706"; // Amber draw
  }

  return (
    <div
      role="img"
      aria-label={`Win rate ${formattedPct}, ${wins} victorias de ${total} partidos`}
      className="flex flex-col items-center justify-center gap-1"
    >
      <div className="relative flex items-center justify-center">
        <CometDial
          value={Number(clamped.toFixed(1))}
          min={0}
          max={100}
          step={0.1}
          unit="%"
          label="Porcentaje de victorias"
          accent={accentColor}
          ink="#111827"
          size={200}
          sweep={280}
          thickness={7}
          speed={30}
          cometReach={150}
          cometWidth={10}
        />
      </div>

      <div className="flex flex-col items-center text-center -mt-2">
        <span className="font-mono-tech text-xs font-bold text-[var(--text-muted)] tabular-nums">
          {formattedPct} ganados · {wins} de {total}
        </span>
      </div>
    </div>
  );
};
