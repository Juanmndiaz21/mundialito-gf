import type { Campaign, Match, Phase, TournamentType } from "./types";

export const PHASE_ORDER: Phase[] = ["group", "r16", "qf", "sf", "final"];

function phaseRank(phase: Phase): number {
  return PHASE_ORDER.indexOf(phase);
}

function higherPhase(a: Phase, b: Phase): Phase {
  return phaseRank(b) > phaseRank(a) ? b : a;
}

function nextKnockoutPhase(phase: Phase): Phase {
  const idx = phaseRank(phase);
  return PHASE_ORDER[Math.min(idx + 1, PHASE_ORDER.length - 1)];
}

function createEmptyCampaign(index: number): Campaign {
  return {
    index,
    matchIds: [],
    status: "active",
    reachedPhase: "group",
    eliminatedAt: null,
    nextPhase: "group",
    groupRecord: { wins: 0, losses: 0 },
  };
}

export function renumberMatches(matches: Match[]): Match[] {
  const byTournament: Record<TournamentType, Match[]> = {
    mundialito: [],
    mixto: [],
  };

  for (const m of matches) {
    byTournament[m.tournamentType].push({ ...m });
  }

  for (const t of ["mundialito", "mixto"] as const) {
    byTournament[t].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.matchNumber - b.matchNumber;
    });
    byTournament[t].forEach((m, idx) => {
      m.matchNumber = idx + 1;
    });
  }

  return [...byTournament.mundialito, ...byTournament.mixto];
}

export function recomputePhases(inputMatches: Match[]): {
  matches: Match[];
  campaigns: Campaign[];
} {
  const numbered = renumberMatches(inputMatches);
  const mundialito = numbered
    .filter((m) => m.tournamentType === "mundialito")
    .sort((a, b) => a.matchNumber - b.matchNumber);
  const mixto = numbered
    .filter((m) => m.tournamentType === "mixto")
    .sort((a, b) => a.matchNumber - b.matchNumber)
    .map((m) => ({ ...m, phase: null }));

  const campaigns: Campaign[] = [];
  let current = createEmptyCampaign(1);
  let phase: Phase = "group";
  let gWins = 0;
  let gLosses = 0;

  for (const match of mundialito) {
    match.phase = phase;
    current.matchIds.push(match.id);
    current.reachedPhase = higherPhase(current.reachedPhase, phase);

    if (phase === "group") {
      if (match.result === "win") {
        gWins += 1;
      } else {
        gLosses += 1;
      }
      current.groupRecord = { wins: gWins, losses: gLosses };

      if (gWins === 2) {
        phase = "r16";
      } else if (gLosses === 2) {
        current.status = "eliminated";
        current.eliminatedAt = "group";
        current.nextPhase = null;
        campaigns.push(current);
        current = createEmptyCampaign(campaigns.length + 1);
        phase = "group";
        gWins = 0;
        gLosses = 0;
      }
    } else if (match.result === "win" && phase !== "final") {
      phase = nextKnockoutPhase(phase);
    } else if (match.result === "win" && phase === "final") {
      current.status = "champion";
      current.eliminatedAt = null;
      current.nextPhase = null;
      campaigns.push(current);
      current = createEmptyCampaign(campaigns.length + 1);
      phase = "group";
      gWins = 0;
      gLosses = 0;
    } else {
      current.status = "eliminated";
      current.eliminatedAt = phase;
      current.nextPhase = null;
      campaigns.push(current);
      current = createEmptyCampaign(campaigns.length + 1);
      phase = "group";
      gWins = 0;
      gLosses = 0;
    }
  }

  if (current.matchIds.length > 0) {
    current.status = "active";
    current.nextPhase = phase;
    campaigns.push(current);
  }

  return {
    matches: [...mundialito, ...mixto],
    campaigns,
  };
}

export function previewPhase(matches: Match[]): {
  phase: Phase;
  campaignIndex: number;
  groupRecord: { wins: number; losses: number };
} {
  const { campaigns } = recomputePhases(matches);
  const last = campaigns[campaigns.length - 1];
  if (!last || last.status !== "active" || !last.nextPhase) {
    return {
      phase: "group",
      campaignIndex: campaigns.length + 1,
      groupRecord: { wins: 0, losses: 0 },
    };
  }
  return {
    phase: last.nextPhase,
    campaignIndex: last.index,
    groupRecord: last.groupRecord,
  };
}

export function winsNeededForTitle(campaign: Campaign | undefined): number {
  if (!campaign || campaign.status !== "active" || !campaign.nextPhase) {
    return 6;
  }
  if (campaign.nextPhase === "group") {
    return 2 - campaign.groupRecord.wins + 4;
  }
  const idx = PHASE_ORDER.indexOf(campaign.nextPhase);
  return PHASE_ORDER.length - idx;
}

