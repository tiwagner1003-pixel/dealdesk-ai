import type { Metadata } from "next";
import Link from "next/link";
import { Rechtsseite } from "@/components/Rechtsseite";
import { ANBIETER } from "@/data/anbieter";
import { ChartFreigabeWiderruf } from "@/components/TradingViewChart";

export const metadata: Metadata = {
  title: "Datenschutz · DealDesk",
  description: "Was beim Besuch von DealDesk verarbeitet wird — und was im Browser bleibt.",
};

// Zur Laufzeit rendern: Ob ein KI-Schlüssel gesetzt ist, entscheidet über einen
// Absatz, und das darf nicht beim Bauen festgeschrieben werden.
export const dynamic = "force-dynamic";

/**
 * Die Erklärung beschreibt den tatsächlichen Zustand. Wer an der Verarbeitung
 * etwas ändert — eine KI mit Schlüssel, ein Analysewerkzeug, eine Schrift von
 * außen, ein Konto —, ändert zuerst diese Seite.
 */
export default function DatenschutzSeite() {
  // Ist ein KI-Schlüssel gesetzt, gehen Eingaben an Anthropic. Dann muss das
  // hier stehen — ohne Schlüssel beschriebe der Absatz eine Verarbeitung, die
  // es gar nicht gibt.
  const kiAktiv = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <Rechtsseite
      titel="Datenschutz"
      unterzeile="Informationen nach Artikel 13 der Datenschutz-Grundverordnung."
    >
      <section>
        <p className="legal-lead">
          DealDesk braucht kein Konto, setzt selbst keine Cookies und misst keine
          Reichweite. Ihre Fälle bleiben in Ihrem Browser. Inhalte von fremden Servern
          lädt die Seite nur, wenn Sie das ausdrücklich anklicken. Was beim Besuch
          trotzdem anfällt, steht hier.
        </p>
      </section>

      <section>
        <h2>Verantwortlicher</h2>
        <p>
          {ANBIETER.name}, {ANBIETER.strasse}, {ANBIETER.ort}<br/>
          E-Mail: <a href={`mailto:${ANBIETER.email}`}>{ANBIETER.email}</a>
        </p>
        <p>Vollständige Anbieterangaben im <Link href="/impressum">Impressum</Link>.</p>
      </section>

      <section>
        <h2>Aufruf der Seite und Hosting</h2>
        <p>
          Beim Aufruf überträgt der Browser technisch notwendige Verbindungsdaten an
          den Server: IP-Adresse, Zeitpunkt der Anfrage, die abgerufene Adresse, den
          Antwortstatus, die übertragene Datenmenge sowie die Kennung von Browser und
          Betriebssystem. Ohne diese Angaben lässt sich eine Seite nicht ausliefern.
        </p>
        <p>
          Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe f DSGVO. Das berechtigte
          Interesse liegt im fehlerfreien Betrieb der Seite und in ihrer Absicherung
          gegen missbräuchliche Zugriffe. Die Daten werden nicht mit anderen Quellen
          zusammengeführt, und es wird kein Profil gebildet.
        </p>
        <p>
          Die Seite wird bei Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723,
          Vereinigte Staaten, betrieben. Vercel verarbeitet die Verbindungsdaten in
          unserem Auftrag; die Verarbeitung findet überwiegend in den Vereinigten
          Staaten statt. Für die Übermittlung stützt sich der Anbieter auf die
          Standardvertragsklauseln der Europäischen Kommission nach dem
          Durchführungsbeschluss (EU) 2021/914. Einzelheiten im{" "}
          <a href="https://vercel.com/legal/dpa">Vertrag zur Auftragsverarbeitung</a>{" "}
          und in der{" "}
          <a href="https://vercel.com/legal/privacy-policy">Datenschutzerklärung des Anbieters</a>.
        </p>
      </section>

      <section>
        <h2>Ihre Fälle im Browser</h2>
        <p>
          Bewertungsfälle, geöffnete Tabs und die Wahl zwischen hellem und dunklem
          Schema werden im lokalen Speicher Ihres Browsers abgelegt
          (<code>localStorage</code>, Schlüssel <code>dealdesk:v1</code>). Diese Daten
          verlassen Ihr Gerät nicht und werden zu keinem Zeitpunkt an uns übertragen.
        </p>
        <p>
          Die Speicherung erfolgt ohne Einwilligung auf Grundlage von § 25 Absatz 2
          Nummer 2 des Telekommunikation-Digitale-Dienste-Datenschutz-Gesetzes: Sie ist
          erforderlich, damit der ausdrücklich gewünschte Dienst — die eigene Arbeit
          über mehrere Besuche hinweg zu behalten — zur Verfügung steht. Zu keinem
          anderen Zweck wird auf das Gerät zugegriffen.
        </p>
        <p>
          Löschen lässt sich der Stand jederzeit über „Reset samples“ in der
          Fallbibliothek oder über die Einstellungen Ihres Browsers. Exporte als
          PowerPoint, Excel oder CSV entstehen ebenfalls im Browser.
        </p>
      </section>

      <section>
        <h2>Kurse und Unternehmensdaten</h2>
        <p>
          Kurse und Kennzahlen ruft unser Server bei öffentlich zugänglichen Quellen ab —
          Yahoo Finance, Stooq und der US-Börsenaufsicht SEC (EDGAR). Übermittelt wird
          dabei nur das Tickersymbol. Ihre IP-Adresse und andere Angaben über Sie gehen
          an diese Anbieter nicht, weil die Abfrage vom Server und nicht von Ihrem
          Browser ausgeht.
        </p>
      </section>

      <section id="tradingview">
        <h2>Kurscharts von TradingView</h2>
        <p>
          Liefern diese Quellen keinen Kursverlauf, kann an seiner Stelle ein Chart von
          TradingView eingeblendet werden. Er wird erst geladen, wenn Sie auf „Load
          chart“ klicken. Vorher stellt Ihr Browser keine Verbindung zu TradingView her.
        </p>
        <p>
          Nach dem Klick lädt Ihr Browser Programmcode und Kursdaten unmittelbar von
          den Servern der TradingView Inc., 1330 Avenue of the Americas, 23rd Floor,
          New York, NY 10019, Vereinigte Staaten. Dabei erhält TradingView Ihre
          IP-Adresse, die Adresse dieser Seite sowie Angaben zu Browser und Gerät, und
          TradingView kann Cookies oder ähnliche Techniken auf Ihrem Gerät einsetzen.
          Was TradingView damit tut, verantwortet TradingView selbst; Einzelheiten in
          der{" "}
          <a href="https://www.tradingview.com/privacy-policy/">Datenschutzerklärung von TradingView</a>.
        </p>
        <p>
          Rechtsgrundlage ist Ihre Einwilligung nach Artikel 6 Absatz 1 Buchstabe a
          DSGVO und § 25 Absatz 1 TDDDG. Die Daten gehen in die Vereinigten Staaten.
          TradingView nennt in seiner Datenschutzerklärung kein bestimmtes
          Übermittlungsinstrument; die Übermittlung stützt sich deshalb auf Ihre
          ausdrückliche Einwilligung nach Artikel 49 Absatz 1 Buchstabe a DSGVO. Das
          bedeutet: Es ist nicht zugesichert, dass Ihre Daten dort so geschützt sind
          wie in der Europäischen Union, und Behörden in den Vereinigten Staaten können
          unter Umständen darauf zugreifen.
        </p>
        <p>
          Setzen Sie beim Laden das Häkchen „Remember“, merkt sich Ihr Browser diese
          Wahl im lokalen Speicher (Schlüssel <code>dealdesk:tradingview</code>), und
          Charts werden bei späteren Besuchen ohne erneuten Klick geladen. Ohne das
          Häkchen gilt die Freigabe nur für den einzelnen Chart. Widerrufen können Sie
          die gespeicherte Wahl jederzeit mit Wirkung für die Zukunft:
        </p>
        <ChartFreigabeWiderruf/>
      </section>

      <section>
        <h2>Co-Pilot, Memo und Dokumentanalyse</h2>
        {kiAktiv ? (
          <p>
            Fragen an den Co-Pilot, die Modelldaten eines Falls beim Erzeugen eines
            Memos und hochgeladene Dokumente werden zur Beantwortung an Anthropic PBC,
            548 Market Street, San Francisco, CA 94104, Vereinigte Staaten, übermittelt
            und dort durch ein Sprachmodell verarbeitet. Rechtsgrundlage ist Artikel 6
            Absatz 1 Buchstabe b DSGVO, weil die Antwort ohne die Übermittlung nicht
            entstehen kann. Geben Sie dort keine personenbezogenen oder vertraulichen
            Daten ein.
          </p>
        ) : (
          <p>
            Auf dieser Seite ist kein Sprachmodell angebunden. Fragen an den Co-Pilot und
            die Modelldaten beim Erzeugen eines Memos werden auf unserem Server
            regelbasiert beantwortet und dabei nicht gespeichert; ein auf der Seite
            „Analyse“ hochgeladenes Dokument wird weder ausgewertet noch gespeichert.
            An Dritte geht nichts davon.
          </p>
        )}
      </section>

      <section>
        <h2>Was es nicht gibt</h2>
        <ul>
          <li>Keine Reichweitenmessung, keine Analysewerkzeuge, kein Tracking.</li>
          <li>Keine eigenen Cookies.</li>
          <li>Keine Schriften, Skripte oder Bilder von fremden Servern — außer dem
            TradingView-Chart, und auch der nur nach Ihrem Klick.</li>
          <li>Kein Konto, kein Kontaktformular, kein Rundbrief.</li>
          <li>Keine Werbung und keine Weitergabe von Daten zu Werbezwecken.</li>
        </ul>
      </section>

      <section>
        <h2>Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft über die zu Ihnen verarbeiteten Daten
          (Artikel 15 DSGVO), auf Berichtigung (Artikel 16), auf Löschung (Artikel 17),
          auf Einschränkung der Verarbeitung (Artikel 18), auf Datenübertragbarkeit
          (Artikel 20) und auf Widerspruch gegen eine Verarbeitung, die auf einem
          berechtigten Interesse beruht (Artikel 21).
        </p>
        <p>
          Unabhängig davon können Sie sich bei einer Datenschutz-Aufsichtsbehörde
          beschweren (Artikel 77). Zuständig ist die Behörde des Bundeslandes, in dem
          der Verantwortliche seinen Sitz hat, oder die Ihres gewöhnlichen
          Aufenthaltsorts.
        </p>
        <p>
          Der Umfang ist hier klein: Über den Abruf hinaus liegen bei uns keine Daten
          über Sie vor, und Ihre Fälle befinden sich ausschließlich auf Ihrem eigenen Gerät.
        </p>
      </section>
    </Rechtsseite>
  );
}
