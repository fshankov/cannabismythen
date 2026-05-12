/**
 * Iter-4 — Mehr-popover bodies (team bios, named experts, methodology
 * deep-dive). All German AI-drafted, awaiting ISD review. English glosses
 * in code comments above each block.
 *
 * Names sourced from src/content/ueber-uns/team.mdoc; institutional details
 * from src/content/ueber-uns/projekt.mdoc + methodik.mdoc.
 */

export interface TeamMember {
  initials: string;
  fullName: string;
  role: string;
  affiliation: string;
  /** AI-drafted one-line bio. ISD must replace or strike. */
  bio: string;
  color: string;
}

export const TEAM: TeamMember[] = [
  {
    initials: 'CS',
    fullName: 'Christian Schütze',
    role: 'Projektleitung',
    affiliation: 'ISD Hamburg',
    // "Lead of the CaRM project; coordinates research design, classification
    // process and editorial direction."
    bio: 'Leitet das CaRM-Projekt und verantwortet Forschungsdesign, Klassifikationsprozess und redaktionelle Linie.',
    color: '#6366f1',
  },
  {
    initials: 'BS',
    fullName: 'Dr. Bernd Schulte',
    role: 'Projektteam',
    affiliation: 'ISD Hamburg',
    // "Senior researcher; addiction prevention and public health expertise."
    bio: 'Senior-Forscher mit Schwerpunkten in Suchtprävention und Public Health.',
    color: '#14b8a6',
  },
  {
    initials: 'SB',
    fullName: 'Dr. Sven Buth',
    role: 'Projektteam',
    affiliation: 'ISD Hamburg',
    // "Quantitative methods lead; oversees survey design and statistical
    // analysis of the population studies."
    bio: 'Verantwortet quantitative Methoden — vom Stichprobendesign bis zur statistischen Auswertung der Bevölkerungsbefragung.',
    color: '#f97316',
  },
  {
    initials: 'PD',
    fullName: 'Dr. Peter Degkwitz',
    role: 'Projektteam',
    affiliation: 'ISD Hamburg',
    // "Substance use research veteran; brings decades of qualitative and
    // policy-oriented research experience."
    bio: 'Bringt langjährige qualitative und politikorientierte Forschungserfahrung im Bereich Substanzkonsum ein.',
    color: '#a855f7',
  },
  {
    initials: 'MR',
    fullName: 'Moritz Rosenkranz',
    role: 'Projektteam',
    affiliation: 'ISD Hamburg',
    // "Researcher; co-leads the literature analysis and contributes to the
    // four-level classification."
    bio: 'Forscher mit Schwerpunkt Literaturanalyse — co-verantwortlich für die vierstufige Klassifikation.',
    color: '#eab308',
  },
  {
    initials: 'HL',
    fullName: 'Harald Lahusen',
    role: 'Projektteam',
    affiliation: 'ISD Hamburg',
    // "Editorial and dissemination lead; connects research findings with
    // prevention practice and public communication."
    bio: 'Verbindet Forschungsergebnisse mit der Präventionspraxis und der Öffentlichkeitsarbeit.',
    color: '#10b981',
  },
];

export interface NamedExpert {
  fullName: string;
  affiliation: string;
  /** AI-drafted one-line context. */
  context: string;
}

/** "Befragte Präventionsexpert:innen" — named in the final report. */
export const NAMED_EXPERTS: NamedExpert[] = [
  {
    fullName: 'Dr. Jens Kalke',
    affiliation: 'ZIS / ISD Hamburg',
    // "Long-time prevention researcher; named in the final report among
    // surveyed prevention experts."
    context: 'Langjähriger Präventionsforscher; im Abschlussbericht als befragte:r Expert:in namentlich aufgeführt.',
  },
  {
    fullName: 'Dr. Heike Zurhold',
    affiliation: 'ZIS / ISD Hamburg',
    // "Researcher at the Centre for Interdisciplinary Addiction Research."
    context: 'Forscherin am Zentrum für interdisziplinäre Suchtforschung (ZIS).',
  },
  {
    fullName: 'Veronika Möller',
    affiliation: 'ZIS / ISD Hamburg',
    // "Contributed expertise to the survey of prevention professionals."
    context: 'Hat ihre Expertise in die Befragung von Präventionsfachkräften eingebracht.',
  },
];

/** Landesstellen support credit — one-liner under the experts row. */
// "With support from the state prevention agencies SH, MV, Berlin and
// regional coordination offices."
export const LANDESSTELLEN_CREDIT =
  'Mit Unterstützung der Landesstellen Schleswig-Holstein, Mecklenburg-Vorpommern, Berlin und regionaler Koordinationsstellen.';

/**
 * Methodik-Detail content for the "Mehr zur Methodik →" chip on Step 5.
 * Structured into 3 phases plus the expert round, matching
 * src/content/ueber-uns/methodik.mdoc.
 */
export interface MethodikPhase {
  /** Short label, e.g. "Phase 1". */
  label: string;
  /** Full title in German. */
  title: string;
  /** 1–2 short paragraphs of body. */
  body: string;
}

export const METHODIK_PHASES: MethodikPhase[] = [
  {
    label: 'Phase 1',
    // "Phase 1: Empirical capture of cannabis beliefs"
    title: 'Empirische Erfassung der Überzeugungen',
    body:
      'Drei Quellen liefen parallel: eine offene Online-Befragung von 1.041 Personen aus dem Payback-Panel (August bis Oktober 2024), Fragebögen von 60 Präventionsfachkräften aus mehreren Bundesländern und eine systematische Analyse einschlägiger (Online-)Medien.\n\nIn Summe entstanden 7.408 frei formulierte Aussagen. Sie wurden zu 100 Themenfeldern verdichtet und auf 53 Themenfelder gebündelt — Grundlage für 42 prüfbare Thesen.',
  },
  {
    label: 'Phase 2',
    // "Phase 2: Scientific literature analysis"
    title: 'Wissenschaftliche Literaturanalyse',
    body:
      'Jede der 42 Thesen wurde gegen 548 Quellen aus PubMed, Web of Science, dem Xchange-Präventionsregister und der EUDA geprüft. Die Recherche lief im Januar und Februar 2025.\n\nDaraus entstand die vierstufige Einordnung: richtig, eher richtig, eher falsch, falsch — plus „keine Aussage möglich“, wenn die Evidenzlage keine eindeutige Einordnung erlaubt.',
  },
  {
    label: 'Phase 3',
    // "Phase 3: Quantitative survey"
    title: 'Quantitative Bevölkerungsbefragung',
    body:
      'Im Sommer 2025 wurden 2.097 Erwachsene (18–70 Jahre) im Payback-Panel befragt, quotiert nach Konsumstatus. Hinzu kamen 555 Minderjährige (16–17 Jahre) über das Horizoom-Panel und 143 Mitglieder von Cannabis-Anbauvereinigungen — insgesamt 2.795 Personen.\n\nFür jede These wurden fünf Indikatoren erhoben: Kenntnis, Bedeutung, Richtigkeit, Präventionsbedeutung und Bevölkerungsrisiko. Zusätzlich wurden Informationsquellen und deren Vertrauenswürdigkeit untersucht.',
  },
  {
    label: 'Expert:innenrunde',
    // "Expert round (November 2025) — interdisciplinary panel integrates
    // literature and survey findings; final classification fixed."
    title: 'November 2025',
    body:
      'In einer interdisziplinären Expert:innendiskussion wurden Literaturanalyse und quantitative Erhebung zusammengeführt. Hier wurde die endgültige Klassifikation der 42 Thesen festgelegt.',
  },
];

/**
 * Footer block content for VizTeamRow (replaces the four sections of the
 * legacy /ueber-uns/projekt page).
 */
// All four blocks AI-drafted from src/content/ueber-uns/projekt.mdoc, awaiting
// ISD review.
export const FOOTER_BLOCKS = {
  kontakt: {
    // "Contact"
    label: 'Kontakt',
    lines: [
      'Institut für interdisziplinäre Sucht- und Drogenforschung (ISD)',
      'Lokstedter Weg 24, 20251 Hamburg',
    ],
    email: 'info@isd-hamburg.de',
  },
  foerderung: {
    // "Funding"
    label: 'Förderung',
    body:
      'Bundesinstitut für Öffentliche Gesundheit (BIöG, vormals Bundeszentrale für gesundheitliche Aufklärung BZgA).',
  },
  zitierweise: {
    // "Citation"
    label: 'Zitierweise',
    body: 'ISD Hamburg (2026). Cannabis: Mythen & Evidenz — Interaktives Informationstool.',
  },
  abschlussbericht: {
    // "Final report"
    label: 'Abschlussbericht',
    body:
      'Schütze, C., Schulte, B., Buth, S., Degkwitz, P., Rosenkranz, M., & Lahusen, H. (2026). Cannabiskonsum — Risiken und Mythen (CaRM): Abschlussbericht. ISD Hamburg.',
  },
} as const;
