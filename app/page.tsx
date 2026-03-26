import Link from "next/link";
import { auth, googleAuthConfigured } from "../auth";
import {
  homeEvents,
  leaderboard,
  notifications,
  powerUps,
  profileBadges,
  teamBattle,
  weeklyLeaders
} from "../lib/data";
import { getIplMatches } from "../lib/ipl-data";
import { signInWithGoogle, signOutUser } from "./actions/auth";

const confidenceOptions = [
  { label: "1x", tone: "safe" },
  { label: "2x", tone: "push" },
  { label: "3x", tone: "chaos" }
];

const bonusOptions = ["10-20 runs", "21-35 runs", "Toss winner", "Win by wickets"];
const tabs = ["Home", "Leaderboard", "Profile"];

export default async function Home() {
  const session = await auth();
  const { matches: todayMatches, sourceLabel, isLive } = await getIplMatches();
  const urgentMatches = todayMatches.filter((match) => match.countdown.includes("Lock closes in")).length;
  const signedInUser = session?.user;

  return (
    <main className="app-shell">
      <div className="screen-frame">
        <section className="top-strip compact">
          <div>
            <p className="kicker">Daily Habit</p>
            <h1>IPL Predictor</h1>
          </div>
          <div className="header-stats">
            <span className="rank-pill">#12 ↑3</span>
            <span className="streak-pill">🔥 5 match streak</span>
          </div>
        </section>

        <section className="urgency-hero">
          <div className="urgency-main">
            <span className="alert-pill">
              {urgentMatches > 0 ? `${urgentMatches} matches closing soon` : "IPL schedule synced"}
            </span>
            <h2>Predict now before the locks hit.</h2>
            <p>One tap to lock your winner. Boost is optional.</p>
            <p className={`source-badge ${isLive ? "live" : "fallback"}`}>{sourceLabel}</p>
          </div>
          <div className="urgency-actions">
            <button className="primary-button">Predict Now</button>
            <div className="streak-card">
              <div className="streak-top">
                <strong>5 Match Streak</strong>
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
            <p className="section-copy">
              {signedInUser?.email
                ? `Signed in as ${signedInUser.name ?? signedInUser.email}`
                : "Minimal friction. Invite code in, office leaderboard on."}
            </p>
          </div>
          <div className="entry-stack">
            <label className="field">
              <span>Invite Code</span>
              <input value="BLR-PITCH-24" readOnly aria-label="Invite code" />
            </label>
            <div className="cta-row">
              <button className="secondary-button">Join League</button>
              {signedInUser?.email ? (
                <form action={signOutUser}>
                  <button className="secondary-button" type="submit">
                    Sign out
                  </button>
                </form>
              ) : googleAuthConfigured ? (
                <form action={signInWithGoogle}>
                  <button className="secondary-button" type="submit">
                    Continue with Google
                  </button>
                </form>
              ) : (
                <button className="secondary-button" type="button" disabled>
                  Continue with Google
                </button>
              )}
              {signedInUser?.role === "admin" ? (
                <Link href="/admin/users" className="secondary-link-button">
                  Manage users
                </Link>
              ) : null}
            </div>
            {!googleAuthConfigured ? (
              <p className="helper-copy">
                Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `AUTH_SECRET` to enable Google login.
              </p>
            ) : null}
          </div>
        </section>

        <section className="sticky-header">
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
              {todayMatches.map((match) => (
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
                      <p className="helper-copy">{match.availablePowerUp}</p>
                    </div>
                    <button className="quick-chip active">{match.boostExpanded ? "Boost open" : "Boost"}</button>
                  </div>

                  {match.boostExpanded ? (
                    <div className="inline-boost">
                      <div className="block">
                        <p className="block-title">Confidence</p>
                        <div className="chip-row">
                          {confidenceOptions.map((option) => (
                            <button key={option.label} className={`confidence-chip ${option.tone}`}>
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
                            <select defaultValue="10-20 runs">
                              {bonusOptions.map((bonus) => (
                                <option key={bonus}>{bonus}</option>
                              ))}
                            </select>
                          </label>
                          <label className="field compact">
                            <span>Toss winner</span>
                            <select defaultValue="Optional">
                              <option>Optional</option>
                              <option>{match.teams[0].short}</option>
                              <option>{match.teams[1].short}</option>
                            </select>
                          </label>
                        </div>
                      </div>

                      <div className="subtle-powerups">
                        {powerUps.map((powerUp) => (
                          <button key={powerUp.label} className="power-indicator">
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
                {homeEvents.map((item) => (
                  <div key={item.id} className={`feed-card ${item.accent}`}>
                    <div className="event-topline">
                      <strong>{item.title}</strong>
                    </div>
                    <p>{item.detail}</p>
                    {item.reactions ? (
                      <div className="reaction-row">
                        {item.reactions.map((reaction) => (
                          <button key={reaction} className="reaction-chip">
                            {reaction}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="side-column">
            <article className="panel leaderboard-panel">
              <div className="panel-head">
                <div>
                  <p className="section-label">Leaderboard</p>
                  <h3>Near you</h3>
                </div>
              </div>
              <div className="tab-row">
                <button className="tab active">Near You</button>
                <button className="tab">Teams</button>
                <button className="tab">Weekly</button>
              </div>
              <div className="goal-strip">
                <div className="goal-card">
                  <span>Mini goal</span>
                  <strong>Reach Top 10 today</strong>
                </div>
                <div className="goal-card">
                  <span>Projected</span>
                  <strong>If MI wins → #5</strong>
                </div>
              </div>
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

              <div className="sub-panels">
                <div className="mini-panel">
                  <p className="block-title">Beat your team</p>
                  {teamBattle.map((team) => (
                    <div key={team.name} className="mini-row">
                      <span>{team.name}</span>
                      <strong>{team.points}</strong>
                      <small>{team.movement}</small>
                    </div>
                  ))}
                </div>
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
              <p className="helper-copy">Add your CricAPI key in `.env.local` to replace demo scheduling with live IPL fixtures.</p>
            </article>

            <article className="panel profile-panel">
              <div className="panel-head">
                <div>
                  <p className="section-label">Profile</p>
                  <h3>Identity layer</h3>
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
                  <strong>38</strong>
                </div>
                <div className="result-box">
                  <span>Current streak</span>
                  <strong>5</strong>
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
          {tabs.map((tab, index) => (
            <button key={tab} className={`nav-item ${index === 0 ? "active" : ""}`}>
              <span className="nav-icon">{index === 0 ? "◉" : index === 1 ? "▣" : "◌"}</span>
              <span>{tab}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
