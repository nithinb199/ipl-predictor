import { fallbackTodayMatches, type MatchCard, type TeamOption } from "./data";

type CricApiTeam = {
  name?: string;
  shortname?: string;
  shortName?: string;
};

type CricApiMatch = {
  id?: string;
  name?: string;
  matchType?: string;
  status?: string;
  venue?: string;
  date?: string;
  dateTimeGMT?: string;
  dateTime?: string;
  ms?: string;
  series?: string;
  teamInfo?: CricApiTeam[];
  teams?: string[];
  t1?: string;
  t2?: string;
  t1img?: string;
  t2img?: string;
};

type CricApiResponse = {
  status?: string;
  data?: CricApiMatch[];
  reason?: string;
};

export type IplMatchesResult = {
  matches: MatchCard[];
  sourceLabel: string;
  isLive: boolean;
};

const TEAM_COLORS: Record<string, string> = {
  CSK: "#FACC15",
  MI: "#3B82F6",
  RCB: "#EF4444",
  KKR: "#8B5CF6",
  SRH: "#F97316",
  RR: "#EC4899",
  DC: "#2563EB",
  PBKS: "#DC2626",
  GT: "#0F766E",
  LSG: "#14B8A6"
};

const IPL_PATTERN = /(indian premier league|\bipl\b)/i;

function toShortName(name: string) {
  const cleaned = name.replace(/[^A-Za-z ]/g, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "TBD";
  }
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function buildTeamOption(team: CricApiTeam | string | undefined): TeamOption {
  if (typeof team === "string") {
    const parsedTeam = parseBracketTeam(team);
    return {
      short: parsedTeam.short,
      name: parsedTeam.name,
      color: TEAM_COLORS[parsedTeam.short] ?? "#3B82F6"
    };
  }

  const rawName = team?.name ?? "TBD";
  const short = (team?.shortname ?? team?.shortName)?.toUpperCase() ?? toShortName(rawName);

  return {
    short,
    name: rawName,
    color: TEAM_COLORS[short] ?? "#3B82F6"
  };
}

function parseBracketTeam(value: string) {
  const match = value.match(/^(.*?)\s*\[([A-Za-z0-9-]+)\]\s*$/);
  if (!match) {
    return {
      name: value.trim(),
      short: toShortName(value)
    };
  }

  return {
    name: match[1].trim(),
    short: match[2].trim().toUpperCase()
  };
}

function formatMatchTime(value?: string) {
  if (!value) {
    return "Time TBC";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Time TBC";
  }

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }).format(date);
}

function formatCountdown(value?: string) {
  if (!value) {
    return "Schedule pending";
  }

  const matchDate = new Date(value);
  if (Number.isNaN(matchDate.getTime())) {
    return "Schedule pending";
  }

  const now = new Date();
  const diffMs = matchDate.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins <= -180) {
    return "Result window";
  }
  if (diffMins <= 0) {
    return "Lock closing now";
  }
  if (diffMins < 60) {
    return `Lock closes in ${diffMins}m`;
  }

  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) {
    return `Lock closes in ${diffHours}h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `Lock closes in ${diffDays}d`;
}

function deriveStatus(match: CricApiMatch) {
  if (match.status?.trim()) {
    return match.status;
  }

  const countdown = formatCountdown(match.dateTimeGMT ?? match.dateTime ?? match.date);
  if (countdown === "Result window") {
    return "Result posted";
  }
  if (countdown === "Lock closing now") {
    return "You haven't predicted yet";
  }
  return "Prediction window open";
}

function mapMatch(match: CricApiMatch, index: number): MatchCard | null {
  const teamInfo = match.teamInfo?.length
    ? match.teamInfo
    : match.teams?.length
      ? match.teams
      : match.t1 && match.t2
        ? [match.t1, match.t2]
        : null;
  if (!teamInfo || teamInfo.length < 2) {
    return null;
  }

  const [teamA, teamB] = [buildTeamOption(teamInfo[0]), buildTeamOption(teamInfo[1])];
  const status = deriveStatus(match);
  const startsAt = match.dateTimeGMT ?? match.dateTime ?? match.date;
  const sortedTeams = [teamA, teamB].sort((a, b) => a.name.localeCompare(b.name));
  const underdog = sortedTeams[0]?.short ?? teamA.short;

  return {
    id: match.id ?? `ipl-${index + 1}-${teamA.short}-${teamB.short}`,
    teams: [teamA, teamB],
    startTime: formatMatchTime(startsAt),
    countdown: formatCountdown(startsAt),
    venue: match.venue ?? "Venue TBC",
    status,
    selectedWinner: "",
    underdog,
    boostExpanded: index === 0,
    projectedRank: "Projected rank updates after you lock a pick",
    rankIfWrong: "Rank-drop alerts appear after results",
    availablePowerUp: "Optional boost available",
    source: "live",
    series: match.series ?? "Indian Premier League"
  };
}

export async function getIplMatches(): Promise<IplMatchesResult> {
  const apiKey = process.env.CRICAPI_KEY;

  if (!apiKey) {
    return {
      matches: fallbackTodayMatches,
      sourceLabel: "Demo fallback: add CRICAPI_KEY for live IPL fixtures",
      isLive: false
    };
  }

  try {
    const response = await fetch(`https://api.cricapi.com/v1/cricScore?apikey=${apiKey}`, {
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`CricAPI returned ${response.status}`);
    }

    const payload = (await response.json()) as CricApiResponse;
    const rawMatches = payload.data ?? [];
    const iplMatches = rawMatches
      .filter((match) => IPL_PATTERN.test(match.series ?? "") || IPL_PATTERN.test(match.name ?? ""))
      .map(mapMatch)
      .filter((match): match is MatchCard => Boolean(match));

    if (iplMatches.length === 0) {
      return {
        matches: fallbackTodayMatches,
        sourceLabel: "Live source connected, but no IPL fixtures were returned in the current feed",
        isLive: false
      };
    }

    return {
      matches: iplMatches,
      sourceLabel: "Live IPL fixtures and results from CricAPI",
      isLive: true
    };
  } catch {
    return {
      matches: fallbackTodayMatches,
      sourceLabel: "Live fetch failed, showing fallback schedule",
      isLive: false
    };
  }
}
