import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { sessionOptions, type SessionData } from "./session";
import { isStaff, isManager, isAdmin } from "./roles";

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Utilisateur courant (ou null), avec son unité/bâtiment rattaché si présent. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { unit: { include: { building: true } } },
  });

  // Session obsolète (utilisateur supprimé) -> on ignore.
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Exige un utilisateur connecté (peu importe le statut). */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}

/** Exige un compte connecté ET approuvé. */
export async function requireApproved(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.status !== "APPROVED") redirect("/en-attente");
  return user;
}

/** Exige un membre de l'équipe (modérateur, sous-admin ou admin). */
export async function requireStaff(): Promise<CurrentUser> {
  const user = await requireApproved();
  if (!isStaff(user.role)) redirect("/accueil");
  return user;
}

/** Exige un sous-admin ou admin (gestion du contenu et des comptes). */
export async function requireManager(): Promise<CurrentUser> {
  const user = await requireApproved();
  if (!isManager(user.role)) redirect("/accueil");
  return user;
}

/** Exige le référent principal (admin) : rôles, sauvegarde. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireApproved();
  if (!isAdmin(user.role)) redirect("/accueil");
  return user;
}

/** Détruit la session courante. */
export async function destroySession() {
  const session = await getSession();
  session.destroy();
}

/** Crée la session pour un utilisateur donné. */
export async function createSessionFor(user: {
  id: string;
  role: SessionData["role"];
  status: SessionData["status"];
}) {
  const session = await getSession();
  session.userId = user.id;
  session.role = user.role;
  session.status = user.status;
  await session.save();
}
