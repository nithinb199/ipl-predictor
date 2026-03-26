"use server";

import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { createManagedUser, updateUserRole, updateUserStatus, updateUserTeam } from "../../../lib/users";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "admin") {
    redirect("/");
  }
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const team = String(formData.get("team") ?? "").trim();

  if (!name || !email) {
    return;
  }

  await createManagedUser({
    name,
    email,
    team: team || null
  });
}

export async function changeUserRoleAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "");

  if (role === "admin" || role === "member") {
    await updateUserRole(email, role);
  }
}

export async function changeUserStatusAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";
  await updateUserStatus(email, isActive);
}

export async function changeUserTeamAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "");
  const team = String(formData.get("team") ?? "").trim();
  await updateUserTeam(email, team || null);
}
