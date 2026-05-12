import type { ScrollyStep } from './types';

/**
 * Source of truth for the v3 scrollytelling content during prototyping.
 * Iter-3: 10 steps total. Steps 3+4 share VizMythGrid (gridMode prop);
 * steps 5+6 share VizSampleAndRanked (sampleRankedMode prop); steps 7+8
 * share VizSourcesStrips (sourcesPair prop). Step 9 = CTAs, step 10 = team.
 */
export const STEPS: ScrollyStep[] = [
  {
    stepNumber: 1,
    heading:
      'Hand aufs Herz:\nWie viel von dem, was du über Cannabis weißt, stimmt eigentlich?',
    bodyText:
      'Im April 2024 wurde Cannabis in Deutschland teil-legalisiert. Das Konsumcannabisgesetz beendete eine jahrzehntelange Verbotskultur. Auf einmal stehen Fragen im Raum, die vorher selten gestellt wurden — und alle haben eine Meinung dazu.\n\nDas Institut für interdisziplinäre Sucht- und Drogenforschung Hamburg (ISD) wollte es genau wissen: Was glaubt die Bevölkerung wirklich über Cannabis — und wie viel davon stimmt?',
    vizName: 'timeline',
  },
  {
    stepNumber: 2,
    heading: 'Jede:r in Deutschland\nhat eine Meinung über Cannabis.',
    bodyText:
      'Online, am Küchentisch, im Wartezimmer — Cannabis ist ein Thema. Das ISD sammelte Aussagen systematisch: eine Online-Befragung von 1.041 Personen, Gespräche mit 60 Präventionsfachkräften, eine Analyse einschlägiger (Online-)Medien.\n\nManches klingt plausibel, manches widersprüchlich. Was davon stimmt eigentlich? Genau das wollten wir herausfinden.',
    hint: 'Tippe auf eine Stimme, um sie zu lesen. ↓',
    vizName: 'peopleVoices',
  },
  {
    stepNumber: 3,
    heading: 'Aus tausenden Stimmen\nblieben 42 prüfbare Thesen.',
    bodyText:
      'Drei Quellen, gegeneinander abgeglichen: Online-Befragung, Fachgespräche, Medienanalyse. Aussagen, die immer wieder auftauchten, wurden gebündelt und zu prüfbaren Thesen verdichtet. Dann thematisch sortiert: medizinisch, körperlich, psychisch, kombiniert, sozial, rechtlich.\n\n42 Thesen blieben übrig. Manche stimmen, manche nicht.',
    vizName: 'mythGrid',
    gridMode: 'themed',
  },
  {
    stepNumber: 4,
    heading: 'Jede These wurde\ngegen die Forschungsliteratur geprüft.',
    bodyText:
      'Jede der 42 Thesen geprüft — gegen die aktuelle wissenschaftliche Evidenz. Vierstufige Skala: richtig, eher richtig, eher falsch, falsch.\n\n↑ 16 stimmen.\n↗ 6 stimmen eher.\n↙ 11 stimmen eher nicht.\n↓ 7 stimmen nicht.\n— Bei 2 Thesen lässt die Forschungslage keine eindeutige Aussage zu.\n\nGrundlage: 548 wissenschaftliche Quellen aus PubMed, PsychInfo, SocIndex und Google Scholar (Stand: September 2025).',
    hint: 'Tippe auf eine Karte, um sie zu lesen. ↓',
    vizName: 'mythGrid',
    gridMode: 'classified',
  },
  {
    stepNumber: 5,
    heading: 'Dann fragten wir 2.795 Menschen,\nwas sie für richtig halten.',
    bodyText:
      'Bevölkerungsbefragung in Deutschland: 2.097 Erwachsene (18–70 Jahre), 555 Minderjährige (16–17 Jahre), 143 Mitglieder von Cannabis-Anbauvereinigungen.\n\nFür jede der 42 Thesen erhoben wir fünf Indikatoren — über fünf Zielgruppen hinweg: Volljährige, Minderjährige, Konsumierende, junge Erwachsene und Eltern minderjähriger Kinder.',
    vizName: 'sampleAndRanked',
    sampleRankedMode: 'sample',
    chips: [{ label: 'Mehr zur Methodik', popoverKey: 'methodik' }],
  },
  {
    stepNumber: 6,
    heading: 'Was sie wissen.\nWas sie glauben.',
    bodyText:
      '**Kenntnis** — 77 % der Konsumierenden kennen „Cannabis lindert Schmerzen“ [↙ eher falsch]. „Cannabis ist ein Allheilmittel“ [↓ falsch] kennen dagegen nur 12 % der Erwachsenen.\n\n**Bedeutung** — was Menschen kennen, wiegt für sie meist auch schwerer. Beide Werte laufen eng zusammen.\n\n**Richtigkeit** — „Cannabis gefährdet die Verkehrssicherheit“ [↑ richtig] kommt bei Erwachsenen auf 92 von 100, fast Konsens. „Cannabis verursacht Motivationsverlust“ [↓ falsch] nur 25 — die Mehrheit liegt daneben.\n\n**Präventionsbedeutung** — wo prägt ein falsches Bild Verhalten? Genau dort lohnt sich Aufklärung am meisten.\n\n**Bevölkerungsrisiko** — ein verbreiteter Halbmythos erreicht mehr Köpfe als ein obskurer. Sinnvoll nur für Voll- und Minderjährige.',
    vizName: 'sampleAndRanked',
    sampleRankedMode: 'ranked-1',
  },
  {
    stepNumber: 7,
    heading: 'Wo wir suchen.\nWem wir vertrauen.',
    bodyText:
      '**Suche** — Apotheken und Arztpraxen führen bei Erwachsenen (60 %). Minderjährige greifen dort nur zu 37 % zu und fragen lieber Angehörige (53 %). Foren und Influencer:innen sind vor allem für jüngere Gruppen relevant.\n\n**Vertrauen** — Apotheken erreichen 92 Punkte, in allen Zielgruppen. Doch wer dort vertraut, sucht nicht zwangsläufig dort. Die Lücke zwischen Vertrauen und Nutzung ist der eigentliche Befund.',
    vizName: 'sourcesStrips',
  },
  {
    stepNumber: 8,
    heading: 'Was uns nebenbei erreicht.\nWo Aufklärung am meisten bewegt.',
    bodyText:
      '**Wahrnehmung** — Nicht aktiv gesuchten Informationen begegnen wir in Radio, Fernsehen, auf Plakaten und Infoscreens. Wir vertrauen ihnen weniger, sie erreichen uns trotzdem.\n\n**Prävention** — Wahrnehmung × Vertrauen ergibt das Präventionspotenzial. Die größten Hebel liegen dort, wo Reichweite und Vertrauen zusammenfallen — nicht dort, wo Information am häufigsten landet.',
    vizName: 'sourcesStrips',
  },
  {
    stepNumber: 9,
    heading: 'Was wir daraus gemacht haben.',
    bodyText:
      'Diese Website verwertet die Befunde der CaRM-Studie für unterschiedliche Bedürfnisse:\n\n— 42 Faktenkarten mit wissenschaftlicher Klassifikation, Quellen und Erklärungen je Mythos.\n— Ein Quiz, das dein eigenes Wissen mit den Ergebnissen der Bevölkerungsbefragung vergleicht.\n— Den Daten-Explorer mit Sichten für allgemeines Publikum, Eltern, Fachkräfte und Forschung.\n— Meine Interessen — die FAQ, sortiert nach Themen und Zielgruppen.',
    vizName: 'ctaGrid',
  },
  {
    stepNumber: 10,
    heading: 'Wer hinter der Studie steht.',
    bodyText:
      'Die CaRM-Studie — Cannabiskonsum: Risiken und Mythen. Durchgeführt vom Institut für interdisziplinäre Sucht- und Drogenforschung (ISD) in Hamburg. Gefördert vom Bundesinstitut für Öffentliche Gesundheit (BIÖG).',
    vizName: 'teamRow',
  },
];
