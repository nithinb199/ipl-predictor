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
import { HomeClient } from "./components/home-client";

export default async function Home() {
  const session = await auth();
  const { matches, sourceLabel, isLive } = await getIplMatches();
  const signedInUser = session?.user;

  return (
    <main className="app-shell">
      <div className="screen-frame">
        <section className="join-card compact auth-card">
          <div>
            <p className="section-label">League Access</p>
            <p className="section-copy">
              {signedInUser?.email
                ? `Signed in as ${signedInUser.name ?? signedInUser.email}`
                : "Use Google to join the office leaderboard and save your picks."}
            </p>
          </div>
          <div className="entry-stack">
            <div className="cta-row">
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

        <HomeClient
          matches={matches}
          sourceLabel={sourceLabel}
          isLive={isLive}
          leaderboard={leaderboard}
          teamBattle={teamBattle}
          weeklyLeaders={weeklyLeaders}
          homeEvents={homeEvents}
          notifications={notifications}
          profileBadges={profileBadges}
          powerUps={powerUps}
        />
      </div>
    </main>
  );
}
