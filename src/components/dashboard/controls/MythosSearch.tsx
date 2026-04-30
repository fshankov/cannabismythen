import { useId, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Myth } from '../../../lib/dashboard/types';
import { getMythText, getMythShortText } from '../../../lib/dashboard/data';
import { t } from '../../../lib/dashboard/translations';

interface Props {
  myths: Myth[];
  /** Current search query. */
  value: string;
  /** Called as the user types. */
  onChange: (q: string) => void;
  /** Called when a myth is picked from the autocomplete. Updates `selectedMythId`. */
  onSelectMyth: (id: number) => void;
}

const MAX_SUGGESTIONS = 8;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function MythosSearch({ myths, value, onChange, onSelectMyth }: Props) {
  const inputId = useId();
  const listboxId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);

  const matches = useMemo(() => {
    const q = normalize(value.trim());
    if (q.length < 2) return [];
    return myths
      .filter((m) => {
        const haystack = `${normalize(getMythText(m, 'de'))} ${normalize(getMythShortText(m, 'de'))}`;
        return haystack.includes(q);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [myths, value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const m = matches[activeIndex];
      if (m) {
        onSelectMyth(m.id);
        setActiveIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setActiveIndex(-1);
    }
  };

  return (
    <div className="carm-mythos-search">
      <label htmlFor={inputId} className="carm-mythos-search__label">
        {t('filter.search.label', 'de')}
      </label>
      <div className="carm-mythos-search__input-wrap">
        <Search size={16} strokeWidth={2} className="carm-mythos-search__icon" aria-hidden="true" />
        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          className="carm-mythos-search__input"
          placeholder={t('filter.search.placeholder', 'de')}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      {matches.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t('filter.search.label', 'de')}
          className="carm-mythos-search__list"
        >
          {matches.map((m, i) => (
            <li key={m.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                tabIndex={-1}
                className={`carm-mythos-search__item${i === activeIndex ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  onSelectMyth(m.id);
                  setActiveIndex(-1);
                }}
              >
                <span className="carm-mythos-search__item-title">{getMythShortText(m, 'de')}</span>
                <span className="carm-mythos-search__item-meta">{m.category_de}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
