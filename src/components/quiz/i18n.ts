/**
 * i18n module for the quiz system.
 *
 * All user-facing strings are stored here with German (de) as the primary language.
 * To add English: add an `en` key to `translations` and populate all keys.
 *
 * Usage:
 *   import { t } from "./i18n";
 *   t("quiz.alltag.title") // → "Cannabis & Alltag"
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
    "quiz.alltag.title": "Cannabis & Alltag",
    "quiz.alltag.subtitle": "Was weißt du über Cannabis im Alltag?",
    "quiz.alltag.description":
      "Wirkungen auf Fahrtüchtigkeit, Arbeitsplatz, Schlaf und persönliche Leistung.",
    "quiz.gesellschaft.title": "Cannabis & Gesellschaft",
    "quiz.gesellschaft.subtitle":
      "Was weißt du über Cannabis in der Gesellschaft?",
    "quiz.gesellschaft.description":
      "Sozialverhalten, Beziehungen, Legalisierung und öffentliche Wahrnehmung.",
    "quiz.koerper.title": "Cannabis & Körper",
    "quiz.koerper.subtitle":
      "Was weißt du über die körperlichen Wirkungen von Cannabis?",
    "quiz.koerper.description":
      "Gesundheitsrisiken, Schmerzlinderung, Herz-Kreislauf, Atemwege und Krebs.",
    "quiz.psyche.title": "Cannabis & Psyche",
    "quiz.psyche.subtitle":
      "Was weißt du über Cannabis und die Psyche?",
    "quiz.psyche.description":
      "Psychosen, kognitive Leistung, Abhängigkeit und emotionale Wirkungen.",

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
    "population.score":
      "Bev\u00F6lkerungswissen: {score} von 100 Punkten",
    "population.unavailable":
      "F\u00FCr diese Aussage liegen keine vergleichenden Daten vor.",

    // ── Result tier titles & messages ─────────────────────────────────
    "tier.0.title": "Noch viel zu entdecken",
    "tier.0.message":
      "Es gibt noch viel Spannendes über Cannabis zu lernen.",
    "tier.1.title": "Auf dem richtigen Weg",
    "tier.1.message":
      "Du hast schon einiges richtig eingeschätzt — weiter so!",
    "tier.2.title": "Gut informiert",
    "tier.2.message":
      "Du kennst dich schon gut aus. Hier sind ein paar Themen zum Vertiefen.",
    "tier.3.title": "Cannabis-Experte:in",
    "tier.3.message":
      "Beeindruckend! Du hast fast alles richtig eingeschätzt.",

    // ── UI strings ────────────────────────────────────────────────────
    "ui.progress": "{answered} von {total} beantwortet",
    "ui.resultTitle": "Dein Ergebnis",
    "ui.scoreHeadline": "{correct} von {total} richtig beantwortet",
    "ui.correctPctLine": "{pct}\u00A0% richtig",
    "ui.percentileLine":
      "Du weißt mehr als {pct}\u00A0% der Erwachsenen in Deutschland.",
    "ui.shareButton": "Ergebnis teilen",
    "ui.copiedToClipboard": "Link kopiert! \u2713",
    "ui.shareTitle": "Mein Cannabis-Quiz Ergebnis",
    "ui.shareText":
      "Ich habe {correct} von {total} Cannabis-Mythen richtig eingesch\u00E4tzt und wei\u00DF mehr als {pct}\u00A0% der Erwachsenen in Deutschland. Teste dich selbst: https://cannabismythen.de/selbsttest/",
    "ui.backToQuizzes": "Alle Quiz-Module",
    "ui.restartQuiz": "Quiz wiederholen",
    "ui.zahlenUndFakten": "Zahlen & Fakten entdecken",
    "ui.correct": "Richtig!",
    "ui.incorrect": "Leider falsch",
    "ui.correctAnswer": "Evidenzbasierte Bewertung:",
    "ui.yourAnswer": "Deine Antwort:",
    "ui.moreLink": "mehr \u2192",
    "ui.questionLabel": "Aussage {n} von {total}",
    "ui.siteName": "Cannabis: Mythen & Evidenz",
    "ui.siteUrl": "cannabismythen.de",
    "ui.questionsCount": "{n} Fragen",
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
