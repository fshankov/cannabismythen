/**
 * PivotToggle — a 2-3 option pill segmented control.
 *
 * Lifted from the Streifen view's `.strips-pivot-toggle` (the
 * Indikatoren | Gruppen switch). Now the canonical primitive that the
 * Streifen, Sources, and Tabelle / Balken toolbars all share so every
 * dashboard tab renders identical chrome above the chart.
 *
 * Keyboard:
 *   - ArrowLeft / ArrowRight move focus between segments.
 *   - Enter or Space activates the focused segment.
 *
 * Visuals:
 *   - `.carm-pivot-toggle` matches the geometry of the original
 *     `.strips-pivot-toggle` exactly so Streifen stays pixel-identical
 *     after migration.
 */

import { useRef, type KeyboardEvent } from 'react';

interface PivotOption<T extends string> {
  value: T;
  label: string;
}

interface PivotToggleProps<T extends string> {
  options: PivotOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Required for the underlying tablist — German label is fine. */
  'aria-label': string;
}

export default function PivotToggle<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: PivotToggleProps<T>) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const focusIndex = (i: number) => {
    const next = (i + options.length) % options.length;
    buttonsRef.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusIndex(index + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusIndex(index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusIndex(options.length - 1);
    }
  };

  return (
    <div
      className="carm-pivot-toggle"
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={`carm-pivot-toggle__btn ${active ? 'active' : ''}`}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
