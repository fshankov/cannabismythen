/**
 * Matomo cookieless event tracking utility for the quiz system.
 *
 * This module provides a single typed function `trackQuizEvent()` so that
 * Matomo is never called ad-hoc inline. All 6 event types are handled here.
 */

import type { MatomoEvent, Classification, ResultTierIndex } from "./types";

// Matomo's global tracker array
declare global {
  interface Window {
    _paq?: Array<unknown[]>;
  }
}

function push(...args: unknown[]): void {
  if (typeof window !== "undefined") {
    window._paq = window._paq || [];
    window._paq.push(args);
  }
}

/**
 * Send a typed event to Matomo.
 * All quiz tracking goes through this function.
 */
export function trackQuizEvent(event: MatomoEvent): void {
  // Set custom dimensions if provided
  if (event.customDimensions) {
    for (const [key, value] of Object.entries(event.customDimensions)) {
      // Custom dimension indices — map string keys to Matomo dimension IDs
      const dimId = CUSTOM_DIMENSION_MAP[key];
      if (dimId) {
        push("setCustomDimension", dimId, value);
      }
    }
  }

  push(
    "trackEvent",
    event.category,
    event.action,
    event.name,
    event.value ?? undefined
  );
}

/** Map of custom dimension names to Matomo dimension IDs. */
const CUSTOM_DIMENSION_MAP: Record<string, number> = {
  chosen_answer: 1,
  percentile_tier: 2,
};

// ─── Convenience wrappers for all 6 event types ────────────────────────────────

export function trackQuizStarted(themeName: string): void {
  trackQuizEvent({
    category: "Quiz",
    action: "started",
    name: themeName,
  });
}

export function trackAnswerSubmitted(
  mythId: string,
  isCorrect: boolean,
  chosenAnswer: Classification
): void {
  trackQuizEvent({
    category: "Quiz",
    action: "answer_submitted",
    name: mythId,
    value: isCorrect ? 1 : 0,
    customDimensions: {
      chosen_answer: chosenAnswer.toUpperCase(),
    },
  });
}

export function trackQuizCompleted(
  themeName: string,
  score: number,
  tierIndex: ResultTierIndex
): void {
  const tierLabels: Record<ResultTierIndex, string> = {
    0: "bottom30",
    1: "mid50",
    2: "top25",
    3: "top10",
  };

  trackQuizEvent({
    category: "Quiz",
    action: "completed",
    name: themeName,
    value: score,
    customDimensions: {
      percentile_tier: tierLabels[tierIndex],
    },
  });
}

export function trackResultCardViewed(tierLabel: string): void {
  trackQuizEvent({
    category: "Quiz",
    action: "result_card_viewed",
    name: tierLabel,
  });
}

export function trackResultCardShared(platform: string): void {
  trackQuizEvent({
    category: "Quiz",
    action: "result_card_shared",
    name: platform,
  });
}

export function trackMythLinkClicked(mythId: string): void {
  trackQuizEvent({
    category: "Quiz",
    action: "myth_link_clicked",
    name: mythId,
  });
}

// ─── Phase C / D event wrappers ──────────────────────────────────────────

/** Fires when the user opens the Übersicht (deck overview) sheet. */
export function trackDeckOverviewOpened(themeName: string): void {
  trackQuizEvent({
    category: "Quiz",
    action: "deck_overview_opened",
    name: themeName,
  });
}

/** Fires when a horizontal swipe commits, advancing or going back. */
export function trackCardSwiped(direction: "next" | "prev"): void {
  trackQuizEvent({
    category: "Quiz",
    action: "card_swiped",
    name: direction,
  });
}

/** Fires when the user picks a confidence value after answering. */
export function trackConfidenceChosen(
  mythId: string,
  confidence: "sure" | "unsure"
): void {
  trackQuizEvent({
    category: "Quiz",
    action: "confidence_chosen",
    name: mythId,
    customDimensions: {
      chosen_answer: confidence.toUpperCase(),
    },
  });
}

/** Fires when a keyboard shortcut triggers an action. `name` is the action
 *  name (e.g. "next", "prev", "answer:richtig", "open_factsheet"). */
export function trackKeyboardShortcutUsed(action: string): void {
  trackQuizEvent({
    category: "Quiz",
    action: "keyboard_shortcut_used",
    name: action,
  });
}
