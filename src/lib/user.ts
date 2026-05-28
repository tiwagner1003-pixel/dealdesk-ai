export type AppUser = {
  email: string;
  name: string;
  role: string;            // Associate · M&A, Analyst, VP, etc.
  firm: string;
  initials: string;
  plan: "Free" | "Pro" | "Enterprise";
  avatar?: string;         // optional URL
};

/**
 * For real auth, wire this up to your auth provider's session hook.
 * See README → "Auth setup" — recommended: NextAuth.js v5 (Auth.js) with
 * Credentials + Google. For now this is a simple client store so the
 * Login → Dashboard → Workspace flow works end-to-end.
 */
export function buildDemoUser(): AppUser {
  return {
    email: "demo@deal-desk.ai",
    name: "Luca Schmidt",
    role: "Associate · M&A",
    firm: "Lakeshore Partners",
    initials: "LS",
    plan: "Pro",
  };
}

export function initialsOf(name: string) {
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}
