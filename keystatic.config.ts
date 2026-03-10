import { config, collection, fields } from "@keystatic/core";

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
    ...metaFields,
    content: fields.markdoc({
      label: "Content",
      description:
        "Quiz questions, options, correct answers, and explanations (German).",
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
});
