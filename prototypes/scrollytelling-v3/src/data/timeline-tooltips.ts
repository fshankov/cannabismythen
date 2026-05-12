/**
 * Iter-4 — short German hover-tooltip bodies for each timeline anchor in
 * VizTimeline. All strings AI-drafted, awaiting ISD review. English glosses
 * in code comments. Keyed by the anchor's `date` field.
 */

export interface TimelineTooltip {
  /** Short body line shown under date + title in the hover tooltip. */
  body: string;
}

export const TIMELINE_TOOLTIPS: Record<string, TimelineTooltip> = {
  // KCanG inception — "The Konsumcannabisgesetz comes into force; the project
  // sets out to test public beliefs against the evidence."
  '2024-04-01': {
    body:
      'Mit dem Konsumcannabisgesetz tritt eine neue Realität ein. Das ISD beginnt zu prüfen, was die Bevölkerung wirklich über Cannabis denkt.',
  },
  // First online survey — "1,041 people open-question respondents; 7,408 free-form
  // statements collected, plus 60 prevention experts and a media analysis."
  '2024-09-01': {
    body:
      '1.041 Personen, 60 Präventionsfachkräfte, dazu eine Medienanalyse. 7.408 frei formulierte Aussagen werden gesammelt — der Rohstoff für die spätere Auswahl.',
  },
  // Literature review — "Each of the 42 theses checked against PubMed, PsychInfo,
  // SocIndex and Google Scholar; 548 sources screened."
  '2025-01-15': {
    body:
      'Jede These wird gegen 548 wissenschaftliche Quellen geprüft — PubMed, PsychInfo, SocIndex und Google Scholar. Daraus entsteht die vierstufige Einordnung.',
  },
  // Main population survey — "2,795 people across three sub-samples; five
  // indicators per myth, five target groups."
  '2025-07-15': {
    body:
      'Quantitative Erhebung mit 2.795 Personen: 2.097 Erwachsene, 555 Minderjährige, 143 Mitglieder von Anbauvereinigungen. Fünf Indikatoren je These.',
  },
  // Expert round — "An interdisciplinary expert panel integrates the findings
  // and finalises the classification of all 42 myths."
  '2025-11-15': {
    body:
      'Eine interdisziplinäre Expert:innenrunde bewertet Literatur und Befragung zusammen und legt die endgültige Klassifikation der 42 Thesen fest.',
  },
  // Publication — "The findings reach the public on this site — 42 fact-sheets,
  // a self-test, a data explorer and FAQ."
  '2026-09-01': {
    body:
      'Veröffentlichung auf dieser Website: 42 Faktenkarten, ein Selbsttest, ein Daten-Explorer und themenorientierte FAQ.',
  },
};
