/**
 * MythosSearchChip — toolbar-anchored combobox.
 *
 * Lives in the shared dashboard toolbar `actions` slot on every tab so
 * users can pick a specific myth from any view. Click expands an inline
 * input with autocomplete; suggestions show:
 *   - verdict arrow (color-coded)
 *   - long claim sentence (from the .mdoc factsheet `title` field)
 *   - category label
 *
 * Arrow keys navigate; Enter commits the highlighted (or top-1) result
 * and opens the factsheet panel. The input value is held in shared
 * `state.search` so it persists across tab switches.
 */

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import type { CorrectnessClass, Myth } from '../../../lib/dashboard/types';
import {
  getMythText,
  getMythShortText,
  getCategoryName,
} from '../../../lib/dashboard/data';
import { t } from '../../../lib/dashboard/translations';
import VerdictArrowWithInfo from '../VerdictArrowWithInfo';
import type { MythContentEntry } from '../FactsheetPanel';

interface Props {
  myths: Myth[];
  /** Shared search query — kept in AppState so it persists across tabs. */
  value: string;
  onChange: (next: string) => void;
  /** Called when the user picks a myth — opens the FactsheetPanel. */
  onSelectMyth: (id: number) => void;
  /** Map of myth ID → pre-rendered factsheet content. We use
   *  `mythContent[id].title` as the long claim sentence shown in the
   *  autocomplete row, falling back to the short label when missing. */
  mythContent?: Record<number, MythContentEntry>;
}

const MAX_SUGGESTIONS = 8;

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function MythosSearchChip({
  myths,
  value,
  onChange,
  onSelectMyth,
  mythContent,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // The chip is collapsed by default; when the user starts typing or
  // there's already a query in shared state we expand inline.
  const [open, setOpen] = useState<boolean>(value.length > 0);
  const [highlight, setHighlight] = useState(-1);
  const inputId = useId();
  const listboxId = useId();

  /** Long claim sentence (Markdoc `title`) when available — shown as
   *  the autocomplete row's primary label so users see the full
   *  statement, not the short axis label. */
  const longText = (m: Myth): string =>
    mythContent?.[m.id]?.title?.trim() || getMythText(m, 'de');

  const matches = useMemo<Myth[]>(() => {
    const q = normalize(value.trim());
    if (q.length < 2) return [];
    return myths
      .filter((m) => {
        const haystack = `${normalize(longText(m))} ${normalize(
          getMythShortText(m, 'de'),
        )} ${normalize(getCategoryName(m, 'de'))}`;
        return haystack.includes(q);
      })
      .slice(0, MAX_SUGGESTIONS);
    // longText reads from mythContent which is referentially stable
    // across renders inside MythenExplorer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myths, value, mythContent]);

  // Auto-expand whenever the shared query is non-empty (e.g. after a
  // tab switch or URL deep-link).
  useEffect(() => {
    if (value.length > 0 && !open) setOpen(true);
  }, [value, open]);

  // Focus the input when the chip expands and reset highlight.
  useEffect(() => {
    if (!open) {
      setHighlight(-1);
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  // Outside-click + Escape handlers — fire while open. Outside-click
  // collapses the chip ONLY if the query is empty; otherwise we keep
  // it expanded so the user can see what they typed when they come back.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const node = containerRef.current;
      if (node && !node.contains(e.target as Node)) {
        if (value.trim().length === 0) setOpen(false);
        setHighlight(-1);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (value.trim().length === 0) setOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, value]);

  const commit = (m: Myth) => {
    onSelectMyth(m.id);
    setHighlight(-1);
  };

  const onInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (matches.length === 0) return;
      e.preventDefault();
      setHighlight((i) => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      if (matches.length === 0) return;
      e.preventDefault();
      setHighlight((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target =
        highlight >= 0 ? matches[highlight] : matches[0] ?? null;
      if (target) commit(target);
    }
  };

  return (
    <div className="carm-search-chip" ref={containerRef}>
      {!open ? (
        <button
          type="button"
          className="carm-btn carm-btn--ghost carm-search-chip__trigger"
          onClick={() => setOpen(true)}
          aria-label={t('filter.search.label', 'de')}
          aria-expanded={false}
        >
          <Search size={14} strokeWidth={2} aria-hidden="true" />
          {t('filter.search.label', 'de')}
        </button>
      ) : (
        <div
          className="carm-search-chip__expanded"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-owns={listboxId}
        >
          <Search
            size={14}
            strokeWidth={2}
            aria-hidden="true"
            className="carm-search-chip__icon"
          />
          <input
            id={inputId}
            ref={inputRef}
            type="search"
            className="carm-search-chip__input"
            placeholder={t('filter.search.placeholder', 'de')}
            value={value}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={
              highlight >= 0 ? `${listboxId}-${highlight}` : undefined
            }
            onChange={(e) => {
              onChange(e.target.value);
              setHighlight(-1);
            }}
            onKeyDown={onInputKeyDown}
          />
          {value.length > 0 && (
            <button
              type="button"
              className="carm-search-chip__clear"
              aria-label={t('filter.reset', 'de')}
              onClick={() => {
                onChange('');
                setHighlight(-1);
                inputRef.current?.focus();
              }}
            >
              <X size={12} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
          {matches.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              aria-label={t('filter.search.label', 'de')}
              className="carm-search-chip__list"
            >
              {matches.map((m, i) => (
                <li key={m.id} role="presentation">
                  <button
                    type="button"
                    id={`${listboxId}-${i}`}
                    role="option"
                    aria-selected={i === highlight}
                    tabIndex={-1}
                    className={`carm-search-chip__item${
                      i === highlight ? ' is-active' : ''
                    }`}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => {
                      // mousedown fires before the input's blur, so the
                      // outside-click effect above can't race-close the
                      // list before the click registers.
                      e.preventDefault();
                      commit(m);
                    }}
                  >
                    <span
                      className={`carm-search-chip__item-arrow classification--${m.correctness_class}`}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <VerdictArrowWithInfo
                        verdict={m.correctness_class as CorrectnessClass}
                        size={14}
                        strokeWidth={2.25}
                      />
                    </span>
                    <span className="carm-search-chip__item-text">
                      <span
                        className={`carm-search-chip__item-title statement--${m.correctness_class}`}
                      >
                        {longText(m)}
                      </span>
                      <span className="carm-search-chip__item-meta">
                        {getCategoryName(m, 'de')}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
