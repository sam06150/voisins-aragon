import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Nom du cookie de session (doit correspondre à lib/session.ts).
// Volontairement en littéral : le proxy s'exécute côté edge et ne doit pas
// dépendre du module de session (qui valide SESSION_SECRET au chargement).
const SESSION_COOKIE = "aragon_session";

const PROTECTED_PREFIXES = [
  "/accueil",
  "/annuaire",
  "/incidents",
  "/forum",
  "/annonces",
  "/reunions",
  "/documents",
  "/admin",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (!isProtected) return NextResponse.next();

  // Contrôle léger de présence du cookie ; la vérification autoritaire
  // (utilisateur existant + statut APPROVED) est faite dans les layouts serveur.
  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
