import { promises as fs } from "node:fs";
import path from "node:path";
import { getSql, hasDatabaseUrl } from "./db";

export type ManagedUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  team: string | null;
  role: "admin" | "member";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

const USERS_FILE = path.join(process.cwd(), "data", "users.json");
let dbInitialized = false;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createId() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

async function ensureUsersFile() {
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
    await fs.writeFile(USERS_FILE, "[]\n", "utf8");
  }
}

async function writeUsers(users: ManagedUser[]) {
  await ensureUsersFile();
  await fs.writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

async function ensureUsersTable() {
  if (!hasDatabaseUrl() || dbInitialized) {
    return;
  }

  const sql = getSql();
  await sql`
    create table if not exists app_users (
      id text primary key,
      email text not null unique,
      name text not null,
      image text,
      team text,
      role text not null default 'member',
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      last_login_at timestamptz
    )
  `;
  dbInitialized = true;
}

function mapDbUser(row: {
  id: string;
  email: string;
  name: string;
  image: string | null;
  team: string | null;
  role: "admin" | "member";
  is_active: boolean;
  created_at: Date | string;
  last_login_at: Date | string | null;
}): ManagedUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
    team: row.team,
    role: row.role,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null
  };
}

export async function getUsers() {
  if (hasDatabaseUrl()) {
    await ensureUsersTable();
    const sql = getSql();
    const rows = await sql<{
      id: string;
      email: string;
      name: string;
      image: string | null;
      team: string | null;
      role: "admin" | "member";
      is_active: boolean;
      created_at: Date | string;
      last_login_at: Date | string | null;
    }[]>`
      select id, email, name, image, team, role, is_active, created_at, last_login_at
      from app_users
      order by name asc
    `;

    const users = rows.map(mapDbUser);
    const adminEmails = getAdminEmails();
    const promoted = users.map((user) =>
      adminEmails.includes(normalizeEmail(user.email)) && user.role !== "admin"
        ? { ...user, role: "admin" as const }
        : user
    );

    const changed = promoted.some((user, index) => user.role !== users[index]?.role);
    if (changed) {
      for (const user of promoted) {
        await sql`
          update app_users
          set role = ${user.role}
          where email = ${user.email}
        `;
      }
    }

    return promoted;
  }

  await ensureUsersFile();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  const users = JSON.parse(raw) as ManagedUser[];
  const adminEmails = getAdminEmails();

  let changed = false;
  const normalized = users.map((user) => {
    const shouldBeAdmin = adminEmails.includes(normalizeEmail(user.email));
    if (shouldBeAdmin && user.role !== "admin") {
      changed = true;
      return { ...user, role: "admin" as const };
    }
    return user;
  });

  if (changed) {
    await writeUsers(normalized);
  }

  return normalized.sort((a, b) => a.name.localeCompare(b.name));
}

export async function findUserByEmail(email: string) {
  const users = await getUsers();
  return users.find((user) => normalizeEmail(user.email) === normalizeEmail(email)) ?? null;
}

export async function upsertUserFromProfile(profile: {
  email: string;
  name: string;
  image: string | null;
}) {
  if (hasDatabaseUrl()) {
    await ensureUsersTable();
    const sql = getSql();
    const users = await getUsers();
    const email = normalizeEmail(profile.email);
    const now = new Date().toISOString();
    const adminEmails = getAdminEmails();
    const existingUser = users.find((user) => normalizeEmail(user.email) === email);
    const hasAdminUser = users.some((user) => user.role === "admin");
    const shouldBootstrapAdmin = adminEmails.length === 0 && !hasAdminUser;
    const role = adminEmails.includes(email) || shouldBootstrapAdmin ? "admin" : existingUser?.role ?? "member";

    const rows = await sql<{
      id: string;
      email: string;
      name: string;
      image: string | null;
      team: string | null;
      role: "admin" | "member";
      is_active: boolean;
      created_at: Date | string;
      last_login_at: Date | string | null;
    }[]>`
      insert into app_users (id, email, name, image, team, role, is_active, created_at, last_login_at)
      values (${existingUser?.id ?? createId()}, ${email}, ${profile.name}, ${profile.image}, ${existingUser?.team ?? null}, ${role}, ${existingUser?.isActive ?? true}, ${existingUser?.createdAt ?? now}, ${now})
      on conflict (email) do update
      set
        name = excluded.name,
        image = excluded.image,
        role = excluded.role,
        last_login_at = excluded.last_login_at
      returning id, email, name, image, team, role, is_active, created_at, last_login_at
    `;

    return rows[0] ? mapDbUser(rows[0]) : null;
  }

  const users = await getUsers();
  const email = normalizeEmail(profile.email);
  const now = new Date().toISOString();
  const adminEmails = getAdminEmails();
  const existingUser = users.find((user) => normalizeEmail(user.email) === email);
  const hasAdminUser = users.some((user) => user.role === "admin");
  const shouldBootstrapAdmin = adminEmails.length === 0 && !hasAdminUser;

  if (existingUser) {
    const updatedUsers = users.map((user) =>
      normalizeEmail(user.email) === email
        ? {
            ...user,
            name: profile.name,
            image: profile.image,
            role: adminEmails.includes(email) || shouldBootstrapAdmin ? "admin" : user.role,
            lastLoginAt: now
          }
        : user
    );

    await writeUsers(updatedUsers);
    return updatedUsers.find((user) => normalizeEmail(user.email) === email) ?? null;
  }

  const newUser: ManagedUser = {
    id: createId(),
    email,
    name: profile.name,
    image: profile.image,
    team: null,
    role: adminEmails.includes(email) || shouldBootstrapAdmin ? "admin" : "member",
    isActive: true,
    createdAt: now,
    lastLoginAt: now
  };

  await writeUsers([...users, newUser]);
  return newUser;
}

export async function createManagedUser(input: { email: string; name: string; team: string | null }) {
  if (hasDatabaseUrl()) {
    await ensureUsersTable();
    const sql = getSql();
    const users = await getUsers();
    const email = normalizeEmail(input.email);
    const existing = users.find((user) => normalizeEmail(user.email) === email);
    if (existing) {
      return { error: "A user with that email already exists." };
    }

    const adminEmails = getAdminEmails();
    const hasAdminUser = users.some((user) => user.role === "admin");
    const shouldBootstrapAdmin = adminEmails.length === 0 && !hasAdminUser;
    const now = new Date().toISOString();
    const role = adminEmails.includes(email) || shouldBootstrapAdmin ? "admin" : "member";

    const rows = await sql<{
      id: string;
      email: string;
      name: string;
      image: string | null;
      team: string | null;
      role: "admin" | "member";
      is_active: boolean;
      created_at: Date | string;
      last_login_at: Date | string | null;
    }[]>`
      insert into app_users (id, email, name, image, team, role, is_active, created_at, last_login_at)
      values (${createId()}, ${email}, ${input.name}, ${null}, ${input.team}, ${role}, ${true}, ${now}, ${null})
      returning id, email, name, image, team, role, is_active, created_at, last_login_at
    `;

    return rows[0] ? { user: mapDbUser(rows[0]) } : { error: "Failed to create user." };
  }

  const email = normalizeEmail(input.email);
  const existing = await findUserByEmail(email);
  if (existing) {
    return { error: "A user with that email already exists." };
  }

  const users = await getUsers();
  const adminEmails = getAdminEmails();
  const hasAdminUser = users.some((user) => user.role === "admin");
  const shouldBootstrapAdmin = adminEmails.length === 0 && !hasAdminUser;
  const now = new Date().toISOString();

  const newUser: ManagedUser = {
    id: createId(),
    email,
    name: input.name,
    image: null,
    team: input.team,
    role: adminEmails.includes(email) || shouldBootstrapAdmin ? "admin" : "member",
    isActive: true,
    createdAt: now,
    lastLoginAt: null
  };

  await writeUsers([...users, newUser]);
  return { user: newUser };
}

export async function updateUserRole(email: string, role: "admin" | "member") {
  if (hasDatabaseUrl()) {
    await ensureUsersTable();
    const sql = getSql();
    await sql`
      update app_users
      set role = ${role}
      where email = ${normalizeEmail(email)}
    `;
    return;
  }

  const users = await getUsers();
  const normalizedEmail = normalizeEmail(email);
  const updated = users.map((user) =>
    normalizeEmail(user.email) === normalizedEmail ? { ...user, role } : user
  );
  await writeUsers(updated);
}

export async function updateUserStatus(email: string, isActive: boolean) {
  if (hasDatabaseUrl()) {
    await ensureUsersTable();
    const sql = getSql();
    await sql`
      update app_users
      set is_active = ${isActive}
      where email = ${normalizeEmail(email)}
    `;
    return;
  }

  const users = await getUsers();
  const normalizedEmail = normalizeEmail(email);
  const updated = users.map((user) =>
    normalizeEmail(user.email) === normalizedEmail ? { ...user, isActive } : user
  );
  await writeUsers(updated);
}

export async function updateUserTeam(email: string, team: string | null) {
  if (hasDatabaseUrl()) {
    await ensureUsersTable();
    const sql = getSql();
    await sql`
      update app_users
      set team = ${team}
      where email = ${normalizeEmail(email)}
    `;
    return;
  }

  const users = await getUsers();
  const normalizedEmail = normalizeEmail(email);
  const updated = users.map((user) =>
    normalizeEmail(user.email) === normalizedEmail ? { ...user, team } : user
  );
  await writeUsers(updated);
}
