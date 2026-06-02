/**
 * i18n module for the quiz system.
 *
 * All user-facing strings are stored here with German (de) as the primary language.
 * To add English: add an `en` key to `translations` and populate all keys.
 *
 * Usage:
 *   import { t } from "./i18n";
 *   t("quiz.medizin.title") // → "Medizinischer Nutzen"
 */

type Lang = "de" | "en";

const DEFAULT_LANG: Lang = "de";

const translations: Record<Lang, Record<string, string>> = {
  de: {
    // ── Answer option labels ──────────────────────────────────────────
    "answer.falsch": "Falsch",
    "answer.eher_falsch": "Eher falsch",
    "answer.eher_richtig": "Eher richtig",
    "answer.richtig": "Richtig",

    // ── Classification display labels ─────────────────────────────────
    "classification.falsch": "Falsch",
    "classification.eher_falsch": "Eher falsch",
    "classification.eher_richtig": "Eher richtig",
    "classification.richtig": "Richtig",

    // ── Quiz theme titles ─────────────────────────────────────────────
    "quiz.medizin.title": "Medizinischer und therapeutischer Nutzen",
    // EN: "How well do you know the research findings on the medical use of cannabis?"
    "quiz.medizin.subtitle":
      "Wie gut kennst du die Forschungsbefunde zum medizinischen Einsatz von Cannabis?",
    "quiz.medizin.description":
      "Schmerzlinderung, Spastiken, Schlaf, Angst, Depressionen und ADHS.",
    "quiz.risiken.title": "Risiken für Entwicklung, Körper und Psyche",
    // EN: "How well do you know the scientific findings on physical and mental health risks?"
    "quiz.risiken.subtitle":
      "Wie gut kennst du die wissenschaftlichen Erkenntnisse zu körperlichen und psychischen Risiken?",
    "quiz.risiken.description":
      "Entwicklung, Körper, Psyche — von Fötus bis Sucht und Suizidgedanken.",
    "quiz.stimmung.title": "Wirkung auf Stimmung und Wahrnehmung",
    // EN: "What do you know about how cannabis affects mood and perception?"
    "quiz.stimmung.subtitle":
      "Was weißt du darüber, wie Cannabis Stimmung und Wahrnehmung beeinflusst?",
    "quiz.stimmung.description":
      "Entspannung, Kreativität, Motivation, Aggression und Wahrnehmung.",
    "quiz.gesellschaft.title": "Soziales, Bevölkerung und Gesetzgebung",
    // EN: "What do you know about cannabis, society and the new legal situation?"
    "quiz.gesellschaft.subtitle":
      "Was weißt du über Cannabis, Gesellschaft und die neue Gesetzeslage?",
    "quiz.gesellschaft.description":
      "Verbreitung, Verkehr, soziale Folgen, Legalisierung und Vorurteile.",
    // 2026-06-02 (ISD/Fedor) — renamed from "Allgemeine Einschätzung der
    // Gefährlichkeit" to the shorter "Allgemeine Gefährlichkeit" (tile + full
    // title). The dashboard/Fakten-Karten category taxonomy keeps the long form.
    "quiz.gefaehrlichkeit.title": "Allgemeine Gefährlichkeit",
    // EN: "How do you assess the general risks of cannabis — and where does research stand?"
    "quiz.gefaehrlichkeit.subtitle":
      "Wie schätzt du die Gefährlichkeit von Cannabis ein — und was zeigt die Forschung?",
    "quiz.gefaehrlichkeit.description":
      "Alkohol-Vergleich, Harmlosigkeit, Heranwachsende, Dosierung und Mischkonsum.",
    // Stage 6 — Schnellcheck (dynamic 7-myth deck across all themes)
    "quiz.schnellcheck.title": "Schnellcheck",
    // 2026-05-28 (CAR-5/CAR-6) — "Aussagen" → "Mythen" sweep for UI
    // labels. The site's preferred user-facing unit is "Mythos".
    // 2026-06-02 (ISD/HL) — reworded per review. EN: "7 random myths from all
    // topic areas – freshly assembled every time."
    "quiz.schnellcheck.subtitle":
      "7 zufällige Mythen aus allen Themenbereichen – jedes Mal neu zusammengestellt.",
    "quiz.schnellcheck.description":
      "Querschnitt durch alle Themen. Jeder Besuch zieht neue Mythen.",

    // ── Myth statements ───────────────────────────────────────────────
    "myth.m01.statement": "Cannabis ist ein Allheilmittel.",
    "myth.m02.statement": "Cannabiskonsum ist harmlos.",
    "myth.m03.statement":
      "Konsum durch Heranwachsende führt — stärker als bei Erwachsenen — zu gesundheitlichen Schäden.",
    "myth.m04.statement":
      "Cannabis ist weniger schädlich als Alkohol.",
    "myth.m05.statement": "Cannabis ist schwierig zu dosieren.",
    "myth.m06.statement":
      "Mischkonsum ist besonders risikoreich.",
    "myth.m07.statement":
      "Zusätze führen zu erhöhten Gesundheitsrisiken.",
    "myth.m08.statement": "Cannabiskonsum schädigt den Fötus.",
    "myth.m09.statement":
      "Eine Überdosierung von Cannabis führt nicht zum Tod.",
    "myth.m10.statement": "Cannabis lindert Schmerzen.",
    "myth.m11.statement":
      "Cannabiskonsum bewirkt Übelkeit und Erbrechen.",
    "myth.m12.statement": "Cannabis hemmt Entzündungen.",
    "myth.m13.statement": "Cannabiskonsum lindert Spastiken.",
    "myth.m14.statement":
      "Cannabiskonsum bewirkt Herz-Kreislaufkrankheiten.",
    "myth.m15.statement":
      "Inhalativer Konsum bewirkt Atemwegserkrankungen.",
    "myth.m16.statement":
      "Cannabiskonsum verursacht Krebserkrankungen.",
    "myth.m17.statement": "Cannabiskonsum hilft beim Abnehmen.",
    "myth.m18.statement":
      "Cannabiskonsum hilft bei Schlafproblemen.",
    "myth.m19.statement":
      "Cannabiskonsum verändert die Wahrnehmungen.",
    "myth.m20.statement":
      "Cannabiskonsum beeinträchtigt kognitive Fähigkeiten.",
    "myth.m21.statement":
      "Cannabiskonsum gefährdet die Verkehrssicherheit.",
    "myth.m22.statement": "Cannabis ist eine Einstiegsdroge.",
    "myth.m23.statement":
      "Cannabis verursacht keine Abhängigkeit.",
    "myth.m24.statement": "Cannabiskonsum löst Psychosen aus.",
    "myth.m25.statement": "Cannabiskonsum hilft gegen Angst.",
    "myth.m26.statement":
      "Cannabiskonsum hilft gegen Depressionen.",
    "myth.m27.statement": "Cannabiskonsum hilft bei ADHS.",
    "myth.m28.statement":
      "Cannabiskonsum verursacht einen generellen Motivationsverlust.",
    "myth.m29.statement":
      "Cannabiskonsum verbessert die Gemütslage.",
    "myth.m30.statement":
      "Cannabiskonsum führt zu Suizidgedanken.",
    "myth.m31.statement": "Cannabiskonsum entspannt.",
    "myth.m32.statement":
      "Cannabiskonsum macht nicht aggressiv.",
    "myth.m33.statement": "Cannabiskonsum macht kreativ.",
    "myth.m34.statement":
      "Cannabiskonsum schädigt soziale Beziehungen.",
    "myth.m35.statement":
      "Konsument*innen halten sich in geringerem Maße an soziale Regeln.",
    "myth.m36.statement":
      "Cannabiskonsum führt zu niedrigen Leistungen.",
    "myth.m37.statement":
      "Cannabiskonsum geht einher mit einem niedrigen sozialen Niveau.",
    "myth.m38.statement": "Cannabiskonsum ist cool.",
    "myth.m39.statement":
      "Ein großer Teil der Bevölkerung konsumiert Cannabis.",
    "myth.m40.statement":
      "Cannabiskonsum ist nun für alle überall erlaubt.",
    "myth.m41.statement":
      "Das neue Gesetz wird einen Anstieg des Cannabiskonsums bewirken.",
    "myth.m42.statement":
      "Das neue Gesetz wird einen Anstieg des Cannabiskonsums bei Minderjährigen bewirken.",

    // ── Myth explanations ─────────────────────────────────────────────
    "myth.m01.explanation":
      "Cannabis ist kein Allheilmittel. Die wissenschaftliche Evidenz für die Wirksamkeit ist unzureichend und geht je nach Konsumform mit erheblichen gesundheitlichen Risiken einher.",
    "myth.m02.explanation":
      "Cannabis ist nicht harmlos. Wissenschaftliche Erkenntnisse bestätigen kurz- und langfristige negative Auswirkungen auf Körper, Psyche und soziale Aspekte.",
    "myth.m03.explanation":
      "Kinder und Jugendliche können durch Cannabiskonsum ernsthafte Beeinträchtigungen erfahren, insbesondere bei frühem und hochfrequentem Konsum mit größerer Wahrscheinlichkeit als Erwachsene.",
    "myth.m04.explanation":
      "Cannabis verursacht aus Expertensicht erheblich weniger Schäden als Alkohol — sowohl für die eigene Gesundheit als auch gegenüber anderen.",
    "myth.m05.explanation":
      "Insbesondere weniger erfahrene Konsumierende können Schwierigkeiten bei der Dosierung haben. Die Zusammensetzung von unkontrolliertem Cannabis ist nicht einschätzbar.",
    "myth.m06.explanation":
      "Mischkonsum erhöht die Wahrscheinlichkeit für intensiven Konsum und damit für akute negative Konsequenzen wie Vergiftungen, aggressives Verhalten und kognitive Beeinträchtigungen.",
    "myth.m07.explanation":
      "Auf dem illegalen Markt erworbenes Cannabis kann Streckmittel oder synthetische Cannabinoide enthalten, die zu schweren Gesundheitsrisiken bis hin zum Tod führen.",
    "myth.m08.explanation":
      "Studien zeigen, dass insbesondere langfristiges Cannabisrauchen während der Schwangerschaft die Gesundheit des Neugeborenen und dessen spätere Entwicklung schädigen kann.",
    "myth.m09.explanation":
      "Eine Cannabisüberdosierung ist möglich und geht mit psychiatrischen oder kardiovaskulären Symptomen einher. Todesfälle sind jedoch extrem selten.",
    "myth.m10.explanation":
      "Cannabinoide zeigen nur bei bestimmten chronischen Schmerzen für einen kleinen Teil der Patient:innen geringe positive Effekte. Selbstbeobachtete Schmerzlinderung wird oft auf den Placebo-Effekt zurückgeführt.",
    "myth.m11.explanation":
      "Cannabiskonsum kann Übelkeit und Erbrechen auslösen, insbesondere das Cannabinoid-Hyperemesis-Syndrom bei chronischem Konsum.",
    "myth.m12.explanation":
      "Die Studienlage zur entzündungshemmenden Wirkung von Cannabis ist nicht ausreichend, um eine klare wissenschaftliche Aussage zu treffen.",
    "myth.m13.explanation":
      "Es gibt Evidenz dafür, dass bestimmte Cannabinoide bei der Behandlung von Spastiken, insbesondere bei Multipler Sklerose, wirksam sein können.",
    "myth.m14.explanation":
      "Cannabiskonsum kann das Herz-Kreislauf-System belasten. Studien zeigen Zusammenhänge mit einem erhöhten Risiko für kardiovaskuläre Erkrankungen.",
    "myth.m15.explanation":
      "Das Rauchen von Cannabis schädigt die Atemwege und ist mit chronischer Bronchitis, Husten und Atemwegsinfektionen verbunden.",
    "myth.m16.explanation":
      "Cannabiskonsum, insbesondere durch Rauchen, steht im Zusammenhang mit einem erhöhten Krebsrisiko durch krebserregende Verbrennungsstoffe.",
    "myth.m17.explanation":
      "Die Studienlage zum Zusammenhang zwischen Cannabiskonsum und Körpergewicht ist widersprüchlich. Eine klare Aussage ist nicht möglich.",
    "myth.m18.explanation":
      "Obwohl Cannabis kurzfristig beim Einschlafen helfen kann, verschlechtert regelmäßiger Konsum langfristig die Schlafqualität.",
    "myth.m19.explanation":
      "Cannabis wirkt auf das zentrale Nervensystem und verändert die Wahrnehmung, darunter Zeitwahrnehmung, Sinneseindrücke und Raumwahrnehmung.",
    "myth.m20.explanation":
      "Cannabiskonsum beeinträchtigt Aufmerksamkeit, Gedächtnis und Lernfähigkeit — akut und bei regelmäßigem Konsum auch langfristig.",
    "myth.m21.explanation":
      "Cannabiskonsum beeinträchtigt Reaktionszeit, Aufmerksamkeit und Koordination und erhöht das Unfallrisiko im Straßenverkehr signifikant.",
    "myth.m22.explanation":
      'Die \u201EGateway-Hypothese\u201C ist wissenschaftlich umstritten. Der Zusammenhang ist eher auf gemeinsame Risikofaktoren zur\u00FCckzuf\u00FChren als auf eine pharmakologische Wirkung.',
    "myth.m23.explanation":
      "Cannabis kann abhängig machen. Etwa 9 % der Konsument:innen entwickeln eine Abhängigkeit; bei Jugendlichen liegt der Anteil bei bis zu 17 %.",
    "myth.m24.explanation":
      "Cannabiskonsum kann psychotische Symptome auslösen und das Risiko für Psychose oder Schizophrenie erhöhen, besonders bei genetischer Veranlagung.",
    "myth.m25.explanation":
      "Obwohl manche kurzfristig angstlösende Effekte berichten, kann Cannabis Angststörungen langfristig verschlimmern und sogar Panikattacken auslösen.",
    "myth.m26.explanation":
      "Es gibt keine ausreichende Evidenz, dass Cannabis Depressionen lindert. Regelmäßiger Konsum ist mit einem erhöhten Risiko für depressive Störungen verbunden.",
    "myth.m27.explanation":
      "Trotz verbreiteter Selbstmedikation gibt es keine ausreichende wissenschaftliche Grundlage dafür, dass Cannabis bei ADHS hilft.",
    "myth.m28.explanation":
      'Das Klischee des \u201Eamotivationalen Syndroms\u201C ist wissenschaftlich nicht gut belegt. Ein genereller Motivationsverlust kann nicht nachgewiesen werden.',
    "myth.m29.explanation":
      "Cannabis kann kurzfristig die Stimmung heben. Bei regelmäßigem Konsum können sich jedoch gegenteilige Effekte einstellen.",
    "myth.m30.explanation":
      "Studien deuten auf einen Zusammenhang zwischen Cannabiskonsum und erhöhtem Risiko für Suizidgedanken hin, besonders bei Jugendlichen.",
    "myth.m31.explanation":
      "Viele berichten über entspannende Wirkungen, jedoch kann dieser Effekt bei höheren Dosen in Anspannung und Angst umschlagen.",
    "myth.m32.explanation":
      "Entgegen der verbreiteten Annahme kann Cannabiskonsum unter bestimmten Umständen mit aggressivem Verhalten assoziiert sein, besonders bei chronischem Konsum.",
    "myth.m33.explanation":
      "Die Annahme, dass Cannabis die Kreativität steigert, ist wissenschaftlich nicht belegt. Studien zeigen eher eine Beeinträchtigung der divergenten Denkfähigkeit.",
    "myth.m34.explanation":
      "Dass Cannabiskonsum generell soziale Beziehungen schädigt, lässt sich wissenschaftlich nicht pauschal bestätigen. Negative Auswirkungen hängen stark vom Konsummuster ab.",
    "myth.m35.explanation":
      "Es gibt keine ausreichende Evidenz dafür, dass Cannabiskonsumierende sich generell weniger an soziale Regeln halten. Dieses Stereotyp spiegelt eher Vorurteile wider.",
    "myth.m36.explanation":
      "Ein pauschaler Zusammenhang zwischen Cannabiskonsum und niedrigen Leistungen ist wissenschaftlich nicht belegt, obwohl intensiver Konsum kognitive Funktionen beeinträchtigen kann.",
    "myth.m37.explanation":
      "Cannabiskonsum zieht sich durch alle sozialen Schichten. Die Annahme eines niedrigen sozialen Niveaus ist ein Vorurteil ohne wissenschaftliche Grundlage.",
    "myth.m38.explanation":
      'Die Gleichsetzung von Cannabiskonsum mit \u201ECoolness\u201C ist ein Mythos. Cannabiskonsum ist weder cool noch uncool \u2014 er ist mit realen Gesundheitsrisiken verbunden.',
    "myth.m39.explanation":
      "Nur ein relativ kleiner Teil der Bevölkerung konsumiert regelmäßig Cannabis. Die 12-Monats-Prävalenz liegt bei Erwachsenen bei etwa 8 %.",
    "myth.m40.explanation":
      "Die Teillegalisierung bedeutet nicht, dass Cannabis überall und für alle erlaubt ist. Es gelten strenge Regelungen zu Alter, Besitzmenge und Konsumorten.",
    "myth.m41.explanation":
      "Internationale Erfahrungen zeigen, dass Legalisierungen in der Regel mit einem Anstieg des Cannabiskonsums einhergehen, zumindest in den ersten Jahren.",
    "myth.m42.explanation":
      "Internationale Studien zeigen bislang keinen klaren Anstieg des Konsums bei Minderjährigen nach einer Legalisierung. In einigen Regionen blieben die Raten stabil.",

    // ── Population comparison strings ─────────────────────────────────
    // ── UI strings ────────────────────────────────────────────────────
    // Stage A (2026-05-16): counter wording matches Pew's "Question X
    // of Y" and the on-card `ui.questionLabel` so the vocabulary is
    // consistent header ↔ card.
    // 2026-05-28 (CAR-6, Harald review) — "Aussage N" → "Mythos N" and
    // the counter now reflects the currently-viewing index, not the
    // answered count. ProgressBar receives `current` (1-based) from
    // QuizPlayer = safeIndex + 1.
    "ui.progress": "Mythos {current} von {total}",
    "ui.resultTitle": "Dein Ergebnis",
    "ui.shareButton": "Ergebnis teilen",
    "ui.copiedToClipboard": "Link kopiert! \u2713",
    "ui.shareTitle": "Mein Cannabis-Quiz Ergebnis",
    "ui.backToQuizzes": "Alle Quiz-Module",
    "ui.restartQuiz": "Quiz wiederholen",
    "ui.zahlenUndFakten": "Zahlen & Fakten entdecken",
    "ui.correct": "Richtig!",
    "ui.incorrect": "Leider falsch",
    "ui.mythVerdict": "Der Mythos \u201e{statement}\u201c ist {verdict}.",
    "ui.verdictScale.label": "Antwort w\u00e4hlen",
    // 2026-05-29 (QuizCard redesign) \u2014 small eyebrow label above the
    // 4-button answer grid on the card front (Du form; Figma "SELECT
    // YOUR ANSWER"). Fades out once the user answers. AI draft.
    "ui.chooseAnswer": "W\u00e4hle deine Antwort",

    // \u2500\u2500 Deck overview (Phase C \u00a73.11) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    "ui.close": "Schlie\u00dfen",

    // \u2500\u2500 Keyboard shortcuts (Phase C \u00a73.12) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    "ui.shortcuts.title": "Tastenk\u00fcrzel",
    "ui.shortcuts.row.answer": "1 \u2013 4: Antwort w\u00e4hlen",
    "ui.shortcuts.row.next": "\u2192: N\u00e4chste Frage",
    "ui.shortcuts.row.prev": "\u2190: Vorherige Frage",
    "ui.shortcuts.row.advance": "Enter: Weiter",
    "ui.shortcuts.row.factsheet": "D: Details \u00f6ffnen",
    "ui.shortcuts.row.help": "?: Diese Hilfe",
    "ui.shortcuts.row.close": "Esc: Schlie\u00dfen",

    // \u2500\u2500 Streak chip (Phase D \u00a73.7) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    "ui.streak.label": "{n} richtig in Folge",

    // \u2500\u2500 Schritte band labels (Stage 1 \u2014 CaRM Schritte model) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    // BugHerd #25 (Session 3b, 2026-05-07): per-question Schritte band
    // labels updated per ISD ruling — reviewer's set + 'Völlig daneben'
    // for the 3-Schritte case.
    // Stage E commit 5 (2026-05-23) — revised Schritte verdict wording
    // (Richtig! / Fast richtig. / Knapp daneben. / Da liegst du daneben.)
    // 2026-05-28 (CAR-8, Harald review) — gamified relabel of the
    // per-Schritte verdict feedback. Applied to every quiz module
    // (themed + Schnellcheck). All cards use the 4-step Likert
    // classification (no separate Schätzfrage card type), so the new
    // estimation-flavoured wording fits the same per-Schritte mapping.
    // Renders in the per-question FeedbackStrip portaled below the
    // progress bar. AI draft — Du form — awaiting ISD review.
    // English glosses:
    //   exact → "Bullseye!"
    //   near  → "Right next to it!"
    //   off   → "Slight miss!"
    //   far   → "Pretty tricky!"
    "schritte.exact": "Volltreffer!",
    "schritte.near": "Ganz nah dran!",
    "schritte.off": "Leicht verschätzt!",
    "schritte.far": "Ganz schön knifflig!",
    //\u2500\u2500 Micro-copy table (Phase D \u00a73.7) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    // \u2500\u2500 Result screen \u2014 N\u00e4chstes Modul (Phase C \u00a73.14) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    "ui.nextModule.cta": "N\u00e4chstes Modul: {title} \u2192",
    "ui.classificationPhrase.richtig": "richtig",
    "ui.classificationPhrase.eher_richtig": "eher richtig",
    "ui.classificationPhrase.eher_falsch": "eher falsch",
    "ui.classificationPhrase.falsch": "falsch",
    "ui.correctAnswer": "Wissenschaftliche Bewertung:",
    // Stage A (2026-05-16): touched-string Sie → Du sweep. The full
    // Sie → Du site flip lives in its own session (CLAUDE.md "Sie/Du
    // baseline"); Stage A only flips strings already in the diff.
    "ui.yourAnswer": "Deine Antwort:",
    "ui.yourAnswerLabel": "Deine Antwort",
    "classification.scientific": "Wissenschaftlich",
    "ui.correctAnswerLabel": "Richtige Antwort",
    "ui.swipeHint": "oder nach links wischen",
    "ui.startQuiz": "Los geht's",
    "ui.quizMeta": "{n} Mythen · ca. {min} Min.",
    "ui.moreLink": "mehr \u2192",
    "ui.questionLabel": "Mythos {n} von {total}",
    "ui.siteName": "Cannabis: Mythen & Evidenz",
    "ui.siteUrl": "cannabismythen.de",
    "ui.questionsCount": "{n} Fragen",
    "ui.nextQuestion": "N\u00e4chste Frage",
    "ui.previousQuestion": "Zur\u00fcck",
    "ui.finishQuiz": "Ergebnis ansehen",
    "ui.persistenceNotice":
      "Wir speichern deinen Fortschritt nur in diesem Browser.",
    "ui.progressRestored":
      "Fortschritt wiederhergestellt.",
    "ui.resetProgress": "Quiz zur\u00fccksetzen",
    "ui.retrospectiveTitle": "Deine Antworten im \u00dcberblick",
    "ui.exploreData": "Daten-Explorer \u00f6ffnen",
    "ui.shareResultHeading": "Ergebnis teilen",
    // 2026-05-29 (QuizCard redesign) \u2014 back-face button now carries a
    // Lucide Search icon, so the label is the short Figma form "Details"
    // (was "Mehr auf der Fakten-Karte \u2192"). Opens the FactsheetPanel popup.
    "ui.openMythDetail": "Details",
    // Stage B (2026-05-16) 4-column comparison table keys removed in
    // Stage D PR3 (2026-05-22). Replaced by the unified
    // `quiz-result__list` pattern. Restore from git history if needed
    // (commits bd728ed / 02520b9).
    // Stage C (2026-05-17) "Auf einen Blick" summary-grid keys removed
    // in Stage D PR3 (2026-05-22). Replaced by the achievement card's
    // tonal headline + score lines.

    // ── Stage D PR2 (2026-05-22) — Achievement card + per-row sentence.
    //    Stage F commit 3 (2026-05-23) — deltaLine.* keys removed.
    //    2026-05-28 (CAR-9/CAR-10) — scoreLine.* + per-question reveal
    //    rewritten for honesty: user side now uses userExpectedPunkte
    //    (Σ pointsForSchritte, 0–N scale, one decimal) instead of the
    //    binary breakdown.exact count; population side uses the same
    //    0–N Punkte scale derived from populationCorrectPct. The
    //    misleading joinedExact / joinedMissed keys were dropped in
    //    favour of `result.row.populationMean` which states the
    //    per-myth mean Richtigkeit honestly.
    //    AI draft — Du form — awaiting ISD review.
    //    English glosses for ISD:
    //      profi      → "You really know the cannabis myths."
    //      guterweg   → "For most statements you're closer than most are."
    //      gehtnoch   → "There's room to grow — that's what the Fakten-Karten are for."
    //      erwischt   → "Cannabis is full of myths. The Fakten-Karten sort them out."
    // Stage E commit 3 (2026-05-23) — revised tonal headlines.
    // Du-form, AI draft, awaiting ISD review. The Keystatic
    // verdict.title in each module .mdoc is an editorial-suggestion
    // surface (see the `internalNotes` marker on each module);
    // ISD proposes there, Fedor promotes here.
    //
    // English glosses for ISD:
    //   profi      → "You recognise the myths clearly — scientifically solid."
    //   guterweg   → "You usually sit closer to the research than the average."
    //   gehtnoch   → "A few myths are stubborn. The Fakten-Karten help."
    //   erwischt   → "Cannabis is full of myths. Time for a look in the Fakten-Karten."
    // 2026-05-29 (Stage 3) — big Inter band TITLE above the headline on the
    // result card. German, punchy + appreciative (Newton-Youth voice; no
    // finger-wag even in the lowest band). AI draft — ISD review pending.
    // EN glosses: Myth pro / Well-informed / Room to grow / Lots to discover.
    "result.bandTitle.profi": "Mythen-Profi",
    "result.bandTitle.guterweg": "Gut im Bilde",
    "result.bandTitle.gehtnoch": "Da geht noch was",
    "result.bandTitle.erwischt": "Viel zu entdecken",
    // 2026-06-02 (ISD/HL review) — headlines rewritten by Harald Lahusen
    // (tracked changes in the methodology .docx) for a warmer, punchier
    // Du-voice. EN glosses below.
    // EN: "Nobody fools you that easily – your knowledge is scientifically rock-solid."
    "result.achievementHeadline.profi":
      "Dir macht so schnell niemand was vor – dein Wissen ist wissenschaftlich absolut solide.",
    // EN: "You're usually closer to the scientific facts than the average."
    "result.achievementHeadline.guterweg":
      "Du bist an den wissenschaftlichen Fakten meist näher dran als der Durchschnitt.",
    // EN: "A few myths are still unclear. No worries – the Fakten-Karten show you what's actually true."
    "result.achievementHeadline.gehtnoch":
      "Ein paar Mythen sind noch unklar. Macht nichts – die Fakten-Karten zeigen dir, was wirklich stimmt.",
    // EN: "Not so easy to keep track, right? Our Fakten-Karten show you what the research says."
    "result.achievementHeadline.erwischt":
      "Gar nicht so leicht, den Durchblick zu behalten, oder? Unsere Fakten-Karten zeigen dir, was die Forschung sagt.",
    // 2026-05-28 (CAR-9, Harald review) — user score line rewritten
    // from binary "Du: K von N genau richtig" (which only counted
    // Schritte=0 answers) to a Punkt-based reading that uses the full
    // partial-credit ladder. 2026-05-29 (QuizCard redesign) — dropped
    // "möglichen" for a tighter line; the percentage comparison now lives
    // in the delta sentence below (no percentages elsewhere on cards).
    // EN gloss: "You scored {X,X} out of {total} points."
    "result.scoreLine.user":
      "Du hast {points} von {total} Punkten erreicht.",
    // 2026-06-02 (ISD/HL review) — the result-page comparison now stays in
    // POINTS (same 0–N scale as the user line), not percentage points. Per
    // Fedor's explicit ruling this line drops the "(18–70)" qualifier
    // (sanctioned exception, like the homepage credibility lede); the
    // qualifier still appears on the per-question strip (result.row.populationMean).
    // {points} = population's expected points = populationExpectedExactCount(deck).
    // EN gloss: "For comparison: in the CaRM study, adults scored {X,X} out of {N} points on average."
    "result.scoreLine.populationPoints":
      "Zum Vergleich: In der CaRM-Studie haben Erwachsene im Durchschnitt {points} von {total} Punkten erreicht.",
    // 2026-05-29 (QuizCard redesign) — per-question population reveal on
    // the 0–1 per-card points scale (no percentages on cards). {points} =
    // populationCorrectPct / 100, one decimal. Apples-to-apples with the
    // user's on-card points badge (+1 / +0,66 / +0,33 / 0).
    // EN gloss: "Adults (18–70) score on average {0,8} out of 1 point here."
    "result.row.populationMean":
      "Erwachsene (18–70) in der CaRM-Studie erreichen hier im Durchschnitt {points} von 1 Punkt.",

    // ── Stage D PR3 (2026-05-22) — "Lohnt sich besonders" flag chip on
    //    the top weakest review rows. Removed from rendering in Stage E
    //    commit 4 (replaced by the wrong-myths fakten-karten grid);
    //    key kept inert in case a future surface needs it.
    "result.row.especiallyWorth": "Lohnt sich besonders",

    // ── Stage E commit 4 (2026-05-23) — wrong-myths fakten-karten grid
    //    heading. Shown below the consolidated ShareCard when the
    //    user did NOT place every myth genau richtig. AI draft —
    //    awaiting ISD review.
    //    English gloss: "These myths are worth a second look."
    "result.wrongMyths.heading": "Diese Mythen lohnen einen zweiten Blick.",
  },

  // ── English (placeholder — to be filled) ──────────────────────────
  en: {} as Record<string, string>,
};

let currentLang: Lang = DEFAULT_LANG;

export function setLang(lang: Lang): void {
  currentLang = lang;
}

/**
 * Translate a key, with optional interpolation.
 * Interpolation tokens: {key} in the string are replaced by values from `params`.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = translations[currentLang];
  let str = dict[key];

  if (!str) {
    // Fallback to German
    str = translations.de[key];
  }

  if (!str) {
    console.warn(`[i18n] Missing key: "${key}"`);
    return key;
  }

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return str;
}
