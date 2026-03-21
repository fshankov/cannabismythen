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

  // View tabs
  'view.table': { de: 'Tabelle', en: 'Table' },
  'view.bar': { de: 'Balken', en: 'Bar' },
  'view.scatter': { de: 'Streuung', en: 'Scatter' },
  'view.lollipop': { de: 'Lollipop', en: 'Lollipop' },

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
    de: 'Jeder Punkt ist ein Mythos über alle fünf Gruppen. Klicken zum Hervorheben, Doppelklick für Details.',
    en: 'Each dot is one myth positioned across all five groups. Click to highlight; double-click for details.',
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
