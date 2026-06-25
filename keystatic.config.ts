import { config, collection, singleton, fields } from "@keystatic/core";

// ─── Shared field helpers ───────────────────────────────────────────────────
// Reusable field groups used across multiple collections.

const statusField = fields.select({
  label: "Status",
  options: [
    { label: "Entwurf", value: "draft" }, // Draft
    { label: "Veröffentlicht", value: "published" }, // Published
  ],
  defaultValue: "draft",
});

const metaFields = {
  summary: fields.text({
    label: "Zusammenfassung (SEO / Listings)",
    multiline: true,
    description: "Kurzbeschreibung für Suchergebnisse und Übersichtsseiten. Nicht zu verwechseln mit der Karten-Zusammenfassung (cardSummary) der Fakten-Karten.",
  }),
  // tags / publishedAt / updatedAt are not used anywhere on the site.
  // Hidden from the editor via fields.ignored() — the value (if any) stays
  // in the file, the reader still returns it; editors just don't see it.
  tags: fields.ignored(),
  status: statusField,
  internalNotes: fields.text({
    label: "Interne Notizen", // Internal notes
    multiline: true,
    description:
      "Nur für die Redaktion — wird nie öffentlich angezeigt. (Editorial only, never shown publicly.)",
  }),
  publishedAt: fields.ignored(),
  updatedAt: fields.ignored(),
};

// ─── Collections ────────────────────────────────────────────────────────────

const zahlenUndFakten = collection({
  label: "🃏 Mythen-Faktenblätter",
  slugField: "title",
  path: "src/content/zahlen-und-fakten/*",
  format: { contentField: "content" },
  schema: {
    title: fields.slug({ name: { label: "Titel" } }), // Title
    // mythId + mythNumber are code join-keys (src/lib/faq.ts, quiz page).
    // Kept, but moved to a "System" block at the bottom so editors don't
    // touch them. `theme` and `category` are not used anywhere on the
    // site → hidden via fields.ignored() (value preserved in the file).
    theme: fields.ignored(),
    category: fields.ignored(),
    categoryGroup: fields.select({
      label: "Themengruppe",
      description: "Übergeordnete Themengruppe für die Fakten-Karten-Filterung.",
      options: [
        { label: "Medizinischer und therapeutischer Nutzen", value: "Medizinischer und therapeutischer Nutzen" },
        { label: "Risiken für den Körper und die Entwicklung", value: "Risiken für den Körper und die Entwicklung" },
        { label: "Risiken für die psychische Gesundheit", value: "Risiken für die psychische Gesundheit" },
        { label: "Einfluss auf Stimmung und Wahrnehmung", value: "Einfluss auf Stimmung und Wahrnehmung" },
        { label: "Soziale Auswirkungen und Leistungsfähigkeit", value: "Soziale Auswirkungen und Leistungsfähigkeit" },
        { label: "Risiken durch Dosierung und Qualität", value: "Risiken durch Dosierung und Qualität" },
        { label: "Verbreitung in der Bevölkerung und Gesetzgebung", value: "Verbreitung in der Bevölkerung und Gesetzgebung" },
        { label: "Allgemeine Einschätzung der Gefährlichkeit", value: "Allgemeine Einschätzung der Gefährlichkeit" },
      ],
      defaultValue: "Medizinischer und therapeutischer Nutzen",
    }),
    classification: fields.select({
      label: "Klassifikation", // Classification
      options: [
        { label: "Richtig", value: "richtig" },
        { label: "Eher richtig", value: "eher_richtig" },
        { label: "Eher falsch", value: "eher_falsch" },
        { label: "Falsch", value: "falsch" },
        { label: "Keine Aussage möglich", value: "keine_aussage" },
      ],
      defaultValue: "falsch",
    }),
    classificationLabel: fields.text({
      label: "Einordnung – Kurzformel",
      description: 'Lesbare Kurzformel der Einordnung, z. B. "Das stimmt nicht." Wird auf der Fakten-Karte und im Daten-Explorer angezeigt.',
    }),
    cardSummary: fields.text({
      label: "⭐ Karten-Zusammenfassung (Synthese im Factsheet-Popup)",
      multiline: true,
      description: "2–3 prägnante Sätze. Wird im Popup-Factsheet als „Synthese\" angezeigt — eine kompakte Forschungs-Synthese. NICHT auf den Fakten-Karten-Vorderseiten (dort wird cardShortSummary verwendet, damit Karte und Popup sich unterscheiden).",
    }),
    cardShortSummary: fields.text({
      label: "📇 Kurzzusammenfassung (Fakten-Karte / Quiz / Startseite)",
      multiline: true,
      description: "ISD-finalisierte Kurzfassung. Wird auf der Rückseite der Fakten-Karte, im Quiz-Reveal und im Karten-Preview auf der Startseite angezeigt. ~200–450 Zeichen. Bewusst länger und anders formuliert als die Karten-Zusammenfassung (Popup-Synthese), damit Nutzer:innen beim Klick eine andere Perspektive sehen.",
    }),
    trueStatement: fields.ignored(), // not used on the site
    relatedMyths: fields.array(fields.text({ label: "Mythos-ID" }), {
      label: "Verwandte Mythen", // Related myths
      itemLabel: (props) => props.value,
      description: "IDs verwandter Mythen, z. B. m10, m12.",
    }),
    quizIds: fields.ignored(), // not used on the site
    ...metaFields,
    // ── System – bitte nicht ändern (code join-keys) ────────────────────────
    mythId: fields.text({
      label: "Mythos-ID (System – bitte nicht ändern)", // Myth ID, e.g. m01
      description: "Technische ID, z. B. m01. Wird vom Code verwendet.",
    }),
    mythNumber: fields.integer({
      label: "Mythos-Nummer (System – bitte nicht ändern)", // Myth number 1–42
      description: "Technische Nummer (1–42). Wird vom Code verwendet.",
    }),
    content: fields.markdoc({
      label: "Inhalt", // Content
      description: "Vollständiger Text des Faktenblatts (Markdoc, Deutsch).",
    }),
  },
});

// ─── FAQ – audience-specific files ──────────────────────────────────────────
// One file per audience × question. Source content is the final ISD-reviewed
// FAQ doc at `_local/research/team/FAQ final/cannabismythen_FAQ_2026 05 20.docx`.
// When the same scientific question appears for multiple Zielgruppen with a
// different opening (e.g. "Die allermeisten Eltern…" vs "…Jugendlichen…") we
// keep one .mdoc per audience so the text matches the doc verbatim — see the
// audience-prefixed slug pattern `{audience}-{topic}` in src/content/faq/questions/.

const FAQ_AUDIENCE_OPTIONS = [
  { label: "Eltern minderjähriger Kinder", value: "eltern" },
  { label: "Jugendliche", value: "jugendliche" },
  { label: "Konsumierende", value: "konsumierende" },
  { label: "Lehrkräfte", value: "lehrkraefte" },
  { label: "Fachkräfte", value: "fachkraefte" },
];

const FAQ_DASHBOARD_OPTIONS = [
  { label: "Daten-Explorer (Übersicht)", value: "/daten-explorer/" },
  { label: "Dashboard: Informationswege", value: "/daten-explorer/informationswege/" },
  { label: "Dashboard: Präventionsbedeutung", value: "/daten-explorer/praeventionsbedeutung/" },
  { label: "Dashboard: Präventionspotential", value: "/daten-explorer/praeventionspotential/" },
  { label: "Dashboard: Bevölkerungsrelevanz", value: "/daten-explorer/bevoelkerungsrelevanz/" },
  { label: "Dashboard: Zielgruppenvergleich", value: "/daten-explorer/zielgruppen/" },
  { label: "Dashboard: Minderjährige", value: "/daten-explorer/minderjaehrige/" },
];

const faqQuestions = collection({
  label: "❓ Einzelne Fragen",
  slugField: "title",
  path: "src/content/faq/questions/*",
  format: { contentField: "answer" },
  schema: {
    title: fields.slug({
      name: {
        label: "Frage (Slug)",
        description:
          "Kurze, prägnante Form der Frage. Wird nur intern und als URL-Slug verwendet.",
      },
    }),
    questionLong: fields.text({
      label: "Vollständige Frage",
      description: "Wird als Überschrift auf der FAQ-Seite angezeigt.",
    }),
    audience: fields.select({
      label: "Zielgruppe",
      options: FAQ_AUDIENCE_OPTIONS,
      defaultValue: "eltern",
      description:
        "Genau eine Zielgruppe pro Datei. Wenn dieselbe Frage in mehreren Zielgruppen erscheint, gibt es pro Zielgruppe eine eigene Datei (z. B. eltern-strassenverkehr.mdoc, jugendliche-strassenverkehr.mdoc).",
    }),
    sortOrder: fields.integer({
      label: "Reihenfolge auf der Audience-Seite",
      description:
        "Position innerhalb der Zielgruppe (1, 2, 3, …). Entspricht der TOC-Nummer im Quelldokument (z. B. Eltern 1.5 → 5).",
      defaultValue: 99,
    }),
    classification: fields.select({
      label: "Wissenschaftliche Einordnung",
      options: [
        { label: "Richtig", value: "richtig" },
        { label: "Eher richtig", value: "eher_richtig" },
        { label: "Eher falsch", value: "eher_falsch" },
        { label: "Falsch", value: "falsch" },
        { label: "Keine Aussage möglich", value: "keine_aussage" },
        { label: "Nicht zutreffend (Meta-Frage)", value: "n_a" },
      ],
      defaultValue: "n_a",
    }),
    classificationLabel: fields.text({
      label: "Einordnung – Kurzformel",
      description:
        'Optional, z. B. "Das stimmt nicht." Fällt auf den Default-Text der Klassifikation zurück.',
    }),
    leadAnswer: fields.text({
      label: "Kurzantwort (1–2 Sätze)",
      multiline: true,
      description:
        "Wird oberhalb der ausführlichen Antwort hervorgehoben gezeigt. Sollte die Frage in einem Zug beantworten.",
    }),
    primaryMyth: fields.text({
      label: "Primärer Mythos (z. B. m22)",
      description:
        "Hauptbezugs-Factsheet. Erscheint im Related-Rail mit Pfeil. Format: m01 – m42.",
    }),
    relatedMyths: fields.array(fields.text({ label: "Mythos-ID" }), {
      label: "Verwandte Mythen",
      itemLabel: (p) => p.value,
      description:
        "z. B. m6, m20. Erscheinen als 'Verwandt: …'. Maximal 4 empfohlen.",
    }),
    relatedQuiz: fields.array(fields.text({ label: "Quiz-Slug" }), {
      label: "Verwandte Quiz-Module",
      itemLabel: (p) => p.value,
      description:
        "Slugs aus der quiz-Sammlung, z. B. quiz-medizin oder quiz-risiken.",
    }),
    relatedDashboard: fields.array(
      fields.select({
        label: "Dashboard-Verweis",
        options: FAQ_DASHBOARD_OPTIONS,
        defaultValue: "/daten-explorer/",
      }),
      {
        label: "Dashboard-Verweise",
        itemLabel: (p) => p.value,
      }
    ),
    helplineLabel: fields.text({
      label: "Helpline – Anlass-Text",
      description:
        'z. B. "Suchen Sie Hilfe wegen Depressionen?". Leer lassen = keine Helpline.',
    }),
    helplineTitle: fields.text({
      label: "Helpline – Anbieter-Name",
      description: 'z. B. "Deutsche Depressionshilfe".',
    }),
    helplineUrl: fields.url({
      label: "Helpline – Link",
      description: "Vollständige URL inkl. https://",
    }),
    vizSpec: fields.object(
      {
        vizType: fields.select({
          label: "Visualisierungs-Typ",
          options: [
            { label: "Keine Visualisierung", value: "none" },
            { label: "Top-Mythen (horizontale Balken)", value: "bars-top-myths" },
            { label: "Richtigkeit (Balken)", value: "bars-correctness" },
            { label: "Gruppenvergleich (gruppierte Balken)", value: "grouped-bars-groups" },
            { label: "Donut – Richtigkeit", value: "donut-correctness" },
            { label: "Kanal-Ranking", value: "ranking-channels" },
            { label: "Streudiagramm: Vertrauen × Nutzung", value: "scatter-trust-usage" },
            { label: "Vergleichstabelle", value: "table-comparison" },
          ],
          defaultValue: "none",
        }),
        vizSource: fields.text({
          label: "Datenquelle",
          description:
            'Woher die Daten stammen, z. B. "Tabelle Eltern, Spalte Präventionsbedeutung".',
        }),
        vizDescription: fields.text({
          label: "Beschreibung der Visualisierung",
          multiline: true,
          description: "Was die Grafik zeigen soll.",
        }),
        vizConfig: fields.text({
          label: "Konfiguration (technisch, optional)",
          multiline: true,
          description:
            "Optionale technische Parameter (JSON). Im Zweifel leer lassen.",
        }),
        vizPlacement: fields.select({
          label: "Platzierung im Antworttext",
          options: [
            { label: "Nach Kurzantwort", value: "after-lead" },
            { label: "Vor CaRM-Datenblock", value: "before-data" },
            { label: "Nach CaRM-Datenblock", value: "after-data" },
            { label: "Am Ende", value: "end" },
          ],
          defaultValue: "after-data",
        }),
      },
      {
        label: "Visualisierung (optional)",
        description: "Pro Frage höchstens eine Visualisierung.",
      }
    ),
    ...metaFields,
    answer: fields.markdoc({
      label: "Ausführliche Antwort",
      description:
        'Mehrere Absätze. Custom Markdoc-Tags verfügbar: {% factsheet-link id="m22" /%}, {% data-callout label="…" value="10,0 %" /%}, {% top-myths-bars groupA="minors" topN=5 /%} u.a.',
    }),
  },
});

const faqAudiences = singleton({
  label: "❓ Zielgruppen-Einstellungen",
  path: "src/content/faq/audiences",
  format: { data: "yaml" },
  schema: {
    audiences: fields.array(
      fields.object({
        id: fields.select({
          label: "Zielgruppen-ID",
          options: FAQ_AUDIENCE_OPTIONS,
          defaultValue: "eltern",
        }),
        title: fields.text({
          label: "Seitentitel",
          description: 'z. B. "Fragen für Eltern minderjähriger Kinder"',
        }),
        cardLabel: fields.text({
          label: "Hub-Karten-Label",
          description: 'Kurzform für die Hub-Karte, z. B. "Eltern".',
        }),
        emoji: fields.text({
          label: "Emoji für Hub-Karte",
          description: "Single emoji oder Lucide-Icon-Name (Phase 2).",
        }),
        accentColor: fields.text({
          label: "Akzentfarbe (CSS hex)",
          description: 'z. B. "#4f46e5"',
        }),
        description: fields.text({
          label: "Audience-Beschreibung",
          multiline: true,
          description:
            "Erscheint unter dem H1 auf der Audience-Seite und als Teaser auf der Hub-Karte.",
        }),
        introNote: fields.text({
          label: "Optionaler Einleitungs-Callout",
          multiline: true,
          description:
            "Markdown unterstützt. Wird als Hinweis-Box oberhalb der Fragen gezeigt.",
        }),
        weiterfuehrend: fields.array(
          fields.object({
            label: fields.text({ label: "Beschreibung" }),
            url: fields.url({ label: "Link" }),
          }),
          {
            label: "Weiterführende Informationen",
            itemLabel: (p) => p.fields.label.value || "…",
          }
        ),
        helplines: fields.array(
          fields.object({
            label: fields.text({ label: "Anlass-Text" }),
            title: fields.text({ label: "Anbieter-Name" }),
            url: fields.url({ label: "Link" }),
          }),
          {
            label: "Standard-Helplines (Audience-weit)",
            itemLabel: (p) => p.fields.title.value || "…",
          }
        ),
      }),
      {
        label: "Zielgruppen",
        itemLabel: (p) => p.fields.cardLabel.value || p.fields.id.value,
      }
    ),
  },
});

const quiz = collection({
  label: "🧪 Quiz-Module",
  slugField: "title",
  path: "src/content/quiz/*",
  format: { contentField: "content" },
  schema: {
    title: fields.slug({ name: { label: "Titel" } }), // Title
    theme: fields.ignored(),         // tile style comes from code, not the .mdoc
    questionCount: fields.ignored(), // not used — derived from the questions list
    questions: fields.array(
      fields.object({
        mythId: fields.text({
          label: "Mythos-ID", // Myth ID
          description: "Bezug zu einem Mythos, z. B. m01.",
        }),
        statement: fields.text({
          label: "Aussage", // Statement
          multiline: true,
          description: "Die Mythos-Aussage, die auf der Quiz-Karte steht.",
        }),
        // The correct answer, the population %, and the factsheet slug live in
        // src/components/quiz/quizData.ts (code, CLAUDE.md-protected) — that is
        // the source of truth the quiz actually uses. These .mdoc copies are
        // not read by the quiz page, so they are hidden to stop editors from
        // changing a value that has no effect. Values stay in the file.
        correctClassification: fields.ignored(),
        explanation: fields.text({
          label: "Erklärung", // Explanation
          multiline: true,
          description: "1–2 Sätze, die nach dem Antworten angezeigt werden.",
        }),
        populationCorrectPct: fields.ignored(),
        mythPageSlug: fields.ignored(),
      }),
      {
        label: "Quiz-Fragen", // Quiz questions
        itemLabel: (props) =>
          `${props.fields.mythId.value || "?"}: ${props.fields.statement.value?.slice(0, 50) || "…"}`,
      }
    ),
    verdicts: fields.object(
      {
        profi: fields.object(
          {
            title: fields.text({ label: "Titel" }),
            body: fields.text({ label: "Text", multiline: true }),
          },
          {
            label: "Mythen-Profi (80–100 %)",
          }
        ),
        guterweg: fields.object(
          {
            title: fields.text({ label: "Titel" }),
            body: fields.text({ label: "Text", multiline: true }),
          },
          {
            label: "Auf dem richtigen Weg (60–79 %)",
          }
        ),
        gehtnoch: fields.object(
          {
            title: fields.text({ label: "Titel" }),
            body: fields.text({ label: "Text", multiline: true }),
          },
          {
            label: "Da geht noch was (40–59 %)",
          }
        ),
        erwischt: fields.object(
          {
            title: fields.text({ label: "Titel" }),
            body: fields.text({ label: "Text", multiline: true }),
          },
          {
            label: "Mythen haben dich erwischt (0–39 %)",
          }
        ),
      },
      {
        label: "Ergebnis-Verdikt nach Punktzahl",
        description:
          "Verdikt-Texte für die vier Ergebnis-Bänder. Werden auf der Ergebnisseite gezeigt — passend zur erreichten Punktzahl.",
      }
    ),
    weakSpotIntro: fields.text({
      label: "Einleitung über Mythen-Liste, wenn Schwachstellen vorhanden",
      multiline: true,
      description:
        "Wird über der Mythos-Übersicht angezeigt, wenn ≥1 Mythos 2+ Schritte daneben war.",
    }),
    strongPerformanceIntro: fields.text({
      label: "Einleitung über Mythen-Liste bei starker Leistung",
      multiline: true,
      description:
        "Wird angezeigt, wenn alle Mythen ≤1 Schritt daneben waren.",
    }),
    // Stage 7 — Per-module share-card / population-comparison copy.
    // Each band is a short sentence shown on the result page + the
    // green ShareCard. Empty cells fall back to the global default
    // singleton (`share-copy.yaml`) and finally to a hardcoded sentence
    // in ResultScreen as final defence. {pct} in the text is replaced
    // by the user's percentile vs. Erwachsene 18–70 in der CaRM-Studie.
    shareCopy: fields.object(
      {
        profi: fields.text({ label: "80–100 %", multiline: true }),
        guterweg: fields.text({ label: "60–79 %", multiline: true }),
        gehtnoch: fields.text({ label: "40–59 %", multiline: true }),
        erwischt: fields.text({ label: "0–39 %", multiline: true }),
      },
      {
        label: "Share-Karten-Text nach Punktzahl",
        description:
          "Wird auf der Share-Karte und im Vergleichsabsatz unter dem Hero gezeigt. {pct} im Text wird durch den Prozentsatz ersetzt. Leer lassen, um den globalen Default aus share-copy.yaml zu verwenden.",
      }
    ),
    ...metaFields,
    content: fields.markdoc({
      label: "Inhalt", // Content
      description:
        "Nur Referenz-Notizen. Das interaktive Quiz nutzt die strukturierten Quiz-Fragen oben.",
    }),
  },
});

// ─── Über das Projekt — Scrollytelling singleton ──────────────────────────────
// All editorial German content for the /ueber-uns/ scrollytelling lives here.
// Code-side structural data (viz family, gridMode, sampleRankedMode) stays in
// src/components/scrollytelling/stepDefinitions.ts — these are paired by
// stepNumber at render time. Replaces the legacy `ueberUns` collection
// (deleted 2026-05-11 production-migration session).
const ueberUnsScrolly = singleton({
  label: "ℹ️ Scrollytelling",
  path: "src/content/ueber-uns-scrolly",
  format: { data: "yaml" },
  schema: {
    pageTitle: fields.text({
      label: "Seitentitel (SEO / Browser-Tab)",
      defaultValue: "Über das Projekt",
    }),
    pageDescription: fields.text({
      label: "Seitenbeschreibung (SEO)",
      multiline: true,
      defaultValue:
        "Die CaRM-Studie — Cannabiskonsum: Risiken und Mythen. Forschungsprozess, Methodik und Team in einer interaktiven Geschichte.",
    }),
    // 10 narrative steps. Paired by index with stepDefinitions.ts (code).
    // Order MUST be preserved — index = stepNumber - 1.
    steps: fields.array(
      fields.object({
        heading: fields.text({
          label: "Überschrift",
          multiline: true,
          description: "Zeilenumbruch mit \\n erlaubt.",
        }),
        bodyText: fields.text({
          label: "Fließtext",
          multiline: true,
          description:
            "Absätze mit Leerzeile. **Fettdruck** und Verdikt-Tags [↑ richtig] werden geparst. Bei Schritt 6: eine Zeile `---` trennt Phase 1 (3 Indikatoren) von Phase 2 (Synthese).",
        }),
        legend: fields.text({
          label: "Legende / Metadaten (optional)",
          multiline: true,
          description:
            "Kleingedruckter Hinweis unter dem Fließtext, visuell abgesetzt — z. B. Quellen, Zeitraum, n-Werte. Nur eine Zeile.",
        }),
        hint: fields.text({ label: "Hinweis (optional)", multiline: true }),
      }),
      {
        label: "Schritte (11)",
        itemLabel: (props) => props.fields.heading.value.split("\n")[0].slice(0, 60),
      },
    ),
    // 6 timeline tooltips (Step 1). `anchorDate` is the join key with
    // VizTimeline's ANCHORS array.
    timelineTooltips: fields.array(
      fields.object({
        anchorDate: fields.text({
          label: "Anker-Datum (ISO yyyy-mm-dd)",
          description: "Muss mit ANCHORS in VizTimeline übereinstimmen.",
        }),
        body: fields.text({ label: "Tooltip-Text", multiline: true }),
      }),
      {
        label: "Timeline-Tooltips (Schritt 1)",
        itemLabel: (props) => props.fields.anchorDate.value,
      },
    ),
    // 6 team members (Step 10 avatars).
    teamMembers: fields.array(
      fields.object({
        initials: fields.text({ label: "Initialen (2 Buchstaben)" }),
        fullName: fields.text({ label: "Voller Name" }),
        role: fields.text({ label: "Rolle" }),
        affiliation: fields.text({ label: "Institution", defaultValue: "ISD Hamburg" }),
        bio: fields.text({ label: "Kurz-Bio", multiline: true }),
        color: fields.text({
          label: "Avatar-Farbe (CSS-Hex)",
          description: "z. B. #6366f1",
        }),
      }),
      {
        label: "Projektteam",
        itemLabel: (props) => props.fields.fullName.value,
      },
    ),
    landesstellenCredit: fields.text({
      label: "Landesstellen-Credit",
      multiline: true,
    }),
    // Footer blocks moved to the dedicated `footer` singleton (2026-06-25).
    internalNotes: fields.text({
      label: "Interne Notizen", // Internal notes
      multiline: true,
      description:
        "Nur für die Redaktion — wird nie öffentlich angezeigt. (Editorial only, never shown publicly.)",
    }),
  },
});

const meta = collection({
  label: "⚙️ Meta (intern)",
  slugField: "title",
  path: "src/content/meta/*",
  format: { contentField: "content" },
  schema: {
    title: fields.slug({ name: { label: "Titel" } }), // Title
    ...metaFields,
    content: fields.markdoc({
      label: "Content",
      description: "Internal reference material — not rendered on public site.",
    }),
  },
});

const changelog = collection({
  label: "📋 Project Log",
  slugField: "title",
  path: "src/content/changelog/*",
  format: { contentField: "notes" },
  schema: {
    title: fields.slug({
      name: { label: "Entry Title", description: "e.g. 'Factsheet m03 überarbeitet'" },
    }),
    date: fields.date({
      label: "Date",
      description: "Date of the change or planned action.",
      defaultValue: { kind: "today" },
    }),
    author: fields.text({
      label: "Author",
      description: "Who made or is responsible for this change.",
    }),
    type: fields.select({
      label: "Type",
      options: [
        { label: "✏️ Content Update", value: "content_update" },
        { label: "🆕 New Content", value: "new_content" },
        { label: "🔍 Review / Feedback", value: "review" },
        { label: "🐛 Fix", value: "fix" },
        { label: "📌 Planned", value: "planned" },
        { label: "🚀 Milestone", value: "milestone" },
      ],
      defaultValue: "content_update",
    }),
    status: fields.select({
      label: "Status",
      options: [
        { label: "Done", value: "done" },
        { label: "In Progress", value: "in_progress" },
        { label: "Planned", value: "planned" },
        { label: "Blocked", value: "blocked" },
      ],
      defaultValue: "done",
    }),
    affectedContent: fields.array(fields.text({ label: "Item" }), {
      label: "Affected Content",
      itemLabel: (props) => props.value,
      description: "Which factsheets, FAQ entries, etc. were changed (e.g. m03, m07).",
    }),
    notes: fields.markdoc({
      label: "Notes",
      description:
        "Details, rationale, outstanding questions, or next steps. Internal only.",
    }),
  },
});

// ─── Singletons ─────────────────────────────────────────────────────────────


const dashboardDefinitionen = singleton({
  label: "📊 Definitionen & Glossar",
  path: "src/content/dashboard-definitionen",
  format: { data: "json" },
  schema: {
    // Population group definitions
    groups: fields.object(
      {
        general_population: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Gesamtbevölkerung (16–70)" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue: "Alle Befragten (Volljährige und Minderjährige kombiniert).",
            }),
          },
          { label: "Gesamtbevölkerung" }
        ),
        adults: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Erwachsene (18–70)" }),
            sampleSize: fields.text({ label: "Stichprobe", defaultValue: "n = 2.097" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue:
                "Repräsentative Stichprobe der Bevölkerung (18–70 J.), gewichtet nach Geschlecht, Alter, Bildung und Migrationshintergrund.",
            }),
          },
          { label: "Erwachsene (18–70)" }
        ),
        minors: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Minderjährige (16–17)" }),
            sampleSize: fields.text({ label: "Stichprobe", defaultValue: "n = 555" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue:
                "Repräsentative Stichprobe der 16–17-Jährigen aus dem Horizoom-Jugendpanel.",
            }),
          },
          { label: "Minderjährige (16–17)" }
        ),
        consumers: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Konsumierende" }),
            sampleSize: fields.text({ label: "Stichprobe", defaultValue: "n = 358" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue:
                "Personen mit Cannabis-Konsum in den letzten 30 Tagen (30-Tage-Prävalenz).",
            }),
          },
          { label: "Konsumierende" }
        ),
        young_adults: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Junge Erwachsene (18–26)" }),
            sampleSize: fields.text({ label: "Stichprobe", defaultValue: "n = 333" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue: "Teilgruppe der Volljährigen im Alter von 18–26 Jahren.",
            }),
          },
          { label: "Junge Erwachsene (18–26)" }
        ),
        parents: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Eltern" }),
            sampleSize: fields.text({ label: "Stichprobe", defaultValue: "n = 539" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue: "Volljährige mit mindestens einem Kind unter 18 Jahren.",
            }),
          },
          { label: "Eltern" }
        ),
      },
      { label: "Bevölkerungsgruppen" }
    ),

    // Myth indicator definitions
    mythIndicators: fields.object(
      {
        awareness: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Kenntnis (%)" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue: "Anteil der Befragten, die den Mythos kennen. Höher = bekannter.",
            }),
            scale: fields.text({ label: "Skala", defaultValue: "0–100 %" }),
          },
          { label: "Kenntnis" }
        ),
        significance: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Bedeutung (Punkte)" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue:
                "Subjektive Wichtigkeit des Mythos für eigene Entscheidungen. Nur bei Personen erhoben, die den Mythos kennen.",
            }),
            scale: fields.text({ label: "Skala", defaultValue: "0–100 Punkte" }),
          },
          { label: "Bedeutung" }
        ),
        correctness: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Richtigkeit (Punkte)" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue:
                "Übereinstimmung der Einschätzung mit der wissenschaftlichen Klassifikation. Höher = treffender.",
            }),
            scale: fields.text({ label: "Skala", defaultValue: "0–100 Punkte" }),
          },
          { label: "Richtigkeit" }
        ),
        prevention_significance: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Präventionsbedeutung (Punkte)" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue:
                "Kombination aus Bedeutung und Fehleinschätzung. Höher = größerer Präventionsbedarf.",
            }),
            scale: fields.text({ label: "Skala", defaultValue: "0–100 Punkte" }),
          },
          { label: "Präventionsbedeutung" }
        ),
      },
      { label: "Mythen-Indikatoren" }
    ),

    // Sources indicator definitions
    sourcesIndicators: fields.object(
      {
        search: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Suche (%)" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue:
                "Anteil der Befragten, die diesen Kanal aktiv zur Information nutzen würden.",
            }),
            scale: fields.text({ label: "Skala", defaultValue: "0–100 %" }),
          },
          { label: "Suche" }
        ),
        perception: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Wahrnehmung (%)" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue:
                "Anteil, der über diesen Kanal ungeplant Gesundheitsinformationen wahrnimmt.",
            }),
            scale: fields.text({ label: "Skala", defaultValue: "0–100 %" }),
          },
          { label: "Wahrnehmung" }
        ),
        trust: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Vertrauen (Punkte)" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue: "Eingeschätzte Vertrauenswürdigkeit der Quelle (0–100).",
            }),
            scale: fields.text({ label: "Skala", defaultValue: "0–100 Punkte" }),
          },
          { label: "Vertrauen" }
        ),
        prevention: fields.object(
          {
            label: fields.text({ label: "Label", defaultValue: "Präventionspotential (Punkte)" }),
            definition: fields.text({
              label: "Definition",
              multiline: true,
              defaultValue:
                "Kombinierter Wert aus Suche, Wahrnehmung und Vertrauen. Höher = größeres Potential für Prävention.",
            }),
            scale: fields.text({ label: "Skala", defaultValue: "0–100 Punkte" }),
          },
          { label: "Präventionspotential" }
        ),
      },
      { label: "Informationsquellen-Indikatoren" }
    ),
  },
});

// ─── Homepage editorial sections ───────────────────────────────────────────

const headlineFinding = singleton({
  label: "📢 Schlüsselbefund",
  path: "src/content/headline-finding",
  format: { data: "yaml" },
  schema: {
    eyebrow: fields.text({
      label: "Eyebrow",
      defaultValue: "Ein Schlüsselbefund",
    }),
    leadClause: fields.text({
      label: "Lead-Satzteil (Serifen-Kursiv)",
      multiline: true,
      description: "Der erste, einleitende Teil des Zitat-Satzes (Salbei-Grün, DM Serif Italic).",
      defaultValue: "„3 von 4 Befragten glaubten, Cannabis sei weniger schädlich als Alkohol —",
    }),
    counterClause: fields.text({
      label: "Gegen-Satzteil (Fett)",
      multiline: true,
      description: "Der zweite, kontrastierende Teil (Inter Bold, fast-schwarz).",
      defaultValue: "die wissenschaftliche Evidenz zeigt das Gegenteil.\u201c",
    }),
    counterClassification: fields.select({
      label: "Farbakzent für Gegen-Satzteil",
      description: "Welche Klassifikations-Farbe wird als kleiner Akzent neben dem Gegen-Satzteil gesetzt?",
      options: [
        { label: "Richtig (Emerald)", value: "richtig" },
        { label: "Eher richtig (Lime)", value: "eher_richtig" },
        { label: "Eher falsch (Amber)", value: "eher_falsch" },
        { label: "Falsch (Rose)", value: "falsch" },
        { label: "Keine Aussage (Grau)", value: "keine_aussage_moeglich" },
      ],
      defaultValue: "falsch",
    }),
  },
});

const fourPaths = singleton({
  label: "🧭 Vier Wege ins Thema",
  path: "src/content/four-paths",
  format: { data: "yaml" },
  schema: {
    quizTile: fields.object(
      {
        title: fields.text({ label: "Titel", defaultValue: "Quiz" }),
        description: fields.text({
          label: "Beschreibung",
          defaultValue: "≈3 Minuten · Sofort-Feedback",
        }),
        ctaLabel: fields.text({ label: "CTA-Text", defaultValue: "Quiz starten" }),
        targetUrl: fields.text({ label: "Ziel-URL", defaultValue: "/quiz/" }),
        sampleEyebrow: fields.text({
          label: "Vorschau-Karte: Eyebrow",
          defaultValue: "Beispielfrage",
        }),
        sampleMythText: fields.text({
          label: "Vorschau-Karte: Beispiel-Mythos",
          defaultValue: "Cannabis ist weniger schädlich als Alkohol.",
        }),
        sampleMythClassification: fields.select({
          label: "Vorschau-Karte: Klassifikation",
          options: [
            { label: "Richtig", value: "richtig" },
            { label: "Eher richtig", value: "eher_richtig" },
            { label: "Eher falsch", value: "eher_falsch" },
            { label: "Falsch", value: "falsch" },
          ],
          defaultValue: "eher_falsch",
        }),
      },
      { label: "Quiz-Kachel" },
    ),
    faktenKartenTile: fields.object(
      {
        title: fields.text({ label: "Titel", defaultValue: "Fakten-Karten" }),
        description: fields.text({
          label: "Beschreibung",
          defaultValue: "42 Mythen · mit einem Klick umdrehen",
        }),
        ctaLabel: fields.text({ label: "CTA-Text", defaultValue: "Karten durchstöbern" }),
        targetUrl: fields.text({ label: "Ziel-URL", defaultValue: "/fakten-karten/" }),
      },
      { label: "Fakten-Karten-Kachel" },
    ),
    datenExplorerTile: fields.object(
      {
        title: fields.text({ label: "Titel", defaultValue: "Daten-Explorer" }),
        description: fields.text({
          label: "Beschreibung",
          defaultValue: "5 Indikatoren · 5 Zielgruppen · 42 Mythen",
        }),
        ctaLabel: fields.text({ label: "CTA-Text", defaultValue: "Daten erkunden" }),
        targetUrl: fields.text({ label: "Ziel-URL", defaultValue: "/daten-explorer/" }),
      },
      { label: "Daten-Explorer-Kachel" },
    ),
    meineInteressenTile: fields.object(
      {
        title: fields.text({ label: "Titel", defaultValue: "Meine Interessen" }),
        description: fields.text({
          label: "Beschreibung",
          defaultValue: "Antworten für deine Rolle — Eltern, Lehrkräfte, Fachkräfte u. v. m.",
        }),
        ctaLabel: fields.text({ label: "CTA-Text", defaultValue: "Themen auswählen" }),
        targetUrl: fields.text({ label: "Ziel-URL", defaultValue: "/meine-interessen/" }),
      },
      { label: "Meine-Interessen-Kachel" },
    ),
  },
});

// ─── Homepage v2 (landing-page redesign) editorial sections ────────────────
// Stage-4 redesign of the Startseite. These three singletons feed the new
// blocks (NumbersStripBlock, AudienceShortcutBlock, ProjectStripBlock). The
// hero and headline-finding singletons above remain in place; they are
// replaced/trimmed in later commits of the redesign series.

const numbersStrip = singleton({
  label: "🔢 Forschung in Zahlen",
  path: "src/content/numbers-strip",
  format: { data: "yaml" },
  schema: {
    eyebrow: fields.text({
      label: "Eyebrow",
      defaultValue: "So ist diese Seite entstanden",
    }),
    numerals: fields.array(
      fields.object({
        value: fields.integer({
          label: "Zahl",
          description: "Endwert. Wird beim Eintreten in den Sichtbereich von 0 hochgezählt.",
        }),
        suffix: fields.text({
          label: "Suffix (optional)",
          description: 'z. B. "+" oder "k". Leer lassen für reine Zahl.',
          defaultValue: "",
        }),
        label: fields.text({
          label: "Beschriftung",
          description: "Kurze Zeile unmittelbar unter der Zahl.",
        }),
        description: fields.text({
          label: "Erläuterung",
          multiline: true,
          description: "Eine ergänzende Detailzeile.",
        }),
      }),
      {
        label: "Zahlen",
        itemLabel: (p) => `${p.fields.value.value} ${p.fields.label.value}`,
      },
    ),
    linkLabel: fields.ignored(), // not passed to the component
    linkUrl: fields.ignored(),   // not passed to the component
  },
});

// All website-footer content in one place (rendered by SiteFooter on every
// page via BaseLayout). The four text blocks were previously buried in the
// ueberUnsScrolly singleton and the links in the old projectStrip singleton —
// unified here 2026-06-25 so editors edit the whole footer in one section.
const footer = singleton({
  label: "🦶 Footer-Inhalte", // Footer content
  path: "src/content/footer",
  format: { data: "yaml" },
  schema: {
    footerKontakt: fields.object(
      {
        label: fields.text({ label: "Block-Titel", defaultValue: "Kontakt" }),
        lines: fields.array(fields.text({ label: "Adress-Zeile" }), {
          label: "Adress-Zeilen",
          itemLabel: (props) => props.value,
        }),
        email: fields.text({ label: "E-Mail-Adresse" }),
      },
      { label: "Kontakt" },
    ),
    footerFoerderung: fields.object(
      {
        label: fields.text({ label: "Block-Titel", defaultValue: "Förderung" }),
        body: fields.text({ label: "Text", multiline: true }),
      },
      { label: "Förderung" },
    ),
    footerZitierweise: fields.object(
      {
        label: fields.text({ label: "Block-Titel", defaultValue: "Zitierweise" }),
        body: fields.text({ label: "Text", multiline: true }),
      },
      { label: "Zitierweise" },
    ),
    footerAbschlussbericht: fields.object(
      {
        label: fields.text({ label: "Block-Titel", defaultValue: "Abschlussbericht" }),
        body: fields.text({ label: "Text", multiline: true }),
      },
      { label: "Abschlussbericht" },
    ),
    links: fields.array(
      fields.object({
        label: fields.text({ label: "Beschriftung" }),
        url: fields.text({ label: "URL" }),
      }),
      {
        label: "Links",
        itemLabel: (p) => p.fields.label.value || "Link",
      },
    ),
  },
});

// Stage 7 — Global default share/comparison copy. Used when a quiz
// module's `shareCopy.{band}` cell is empty. Per-module overrides win.
const shareCopy = singleton({
  label: "💬 Share-Karten-Texte",
  path: "src/content/share-copy",
  format: { data: "yaml" },
  schema: {
    profi: fields.text({
      label: "80–100 % – Profi-Band",
      multiline: true,
      defaultValue:
        "Du liegst klar über dem Schnitt der Erwachsenen (18–70) in einer repräsentativen Stichprobe in Deutschland (ca. {pct} %). Stark gemacht.",
    }),
    guterweg: fields.text({
      label: "60–79 % – Guter-Weg-Band",
      multiline: true,
      defaultValue:
        "Du liegst leicht über dem Schnitt der Erwachsenen (18–70) in einer repräsentativen Stichprobe in Deutschland (ca. {pct} %).",
    }),
    gehtnoch: fields.text({
      label: "40–59 % – Geht-noch-Band",
      multiline: true,
      defaultValue:
        "Du liegst etwa im Schnitt der Erwachsenen (18–70) in einer repräsentativen Stichprobe in Deutschland (ca. {pct} %).",
    }),
    erwischt: fields.text({
      label: "0–39 % – Erwischt-Band",
      multiline: true,
      defaultValue:
        "Hier saßen noch viele Mythen. Die Fakten-Karten räumen das in zehn Minuten auf.",
    }),
  },
});

// ─── Config export ──────────────────────────────────────────────────────────

export default config({
  storage: {
    kind: "github",
    repo: {
      owner: "fshankov",
      name: "cannabismythen",
    },
    branchPrefix: "content/",
  },
  // ── Editor sidebar ──────────────────────────────────────────────────────
  // Groups mirror the public website's sections/nav so editors recognise where
  // each thing lives (Startseite, Fakten-Karten, Quiz, Meine Interessen,
  // Daten-Explorer, Über das Projekt). Anything NOT listed is hidden from the
  // sidebar (it stays in the repo, still reachable by direct URL — nothing is
  // deleted). Hidden on purpose (queued for a separate keep/delete review):
  //   heroBlock, audienceShortcut, ueberProjektTeaser (homepage hero is built
  //   in code / these singletons are never rendered), zahlenUndFaktenDashboard
  //   (only a 301-redirect reads it), startseite (archive route), meta,
  //   changelog (internal-only, never public).
  ui: {
    navigation: {
      Startseite: ["headlineFinding", "fourPaths", "numbersStrip"],
      "42 Mythen – Fakten-Karten": ["zahlenUndFakten"],
      Quiz: ["quiz", "shareCopy"],
      "Meine Interessen": ["faqQuestions", "faqAudiences"],
      "Daten-Explorer": ["dashboardDefinitionen"],
      "Über das Projekt": ["ueberUnsScrolly"],
      Footer: ["footer"],
    },
  },
  collections: {
    zahlenUndFakten,  // 🃏 Fakten-Karten  →  /fakten-karten/ + /daten-explorer/[slug]
    faqQuestions,     // ❓ Meine Interessen – Einzelne Fragen (audience-first)
    quiz,             // 🧪 Quiz  →  /quiz/
    // ── Internal (hidden from the editor sidebar via ui.navigation) ─────────
    meta,
    changelog,
  },
  singletons: {
    headlineFinding,
    fourPaths,
    numbersStrip,
    dashboardDefinitionen,
    faqAudiences,
    shareCopy,
    ueberUnsScrolly,
    footer,
  },
});
