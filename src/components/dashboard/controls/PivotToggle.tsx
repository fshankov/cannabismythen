/**
 * PivotToggle — iOS-style switch with a text label on each side.
 *
 * 2026-05-28 PM redesign: replaced the segmented two-chip pair with a
 * single switch (`Indikatoren  [knob slides]  Gruppen`). One track,
 * one knob, two labels — reads obviously as a binary toggle. Click
 * anywhere on the track OR on either label flips state.
 *
 * Keyboard: ArrowLeft → options[0], ArrowRight → options[1],
 * Space / Enter toggles. Focus lands on the track <button>.
 *
 * API is unchanged from the old segmented component — every caller
 * (StripsToolbar, SpannweiteToolbar, SourcesSpannweiteToolbar) keeps
 * passing the same `options: [{value, label}, {value, label}]` shape
 * and the same `onChange(value)` signature. No consumer-side edits.
 */

import { useRef, type KeyboardEvent, type ReactNode } from "react";

interface PivotOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Optional adornment rendered as a SIBLING immediately after the label
   *  button (e.g. an InfoTooltip `(i)`). Kept a sibling — never inside the
   *  label — because the label is a <button> and nesting a button is invalid
   *  HTML and would flip the toggle when the icon is clicked. */
  info?: ReactNode;
}

interface PivotToggleProps<T extends string> {
  options: PivotOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Required for the underlying track button — German label is fine. */
  "aria-label": string;
}

export default function PivotToggle<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
}: PivotToggleProps<T>) {
  const trackRef = useRef<HTMLButtonElement | null>(null);

  // The component is contract-locked to exactly two options; defensively
  // fall back to a stable order if a caller passes more / fewer.
  const left = options[0];
  const right = options[1] ?? options[0];
  const activeSide: "left" | "right" = value === right.value ? "right" : "left";

  const toggle = () => {
    onChange(activeSide === "left" ? right.value : left.value);
  };

  const select = (side: "left" | "right") => {
    onChange(side === "left" ? left.value : right.value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowLeft" || e.key === "Home") {
      e.preventDefault();
      select("left");
    } else if (e.key === "ArrowRight" || e.key === "End") {
      e.preventDefault();
      select("right");
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div className="carm-pivot-switch" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className={
          "carm-pivot-switch__label" +
          (activeSide === "left" ? " carm-pivot-switch__label--active" : "")
        }
        onClick={() => select("left")}
        aria-pressed={activeSide === "left"}
        tabIndex={-1}
      >
        {left.label}
      </button>
      {left.info ? (
        <span className="carm-pivot-switch__info">{left.info}</span>
      ) : null}
      <button
        ref={trackRef}
        type="button"
        role="switch"
        aria-checked={activeSide === "right"}
        aria-label={ariaLabel}
        className="carm-pivot-switch__track"
        data-active={activeSide}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span className="carm-pivot-switch__knob" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={
          "carm-pivot-switch__label" +
          (activeSide === "right" ? " carm-pivot-switch__label--active" : "")
        }
        onClick={() => select("right")}
        aria-pressed={activeSide === "right"}
        tabIndex={-1}
      >
        {right.label}
      </button>
      {right.info ? (
        <span className="carm-pivot-switch__info">{right.info}</span>
      ) : null}
    </div>
  );
}
