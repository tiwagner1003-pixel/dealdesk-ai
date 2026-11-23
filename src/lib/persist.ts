/**
 * Arbeitsstand im Browser halten — DealDesk hat kein Konto mehr, also ist der
 * localStorage der einzige Ort, an dem Fälle einen Neuladen überleben.
 * Alles hier ist absichtlich fehlertolerant: Privates Fenster, voller Speicher
 * oder blockierte Site-Daten dürfen die App nie brechen, nur das Speichern.
 */

const KEY = "dealdesk:v1";

export type Persisted<C> = {
  version: 1;
  cases: C[];
  openCases: string[];
  activeCase: string;
  theme: "light" | "dark";
  /** Stand der Beispielfälle, mit dem gespeichert wurde. Fehlt bei Ständen vor dem 23.11.2026. */
  beispielStand?: string;
};

export function loadState<C extends { id: string }>(): Persisted<C> | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Persisted<C>;
    if (data?.version !== 1 || !Array.isArray(data.cases)) return null;
    const ids = new Set(data.cases.map((c) => c.id));
    return {
      version: 1,
      cases: data.cases,
      openCases: Array.isArray(data.openCases) ? data.openCases.filter((id) => ids.has(id)) : [],
      activeCase: ids.has(data.activeCase) ? data.activeCase : (data.cases[0]?.id ?? ""),
      theme: data.theme === "dark" ? "dark" : "light",
      beispielStand: typeof data.beispielStand === "string" ? data.beispielStand : undefined,
    };
  } catch {
    return null;
  }
}

/** Gibt false zurück, wenn der Browser das Speichern verweigert. */
export function saveState<C>(state: Persisted<C>): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState() {
  try { window.localStorage.removeItem(KEY); } catch { /* nichts zu tun */ }
}
