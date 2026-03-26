"use client";

import { useMemo, useRef, useState } from "react";
import type { EventItem, MatchCard, PlayerCard, PowerUp } from "../../lib/data";

type HomeClientProps = {
  matches: MatchCard[];
  sourceLabel: string;
  isLive: boolean;
  leaderboard: PlayerCard[];
  teamBattle: { name: string; points: number; movement: string }[];
  weeklyLeaders: { name: string; points: number; note: string }[];
  homeEvents: EventItem[];
  notifications: string[];
  profileBadges: string[];
  powerUps: PowerUp[];
};

type LeaderboardTab = "Near You" | "Teams" | "Weekly";
type NavTab = "Home" | "Leaderboard" | "Profile";

const confidenceOptions = [
  { label: "1x", tone: "safe" },
  { label: "2x", tone: "push" },
  { label: "3x", tone: "chaos" }
] as const;

const bonusOptions = ["10-20 runs", "21-35 runs", "Toss winner", "Win by wickets"];
const navTabs: NavTab[] = ["Home", "Leaderboard", "Profile"];
const leaderboardTabs: LeaderboardTab[] = ["Near You", "Teams", "Weekly"];

type InteractiveMatch = MatchCard & {
  confidence: string;
  bonus: string;
  tossWinner: string;
  activePowerUp: string | null;
  reactionCounts: Record<string, number>;
};

function buildInteractiveMatch(match: MatchCard): InteractiveMatch {
  return {
    ...match,
    confidence: "1x",
    bonus: "10-20 runs",
    tossWinner: "Optional",
    activePowerUp: null,
    reactionCounts: {}
  };
}

function nextStatus(teamShort: string, confidence: string, powerUp: string | null) {
  const boostCopy = powerUp ? ` with ${powerUp}` : confidence !== "1x" ? ` at ${confidence}` : "";
  return `Locked on ${teamShort}${boostCopy}`;
}

export function HomeClient({
  matches,
  sourceLabel,
  isLive,
  leaderboard,
  teamBattle,
  weeklyLeaders,
  homeEvents,
  notifications,
  profileBadges,
  powerUps
}: HomeClientProps) {
  const [navTab, setNavTab] = useState<NavTab>("Home");
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTab>("Near You");
  const [joinMessage, setJoinMessage] = useState("Invite code ready. Join the office league in one tap.");
  const [eventState, setEventState] = useState(() =>
    homeEvents.map((event) => ({
      ...event,
      reactionCounts: Object.fromEntries(
        (event.reactions ?? []).map((reaction) => {
          const [label, count] = reaction.split(" ");
          return [label, Number(count ?? "0")];
        })
      )
    }))
  );
  const [matchState, setMatchState] = useState(() => matches.map(buildInteractiveMatch));

  const homeRef = useRef<HTMLElement | null>(null);
  const leaderboardRef = useRef<HTMLElement | null>(null);
  const profileRef = useRef<HTMLElement | null>(null);

  const urgentMatches = useMemo(
    () => matchState.filter((match) => match.countdown.includes("Lock closes in") && !match.selectedWinner).length,
    [matchState]
  );

  const streakText = useMemo(() => {
    const lockedCount = matchState.filter((match) => Boolean(match.selectedWinner)).length;
    return `${Math.max(5, lockedCount + 3)} match streak`;
  }, [matchState]);

  function updateMatch(matchId: string, updater: (match: InteractiveMatch) => InteractiveMatch) {
    setMatchState((current) => current.map((match) => (match.id === matchId ? updater(match) : match)));
  }

  function handlePredictNow() {
    homeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleJoinLeague() {
    setJoinMessage("League joined. You are now on the office leaderboard.");
  }

  function handleWinnerSelect(matchId: string, teamShort: string) {
    updateMatch(matchId, (match) => ({
      ...match,
      selectedWinner: teamShort,
      status: nextStatus(teamShort, match.confidence, match.activePowerUp),
      projectedRank: `If ${teamShort} wins, your rank improves tonight`,
      rankIfWrong: `If ${teamShort} loses, rank-drop alert will trigger`
    }));
  }

  function handleToggleBoost(matchId: string) {
    updateMatch(matchId, (match) => ({
      ...match,
      boostExpanded: !match.boostExpanded
    }));
  }

  function handleConfidenceChange(matchId: string, value: string) {
    updateMatch(matchId, (match) => ({
      ...match,
      confidence: value,
      status: match.selectedWinner ? nextStatus(match.selectedWinner, value, match.activePowerUp) : match.status
    }));
  }

  function handleBonusChange(matchId: string, value: string) {
    updateMatch(matchId, (match) => ({
      ...match,
      bonus: value
    }));
  }

  function handleTossWinnerChange(matchId: string, value: string) {
    updateMatch(matchId, (match) => ({
      ...match,
      tossWinner: value
    }));
  }

  function handlePowerUp(matchId: string, powerUpLabel: string) {
    updateMatch(matchId, (match) => ({
      ...match,
      activePowerUp: match.activePowerUp === powerUpLabel ? null : powerUpLabel,
      status: match.selectedWinner
        ? nextStatus(
            match.selectedWinner,
            match.confidence,
            match.activePowerUp === powerUpLabel ? null : powerUpLabel
          )
        : match.status
    }));
  }

  function handleReaction(eventId: number, reaction: string) {
    setEventState((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
              ...event,
              reactionCounts: {
                ...event.reactionCounts,
                [reaction]: (event.reactionCounts[reaction] ?? 0) + 1
              }
            }
          : event
      )
    );
  }

  function handleNavClick(tab: NavTab) {
    setNavTab(tab);

    if (tab === "Home") {
      homeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (tab === "Leaderboard") {
      leaderboardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    profileRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section className="top-strip compact">
        <div>
          <p className="kicker">Daily Habit</p>
          <h1>IPL Predictor</h1>
        </div>
        <div className="header-stats">
          <span className="rank-pill">#12 ↑3</span>
          <span className="streak-pill">🔥 {streakText}</span>
        </div>
      </section>

      <section className="urgency-hero">
        <div className="urgency-main">
          <span className="alert-pill">
            {urgentMatches > 0 ? `${urgentMatches} matches closing soon` : "All available picks locked"}
          </span>
          <h2>Predict now before the locks hit.</h2>
          <p>One tap to lock your winner. Boost is optional.</p>
          <p className={`source-badge ${isLive ? "live" : "fallback"}`}>{sourceLabel}</p>
        </div>
        <div className="urgency-actions">
          <button className="primary-button" type="button" onClick={handlePredictNow}>
            Predict Now
          </button>
          <div className="streak-card">
            <div className="streak-top">
              <strong>{streakText}</strong>
              <span>Next milestone: 7</span>
            </div>
            <div className="streak-bar">
              <span style={{ width: "71%" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="join-card compact">
        <div>
          <p className="section-label">Join Game</p>
          <p className="section-copy">{joinMessage}</p>
        </div>
        <div className="entry-stack">
          <label className="field">
            <span>Invite Code</span>
            <input value="BLR-PITCH-24" readOnly aria-label="Invite code" />
          </label>
          <div className="cta-row">
            <button className="secondary-button" type="button" onClick={handleJoinLeague}>
              Join League
            </button>
          </div>
        </div>
      </section>

      <section ref={homeRef} className="sticky-header">
        <div>
          <p className="section-label">Today&apos;s Matches</p>
          <h2>Tap a team. Done.</h2>
        </div>
        <div className="header-meta">
          <span className="pulse-dot" />
          <span>
            {urgentMatches > 0 ? `${urgentMatches} urgent IPL picks pending` : "Watching for the next IPL window"}
          </span>
        </div>
      </section>

      <section className="home-layout">
        <div className="main-column">
          <section className="match-feed">
            {matchState.map((match) => (
              <article key={match.id} className={`match-card ${match.boostExpanded ? "expanded" : ""}`}>
                <div className="match-topline">
                  <span className="lock-warning">{match.countdown}</span>
                  <span>{match.startTime}</span>
                </div>
                <div className="match-status-row">
                  <strong>{match.status}</strong>
                  <span>{match.venue}</span>
                </div>
                <div className="teams-row">
                  {match.teams.map((team) => (
                    <button
                      key={`${match.id}-${team.short}`}
                      type="button"
                      onClick={() => handleWinnerSelect(match.id, team.short)}
                      className={`team-button ${team.short === match.selectedWinner ? "selected" : ""}`}
                      style={{ ["--team-color" as string]: team.color }}
                    >
                      <span className="team-logo">{team.short}</span>
                      <span className="team-copy">
                        <strong>{team.short}</strong>
                        <small>{team.name}</small>
                        {team.pickRate ? <small>{team.pickRate}% users picked this side</small> : null}
                      </span>
                      {team.short === match.underdog ? <span className="mini-tag success">Underdog</span> : null}
                    </button>
                  ))}
                </div>

                <div className="prediction-state">
                  <span className="state-pill picked">
                    {match.selectedWinner ? `You picked ${match.selectedWinner}` : "Tap a team to lock instantly"}
                  </span>
                  <span className="state-pill subtle">{match.projectedRank}</span>
                  <span className="state-pill warning">{match.rankIfWrong}</span>
                </div>

                <div className="boost-prompt">
                  <div>
                    <p className="boost-title">Boost your prediction?</p>
                    <p className="helper-copy">
                      {match.activePowerUp ? `${match.activePowerUp} armed` : match.availablePowerUp}
                    </p>
                  </div>
                  <button className="quick-chip active" type="button" onClick={() => handleToggleBoost(match.id)}>
                    {match.boostExpanded ? "Boost open" : "Boost"}
                  </button>
                </div>

                {match.boostExpanded ? (
                  <div className="inline-boost">
                    <div className="block">
                      <p className="block-title">Confidence</p>
                      <div className="chip-row">
                        {confidenceOptions.map((option) => (
                          <button
                            key={`${match.id}-${option.label}`}
                            type="button"
                            onClick={() => handleConfidenceChange(match.id, option.label)}
                            className={`confidence-chip ${option.tone} ${
                              match.confidence === option.label ? "selected-chip" : ""
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="block">
                      <p className="block-title">Bonus prediction</p>
                      <div className="dropdown-grid">
                        <label className="field compact">
                          <span>Win margin</span>
                          <select value={match.bonus} onChange={(event) => handleBonusChange(match.id, event.target.value)}>
                            {bonusOptions.map((bonus) => (
                              <option key={bonus}>{bonus}</option>
                            ))}
                          </select>
                        </label>
                        <label className="field compact">
                          <span>Toss winner</span>
                          <select
                            value={match.tossWinner}
                            onChange={(event) => handleTossWinnerChange(match.id, event.target.value)}
                          >
                            <option>Optional</option>
                            <option>{match.teams[0].short}</option>
                            <option>{match.teams[1].short}</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="subtle-powerups">
                      {powerUps.map((powerUp) => (
                        <button
                          key={`${match.id}-${powerUp.label}`}
                          type="button"
                          onClick={() => handlePowerUp(match.id, powerUp.label)}
                          className={`power-indicator ${match.activePowerUp === powerUp.label ? "selected-chip" : ""}`}
                        >
                          <span>{powerUp.icon}</span>
                          <span>{powerUp.label}</span>
                          <small>{powerUp.remaining} left</small>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </section>

          <section className="panel events-panel">
            <div className="panel-head">
              <div>
                <p className="section-label">Live Events</p>
                <h3>Pressure, rivalry, and near misses</h3>
              </div>
            </div>
            <div className="feed-list">
              {eventState.map((item) => (
                <div key={item.id} className={`feed-card ${item.accent}`}>
                  <div className="event-topline">
                    <strong>{item.title}</strong>
                  </div>
                  <p>{item.detail}</p>
                  <div className="reaction-row">
                    {Object.entries(item.reactionCounts).map(([reaction, count]) => (
                      <button
                        key={`${item.id}-${reaction}`}
                        type="button"
                        className="reaction-chip"
                        onClick={() => handleReaction(item.id, reaction)}
                      >
                        {reaction} {count}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="side-column">
          <article ref={leaderboardRef} className="panel leaderboard-panel">
            <div className="panel-head">
              <div>
                <p className="section-label">Leaderboard</p>
                <h3>{leaderboardTab}</h3>
              </div>
            </div>
            <div className="tab-row">
              {leaderboardTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`tab ${leaderboardTab === tab ? "active" : ""}`}
                  onClick={() => setLeaderboardTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="goal-strip">
              <div className="goal-card">
                <span>Mini goal</span>
                <strong>{leaderboardTab === "Teams" ? "Beat Product today" : "Reach Top 10 today"}</strong>
              </div>
              <div className="goal-card">
                <span>Projected</span>
                <strong>{leaderboardTab === "Weekly" ? "Finish top 3 this week" : "If MI wins → #5"}</strong>
              </div>
            </div>

            {leaderboardTab === "Near You" ? (
              <div className="leaderboard-list near-you">
                {leaderboard.map((player) => (
                  <div key={player.rank} className={`leaderboard-row ${player.highlight ? "highlight" : ""}`}>
                    <span className="rank-cell">#{player.rank}</span>
                    <span className="avatar">{player.name.slice(0, 1)}</span>
                    <div className="leader-copy">
                      <strong>{player.name}</strong>
                      <small>
                        {player.team} · {player.accuracy}% accuracy
                      </small>
                    </div>
                    <div className="leader-score">
                      <strong>{player.points}</strong>
                      <small>{player.movement}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {leaderboardTab === "Teams" ? (
              <div className="sub-panels single-panel">
                <div className="mini-panel">
                  <p className="block-title">Team battle</p>
                  {teamBattle.map((team) => (
                    <div key={team.name} className="mini-row">
                      <span>{team.name}</span>
                      <strong>{team.points}</strong>
                      <small>{team.movement}</small>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {leaderboardTab === "Weekly" ? (
              <div className="sub-panels single-panel">
                <div className="mini-panel">
                  <p className="block-title">This week</p>
                  {weeklyLeaders.map((entry) => (
                    <div key={entry.name} className="mini-row stacked">
                      <span>{entry.name}</span>
                      <strong>{entry.points} pts</strong>
                      <small>{entry.note}</small>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </article>

          <article className="panel notification-panel">
            <div className="panel-head">
              <div>
                <p className="section-label">Alerts</p>
                <h3>Loss aversion hooks</h3>
              </div>
            </div>
            <div className="notification-stack">
              {notifications.map((item) => (
                <div key={item} className="notification-card">
                  <span className="notification-dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article ref={profileRef} className="panel profile-panel">
            <div className="panel-head">
              <div>
                <p className="section-label">Profile</p>
                <h3>{navTab === "Profile" ? "Identity layer" : "Your season"}</h3>
              </div>
            </div>
            <div className="profile-hero">
              <div className="profile-avatar">C</div>
              <div>
                <strong>Chethana</strong>
                <p>#12 overall · 69% accuracy</p>
              </div>
            </div>
            <div className="profile-stats">
              <div className="result-box">
                <span>Total predictions</span>
                <strong>{matchState.filter((match) => Boolean(match.selectedWinner)).length + 36}</strong>
              </div>
              <div className="result-box">
                <span>Current streak</span>
                <strong>{streakText.split(" ")[0]}</strong>
              </div>
            </div>
            <div className="badge-row">
              {profileBadges.map((badge) => (
                <span key={badge} className="badge-chip">
                  {badge}
                </span>
              ))}
            </div>
            <div className="inventory-grid compact-grid">
              {powerUps.map((powerUp) => (
                <div key={powerUp.label} className="inventory-card">
                  <div className="inventory-icon">{powerUp.icon}</div>
                  <strong>{powerUp.label}</strong>
                  <span>{powerUp.remaining} remaining</span>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <nav className="bottom-nav" aria-label="Bottom navigation">
        {navTabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`nav-item ${navTab === tab ? "active" : ""}`}
            onClick={() => handleNavClick(tab)}
          >
            <span className="nav-icon">{index === 0 ? "◉" : index === 1 ? "▣" : "◌"}</span>
            <span>{tab}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
