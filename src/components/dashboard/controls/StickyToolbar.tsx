import type { ReactNode } from 'react';

interface Props {
  /** Left side — typically the IndicatorGroupSelector. */
  start: ReactNode;
  /** Right side — typically Filter / Export / Rundgang triggers. */
  end?: ReactNode;
}

/** Sticky control row anchored under the site nav. Holds the always-visible
 *  primary controls above the chart area. Mobile: bottom-tab-bar overlap is
 *  handled at the page level via padding-bottom on `<main>`. */
export default function StickyToolbar({ start, end }: Props) {
  return (
    <div className="carm-sticky-toolbar" role="toolbar" aria-label="Dashboard-Steuerung">
      <div className="carm-sticky-toolbar__start">{start}</div>
      {end && <div className="carm-sticky-toolbar__end">{end}</div>}
    </div>
  );
}
