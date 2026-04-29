import { config, collection, singleton, fields } from "@keystatic/core";

// ─── Shared field helpers ───────────────────────────────────────────────────
// Reusable field groups used across multiple collections.

const statusField = fields.select({
  label: "Status",
  options: [
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
  ],
  defaultValue: "draft",
});

const metaFields = {
  summary: fields.text({
    label: "Zusammenfassung (SEO / Listings)",
    multiline: true,
    description: "Kurzbeschreibung für Suchergebnisse und Übersichtsseiten. Nicht zu verwechseln mit der Karten-Zusammenfassung (cardSummary) der Fakten-Karten.",
  }),
  tags: fields.array(fields.text({ label: "Tag" }), {
    label: "Tags",
    itemLabel: (props) => props.value,
  }),
  status: statusField,
  internalNotes: fields.text({
    label: "Internal Notes",
    multiline: true,
    description:
      "Editorial notes. NEVER rendered publicly — only visible in the CMS.",
  }),
  publishedAt: fields.date({ label: "Published Date" }),
  updatedAt: fields.date({ label: "Last Updated" }),
};

// ─── Collections ────────────────────────────────────────────────────────────

const zahlenUndFakten = collection({
  label: "🃏 Fakten-Karten – Mythen-Faktenblätter",
  slugField: "title",
  path: "src/content/zahlen-und-fakten/*",
  format: { contentField: "content" },
  schema: {
    title: fields.slug({ name: { label: "Title" } }),
    mythId: fields.text({
      label: "Myth ID",
      description: "e.g. m01, m02",
    }),
    mythNumber: fields.integer({
      label: "Myth Number",
      description: "Numeric myth identifier (1–42)",
    }),
    theme: fields.select({
      label: "Theme",
      options: [
        { label: "Übergreifend", value: "übergreifend" },
        { label: "Substanz", value: "substanz" },
        { label: "Körper", value: "körper" },
        { label: "Körper & Psyche", value: "körper_psyche" },
        { label: "Psyche", value: "psyche" },
        { label: "Soziales", value: "soziales" },
        { label: "Rechtliches", value: "rechtliches" },
      ],
      defaultValue: "übergreifend",
    }),
    category: fields.text({
      label: "Kategorie (intern)",
      description: "Interne Feinkategorie, z. B. Medizin, Risiko, Sozial. Nur für redaktionelle Orientierung.",
    }),
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
      label: "Classification",
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
      label: "⭐ Karten-Zusammenfassung (Fakten-Karte Rückseite)",
      multiline: true,
      description: "2–3 prägnante Sätze für die Rückseite der Fakten-Karte. Faktenbasiert, allgemeinverständlich, zum Weiterlesen einladend. Maximal ~250 Zeichen. Wird ausschließlich auf den Fakten-Karten angezeigt.",
    }),
    trueStatement: fields.text({
      label: "✅ Wahre Aussage (reformuliert)",
      description:
        "Die evidenzbasierte Wahrheit der Aussage – ein Satz. Erscheint auf Fakten-Karten und im Dashboard. Nicht im Quiz (dort bleibt die Original-Aussage). Maximal ~120 Zeichen.",
    }),
    relatedMyths: fields.array(fields.text({ label: "Myth ID" }), {
      label: "Related Myths",
      itemLabel: (props) => props.value,
      description: "IDs of related myths, e.g. m10, m12",
    }),
    quizIds: fields.array(fields.text({ label: "Quiz ID" }), {
      label: "Quiz IDs",
      itemLabel: (props) => props.value,
    }),
    ...metaFields,
    content: fields.markdoc({
      label: "Content",
      description: "Full factsheet body in Markdoc (German).",
    }),
  },
});

const zahlenUndFaktenDashboard = collection({
  label: "📊 Daten-Explorer – Zielgruppen-Indikatoren",
  slugField: "title",
  path: "src/content/zahlen-und-fakten-dashboard/*",
  format: { contentField: "content" },
  schema: {
    title: fields.slug({ name: { label: "Title" } }),
    audienceSegment: fields.select({
      label: "Audience Segment",
      options: [
        { label: "Erwachsene (18–70)", value: "erwachsene" },
        { label: "Minderjährige (16–17)", value: "minderjaehrige" },
        { label: "Konsumierende", value: "konsumierende" },
        { label: "Junge Erwachsene (18–26)", value: "junge_erwachsene" },
        { label: "Eltern", value: "eltern" },
        { label: "Übergreifend", value: "uebergreifend" },
      ],
      defaultValue: "erwachsene",
    }),
    ...metaFields,
    content: fields.markdoc({
      label: "Content",
      description: "Dashboard indicator data and descriptions (German).",
    }),
  },
});

const haeufigeFragen = collection({
  label: "❓ Ihre Fragen – FAQ",
  slugField: "title",
  path: "src/content/haeufige-fragen/*",
  format: { contentField: "content" },
  schema: {
    title: fields.slug({ name: { label: "Title" } }),
    theme: fields.text({
      label: "Theme",
      description: "Thematic group, e.g. Gesundheit, Psyche & Kognition",
    }),
    audience: fields.multiselect({
      label: "Target Audiences",
      options: [
        { label: "Allgemein (18–70)", value: "allgemein" },
        { label: "Jugendliche (16–17)", value: "jugendliche" },
        { label: "Konsumierende", value: "konsumierende" },
        { label: "Junge Erwachsene (18–26)", value: "junge_erwachsene" },
        { label: "Eltern", value: "eltern" },
      ],
    }),
    sortOrder: fields.integer({
      label: "Sort Order",
      description: "Display order on the FAQ index page.",
    }),
    ...metaFields,
    content: fields.markdoc({
      label: "Content",
      description: "FAQ body with questions and answers (German).",
    }),
  },
});

const selbsttest = collection({
  label: "🧪 Selbsttest – Quiz-Module",
  slugField: "title",
  path: "src/content/selbsttest/*",
  format: { contentField: "content" },
  schema: {
    title: fields.slug({ name: { label: "Title" } }),
    theme: fields.text({
      label: "Theme",
      description: "e.g. Körper, Psyche, Alltag, Gesellschaft",
    }),
    questionCount: fields.integer({ label: "Number of Questions" }),
    questions: fields.array(
      fields.object({
        mythId: fields.text({
          label: "Myth ID",
          description: "Reference to a myth, e.g. m01, m22",
        }),
        statement: fields.text({
          label: "Statement (DE)",
          multiline: true,
          description: "The myth statement shown on the quiz card.",
        }),
        correctClassification: fields.select({
          label: "Correct Classification",
          options: [
            { label: "Richtig", value: "richtig" },
            { label: "Eher richtig", value: "eher_richtig" },
            { label: "Eher falsch", value: "eher_falsch" },
            { label: "Falsch", value: "falsch" },
            { label: "Keine Aussage möglich", value: "keine_aussage" },
          ],
          defaultValue: "falsch",
        }),
        explanation: fields.text({
          label: "Explanation (DE)",
          multiline: true,
          description:
            "1–2 sentence explanation shown after answering.",
        }),
        populationCorrectPct: fields.number({
          label: "Population Correct %",
          description:
            "% of German adults who answered correctly. Leave empty if unavailable.",
        }),
        mythPageSlug: fields.text({
          label: "Myth Page Slug",
          description:
            "Slug of the related factsheet page, e.g. m01-allheilmittel",
        }),
      }),
      {
        label: "Quiz Questions",
        itemLabel: (props) =>
          `${props.fields.mythId.value || "?"}: ${props.fields.statement.value?.slice(0, 50) || "…"}`,
      }
    ),
    resultTiers: fields.array(
      fields.object({
        title: fields.text({
          label: "Tier Title (DE)",
          description: "e.g. Gut informiert, Cannabis-Experte",
        }),
        message: fields.text({
          label: "Motivational Message (DE)",
          multiline: true,
        }),
        minScore: fields.integer({
          label: "Min Score",
          description: "Minimum score for this tier (inclusive).",
        }),
        maxScore: fields.integer({
          label: "Max Score",
          description: "Maximum score for this tier (inclusive).",
        }),
        recommendedSlugs: fields.array(
          fields.text({ label: "Factsheet Slug" }),
          {
            label: "Recommended Factsheets",
            itemLabel: (props) => props.value,
            description:
              "2–3 factsheet slugs to recommend for this tier.",
          }
        ),
      }),
      {
        label: "Result Tiers",
        itemLabel: (props) =>
          `${props.fields.minScore.value}–${props.fields.maxScore.value}: ${props.fields.title.value || "…"}`,
      }
    ),
    ...metaFields,
    content: fields.markdoc({
      label: "Content",
      description:
        "Quiz questions, options, correct answers, and explanations (German). Used as reference — the interactive quiz reads from the structured 'questions' field above.",
    }),
  },
});

const startseite = collection({
  label: "🏠 Startseite – Scrollytelling",
  slugField: "title",
  path: "src/content/startseite/*",
  format: { contentField: "content" },
  schema: {
    title: fields.slug({ name: { label: "Title" } }),
    versionLabel: fields.text({
      label: "Version Label",
      description: "e.g. v2.0",
    }),
    stepCount: fields.integer({ label: "Number of Steps" }),
    steps: fields.array(
      fields.object({
        stepNumber: fields.integer({
          label: "Step Number",
          description: "1-based step number",
        }),
        heading: fields.text({
          label: "Heading (H2)",
          multiline: true,
          description: "Step heading shown in the text column.",
        }),
        bodyText: fields.text({
          label: "Body Text",
          multiline: true,
          description:
            "Paragraph text for this step (German). Use \\n\\n for paragraph breaks.",
        }),
        hint: fields.text({
          label: "Hint / Instruction",
          description:
            "Small hint text below the body, e.g. 'Tippe auf die Karte…'",
        }),
        vizType: fields.select({
          label: "Visualization Type",
          options: [
            { label: "Big Number", value: "bigNumber" },
            { label: "Context Cloud (Grey)", value: "contextCloud" },
            { label: "Group Cloud (Colored)", value: "groupCloud" },
            { label: "Color Reveal Cloud", value: "colorReveal" },
            { label: "Trust Gap Chart", value: "trustGap" },
          ],
          defaultValue: "bigNumber",
        }),
        ctaLabel: fields.text({
          label: "CTA Button Label",
          description: "Optional call-to-action button text.",
        }),
        ctaUrl: fields.text({
          label: "CTA Button URL",
          description: "Optional call-to-action button link.",
        }),
      }),
      {
        label: "Scrollytelling Steps",
        itemLabel: (props) =>
          `Schritt ${props.fields.stepNumber.value}: ${props.fields.heading.value?.slice(0, 40) || "…"}`,
      }
    ),
    ...metaFields,
    content: fields.markdoc({
      label: "Content",
      description:
        "Full specification document (German). Used as reference and rendered on detail page.",
    }),
  },
});

const ueberUns = collection({
  label: "ℹ️ Über das Projekt – Seiten",
  slugField: "title",
  path: "src/content/ueber-uns/*",
  format: { contentField: "content" },
  schema: {
    title: fields.slug({ name: { label: "Title" } }),
    sortOrder: fields.integer({
      label: "Sort Order",
      description: "Display order on the about page.",
    }),
    ...metaFields,
    content: fields.markdoc({
      label: "Content",
      description: "About page content (German).",
    }),
  },
});

const meta = collection({
  label: "⚙️ Meta (intern)",
  slugField: "title",
  path: "src/content/meta/*",
  format: { contentField: "content" },
  schema: {
    title: fields.slug({ name: { label: "Title" } }),
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

const heroBlock = singleton({
  label: "🏔️ Hero-Block – Startseite",
  path: "src/content/hero-block",
  format: { data: "yaml" },
  schema: {
    headline1: fields.text({
      label: "Headline Zeile 1",
      description: "Erste Zeile der Hauptüberschrift. Inter fett, Off-White.",
      defaultValue: "Was glauben wir zu wissen —",
    }),
    headline2: fields.text({
      label: "Headline Zeile 2",
      description: "Zweite Zeile der Hauptüberschrift. DM Serif Display, kursiv, Salbei-Grün.",
      defaultValue: "und was stimmt wirklich?",
    }),
    eyebrow: fields.text({
      label: "Eyebrow-Label",
      description: "Kleiner Claim über der Überschrift (Kapitälchen).",
      defaultValue: "cannabismythen.de · 42 Mythen · wissenschaftlich geprüft",
    }),
    hoverHint: fields.text({
      label: "Hover-Hinweis",
      description: "Kurztext der den interaktiven Nebel-Effekt erklärt (Desktop). Wird auf Touch-Geräten versteckt.",
      defaultValue: "Bewege die Maus — hebe den Nebel und entdecke die Mythen",
    }),
    ctaLabel: fields.text({
      label: "CTA Button-Text",
      description: "Beschriftung des Call-to-Action-Buttons unter dem Hinweis. Leer lassen = kein Button.",
      defaultValue: "Mythen entdecken",
    }),
    ctaUrl: fields.text({
      label: "CTA Button-Link",
      description: "Ziel-URL des CTA-Buttons.",
      defaultValue: "/fakten-karten/",
    }),
  },
});

const dashboardDefinitionen = singleton({
  label: "📊 Daten-Explorer – Definitionen & Glossar",
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

const credibilityBlock = singleton({
  label: "🛡️ Credibility-Block – Startseite",
  path: "src/content/credibility-block",
  format: { data: "yaml" },
  schema: {
    eyebrow: fields.text({
      label: "Eyebrow",
      description: "Kleines Kapitälchen-Label über der Überschrift.",
      defaultValue: "Woher die Zahlen kommen",
    }),
    headline: fields.text({
      label: "Überschrift",
      description: "Serifen-Überschrift (DM Serif Display, kursiv).",
      defaultValue: "Eine Bevölkerungs­befragung, wissenschaftlich eingeordnet.",
    }),
    lede: fields.text({
      label: "Einleitender Absatz",
      multiline: true,
      description: "Kurzer Text unter der Überschrift (2–3 Sätze).",
      defaultValue:
        "Unsere 42 Aussagen stammen aus einer repräsentativen Befragung in Deutschland. Jede wird von Wissenschaftler:innen auf Basis der aktuellen Evidenz eingeordnet — transparent, nachvollziehbar, aktualisiert.",
    }),
    row1Label: fields.text({ label: "Zeile 1 – Label", defaultValue: "ISD Hamburg" }),
    row1Value: fields.text({
      label: "Zeile 1 – Wert",
      defaultValue: "Institut für Interdisziplinäre Sucht- und Drogenforschung",
    }),
    row1Link: fields.text({ label: "Zeile 1 – Link (optional)", defaultValue: "https://isd-hamburg.de" }),
    row2Label: fields.text({ label: "Zeile 2 – Label", defaultValue: "Bevölkerungsbefragung" }),
    row2Value: fields.text({
      label: "Zeile 2 – Wert",
      defaultValue: "n = 2.097 Erwachsene · Deutschland 2024 · gewichtet nach Geschlecht, Alter, Bildung",
    }),
    row2Link: fields.text({ label: "Zeile 2 – Link (optional)", defaultValue: "/ueber-uns/" }),
    row3Label: fields.text({ label: "Zeile 3 – Label", defaultValue: "Wissenschaftlich geprüft" }),
    row3Value: fields.text({
      label: "Zeile 3 – Wert",
      defaultValue: "Letzte Prüfung der Einordnungen: April 2026",
    }),
    row3Link: fields.text({ label: "Zeile 3 – Link (optional)", defaultValue: "/ueber-uns/" }),
  },
});

const headlineFinding = singleton({
  label: "📢 Schlüsselbefund – Startseite",
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
        { label: "Keine Aussage (Grau)", value: "no_classification" },
      ],
      defaultValue: "falsch",
    }),
    dashboardCardTitle: fields.text({
      label: "Karte A – Titel",
      defaultValue: "Alle 42 Mythen im Überblick",
    }),
    dashboardCardBody: fields.text({
      label: "Karte A – Beschreibung",
      multiline: true,
      defaultValue:
        "Filtere nach Zielgruppe, sortiere nach Evidenz, entdecke, welche Annahmen die größte Diskrepanz zur Forschung zeigen.",
    }),
    dashboardCtaLabel: fields.text({
      label: "Karte A – CTA",
      defaultValue: "Zum Daten-Explorer",
    }),
    faktenKartenCardTitle: fields.text({
      label: "Karte B – Titel",
      defaultValue: "Die Fakten-Karten",
    }),
    faktenKartenCardBody: fields.text({
      label: "Karte B – Beschreibung",
      multiline: true,
      defaultValue:
        "Jede Aussage als umdrehbare Karte — vorne der Mythos, hinten die wissenschaftliche Einordnung in einem Satz.",
    }),
    faktenKartenCtaLabel: fields.text({
      label: "Karte B – CTA",
      defaultValue: "Zu den Fakten-Karten",
    }),
  },
});

const quizHookBlock = singleton({
  label: "🧪 Quiz-Hook – Startseite",
  path: "src/content/quiz-hook-block",
  format: { data: "yaml" },
  schema: {
    eyebrow: fields.text({
      label: "Eyebrow",
      defaultValue: "10 Fragen · ca. 3 Minuten · wissenschaftlich eingeordnet",
    }),
    headline: fields.text({
      label: "Überschrift",
      defaultValue: "Wie viele Mythen erkennst du?",
    }),
    subhead: fields.text({
      label: "Unterzeile",
      multiline: true,
      defaultValue:
        "Teste dein Bauchgefühl gegen die Evidenz. Am Ende erfährst du, welche Mythen dich überrascht haben.",
    }),
    sampleMythText: fields.text({
      label: "Beispielmythos (auf der Vorschau-Karte)",
      defaultValue: "Cannabis ist weniger schädlich als Alkohol.",
    }),
    sampleMythClassification: fields.select({
      label: "Klassifikation des Beispielmythos",
      options: [
        { label: "Richtig", value: "richtig" },
        { label: "Eher richtig", value: "eher_richtig" },
        { label: "Eher falsch", value: "eher_falsch" },
        { label: "Falsch", value: "falsch" },
      ],
      defaultValue: "eher_falsch",
    }),
    primaryCtaLabel: fields.text({
      label: "Primärer CTA",
      defaultValue: "Quiz starten",
    }),
    primaryCtaUrl: fields.text({
      label: "Primärer CTA – Link",
      defaultValue: "/selbsttest/",
    }),
    secondaryCtaLabel: fields.text({
      label: "Sekundärer CTA",
      defaultValue: "Zur Dashboard-Analyse",
    }),
    secondaryCtaUrl: fields.text({
      label: "Sekundärer CTA – Link",
      defaultValue: "/zahlen-und-fakten/",
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
  collections: {
    // ── Public sections — in nav order ──────────────────────────────────────
    zahlenUndFakten,        // 🃏 Fakten-Karten  →  /fakten-karten/ + /zahlen-und-fakten/[slug]
    zahlenUndFaktenDashboard, // 📊 Daten-Explorer  →  /zahlen-und-fakten/
    haeufigeFragen,         // ❓ Ihre Fragen  →  /haeufige-fragen/
    selbsttest,             // 🧪 Selbsttest  →  /selbsttest/
    startseite,             // 🏠 Startseite  →  / (homepage scrollytelling)
    ueberUns,               // ℹ️ Über das Projekt  →  /ueber-uns/
    // ── Internal ────────────────────────────────────────────────────────────
    meta,
    changelog,
  },
  singletons: {
    heroBlock,
    credibilityBlock,
    headlineFinding,
    quizHookBlock,
    dashboardDefinitionen,
  },
});
