export type TeamOption = {
  short: string;
  name: string;
  color: string;
  pickRate?: number;
};

export type MatchCard = {
  id: string;
  teams: [TeamOption, TeamOption];
  startTime: string;
  countdown: string;
  venue: string;
  status: string;
  selectedWinner: string;
  underdog: string;
  boostExpanded?: boolean;
  projectedRank: string;
  rankIfWrong: string;
  availablePowerUp: string;
  source?: "live" | "fallback";
  series?: string;
};

export type PlayerCard = {
  rank: number;
  name: string;
  team: string;
  points: number;
  movement: string;
  accuracy: number;
  highlight?: boolean;
};

export type EventItem = {
  id: number;
  title: string;
  detail: string;
  accent: "hot" | "cool" | "neutral";
  reactions?: string[];
};

export type PowerUp = {
  label: string;
  icon: string;
  remaining: number;
  effect: string;
};

export const fallbackTodayMatches: MatchCard[] = [
  {
    id: "fallback-1",
    teams: [
      { short: "RCB", name: "Royal Challengers Bengaluru", color: "#EF4444", pickRate: 38 },
      { short: "MI", name: "Mumbai Indians", color: "#3B82F6", pickRate: 62 }
    ],
    startTime: "7:30 PM",
    countdown: "Lock closes in 58m",
    venue: "Wankhede Stadium",
    status: "You haven't predicted yet",
    selectedWinner: "MI",
    underdog: "RCB",
    boostExpanded: true,
    projectedRank: "#5 if MI wins",
    rankIfWrong: "Drop 4 spots if MI loses",
    availablePowerUp: "Double Down available",
    source: "fallback",
    series: "Indian Premier League"
  },
  {
    id: "fallback-2",
    teams: [
      { short: "KKR", name: "Kolkata Knight Riders", color: "#8B5CF6", pickRate: 29 },
      { short: "CSK", name: "Chennai Super Kings", color: "#FACC15", pickRate: 71 }
    ],
    startTime: "3:30 PM",
    countdown: "Lock closes tomorrow 3:00 PM",
    venue: "Eden Gardens",
    status: "You picked KKR",
    selectedWinner: "KKR",
    underdog: "KKR",
    projectedRank: "#9 if KKR wins",
    rankIfWrong: "No rank change if you insure",
    availablePowerUp: "Insurance available",
    source: "fallback",
    series: "Indian Premier League"
  }
];

export const leaderboard: PlayerCard[] = [
  { rank: 7, name: "Pooja", team: "Design", points: 182, movement: "↑1", accuracy: 72 },
  { rank: 8, name: "Rahul", team: "Sales", points: 180, movement: "↓2", accuracy: 69 },
  { rank: 9, name: "Aisha", team: "Product", points: 179, movement: "↑1", accuracy: 70 },
  { rank: 10, name: "Nithin", team: "Engineering", points: 178, movement: "↑2", accuracy: 71 },
  { rank: 11, name: "Rhea", team: "Product", points: 177, movement: "↓1", accuracy: 70 },
  { rank: 12, name: "You", team: "Engineering", points: 176, movement: "↑3", accuracy: 69, highlight: true },
  { rank: 13, name: "Harish", team: "Design", points: 173, movement: "↓1", accuracy: 67 },
  { rank: 14, name: "Maya", team: "Sales", points: 171, movement: "↑1", accuracy: 64 },
  { rank: 15, name: "Aditya", team: "Engineering", points: 170, movement: "↑2", accuracy: 65 },
  { rank: 16, name: "Sam", team: "Support", points: 168, movement: "↓3", accuracy: 63 }
];

export const teamBattle = [
  { name: "Engineering", points: 812, movement: "↑24" },
  { name: "Product", points: 788, movement: "↑18" },
  { name: "Design", points: 761, movement: "↑31" },
  { name: "Sales", points: 720, movement: "↑10" }
];

export const weeklyLeaders = [
  { name: "You", points: 54, note: "Projected top 10 if MI lands" },
  { name: "Rhea", points: 51, note: "Most accurate over last 6 picks" },
  { name: "Nithin", points: 49, note: "Beat him today to take team lead" }
];

export const homeEvents: EventItem[] = [
  {
    id: 1,
    title: "Upset Alert",
    detail: "Only 12% picked RR tonight. Big swing opportunity if they land.",
    accent: "hot",
    reactions: ["🚨 12", "🔥 4"]
  },
  {
    id: 2,
    title: "Head-to-Head",
    detail: "You and Rahul picked opposite teams in MI vs RCB.",
    accent: "cool",
    reactions: ["👀 9", "💥 3"]
  },
  {
    id: 3,
    title: "Near Miss",
    detail: "You could have been #3 last night if RR had held the chase.",
    accent: "neutral",
    reactions: ["😬 7", "📉 2"]
  },
  {
    id: 4,
    title: "Rank Drop Risk",
    detail: "Miss today and you are projected to fall 8 ranks.",
    accent: "hot",
    reactions: ["⚠️ 6", "🏃 3"]
  }
];

export const powerUps: PowerUp[] = [
  { label: "Double Down", icon: "🔥", remaining: 3, effect: "2x points on one match" },
  { label: "Insurance", icon: "🛡", remaining: 2, effect: "Protect a wrong prediction" },
  { label: "All-in", icon: "🎯", remaining: 1, effect: "5x on your season swing" }
];

export const profileBadges = ["Risk Taker", "Streak King", "All-in Addict"];

export const notifications = [
  "RCB vs MI starts in 1 hour",
  "You dropped 8 ranks today",
  "If MI wins, you jump to #5"
];
