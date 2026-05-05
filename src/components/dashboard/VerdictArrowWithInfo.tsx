/**
 * Re-export shim — the canonical implementation now lives in
 * `src/components/shared/VerdictArrowWithInfo.tsx` so it can be used
 * across the daten-explorer, fakten-karten, and quiz factsheet panels
 * without dashboard ↔ feature-folder coupling.
 *
 * This shim keeps existing dashboard imports
 * (`from './VerdictArrowWithInfo'`) compiling without churn. New code
 * should import directly from `../shared/VerdictArrowWithInfo`.
 */

export { default } from '../shared/VerdictArrowWithInfo';
