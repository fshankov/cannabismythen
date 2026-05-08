import type { ScrollyStep } from './types';

/**
 * Source of truth for the v3 scrollytelling content during prototyping.
 * Mirrors src/content/startseite/scrollytelling-v3.mdoc while keeping
 * the Round-2 visualization mapping.
 */
export const STEPS: ScrollyStep[] = [
  {
    stepNumber: 1,
    heading:
      'Hand aufs Herz:\nWie viel von dem, was du über Cannabis weißt, stimmt eigentlich?',
    bodyText:
      'Im April 2024 wurde Cannabis in Deutschland teil-legalisiert. Mit dem Konsumcannabisgesetz endete eine jahrzehntelange Verbotskultur. Plötzlich stehen Fragen im Raum, die zuvor selten öffentlich gestellt wurden — und alle haben Meinungen dazu.\n\nDas Institut für interdisziplinäre Sucht- und Drogenforschung Hamburg (ISD) wollte es genau wissen: Was glaubt die Bevölkerung tatsächlich über diese Substanz — und wie viel davon stimmt?',
    vizName: 'timeline',
  },
  {
    stepNumber: 2,
    heading: 'Jede:r in Deutschland\nhat eine Meinung über Cannabis.',
    bodyText:
      'Online, am Küchentisch, im Wartezimmer. Das ISD sammelte Aussagen systematisch: aus einer Online-Befragung von 1.041 Personen, aus Gesprächen mit 60 Präventionsfachkräften und aus einer Analyse einschlägiger (Online-)Medien.\n\nWas Menschen so sagen — manches plausibel, manches widersprüchlich, manches schlicht falsch.',
    hint: 'Tippe auf eine Stimme, um sie zu lesen. ↓',
    vizName: 'peopleVoices',
  },
  {
    stepNumber: 3,
    heading:
      'Aus tausenden Stimmen\nblieben 42 prüfbare Thesen.',
    bodyText:
      'Die gesammelten Auffassungen wurden gebündelt, abstrahiert und thematisch sortiert: substanzbezogen, übergreifend, körperlich, psychisch, kombiniert, sozial und rechtlich.\n\n42 Thesen, die als Mythen kursieren — manche stimmen, manche nicht.',
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
      'Eine Bevölkerungsbefragung in Deutschland mit 2.097 Erwachsenen (18–70 Jahre), 555 Minderjährigen (16–17 Jahre) und 143 Mitgliedern von Cannabis-Anbauvereinigungen.\n\nFür jede der 42 Thesen wurden fünf Indikatoren erhoben — über fünf Zielgruppen hinweg: Volljährige, Minderjährige, Konsumierende, junge Erwachsene und Eltern minderjähriger Kinder.',
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
      'Arztpraxen und Apotheken genießen mit 92 Vertrauenspunkten die höchste Glaubwürdigkeit als Gesundheitsinformations-Quelle — in allen Zielgruppen.\n\nAber: Nur 37% der Minderjährigen suchen dort tatsächlich Informationen. Bei den Erwachsenen sind es 60%. Minderjährige fragen stattdessen Angehörige (53%) — die zwar ähnlich vertraut sind, aber selbst oft schlecht informiert.\n\nInfluencer:innen erhalten nur 49 von 100 Vertrauenspunkten — werden aber von 17% der Minderjährigen als Quelle für Gesundheitsinformationen genannt.',
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
