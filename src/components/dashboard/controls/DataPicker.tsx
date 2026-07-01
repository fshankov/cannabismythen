/**
 * DataPicker — caption + dropdown trigger + menu, lifted from the
 * Streifen view's `.strips-picker`. Now the canonical picker primitive
 * for every dashboard tab (Stage 2 of the Daten-Explorer refactor).
 *
 * Each menu item supports an inline-expandable definition (the `i`
 * button + `.carm-picker__row-def` panel) so consumers don't need a
 * separate tooltip / popover for indicator + group definitions.
 *
 * Visuals:
 *   - `.carm-picker__*` matches the original `.strips-picker__*`
 *     geometry exactly so the Streifen view stays pixel-identical
 *     after the migration.
 *
 * Outside-click + Escape close are handled internally so each call
 * site only manages the controlled `value`.
 */

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
} from "react";
import { Search } from "lucide-react";
import type { IconComponent } from "@lib/icons";
import InfoTooltip from "../InfoTooltip";

export interface DataPickerOption<T extends string> {
  value: T;
  label: string;
  /** Leading-visual icon. Accepts both Lucide icons and the custom
   *  IconComponent registry (audience / indicator / source SVGs), since
   *  LucideIcon is structurally assignable to ComponentType<IconProps>. */
  Icon?: IconComponent;
  /** Emoji string used in place of an icon (e.g. Themen). */
  emoji?: string;
  /** Greyed-and-blocked. The trigger title surfaces `disabledReason`. */
  disabled?: boolean;
  disabledReason?: string;
  /** Inline-expandable definition shown when the row's `i` is clicked. */
  definition?: {
    title: string;
    text: string;
    scale?: string;
    sampleSize?: string;
  };
}

interface DataPickerProps<T extends string> {
  /** Caption rendered before the trigger, e.g. "Wert für". A trailing
   *  colon is added automatically. */
  caption: string;
  value: T;
  options: DataPickerOption<T>[];
  onChange: (value: T) => void;
  "aria-label"?: string;
  /** When true, the menu opens upward (used by the Streifen bottom
   *  Mythos-Kategorie picker so it doesn't clip the page bottom). */
  dropup?: boolean;
  /** When true, render an `<input type="search">` above the option
   *  list with debounced filtering on `option.label`. ArrowDown moves
   *  focus into the option list; Enter selects the highlighted row.
   *  Stage 4 of the Daten-Explorer refactor enabled this for the
   *  Sources category picker, where the option count justifies a
   *  filter. */
  searchable?: boolean;
  /** Placeholder for the searchable input. Defaults to a German "Suche…". */
  searchPlaceholder?: string;
  /** Locale string for menu microcopy that isn't covered by the
   *  consumer-passed labels (e.g. the inline-definition "Skala" prefix). */
  lang?: "de" | "en";
}

export default function DataPicker<T extends string>({
  caption,
  value,
  options,
  onChange,
  "aria-label": ariaLabel,
  dropup = false,
  searchable = false,
  searchPlaceholder,
  lang = "de",
}: DataPickerProps<T>): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const listboxId = useId();

  const active = options.find((o) => o.value === value) ?? options[0] ?? null;

  /** Filtered options when `searchable` is on. Case- and diacritic-
   *  insensitive substring match against the option label. */
  const visibleOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const norm = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const q = norm(query.trim());
    return options.filter((o) => norm(o.label).includes(q));
  }, [options, query, searchable]);

  // Reset query + highlight when the dropdown opens / closes.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setHighlightIndex(-1);
      return;
    }
    if (searchable) {
      // Focus the search input on open so the user can start typing.
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
  }, [open, searchable]);

  // Outside-pointer + Escape close. Stage 6 follow-up: the InfoTooltip
  // popover renders OUTSIDE this container (it's `position: fixed`), so
  // we ignore pointerdowns that land inside an `.info-tooltip-card` to
  // avoid closing the picker when a user reads a definition.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(".info-tooltip-card")) return;
      const node = containerRef.current;
      if (node && !node.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const renderLeading = (opt: DataPickerOption<T> | null, size = 15) => {
    if (!opt) return null;
    if (opt.emoji) {
      return (
        <span className="carm-picker__emoji" aria-hidden="true">
          {opt.emoji}
        </span>
      );
    }
    if (opt.Icon) {
      const Icon = opt.Icon;
      return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
    }
    return null;
  };

  return (
    <div
      ref={containerRef}
      className={`carm-picker${dropup ? " carm-picker--dropup" : ""}`}
    >
      <span className="carm-picker__caption">{caption}:</span>
      <span className="carm-picker__anchor">
        <button
          type="button"
          className="carm-picker__trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={ariaLabel}
          onClick={() => {
            setOpen((v) => !v);
          }}
        >
          {renderLeading(active)}
          <span className="carm-picker__current">{active?.label ?? ""}</span>
          <span className="carm-picker__chevron" aria-hidden="true">
            ▾
          </span>
        </button>
        {open && (
          <div
            id={listboxId}
            className="carm-picker__menu"
            role="listbox"
            aria-label={ariaLabel}
          >
            {searchable && (
              <div className="carm-picker__search">
                <Search
                  size={14}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="carm-picker__search-icon"
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  className="carm-picker__search-input"
                  placeholder={
                    searchPlaceholder ?? (lang === "de" ? "Suche…" : "Search…")
                  }
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHighlightIndex(-1);
                  }}
                  onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlightIndex((i) =>
                        visibleOptions.length === 0
                          ? -1
                          : (i + 1) % visibleOptions.length,
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlightIndex((i) =>
                        visibleOptions.length === 0
                          ? -1
                          : (i - 1 + visibleOptions.length) %
                            visibleOptions.length,
                      );
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      const target =
                        highlightIndex >= 0
                          ? visibleOptions[highlightIndex]
                          : visibleOptions[0];
                      if (target && !target.disabled) {
                        onChange(target.value);
                        setOpen(false);
                      }
                    } else if (e.key === "Escape") {
                      setOpen(false);
                    }
                  }}
                  aria-controls={listboxId}
                />
              </div>
            )}
            {visibleOptions.length === 0 && (
              <p className="carm-picker__empty" role="status">
                {lang === "de" ? "Keine Treffer" : "No matches"}
              </p>
            )}
            {visibleOptions.map((opt, i) => {
              const isActive = opt.value === value;
              const hasDef = !!opt.definition?.text;
              const isDisabled = !!opt.disabled;
              const isHighlighted = i === highlightIndex;
              return (
                <div
                  key={opt.value}
                  className={`carm-picker__row ${
                    isDisabled ? "is-disabled" : ""
                  } ${isHighlighted ? "is-highlighted" : ""}`}
                >
                  <div className="carm-picker__row-line">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      aria-disabled={isDisabled || undefined}
                      title={isDisabled ? opt.disabledReason : undefined}
                      disabled={isDisabled}
                      className={`carm-picker__item-btn ${isActive ? "active" : ""}`}
                      onClick={() => {
                        if (isDisabled) return;
                        onChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      {renderLeading(opt)}
                      <span className="carm-picker__item-label">
                        {opt.label}
                      </span>
                    </button>
                    {hasDef && opt.definition && (
                      <span className="carm-picker__row-info-wrap">
                        <InfoTooltip
                          title={opt.definition.title}
                          definition={opt.definition.text}
                          scale={opt.definition.scale}
                          sampleSize={opt.definition.sampleSize}
                        />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </span>
    </div>
  );
}
