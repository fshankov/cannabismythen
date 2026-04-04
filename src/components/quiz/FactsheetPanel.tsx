/**
 * Quiz FactsheetPanel — Thin wrapper around the shared FactsheetPanel.
 * (Decision G: Merged into shared component)
 */

import SharedFactsheetPanel from '../shared/FactsheetPanel';
import type { MythContentEntry } from '../shared/FactsheetPanel';
import type { QuizMyth } from './types';
import { t } from './i18n';

export type { MythContentEntry };

interface FactsheetPanelProps {
  myth: QuizMyth;
  mythContentEntry?: MythContentEntry;
  onClose: () => void;
  /** Statement text from Keystatic content (overrides i18n key) */
  statementText?: string;
  /** Explanation text from Keystatic content (overrides i18n key) */
  explanationText?: string;
}

export default function FactsheetPanel({
  myth,
  mythContentEntry,
  onClose,
  statementText,
  explanationText,
}: FactsheetPanelProps) {
  return (
    <SharedFactsheetPanel
      context="quiz"
      mythText={statementText || t(myth.statementKey)}
      classificationKey={myth.correctClassification}
      classificationLabel={
        mythContentEntry?.classificationLabel ||
        t(`classification.${myth.correctClassification}`)
      }
      mythContentEntry={mythContentEntry}
      factsheetSlug={myth.mythPageSlug}
      verdictLabel={t('ui.correctAnswer')}
      onClose={onClose}
      fallbackExplanation={explanationText || t(myth.explanationKey)}
    />
  );
}
