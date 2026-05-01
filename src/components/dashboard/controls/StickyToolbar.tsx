/**
 * @deprecated Removed in Stage 2 of the Daten-Explorer refactor.
 *
 * The sticky toolbar wrapper has been replaced by `<ToolbarRow>` —
 * the new shared layout primitive that arranges pivot + pickers +
 * actions across every dashboard tab. Sticky-on-scroll behaviour
 * was intentionally dropped: the new toolbar is a regular
 * sibling of the chart and scrolls with the page, which matches
 * the Streifen and Sources views. This file is intentionally empty
 * so any stray import surfaces as a TypeScript error at build time.
 * Delete the file in a follow-up cleanup commit.
 */
export {};
