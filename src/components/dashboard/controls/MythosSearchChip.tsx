/**
 * MythosSearchChip — toolbar-anchored combobox.
 *
 * Stage 6 v3: input is always rendered (no click-to-expand). Type
 * directly into the field; suggestions appear in a popup below only
 * when the query matches at least one myth AND the input is focused.
 * Selecting a suggestion (Enter or click) opens the FactsheetPanel
 * and closes the suggestions list.
 *
 * Suggestions show:
 *   - verdict arrow (color-coded)
 *   - long claim sentence (from the .mdoc factsheet `title` field)
 *   - category label
 *
 * The input value is held in shared `state.search` so it persists
 * across tab switches.
 */

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Search, X } from 'lucide-react';
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
  const [focused, setFocused] = useState(false);
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

  // Suggestion popup is open when the input is focused AND the query
  // has matches. Pure derivation — no separate state to keep in sync.
  const showSuggestions = focused && matches.length > 0;

  // Outside-click closes (blurs the input). Escape blurs too.
  useEffect(() => {
    if (!focused) return;
    const onPointer = (e: PointerEvent) => {
      const node = containerRef.current;
      if (node && !node.contains(e.target as Node)) {
        setFocused(false);
        setHighlight(-1);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFocused(false);
        setHighlight(-1);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [focused]);

  const commit = (m: Myth) => {
    onSelectMyth(m.id);
    setHighlight(-1);
    setFocused(false);
    inputRef.current?.blur();
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
      <div
        className="carm-search-chip__input-row"
        role="combobox"
        aria-expanded={showSuggestions}
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
          placeholder={t('filter.search.label', 'de')}
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
          onFocus={() => setFocused(true)}
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
      </div>
      {showSuggestions && (
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
  );
}
