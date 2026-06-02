/**
 * Verdict glyph re-export.
 *
 * `src/components/shared/verdictGlyph.tsx` is the live source of truth for
 * the four-state verdict glyph (richtig / eher_richtig / eher_falsch /
 * falsch + keine_aussage_moeglich fallback) and `<VerdictArrow>` standalone
 * wrapper. We re-export from the registry so consumers go through one
 * import path; the original file stays put so direct imports already in
 * the codebase keep working.
 */

export {
  VERDICT_GLYPHS,
  NO_CLASSIFICATION_COLOR,
  VerdictGlyphPaths,
} from '../../components/shared/verdictGlyph';
export type {
  VerdictColorOverride,
} from '../../components/shared/verdictGlyph';

export { default as VerdictArrow } from '../../components/shared/VerdictArrow';
