import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import {
  changeUserRoleAction,
  changeUserStatusAction,
  changeUserTeamAction,
  createUserAction
} from "./actions";
import { getUsers } from "../../../lib/users";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "admin") {
    redirect("/");
  }

  const users = await getUsers();

  return (
    <main className="app-shell">
      <div className="screen-frame">
        <section className="top-strip compact">
          <div>
            <p className="kicker">Admin</p>
            <h1>User Management</h1>
          </div>
          <div className="header-stats">
            <Link href="/" className="secondary-link-button">
              Back to home
            </Link>
          </div>
        </section>

        <section className="admin-layout">
          <article className="panel admin-create-panel">
            <div className="panel-head">
              <div>
                <p className="section-label">Add user</p>
                <h3>Create or pre-stage office accounts</h3>
              </div>
            </div>
            <form action={createUserAction} className="admin-form">
              <label className="field">
                <span>Name</span>
                <input name="name" placeholder="Rahul Sharma" />
              </label>
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" placeholder="rahul@company.com" />
              </label>
              <label className="field">
                <span>Team</span>
                <input name="team" placeholder="Engineering" />
              </label>
              <button className="primary-button" type="submit">
                Add user
              </button>
            </form>
          </article>

          <article className="panel admin-users-panel">
            <div className="panel-head">
              <div>
                <p className="section-label">Users</p>
                <h3>Manage access, roles, and team assignment</h3>
              </div>
            </div>

            <div className="admin-user-list">
              {users.map((user) => (
                <div key={user.id} className="admin-user-card">
                  <div className="admin-user-head">
                    <div>
                      <strong>{user.name}</strong>
                      <p className="helper-copy">{user.email}</p>
                    </div>
                    <div className="admin-user-badges">
                      <span className={`badge-chip ${user.role === "admin" ? "admin-badge" : ""}`}>{user.role}</span>
                      <span className={`badge-chip ${user.isActive ? "active-badge" : "inactive-badge"}`}>
                        {user.isActive ? "active" : "disabled"}
                      </span>
                    </div>
                  </div>

                  <div className="admin-user-grid">
                    <form action={changeUserRoleAction} className="inline-form">
                      <input type="hidden" name="email" value={user.email} />
                      <label className="field compact">
                        <span>Role</span>
                        <select name="role" defaultValue={user.role}>
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                        </select>
                      </label>
                      <button className="secondary-button" type="submit">
                        Update role
                      </button>
                    </form>

                    <form action={changeUserTeamAction} className="inline-form">
                      <input type="hidden" name="email" value={user.email} />
                      <label className="field compact">
                        <span>Team</span>
                        <input name="team" defaultValue={user.team ?? ""} placeholder="Engineering" />
                      </label>
                      <button className="secondary-button" type="submit">
                        Save team
                      </button>
                    </form>

                    <form action={changeUserStatusAction} className="inline-form">
                      <input type="hidden" name="email" value={user.email} />
                      <input type="hidden" name="isActive" value={String(!user.isActive)} />
                      <button className="secondary-button" type="submit">
                        {user.isActive ? "Disable user" : "Re-enable user"}
                      </button>
                    </form>
                  </div>

                  <div className="admin-user-meta">
                    <span>Team: {user.team ?? "Unassigned"}</span>
                    <span>
                      Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("en-IN") : "Never"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
