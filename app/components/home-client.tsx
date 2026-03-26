"use client";

import { useMemo, useRef, useState } from "react";
import type { MatchCard, PowerUp } from "../../lib/data";

type HomeClientProps = {
  matches: MatchCard[];
  sourceLabel: string;
  isLive: boolean;
  powerUps: PowerUp[];
};

const confidenceOptions = [
  { label: "1x", tone: "safe" },
  { label: "2x", tone: "push" },
  { label: "3x", tone: "chaos" }
] as const;

const bonusOptions = ["10-20 runs", "21-35 runs", "Toss winner", "Win by wickets"];

type InteractiveMatch = MatchCard & {
  confidence: string;
  bonus: string;
  tossWinner: string;
  activePowerUp: string | null;
};

function buildInteractiveMatch(match: MatchCard): InteractiveMatch {
  return {
    ...match,
    confidence: "1x",
    bonus: "10-20 runs",
    tossWinner: "Optional",
    activePowerUp: null
  };
}

function nextStatus(teamShort: string, confidence: string, powerUp: string | null) {
  const boostCopy = powerUp ? ` with ${powerUp}` : confidence !== "1x" ? ` at ${confidence}` : "";
  return `Locked on ${teamShort}${boostCopy}`;
}

export function HomeClient({ matches, sourceLabel, isLive, powerUps }: HomeClientProps) {
  const [joinMessage, setJoinMessage] = useState("Invite code ready. Join the office league in one tap.");
  const [matchState, setMatchState] = useState(() => matches.map(buildInteractiveMatch));
  const matchListRef = useRef<HTMLElement | null>(null);

  const urgentMatches = useMemo(
    () => matchState.filter((match) => match.countdown.includes("Lock closes in") && !match.selectedWinner).length,
    [matchState]
  );

  const streakText = useMemo(() => {
    const lockedCount = matchState.filter((match) => Boolean(match.selectedWinner)).length;
    return `${Math.max(1, lockedCount)} locked today`;
  }, [matchState]);

  function updateMatch(matchId: string, updater: (match: InteractiveMatch) => InteractiveMatch) {
    setMatchState((current) => current.map((match) => (match.id === matchId ? updater(match) : match)));
  }

  function handlePredictNow() {
    matchListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleJoinLeague() {
    setJoinMessage("League joined. Your picks will count on the office board.");
  }

  function handleWinnerSelect(matchId: string, teamShort: string) {
    updateMatch(matchId, (match) => ({
      ...match,
      selectedWinner: teamShort,
      status: nextStatus(teamShort, match.confidence, match.activePowerUp),
      projectedRank: `Pick saved for ${teamShort}`,
      rankIfWrong: "You can still adjust your boost before lock"
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
    updateMatch(matchId, (match) => {
      const nextPowerUp = match.activePowerUp === powerUpLabel ? null : powerUpLabel;

      return {
        ...match,
        activePowerUp: nextPowerUp,
        status: match.selectedWinner ? nextStatus(match.selectedWinner, match.confidence, nextPowerUp) : match.status
      };
    });
  }

  return (
    <>
      <section className="top-strip compact">
        <div>
          <p className="kicker">Today&apos;s Matches</p>
          <h1>IPL Predictor</h1>
        </div>
        <div className="header-stats">
          <span className="alert-pill">{urgentMatches > 0 ? `${urgentMatches} closing soon` : "No urgent locks"}</span>
          <span className="streak-pill">{streakText}</span>
        </div>
      </section>

      <section className="urgency-hero compact-hero">
        <div className="urgency-main">
          <h2>Pick the winner first. Boost only if you want.</h2>
          <p>Real IPL fixtures load here first so the daily loop stays fast.</p>
          <p className={`source-badge ${isLive ? "live" : "fallback"}`}>{sourceLabel}</p>
        </div>
        <div className="urgency-actions">
          <button className="primary-button" type="button" onClick={handlePredictNow}>
            Jump to Matches
          </button>
        </div>
      </section>

      <section ref={matchListRef} className="match-list-shell">
        <div className="sticky-header static-header">
          <div>
            <p className="section-label">Live Match Feed</p>
            <h2>Tap a team. Done.</h2>
          </div>
          <div className="header-meta">
            <span className="pulse-dot" />
            <span>{urgentMatches > 0 ? `${urgentMatches} predictions still pending` : "All visible matches are covered"}</span>
          </div>
        </div>

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
                  {match.boostExpanded ? "Hide boost" : "Boost"}
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
      </section>

      <section className="join-card compact streamlined-card">
        <div>
          <p className="section-label">League Access</p>
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
    </>
  );
}
