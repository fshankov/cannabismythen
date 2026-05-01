/**
 * MythosSearchChip — toolbar-anchored combobox.
 *
 * Stage 4 of the Daten-Explorer refactor promoted the older
 * `<MythosSearch>` form-row into a compact chip that lives in the
 * Balken + Tabelle toolbar `actions` slot. Click expands an inline
 * input with autocomplete; suggestions show the verdict arrow,
 * statement, and category. Arrow keys navigate; Enter commits the
 * top-1 (if nothing highlighted) and opens the factsheet panel.
 *
 * NOT used on Streifen (the dot interaction handles search there)
 * or Sources (different data set — `<DataPicker searchable>` covers
 * that tab's search needs).
 */

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Search } from 'lucide-react';
import type { CorrectnessClass, Myth } from '../../../lib/dashboard/types';
import {
  getMythText,
  getMythShortText,
  getCategoryName,
} from '../../../lib/dashboard/data';
import { t } from '../../../lib/dashboard/translations';
import VerdictArrow from '../../shared/VerdictArrow';

interface Props {
  myths: Myth[];
  /** Called when the user picks a myth — opens the FactsheetPanel. */
  onSelectMyth: (id: number) => void;
}

const MAX_SUGGESTIONS = 8;

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function MythosSearchChip({ myths, onSelectMyth }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(-1);
  const inputId = useId();
  const listboxId = useId();

  const matches = useMemo<Myth[]>(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return myths
      .filter((m) => {
        const haystack = `${normalize(getMythText(m, 'de'))} ${normalize(
          getMythShortText(m, 'de'),
        )} ${normalize(getCategoryName(m, 'de'))}`;
        return haystack.includes(q);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [myths, query]);

  // Focus the input when the chip expands and reset highlight.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setHighlight(-1);
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  // Outside-click + Escape handlers — fire while open.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const node = containerRef.current;
      if (node && !node.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const commit = (m: Myth) => {
    onSelectMyth(m.id);
    setOpen(false);
    setQuery('');
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
    } else if (e.key === 'Escape') {
      setOpen(false);
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
            value={query}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={
              highlight >= 0 ? `${listboxId}-${highlight}` : undefined
            }
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(-1);
            }}
            onKeyDown={onInputKeyDown}
          />
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
                    <span className="carm-search-chip__item-arrow">
                      <VerdictArrow
                        verdict={m.correctness_class as CorrectnessClass}
                        size={14}
                        strokeWidth={2.25}
                      />
                    </span>
                    <span className="carm-search-chip__item-text">
                      <span className="carm-search-chip__item-title">
                        {getMythShortText(m, 'de')}
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
