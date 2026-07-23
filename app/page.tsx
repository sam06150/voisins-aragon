import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  // Visiteur non connecté : la racine du domaine est l'entrée publique
  // (adresse imprimée sur l'affiche et mise en bio des réseaux sociaux).
  // La page de connexion reste accessible directement via /connexion.
  if (!user) redirect("/rejoindre");
  if (user.status !== "APPROVED") redirect("/en-attente");
  redirect("/accueil");
}
