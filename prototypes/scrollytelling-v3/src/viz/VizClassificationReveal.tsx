/**
 * Step 4 viz. Currently the dispatcher in ScrollytellingViewerV3 routes the
 * 'classificationReveal' vizName directly to VizMythGrid with mode='classified',
 * so this file is a thin re-export to keep the file tree honest with the plan.
 * Kept as a separate module so we can later add a sweep-cursor / annotations
 * layer without touching VizMythGrid.
 */
export { VizMythGrid as VizClassificationReveal } from './VizMythGrid';
