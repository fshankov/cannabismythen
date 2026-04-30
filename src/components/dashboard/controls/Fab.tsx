import type { ReactNode } from 'react';

interface Props {
  onClick: () => void;
  /** Accessible label and visible text on hover. */
  label: string;
  icon: ReactNode;
}

/** Mobile-only floating action button anchored to the bottom-right, above
 *  the bottom tab bar. Hidden on desktop via CSS (≥1024px). */
export default function Fab({ onClick, label, icon }: Props) {
  return (
    <button
      type="button"
      className="carm-fab"
      onClick={onClick}
      aria-label={label}
    >
      <span className="carm-fab__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="carm-fab__label">{label}</span>
    </button>
  );
}
