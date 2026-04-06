import type { Lang } from './types';

const translations = {
  // App header
  'app.title': { de: 'Cannabis Mythen Explorer', en: 'Cannabis Mythen Explorer' },
  'app.subtitle': {
    de: 'Interaktive Datenvisualisierung zu Cannabis-Mythen',
    en: 'Interactive data visualization of cannabis myths',
  },

  // Sidebar
  'sidebar.claims': { de: 'Behauptungen', en: 'Claims' },
  'sidebar.selectMyth': { de: 'Mythos auswählen…', en: 'Select a myth…' },
  'sidebar.groups': { de: 'Bevölkerungsgruppen', en: 'Population Groups' },
  'sidebar.categories': { de: 'Kategorien', en: 'Categories' },
  'sidebar.indicator': { de: 'Indikator', en: 'Indicator' },
  'sidebar.selectAll': { de: 'Alle', en: 'All' },
  'sidebar.deselectAll': { de: 'Keine', en: 'None' },

  // Indicators
  'indicator.awareness': { de: 'Kenntnis (%)', en: 'Awareness (%)' },
  'indicator.significance': { de: 'Bedeutung (Punkte)', en: 'Significance (points)' },
  'indicator.correctness': { de: 'Richtigkeit (Punkte)', en: 'Correctness (points)' },
  'indicator.prevention_significance': {
    de: 'Präventionsbedeutung (Punkte)',
    en: 'Prevention Significance (points)',
  },

  // Short indicator names
  'indicator.awareness.short': { de: 'Kenntnis %', en: 'Awareness %' },
  'indicator.significance.short': { de: 'Bedeutung', en: 'Significance' },
  'indicator.correctness.short': { de: 'Richtigkeit', en: 'Correctness' },
  'indicator.prevention_significance.short': { de: 'Prävention', en: 'Prevention' },

  // Indicator descriptions
  'indicator.awareness.description': {
    de: 'Anteil der Befragten, die den Mythos kennen. Höher = bekannter.',
    en: 'Share of respondents who know the myth. Higher = better known.',
  },
  'indicator.significance.description': {
    de: 'Subjektive Wichtigkeit des Mythos für eigene Entscheidungen (0–100). Nur bei Personen erhoben, die den Mythos kennen.',
    en: 'Subjective importance of the myth for personal decisions (0–100). Only measured among respondents who know the myth.',
  },
  'indicator.correctness.description': {
    de: 'Übereinstimmung der Einschätzung mit der wissenschaftlichen Klassifikation (0–100). Höher = treffender.',
    en: 'Agreement of respondents\' assessment with the scientific classification (0–100). Higher = more accurate.',
  },
  'indicator.prevention_significance.description': {
    de: 'Kombination aus Bedeutung und Fehleinschätzung (0–100). Höher = größerer Präventionsbedarf.',
    en: 'Combination of significance and misassessment (0–100). Higher = greater prevention need.',
  },

  // Source metric descriptions
  'sources.metric.search.description': {
    de: 'Anteil der Befragten, die diesen Kanal aktiv zur Information nutzen würden.',
    en: 'Share of respondents who would actively use this channel to seek information.',
  },
  'sources.metric.perception.description': {
    de: 'Anteil, der über diesen Kanal ungeplant Gesundheitsinformationen wahrnimmt.',
    en: 'Share who unplannedly perceive health information through this channel.',
  },
  'sources.metric.trust.description': {
    de: 'Eingeschätzte Vertrauenswürdigkeit der Quelle (0–100).',
    en: 'Perceived trustworthiness of the source (0–100).',
  },
  'sources.metric.prevention.description': {
    de: 'Kombinierter Wert aus Suche, Wahrnehmung und Vertrauen (0–100). Höher = größeres Potential für Prävention.',
    en: 'Combined score of search, perception, and trust (0–100). Higher = greater prevention potential.',
  },

  // View tabs
  'view.table': { de: 'Tabelle', en: 'Table' },
  'view.bar': { de: 'Balken', en: 'Bar' },
  'view.scatter': { de: 'Streuung', en: 'Scatter' },
  'view.lollipop': { de: 'Lollipop', en: 'Lollipop' },
  'view.overview': { de: 'Übersicht', en: 'Overview' },
  'view.circular': { de: 'Circular', en: 'Circular' },

  // Table
  'table.myth': { de: 'Mythos', en: 'Myth' },
  'table.verdict': { de: 'Evidenz', en: 'Science Verdict' },
  'table.awareness': { de: 'Kenntnis %', en: 'Awareness %' },
  'table.value': { de: 'Wert', en: 'Value' },
  'table.noData': { de: 'Keine Daten', en: 'No data' },
  'table.na': { de: 'k. A.', en: 'n/a' },
  'table.allVerdicts': { de: 'Alle', en: 'All' },

  // Detail panel
  'detail.title': { de: 'Mythos-Details', en: 'Myth Details' },
  'detail.verdict': { de: 'Wissenschaftliches Urteil', en: 'Science Verdict' },
  'detail.category': { de: 'Kategorie', en: 'Category' },
  'detail.checked': { de: 'Wissenschaftlich geprüft', en: 'Scientifically Checked' },
  'detail.notChecked': { de: 'Keine Aussage möglich', en: 'No classification possible' },
  'detail.yes': { de: 'Ja', en: 'Yes' },
  'detail.no': { de: 'Nein', en: 'No' },
  'detail.groupComparison': { de: 'Gruppenvergleich', en: 'Group Comparison' },
  'detail.close': { de: 'Schließen', en: 'Close' },
  'detail.factsheet': { de: 'Factsheet lesen', en: 'Read Factsheet' },

  // Bar chart
  'bar.title': { de: 'Mythen nach Kategorie', en: 'Myths by Category' },

  // Scatter chart
  'scatter.title': { de: 'Mythen-Streuung', en: 'Myth Scatter' },
  'scatter.xAxis': { de: 'X-Achse', en: 'X-Axis' },
  'scatter.yAxis': { de: 'Y-Achse', en: 'Y-Axis' },

  // Lollipop
  'lollipop.title': { de: 'Gruppenvergleich', en: 'Group Comparison' },

  // Sources tab
  'view.sources': { de: 'Informationsquellen', en: 'Information Sources' },
  'howto.sources': {
    de: 'Informationswege zur Beschaffung und Wahrnehmung von Gesundheitsinformationen. Wählen Sie Metrik und Bevölkerungsgruppe. Eingerückte Einträge = Unterkategorien.',
    en: 'Information pathways for seeking and perceiving health information. Select metric and population group. Indented entries = subcategories.',
  },
  'sources.metric.search': { de: 'Suche', en: 'Search' },
  'sources.metric.perception': { de: 'Wahrnehmung', en: 'Perception' },
  'sources.metric.trust': { de: 'Vertrauen', en: 'Trust' },
  'sources.metric.prevention': { de: 'Präventionspotential', en: 'Prevention Potential' },

  // Sources V2
  'view.sources_v2': { de: 'Informationsquellen V2', en: 'Information Sources V2' },
  'howto.sources_v2': {
    de: 'Alle vier Metriken pro Quelle in einem Diagramm. Wechseln Sie zwischen Hantel-Diagramm, kleinen Diagrammen und Strategie-Matrix. Klicken Sie auf eine Zeile, um Unterkategorien anzuzeigen.',
    en: 'All four metrics per source in one chart. Switch between dumbbell, small multiples, and strategy matrix. Click a row to reveal subcategories.',
  },
  'sources_v2.mode.dumbbell': { de: 'Hantel-Diagramm', en: 'Dumbbell' },
  'sources_v2.mode.multiples': { de: 'Kleine Diagramme', en: 'Small Multiples' },
  'sources_v2.mode.matrix': { de: 'Strategie-Matrix', en: 'Strategy Matrix' },
  'sources_v2.sort.prevention': { de: 'Nach Prävention', en: 'By Prevention' },
  'sources_v2.sort.gap': { de: 'Nach Lücke (Vertrauen−Suche)', en: 'By Gap (Trust−Search)' },

  // Verdict tags
  'verdict.all': { de: 'Alle Mythen', en: 'All Myths' },
  'verdict.richtig': { de: 'Fakt', en: 'Fact' },
  'verdict.eher_richtig': { de: 'Eher Fakt', en: 'Tends to be Fact' },
  'verdict.eher_falsch': { de: 'Eher Falsch', en: 'Tends to be False' },
  'verdict.falsch': { de: 'Falsch', en: 'False' },
  'verdict.no_classification': { de: 'Keine Aussage möglich', en: 'No classification possible' },

  // Utility buttons
  'util.fullscreen': { de: 'Vollbild', en: 'Fullscreen' },
  'util.exitFullscreen': { de: 'Vollbild beenden', en: 'Exit Fullscreen' },
  'util.share': { de: 'Link kopieren', en: 'Copy Link' },
  'util.copied': { de: 'Kopiert!', en: 'Copied!' },
  'util.download': { de: 'CSV herunterladen', en: 'Download CSV' },

  // How-to-read microcopy
  'howto.table': {
    de: 'Klicken Sie auf eine Zeile für Details. Sortieren per Klick auf Spaltenüberschriften.',
    en: 'Click a row for details. Sort by clicking column headers.',
  },
  'howto.bar': {
    de: 'Balken zeigen den gewählten Indikator nach Kategorie. Farbe = Wissenschaftliches Urteil. Klick auf Balken für Details.',
    en: 'Bars show the selected indicator grouped by category. Color = science verdict. Click a bar for details.',
  },
  'howto.scatter': {
    de: 'Jeder Punkt ist ein Mythos. X/Y-Achsen zeigen die gewählten Indikatoren. Farbe = Wissenschaftliches Urteil.',
    en: 'Each dot is one myth. X/Y axes show the selected indicators. Color = science verdict. Click a dot for details.',
  },
  'howto.lollipop': {
    de: 'Jeder Punkt ist ein Mythos über alle sechs Gruppen. Klicken zum Hervorheben, Doppelklick für Details.',
    en: 'Each dot is one myth positioned across all six groups. Click to highlight; double-click for details.',
  },
  'howto.overview': {
    de: 'Alle Mythen auf einen Blick, nach Kategorie sortiert. Farbe = Wissenschaftliches Urteil. Balken = gewählte Metrik. Klick für Details.',
    en: 'All myths at a glance, grouped by category. Color = science verdict. Bar = selected metric. Click for details.',
  },
  'howto.circular': {
    de: 'Kreisdiagramm mit allen vier Indikatoren je Mythos. Farbige Segmente = Kenntnis, Bedeutung, Richtigkeit, Prävention. Hover für Details, Klick für Factsheet.',
    en: 'Circular chart with all four indicators per myth. Colored segments = Awareness, Significance, Correctness, Prevention. Hover for details, click for factsheet.',
  },
  // Tooltip labels
  'tooltip.category': { de: 'Kategorie', en: 'Category' },
  'tooltip.group': { de: 'Gruppe', en: 'Group' },

  // Misc
  'misc.myths': { de: 'Mythen', en: 'Myths' },
  'misc.of': { de: 'von', en: 'of' },
  'misc.noResults': { de: 'Keine Ergebnisse gefunden', en: 'No results found' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.de;
}

export default translations;
