import type { Metadata } from "next";
import Link from "next/link";
import { Rechtsseite } from "@/components/Rechtsseite";
import { ANBIETER } from "@/data/anbieter";

export const metadata: Metadata = {
  title: "Impressum · DealDesk",
  description: "Anbieterkennzeichnung und Verantwortlichkeit für DealDesk.",
};

export default function ImpressumSeite() {
  return (
    <Rechtsseite titel="Impressum" unterzeile="Angaben nach § 5 Digitale-Dienste-Gesetz.">
      <section>
        <h2>Diensteanbieter</h2>
        <p>
          {ANBIETER.name}<br/>
          {ANBIETER.strasse}<br/>
          {ANBIETER.ort}
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>E-Mail: <a href={`mailto:${ANBIETER.email}`}>{ANBIETER.email}</a></p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt</h2>
        <p>{ANBIETER.name}, Anschrift wie oben.</p>
      </section>

      <section>
        <h2>Zu den Inhalten</h2>
        <p>
          DealDesk ist ein unentgeltliches Lernprojekt zur Unternehmensbewertung
          (Discounted Cash Flow, Vergleichsunternehmen, Leveraged Buy-out). Die
          Beispielfälle, ihre Bearbeiter und die Firmennamen darin sind erfunden.
          Bewertungen, Kursziele und Memos, die die Anwendung errechnet oder entwirft,
          ergeben sich allein aus den eingegebenen Annahmen.
        </p>
        <p>
          <strong>Nichts auf dieser Seite ist eine Anlageberatung, eine
          Anlageempfehlung oder eine Aufforderung zum Kauf oder Verkauf von
          Wertpapieren.</strong> Kurse stammen aus öffentlich zugänglichen Quellen,
          können verzögert sein und werden bei einem Ausfall durch Beispielwerte
          ersetzt; die Anwendung kennzeichnet das. Für Richtigkeit und
          Vollständigkeit der Kurse und Kennzahlen wird keine Gewähr übernommen.
        </p>
        <p>
          Für die Inhalte verlinkter fremder Seiten ist deren jeweiliger Anbieter
          verantwortlich. Wie Daten beim Besuch verarbeitet werden, steht unter{" "}
          <Link href="/datenschutz">Datenschutz</Link>.
        </p>
        <p className="legal-small">
          Zur Streitbeilegung: Es besteht keine Bereitschaft und keine Verpflichtung
          zur Teilnahme an einem Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle.
        </p>
      </section>
    </Rechtsseite>
  );
}
