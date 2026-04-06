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
    label: "Summary",
    multiline: true,
    description: "Short description for listings and SEO.",
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
  label: "Zahlen & Fakten – Factsheets",
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
    category: fields.text({ label: "Category" }),
    categoryGroup: fields.text({ label: "Category Group" }),
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
      label: "Classification Label",
      description: 'Human-readable label, e.g. "Das stimmt nicht."',
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
  label: "Zahlen & Fakten – Dashboard",
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
  label: "Häufige Fragen",
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
  label: "Selbsttest / Quiz",
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
  label: "Startseite – Scrollytelling",
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
  label: "Über uns",
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
  label: "Meta (Internal)",
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

const dashboardDefinitionen = singleton({
  label: "Dashboard – Definitionen & Glossar",
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
    zahlenUndFakten,
    zahlenUndFaktenDashboard,
    haeufigeFragen,
    selbsttest,
    startseite,
    ueberUns,
    meta,
    changelog,
  },
  singletons: {
    dashboardDefinitionen,
  },
});
