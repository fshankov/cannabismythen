import type { ScrollyStep } from './types';

/**
 * Source of truth for the v3 scrollytelling content during prototyping.
 * Iteration 2 (post-design-review): timeline, voice bubbles, indicator-ranked
 * bars, trust-use scatter. The Phase-A .mdoc stays untouched; copy back
 * during port-back.
 */
export const STEPS: ScrollyStep[] = [
  {
    stepNumber: 1,
    heading:
      'Hand aufs Herz:\nWie viel von dem, was du über Cannabis weißt, stimmt eigentlich?',
    bodyText:
      'Seit April 2024 ist Cannabis in Deutschland teil-legalisiert. In den zwei Jahren danach hat das Institut für interdisziplinäre Sucht- und Drogenforschung Hamburg (ISD) systematisch erforscht, was Menschen über diese Substanz glauben — und was die Forschung dazu sagt.\n\nVon der ersten Online-Befragung im Sommer 2024 über Literaturanalysen und eine groß angelegte Hauptbefragung 2025 bis zur Veröffentlichung 2026: Über zwei Jahre Forschungsarbeit für eine evidenzbasierte Cannabis-Aufklärung.',
    vizName: 'timeline',
  },
  {
    stepNumber: 2,
    heading: 'Jede:r in Deutschland\nhat eine Meinung über Cannabis.',
    bodyText:
      'Online, am Küchentisch, im Wartezimmer — Aussagen über Cannabis begleiten den Alltag. Manche plausibel, manche widersprüchlich, manche schlicht falsch.\n\nDas ISD sammelte sie systematisch: aus einer Online-Befragung von 1.041 Personen, aus Gesprächen mit 60 Präventionsfachkräften und aus einer Analyse einschlägiger (Online-)Medien. Die Größe einer Stimme spiegelt grob, wie verbreitet die jeweilige Annahme ist.',
    hint: 'Tippe auf eine Stimme, um sie zu lesen. ↓',
    vizName: 'peopleVoices',
  },
  {
    stepNumber: 3,
    heading:
      'Aus tausenden Stimmen\nblieben 42 prüfbare Thesen.',
    bodyText:
      'Die gesammelten Auffassungen wurden gebündelt, abstrahiert und thematisch sortiert. 42 Thesen, die als Mythen kursieren — manche stimmen, manche nicht.\n\nFarben markieren Themenfelder: körperliche Risiken, psychische Effekte, Soziales, Dosierung & Qualität, Recht, medizinischer Nutzen und allgemeine Gefährlichkeit.',
    vizName: 'mythGrid',
  },
  {
    stepNumber: 4,
    heading:
      'Jede These wurde\ngegen die Forschungsliteratur geprüft.',
    bodyText:
      'In einer systematischen Literaturanalyse wurde jede der 42 Thesen anhand der aktuellen wissenschaftlichen Evidenz bewertet — auf einer vierstufigen Skala: richtig, eher richtig, eher falsch, falsch.\n\n↑ 16 stimmen.\n↗ 6 stimmen eher.\n↙ 11 stimmen eher nicht.\n↓ 7 stimmen nicht.\n— Bei 2 Thesen lässt die aktuelle Forschungslage keine eindeutige Aussage zu.\n\nGrundlage: 39 Faktenblätter aus systematischen Reviews und Einzelstudien (PubMed, Web of Science, EUDA-Quellen — letzte 15 Jahre).',
    hint: 'Tippe auf eine Karte, um sie zu lesen. ↓',
    vizName: 'classificationReveal',
  },
  {
    stepNumber: 5,
    heading:
      'Dann fragten wir 2.795 Menschen,\nwas sie für richtig halten.',
    bodyText:
      'Eine Bevölkerungsbefragung in Deutschland mit 2.097 Erwachsenen (18–70 Jahre), 555 Minderjährigen (16–17 Jahre) und 143 Mitgliedern von Cannabis-Anbauvereinigungen — insgesamt 2.795 Personen.\n\nFür jede der 42 Thesen wurden fünf Indikatoren erhoben — über fünf Zielgruppen hinweg: Volljährige, Minderjährige, Konsumierende, junge Erwachsene und Eltern minderjähriger Kinder.',
    vizName: 'sampleAndIndicators',
  },
  {
    stepNumber: 6,
    heading: 'Drei Fragen.\nDrei Befunde.',
    bodyText:
      'Wer kennt was? Am bekanntesten: „Cannabis lindert Schmerzen“ — 77% der Konsumierenden. Am unbekanntesten: „Cannabis ist ein Allheilmittel“ — nur 12% der Erwachsenen kennen diese Aussage überhaupt.\n\nWer beurteilt richtig? Beim Thema Verkehrssicherheit liegen 92 von 100 Punkten bei den Erwachsenen — nahezu perfekte Übereinstimmung mit der Wissenschaft. Beim „generellen Motivationsverlust“ nur 25 von 100 Punkten — die Mehrheit liegt falsch.\n\nWelche Mythen brauchen Aufklärung? Die Präventionsbedeutung kombiniert persönliche Bedeutung und Wissenslücke. Drei Themen ragen heraus: „Cannabis lindert Schmerzen“ (34 Punkte), „Cannabis ist eine Einstiegsdroge“ (28 Punkte) — und für Minderjährige besonders: „Das Gesetz wird den Konsum erhöhen“ (23 Punkte).',
    hint: 'Scrolle weiter — die Top-10 wechseln in drei Phasen. ↓',
    vizName: 'indicatorRanked',
  },
  {
    stepNumber: 7,
    heading:
      'Wir vertrauen den Richtigen —\naber wir fragen sie nicht.',
    bodyText:
      'Arztpraxen und Apotheken genießen mit 92 Vertrauenspunkten die höchste Glaubwürdigkeit als Gesundheitsinformations-Quelle — in allen Zielgruppen.\n\nAber: Nur 37% der Minderjährigen suchen dort tatsächlich Informationen. Bei den Erwachsenen sind es 60%. Minderjährige fragen stattdessen Angehörige (53%) — die zwar ähnlich vertraut sind, aber selbst oft schlecht informiert.\n\nInfluencer:innen erhalten nur 49 von 100 Vertrauenspunkten — werden aber von 17% der Minderjährigen als Quelle für Gesundheitsinformationen genannt. Die Lücke zwischen Vertrauen (Y-Achse) und Nutzung (X-Achse) erklärt viel über die Entstehung von Cannabis-Mythen.',
    vizName: 'trustScatter',
  },
  {
    stepNumber: 8,
    heading: 'Was wir daraus gemacht haben.',
    bodyText:
      'Diese Website verwertet die Befunde der CaRM-Studie für unterschiedliche Bedürfnisse:\n\n— 42 Faktenkarten mit der wissenschaftlichen Klassifikation, Quellen und Erklärungen je Mythos.\n— Ein Selbsttest, der dein eigenes Wissen mit den Ergebnissen der Bevölkerungsbefragung vergleicht.\n— Vier Daten-Dashboards für allgemeines Publikum, Eltern, Präventionsfachkräfte und Forschung.\n— Häufige Fragen, sortiert nach Themen und Zielgruppen.',
    vizName: 'ctaGrid',
    ctaLabel: 'Zu den Faktenkarten',
    ctaUrl: '/fakten-karten/',
  },
  {
    stepNumber: 9,
    heading: 'Wer hinter der Studie steht.',
    bodyText:
      'Die CaRM-Studie wurde durchgeführt vom Institut für interdisziplinäre Sucht- und Drogenforschung Hamburg (ISD). Gefördert vom Bundesinstitut für Öffentliche Gesundheit (BIÖG). Mai 2026.',
    vizName: 'teamRow',
  },
];
