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
    de: 'Anteil der Befragten, die den Mythos kennen (Skala: 0–100 %). Höher = bekannter.',
    en: 'Share of respondents who know the myth (scale: 0–100%). Higher = better known.',
  },
  'indicator.significance.description': {
    de: 'Subjektive Wichtigkeit des Mythos für den eigenen Umgang mit Cannabis (0–100 Punkte). Nur bei Personen erhoben, die den Mythos kennen.',
    en: 'Subjective importance of the myth for one\'s own use of cannabis (0–100 points). Only measured among respondents who know the myth.',
  },
  'indicator.correctness.description': {
    de: 'Übereinstimmung der Einschätzung mit der wissenschaftlichen Klassifikation (0–100 Punkte). Höher = treffender.',
    en: 'Agreement of respondents\' assessment with the scientific classification (0–100 points). Higher = more accurate.',
  },
  'indicator.prevention_significance.description': {
    de: 'Kombination aus Bedeutung und Fehleinschätzung (0–100 Punkte). Höher = größerer Präventionsbedarf.',
    en: 'Combination of significance and misassessment (0–100 points). Higher = greater prevention need.',
  },
  'indicator.population_relevance.description': {
    de: 'Bevölkerungsbezogene Risikobedeutung (0–100 Punkte) — kombiniert die individuelle Präventionsbedeutung mit dem Verbreitungsgrad des Mythos. Nur für Volljährige (18–70) und Minderjährige (16–17) erhoben.',
    en: 'Population-related risk significance (0–100 points) — combines individual prevention significance with the spread of the myth. Measured only for adults (18–70) and minors (16–17).',
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
  'table.verdict': { de: 'Wissenschaftliche Einordnung', en: 'Science Verdict' },
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
  'view.sources': { de: 'Informationswege', en: 'Information Sources' },
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
  'sources_strips.category.all': { de: 'Alle Informationswege', en: 'All sources' },
  'sources_strips.count': { de: '{n} Informationswege', en: '{n} sources' },
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
  'verdict.keine_aussage_moeglich': { de: 'Keine Aussage möglich', en: 'No classification possible' },

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
  // Session 4a (BugHerd #54): verdict legend rendered above the
  // Streifen chart. UI label, so per the site-wide
  // "Evidenz → Wissenschaftlich" rule it uses the
  // "Wissenschaftliche Einordnung" form.
  'strips.legend.label': {
    de: 'Wissenschaftliche Einordnung',
    en: 'Scientific verdict',
  },
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
  // 2026-05-29 tab rename — Mythen-…/Quellen-… prefixes disambiguate the
  // myth-side vs source-side tab groups; "Übersicht" names the all-values
  // grid (was "Spannweite"). Labels only; view IDs + URL slugs unchanged.
  'view.balken': { de: 'Mythen-Balken', en: 'Myths · Bars' },
  'view.streifen': { de: 'Punktwolke', en: 'Point Cloud' },
  'view.spannweite': { de: 'Mythen-Übersicht', en: 'Myths · Overview' },
  'view.tabelle': { de: 'Mythen-Tabelle', en: 'Myths · Table' },
  'view.quellen': { de: 'Informationswege-Balken', en: 'Sources · Bars' },
  'view.quellen2': { de: 'Informationswege-Übersicht', en: 'Sources · Overview' },
  'view.quellen-tabelle': { de: 'Informationswege-Tabelle', en: 'Sources · Table' },
  'igs.indicator.legend': { de: 'Indikatoren', en: 'Indicators' },
  'igs.group.legend': { de: 'Gruppe', en: 'Group' },
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
  // 2026-05-22 universal myth-search above the toolbars.
  'search.myths.placeholder': { de: 'Mythen suchen…', en: 'Search myths…' },
  'search.myths.aria': {
    de: 'Mythen durchsuchen — tippen Sie ein Wort, um die Mythen einzugrenzen',
    en: 'Search myths — type a word to narrow the list',
  },
  'search.myths.clear': { de: 'Suche löschen', en: 'Clear search' },

  // 2026-05-22 verdict-rank sort revival — tooltip for the new
  // stacked-circles button in the MYTHEN column header.
  'spannweite.sort.verdict.activate.tooltip': {
    de: 'Nach wissenschaftlicher Einordnung sortieren (richtig → falsch)',
    en: 'Sort by scientific verdict (correct → incorrect)',
  },
  'spannweite.sort.verdict.asc.tooltip': {
    de: 'Reihenfolge umkehren (falsch → richtig)',
    en: 'Reverse order (incorrect → correct)',
  },
  'spannweite.sort.verdict.desc.tooltip': {
    de: 'Reihenfolge umkehren (richtig → falsch)',
    en: 'Reverse order (correct → incorrect)',
  },

  'sort.label': { de: 'Sortierung', en: 'Sort' },
  // Balken sort labels — the shared toolbar's Wert/Urteil controls
  // were retired 2026-05-21 in favour of in-header A-Z + value sort
  // buttons. Labels kept in case any surface still references them.
  'sort.value-desc': { de: 'Wert: hoch → niedrig', en: 'Value: high → low' },
  'sort.value-asc': { de: 'Wert: niedrig → hoch', en: 'Value: low → high' },
  'sort.value.short': { de: 'Wert', en: 'Value' },
  'sort.verdict.short': { de: 'Urteil', en: 'Verdict' },
  'filter.button': { de: 'Filter', en: 'Filter' },
  'filter.title': { de: 'Filter & Mythen-Auswahl', en: 'Filter & myth selection' },
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
  // Session 4a (BugHerd #50): placeholder spells out the intent —
  // search inside the Filter popup is for picking individual myths
  // to add to the visible-set selection. Differentiates this input
  // from the search chip above the chart, which jumps to a factsheet.
  'filter.myths.searchPlaceholder': {
    de: 'Mythos suchen und auswählen…',
    en: 'Search and select a myth…',
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
  // One-line guidance under the dialog title — the dialog shows all four
  // formats at once (no tabs). AI-drafted — ISD review pending.
  'export.intro': {
    de: 'Wähle ein Format. Bilder zeigen die aktuelle Ansicht, Excel enthält alle Daten.',
    en: 'Choose a format. Images show the current view, Excel contains all the data.',
  },
  'export.png.title': { de: 'PNG (Bild)', en: 'PNG (image)' },
  'export.png.desc': {
    de: 'Aktuelle Ansicht, hochauflösend (2×).',
    en: 'Current view, high resolution (2×).',
  },
  'export.svg.title': { de: 'SVG (Vektor)', en: 'SVG (vector)' },
  'export.svg.desc': {
    de: 'Aktuelle Ansicht, skalierbar für Druck.',
    en: 'Current view, scalable for print.',
  },
  // Excel = the complete CaRM workbook (static file served from public/),
  // independent of the active filters. AI-drafted — ISD review pending.
  'export.excel.title': { de: 'Excel (alle Daten)', en: 'Excel (all data)' },
  'export.excel.desc': {
    de: 'Kompletter Datensatz, alle Zielgruppen.',
    en: 'Complete dataset, all audience groups.',
  },
  // CSV = the current filtered selection as a table (complement to Excel).
  // AI-drafted — ISD review pending.
  'export.csv.title': { de: 'CSV (Auswahl)', en: 'CSV (selection)' },
  'export.csv.desc': {
    de: 'Aktuelle Auswahl als Tabelle.',
    en: 'Current selection as a table.',
  },
  // Shown under the grid when PNG/SVG are unavailable (Tabelle has no chart).
  // AI-drafted — ISD review pending.
  'export.images.note': {
    de: 'PNG und SVG stehen nur in den Diagramm-Ansichten zur Verfügung.',
    en: 'PNG and SVG are only available in the chart views.',
  },
  'export.preview.label': {
    de: 'Vorschau der aktuellen Visualisierung',
    en: 'Preview of the current visualization',
  },
  // Informationswege (sources) mode — the Excel/CSV downloads switch to the
  // channels dataset. AI-drafted — ISD review pending.
  'export.intro.sources': {
    de: 'Wähle ein Format. Excel und CSV enthalten alle Informationswege.',
    en: 'Choose a format. Excel and CSV contain all information channels.',
  },
  'export.excel.title.sources': { de: 'Excel (Informationswege)', en: 'Excel (information channels)' },
  'export.excel.desc.sources': {
    de: 'Alle Kanäle & Zielgruppen, 2 Tabellen.',
    en: 'All channels & audience groups, 2 sheets.',
  },
  'export.csv.title.sources': { de: 'CSV (Informationswege)', en: 'CSV (information channels)' },
  'export.csv.desc.sources': {
    de: 'Alle Kanäle als Tabelle.',
    en: 'All channels as a table.',
  },
  'export.images.note.sources': {
    de: 'Bild-Export (PNG/SVG) ist für die Informationswege derzeit nicht verfügbar.',
    en: 'Image export (PNG/SVG) is not available for the information channels yet.',
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
  // Spannweite view. AI draft, awaiting ISD review per CLAUDE.md's
  // German-text-quality rule.
  'howto.spannweite': {
    de: 'Jede Zeile ein Mythos, jede Spalte ein Indikator oder eine Bevölkerungsgruppe. Wählen Sie oben den Wert. Der Pfeil markiert den Wert für jeden Mythos, der gefärbte Balken zeigt die Skala 0–100 %. Klick öffnet das Factsheet.',
    en: 'Each row is one myth, each column an indicator or population group. Pick the value at the top. The arrow marks the value for each myth, the tinted bar shows the 0–100 % scale. Click for the factsheet.',
  },
  'spannweite.title': { de: 'Mythen-Spannweite', en: 'Myth range' },
  // User-friendly hover tooltip. Drafted German, awaiting ISD review.
  // Used both in the toolbar A-Z control (legacy v3.x) and the
  // A-Z button in the MYTHEN column header (v4+).
  'spannweite.sort.alpha.tooltip': {
    de: 'Mythen alphabetisch sortieren (A → Z)',
    en: 'Sort myths alphabetically (A → Z)',
  },
  // Per-column value sort tooltips (Spannweite v3.3).
  'spannweite.sort.col.activate.tooltip': {
    de: 'Nach {col} sortieren (niedrige Werte oben). Erneut klicken: hohe Werte oben.',
    en: 'Sort by {col} (low values first). Click again: high values first.',
  },
  'spannweite.sort.col.asc.tooltip': {
    de: 'Sortiert nach {col} — niedrige Werte oben. Erneut klicken: hohe Werte oben.',
    en: 'Sorted by {col} — low values first. Click again: high values first.',
  },
  'spannweite.sort.col.desc.tooltip': {
    de: 'Sortiert nach {col} — hohe Werte oben. Erneut klicken: niedrige Werte oben.',
    en: 'Sorted by {col} — high values first. Click again: low values first.',
  },
  // Informationsquellen-Spannweite — AI-drafted German, awaiting ISD review.
  'howto.sources2': {
    de: 'Jede Zeile eine Informationsquelle, jede Spalte ein Wert oder eine Bevölkerungsgruppe. Wählen Sie oben den Bezug. Der Punkt markiert den Wert je Quelle, der getönte Balken zeigt die Skala 0–100 %. Klick auf das Pfeilsymbol blendet Unterquellen ein.',
    en: 'Each row is an information source, each column a value or population group. Pick the reference at the top. The dot marks each source’s value, the tinted bar shows the 0–100 % scale. Click the chevron to reveal sub-sources.',
  },
  'sources2.title': { de: 'Informationswege-Spannweite', en: 'Information-sources range' },
  'sources.sort.alpha.tooltip': {
    de: 'Informationswege alphabetisch sortieren (A → Z)',
    en: 'Sort sources alphabetically (A → Z)',
  },
  // Category-rank sort affordance (added 2026-05-23) — second sort
  // button in the QUELLEN header. Mirrors the verdict-rank affordance
  // on the myth views: first click groups sources by their canonical
  // source-category order (Institutionell → Persönlich); second click
  // reverses (Persönlich → Institutionell).
  'sources.sort.category.activate.tooltip': {
    de: 'Nach Informationswege-Kategorie sortieren (Institutionell → Persönlich)',
    en: 'Sort by source category (Institutional → Personal)',
  },
  'sources.sort.category.asc.tooltip': {
    de: 'Reihenfolge umkehren (Persönlich → Institutionell)',
    en: 'Reverse order (Personal → Institutional)',
  },
  'sources.sort.category.desc.tooltip': {
    de: 'Reihenfolge umkehren (Institutionell → Persönlich)',
    en: 'Reverse order (Institutional → Personal)',
  },
  'sources.sort.col.activate.tooltip': {
    de: 'Nach {col} sortieren (niedrige Werte oben). Erneut klicken: hohe Werte oben.',
    en: 'Sort by {col} (low values first). Click again: high values first.',
  },
  'sources.sort.col.asc.tooltip': {
    de: 'Sortiert nach {col} — niedrige Werte oben. Erneut klicken: hohe Werte oben.',
    en: 'Sorted by {col} — low values first. Click again: high values first.',
  },
  'sources.sort.col.desc.tooltip': {
    de: 'Sortiert nach {col} — hohe Werte oben. Erneut klicken: niedrige Werte oben.',
    en: 'Sorted by {col} — high values first. Click again: low values first.',
  },
  'balken.title': { de: 'Mythen-Ranking', en: 'Myth ranking' },
  'balken.subtitle': { de: '{indicator} · {group}', en: '{indicator} · {group}' },

  // Stage 6 follow-up — hide / show columns (Punktwolke + Quellen + Tabelle)
  'column.hide': { de: 'Diese Spalte ausblenden', en: 'Hide this column' },
  'column.show': { de: 'Spalte wieder einblenden', en: 'Show this column again' },
  'column.hidden': { de: 'Ausgeblendet', en: 'Hidden' },

  // Dataset-toggle (i) tooltips — Mythen / Informationswege. Verbatim German
  // provided by Fedor (2026-06-15); the `en` field is an internal gloss only
  // (site ships DE). Each question maps to one indicator / source-metric; the
  // shared footer notes the per-Zielgruppe lens. Rendered as a list inside the
  // toggle's InfoTooltip (see MythenExplorer dataset toggle).
  'datasetInfo.mythen.q1': { de: 'Zu welchen Anteilen gekannt?', en: 'Known by what share?' },
  'datasetInfo.mythen.q2': { de: 'In welchem Ausmaß individuell bedeutsam?', en: 'How individually significant?' },
  'datasetInfo.mythen.q3': { de: 'In welchem Grad richtig beurteilt?', en: 'How correctly judged?' },
  'datasetInfo.mythen.q4': { de: 'Wie weit präventiv bedeutsam?', en: 'How relevant for prevention?' },
  'datasetInfo.mythen.q5': { de: 'Mit welcher Bevölkerungsrelevanz?', en: 'With what population relevance?' },
  'datasetInfo.mythen.foot': { de: 'Nach Zielgruppe zu betrachten.', en: 'To be viewed by target group.' },
  'datasetInfo.wege.q1': {
    de: 'Wo wird aktiv nach gesundheitsbezogenen Informationen gesucht – auch zu Cannabis?',
    en: 'Where are health-related information actively sought — including on cannabis?',
  },
  'datasetInfo.wege.q2': { de: 'Wo werden solche Infos nebenbei wahrgenommen?', en: 'Where is such info noticed incidentally?' },
  'datasetInfo.wege.q3': { de: 'In welchem Ausmaß wird diesen Wegen vertraut?', en: 'How much are these channels trusted?' },
  'datasetInfo.wege.q4': { de: 'Für welche ergeben sich wie große Präventionspotentiale?', en: 'Which yield how large a prevention potential?' },
  'datasetInfo.wege.foot': { de: 'Nach Zielgruppe zu betrachten.', en: 'To be viewed by target group.' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.de;
}

export default translations;
