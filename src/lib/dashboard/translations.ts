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
  'indicator.population_relevance': {
    de: 'Bevölkerungsrelevanz (Punkte)',
    en: 'Population Relevance (points)',
  },

  // Short indicator names
  'indicator.awareness.short': { de: 'Kenntnis %', en: 'Awareness %' },
  'indicator.significance.short': { de: 'Bedeutung', en: 'Significance' },
  'indicator.correctness.short': { de: 'Richtigkeit', en: 'Correctness' },
  'indicator.prevention_significance.short': { de: 'Prävention', en: 'Prevention' },
  'indicator.population_relevance.short': { de: 'Bev. Relevanz', en: 'Pop. Relevance' },

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
  'indicator.population_relevance.description': {
    de: 'Bevölkerungsbezogene Risikobedeutung — kombiniert die individuelle Präventionsbedeutung mit dem Verbreitungsgrad des Mythos. Nur für Volljährige (18–70) und Minderjährige (16–17) erhoben.',
    en: 'Population-related risk significance — combines individual prevention significance with the spread of the myth. Measured only for adults (18–70) and minors (16–17).',
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
  'view.ladder': { de: 'Indikator-Leiter', en: 'Indicator Ladder' },
  'view.strips': { de: 'Streifen', en: 'Strips' },

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

  // Sources tab — single Streifen view replacing legacy V1 + V2 source tabs.
  'view.sources': { de: 'Informationsquellen', en: 'Information Sources' },
  'sources.metric.search': { de: 'Suche', en: 'Search' },
  'sources.metric.perception': { de: 'Wahrnehmung', en: 'Perception' },
  'sources.metric.trust': { de: 'Vertrauen', en: 'Trust' },
  'sources.metric.prevention': { de: 'Präventionspotential', en: 'Prevention Potential' },

  // Sources Streifen view — keys feed the in-view labels and pivot pills.
  'sources_strips.pivot.label': { de: 'Spalten', en: 'Columns' },
  'sources_strips.pivot.metric': { de: 'Indikatoren', en: 'Indicators' },
  'sources_strips.pivot.group': { de: 'Gruppen', en: 'Groups' },
  'sources_strips.picker.group': { de: 'Bevölkerungsgruppe', en: 'Population group' },
  'sources_strips.picker.metric': { de: 'Indikator', en: 'Indicator' },
  'sources_strips.children.show': { de: 'Unterkategorien einblenden', en: 'Show subcategories' },
  'sources_strips.category.all': { de: 'Alle Quellen', en: 'All sources' },
  'sources_strips.count': { de: '{n} Quellen', en: '{n} sources' },
  'sources_strips.action.showChildren': { de: 'Unterkategorien zeigen', en: 'Show subcategories' },
  'sources_strips.action.gotoParent': { de: 'Zum Hauptthema', en: 'Go to parent' },

  // Verdict tags — canonical labels matching the report's authoritative wording
  // (klassifikation.mdoc). Keep in sync with quiz `answer.*` and `classification.*`
  // strings in src/components/quiz/i18n.ts.
  'verdict.all': { de: 'Alle Mythen', en: 'All Myths' },
  'verdict.richtig': { de: 'Richtig', en: 'Correct' },
  'verdict.eher_richtig': { de: 'Eher richtig', en: 'Tends to be correct' },
  'verdict.eher_falsch': { de: 'Eher falsch', en: 'Tends to be incorrect' },
  'verdict.falsch': { de: 'Falsch', en: 'Incorrect' },
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
  'howto.ladder': {
    de: 'Vier vertikale Achsen, eine pro Indikator (0–100). Jeder Mythos ist ein Punkt pro Achse, Farbe = Urteil. Tippen Sie eine Bevölkerungsgruppe und einen Punkt zum Hervorheben; nochmals tippen für Details.',
    en: 'Four vertical axes, one per indicator (0–100). Each myth is one dot per axis, color = verdict. Tap a population and a dot to highlight; tap again for details.',
  },
  'howto.strips': {
    de: 'Jeder Punkt ist ein Mythos. Wählen Sie oben den Vergleich und den Wert. Tippen Sie einen Punkt zum Hervorheben — die Werte erscheinen direkt neben dem Punkt. Tippen Sie „Mehr" für das Factsheet.',
    en: 'Each dot is one myth. Pick the comparison and the value at the top. Tap a dot to highlight — values appear right next to the dot. Tap "More" for the factsheet.',
  },

  // Strips view (vertical) — pivot is set by an in-view 'Vergleichen nach:' toggle
  'strips.mode.indicator': { de: 'Indikatoren', en: 'Indicators' },
  'strips.mode.group': { de: 'Gruppen', en: 'Groups' },
  'strips.mode.label': { de: 'Ansicht', en: 'View' },
  'strips.pivot.label': { de: 'Aktive Achse', en: 'Active axis' },
  'strips.compare.label': { de: 'Vergleichen nach', en: 'Compare by' },
  'strips.value.label': { de: 'Wert für', en: 'Value for' },
  'strips.switch.indicators': { de: 'Indikator', en: 'Indicator' },
  'strips.switch.groups': { de: 'Bevölkerungsgruppe', en: 'Population group' },
  'strips.switch.themes': { de: 'Quiz-Themen', en: 'Quiz themes' },
  'strips.sort.label': { de: 'Sortieren nach', en: 'Sort by' },
  'strips.sort.asc': { de: 'Aufsteigend', en: 'Ascending' },
  'strips.sort.desc': { de: 'Absteigend', en: 'Descending' },
  'strips.values.label': { de: 'Werte', en: 'Values' },
  'strips.more': { de: 'Mehr', en: 'More' },
  'strips.na': { de: 'k. A.', en: 'n/a' },
  'strips.theme.gefaehrlichkeit': { de: 'Gefährlichkeit', en: 'Dangerousness' },
  'strips.theme.gesellschaft': { de: 'Gesellschaft', en: 'Society' },
  'strips.theme.medizin': { de: 'Medizin', en: 'Medicine' },
  'strips.theme.risiken': { de: 'Risiken', en: 'Risks' },
  'strips.theme.stimmung': { de: 'Stimmung', en: 'Mood' },
  'strips.theme.gefaehrlichkeit.short': { de: 'Gef.', en: 'Dang.' },
  'strips.theme.gesellschaft.short': { de: 'Ges.', en: 'Soc.' },
  'strips.theme.medizin.short': { de: 'Med.', en: 'Med.' },
  'strips.theme.risiken.short': { de: 'Ris.', en: 'Risks' },
  'strips.theme.stimmung.short': { de: 'Stim.', en: 'Mood' },
  'misc.population': { de: 'Bevölkerungsgruppe', en: 'Population' },
  'misc.viewDetails': { de: 'Details anzeigen', en: 'View details' },
  'misc.deselect': { de: 'Auswahl aufheben', en: 'Deselect' },
  // Tooltip labels
  'tooltip.category': { de: 'Kategorie', en: 'Category' },
  'tooltip.group': { de: 'Gruppe', en: 'Group' },

  // Misc
  'misc.myths': { de: 'Mythen', en: 'Myths' },
  'misc.of': { de: 'von', en: 'of' },
  'misc.noResults': { de: 'Keine Ergebnisse gefunden', en: 'No results found' },

  // Balken view + new dashboard chrome (refactor)
  'view.balken': { de: 'Balken', en: 'Bars' },
  'view.streifen': { de: 'Punktwolke', en: 'Point Cloud' },
  'view.tabelle': { de: 'Tabelle', en: 'Table' },
  'view.quellen': { de: 'Informationsquellen', en: 'Information Sources' },
  'igs.indicator.legend': { de: 'Indikator', en: 'Indicator' },
  'igs.group.legend': { de: 'Bevölkerungsgruppe', en: 'Population group' },
  'igs.group.adults': { de: 'Volljährige (18–70)', en: 'Adults (18–70)' },
  'igs.group.minors': { de: 'Minderjährige (16–17)', en: 'Minors (16–17)' },
  'igs.group.consumers': { de: 'Konsumierende', en: 'Consumers' },
  'igs.group.young_adults': { de: 'Junge Erwachsene (18–26)', en: 'Young adults (18–26)' },
  'igs.group.parents': { de: 'Eltern', en: 'Parents' },
  'igs.disabled.popRel': {
    de: 'Dieser Indikator wurde nur für Volljährige (18–70) und Minderjährige (16–17) erhoben.',
    en: 'This indicator was only collected for adults (18–70) and minors (16–17).',
  },
  'igs.disabled.snackbar': {
    de: 'Bevölkerungsrelevanz nur für Volljährige verfügbar — Gruppe wurde umgestellt.',
    en: 'Population Relevance only available for adults — group switched automatically.',
  },
  'sort.label': { de: 'Sortierung', en: 'Sort' },
  'sort.value-desc': { de: 'Wert absteigend', en: 'Value descending' },
  'sort.value-asc': { de: 'Wert aufsteigend', en: 'Value ascending' },
  'sort.toggle.aria': {
    de: 'Sortierung umschalten — aktuell: {dir}',
    en: 'Toggle sort — currently: {dir}',
  },
  'sort.toggle.label.desc': { de: 'Wert ↓', en: 'Value ↓' },
  'sort.toggle.label.asc': { de: 'Wert ↑', en: 'Value ↑' },
  'filter.button': { de: 'Filter', en: 'Filter' },
  'filter.title': { de: 'Filter & Sortierung', en: 'Filter & sort' },
  'filter.reset': { de: 'Alle Filter zurücksetzen', en: 'Reset all filters' },
  'filter.apply': { de: 'Anwenden', en: 'Apply' },
  'filter.search.label': { de: 'Mythos suchen', en: 'Search myth' },
  'filter.search.placeholder': { de: 'Mythos suchen…', en: 'Search myth…' },
  'filter.categories.label': { de: 'Mythos-Kategorien', en: 'Myth categories' },
  'filter.myths.label': { de: 'Einzelne Mythen', en: 'Individual myths' },
  'filter.myths.empty': {
    de: 'Keine Mythen passen zur Suche.',
    en: 'No myths match the search.',
  },
  'filter.myths.searchPlaceholder': {
    de: 'Mythen durchsuchen…',
    en: 'Search myths…',
  },
  'filter.empty.title': { de: 'Keine Treffer', en: 'No matches' },
  'filter.empty.body': {
    de: 'Mit den aktuellen Filtern wurden keine Mythen gefunden.',
    en: 'No myths match the current filters.',
  },
  'filter.empty.cta': {
    de: 'Filter zurücksetzen',
    en: 'Reset filters',
  },
  'export.button': { de: 'Exportieren', en: 'Export' },
  'export.title': { de: 'Daten exportieren', en: 'Export data' },
  'export.csv.title': { de: 'CSV (Tabelle)', en: 'CSV (table)' },
  'export.csv.desc': {
    de: 'Komplette Daten als Tabelle, Excel-kompatibel.',
    en: 'Full dataset as a table, Excel-compatible.',
  },
  'export.png.title': { de: 'PNG (Bild)', en: 'PNG (image)' },
  'export.png.desc': {
    de: 'Für Präsentationen, hochauflösend (2×).',
    en: 'For presentations, high resolution (2×).',
  },
  'export.svg.title': { de: 'SVG (Vektor)', en: 'SVG (vector)' },
  'export.svg.desc': {
    de: 'Druckqualität, vektorbasiert.',
    en: 'Print quality, vector-based.',
  },
  'export.json.title': { de: 'JSON (Rohdaten)', en: 'JSON (raw data)' },
  'export.json.desc': {
    de: 'Strukturierte Daten für Forschung & Programme.',
    en: 'Structured data for research and integrations.',
  },
  'export.link.title': { de: 'Link kopieren', en: 'Copy link' },
  'export.link.desc': {
    de: 'Aktuelle Filter & Ansicht als URL teilen.',
    en: 'Share the current filters & view as a URL.',
  },
  'export.link.copied': { de: 'Kopiert!', en: 'Copied!' },
  // Tabs in the OWID-style export dialog (Stage 3 of the Daten-Explorer refactor).
  'export.tab.visualization': { de: 'Visualisierung', en: 'Visualization' },
  'export.tab.data': { de: 'Daten', en: 'Data' },
  // Disabled-row copy when the active tab has no chart (Tabelle).
  'export.unavailable.table': {
    de: 'Tabellenansicht hat keine Visualisierung — wechsle zu Balken, Streifen oder Informationsquellen, um Bilder zu exportieren.',
    en: 'The table view has no visualization — switch to Bars, Strips, or Information Sources to export images.',
  },
  'export.preview.label': {
    de: 'Vorschau der aktuellen Visualisierung',
    en: 'Preview of the current visualization',
  },
  'rundgang.label': { de: 'Rundgang', en: 'Tour' },
  'verdict.legend.title': { de: 'Wissenschaftliches Urteil', en: 'Scientific verdict' },
  'verdict.legend.info.richtig': {
    de: 'Der Mythos entspricht dem aktuellen wissenschaftlichen Kenntnisstand.',
    en: 'The myth aligns with the current scientific evidence.',
  },
  'verdict.legend.info.eher_richtig': {
    de: 'Der Mythos ist tendenziell zutreffend, aber mit Einschränkungen.',
    en: 'The myth tends to be correct, with caveats.',
  },
  'verdict.legend.info.eher_falsch': {
    de: 'Der Mythos ist tendenziell nicht zutreffend, enthält aber Teilwahrheiten.',
    en: 'The myth tends to be incorrect, with partial truths.',
  },
  'verdict.legend.info.falsch': {
    de: 'Der Mythos widerspricht dem wissenschaftlichen Kenntnisstand.',
    en: 'The myth contradicts the current scientific evidence.',
  },
  'howto.balken': {
    de: 'Mythen sortiert nach gewähltem Indikator. Farbe = wissenschaftliches Urteil. Klick öffnet das Factsheet.',
    en: 'Myths ranked by the selected indicator. Color = scientific verdict. Click for the factsheet.',
  },
  'balken.title': { de: 'Mythen-Ranking', en: 'Myth ranking' },
  'balken.subtitle': { de: '{indicator} · {group}', en: '{indicator} · {group}' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.de;
}

export default translations;
