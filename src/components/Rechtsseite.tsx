import Link from "next/link";

/** Gemeinsamer Rahmen für Impressum und Datenschutz: schlicht, deutsch, lesbar. */
export function Rechtsseite({ titel, unterzeile, children }: {
  titel: string;
  unterzeile: string;
  children: React.ReactNode;
}) {
  return (
    <div className="legal" lang="de">
      <header className="legal-head">
        <Link href="/" className="legal-back">← Zurück zu DealDesk</Link>
        <h1>{titel}</h1>
        <p>{unterzeile}</p>
      </header>
      <main className="legal-body">{children}</main>
      <footer className="legal-foot">
        <Link href="/methodology">Methodology</Link> · <Link href="/impressum">Impressum</Link> · <Link href="/datenschutz">Datenschutz</Link>
      </footer>
    </div>
  );
}
