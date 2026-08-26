import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  BannerVariant,
  Icon,
  ServerIcon,
  TextInput,
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
  useHotkeys,
} from '@mongodb-js/compass-components';
import { useApplicationMenu } from '@mongodb-js/compass-electron-menu';
import { usePreference } from 'compass-preferences-model/provider';
import type { GoToCandidate } from '../go-to-candidates';
import { rankGoToResults } from '../go-to-search';
import type { ActivateGoToResult, GoToRootState } from '../stores/store';
import { activateResult, loadInventory } from '../stores/store';

const backdropStyles = css({
  position: 'fixed',
  inset: 0,
  zIndex: 5,
  margin: 0,
  padding: 0,
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'default',
});

const paletteStyles = css({
  position: 'fixed',
  zIndex: 6,
  top: spacing[600],
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'min(560px, calc(100vw - 32px))',
  borderRadius: spacing[200],
  border: `1px solid ${palette.gray.light2}`,
  boxShadow: `0px 4px 16px ${palette.black}33`,
  overflow: 'hidden',
});

const paletteLightStyles = css({
  backgroundColor: palette.white,
  borderColor: palette.gray.light2,
});

const paletteDarkStyles = css({
  backgroundColor: palette.gray.dark3,
  borderColor: palette.gray.dark1,
});

const searchStyles = css({
  padding: spacing[300],
});

const resultsStyles = css({
  maxHeight: 320,
  overflowY: 'auto',
  borderTop: `1px solid ${palette.gray.light2}`,
  padding: `${spacing[100]}px 0`,
});

const resultsDarkStyles = css({
  borderTopColor: palette.gray.dark1,
});

const resultsEmptyStyles = css({
  minHeight: spacing[800],
});

const activationErrorStyles = css({
  margin: `0 ${spacing[300]}px ${spacing[200]}px`,
});

const resultRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  width: '100%',
  margin: 0,
  padding: `${spacing[200]}px ${spacing[300]}px`,
  border: 'none',
  background: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  color: 'inherit',
  font: 'inherit',
});

const resultRowActiveLightStyles = css({
  backgroundColor: palette.blue.light3,
});

const resultRowActiveDarkStyles = css({
  backgroundColor: palette.blue.dark3,
});

const resultIconStyles = css({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  color: palette.gray.dark1,
});

const resultIconDarkStyles = css({
  color: palette.gray.light1,
});

const resultTextStyles = css({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const resultPrimaryStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const resultSecondaryStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '12px',
  color: palette.gray.dark1,
});

const resultSecondaryDarkStyles = css({
  color: palette.gray.light1,
});

function ResultIcon({
  candidate,
  darkMode,
}: {
  candidate: GoToCandidate;
  darkMode?: boolean;
}) {
  const className = cx(resultIconStyles, darkMode && resultIconDarkStyles);

  if (candidate.kind === 'connection') {
    return (
      <span className={className}>
        <ServerIcon />
      </span>
    );
  }

  if (candidate.kind === 'database') {
    return (
      <span className={className}>
        <Icon glyph="Database" />
      </span>
    );
  }

  const glyph =
    candidate.collectionType === 'view'
      ? 'Visibility'
      : candidate.collectionType === 'timeseries'
      ? 'TimeSeries'
      : 'Folder';

  return (
    <span className={className}>
      <Icon glyph={glyph} />
    </span>
  );
}

type GoToPaletteProps = {
  candidates: GoToCandidate[];
  onClose: () => void;
  onLoadInventory: () => void;
  onActivateResult: (candidate: GoToCandidate) => Promise<ActivateGoToResult>;
};

function GoToPalette({
  candidates,
  onClose,
  onLoadInventory,
  onActivateResult,
}: GoToPaletteProps) {
  const darkMode = useDarkMode();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [activationError, setActivationError] = useState<string | null>(null);
  const activatingRef = useRef(false);

  const results = useMemo(
    () => rankGoToResults(candidates, query),
    [candidates, query]
  );

  const activeIndex =
    results.length === 0 ? 0 : Math.min(highlightedIndex, results.length - 1);

  useHotkeys('esc', onClose, { enableOnFormTags: ['INPUT'] });

  useEffect(() => {
    inputRef.current?.focus();
    onLoadInventory();
  }, [onLoadInventory]);

  const tryActivate = useCallback(
    async (candidate: GoToCandidate) => {
      if (activatingRef.current) {
        return;
      }
      activatingRef.current = true;
      setActivationError(null);
      try {
        const result = await onActivateResult(candidate);
        if (result.close) {
          onClose();
          return;
        }
        if (result.error) {
          setActivationError(result.error);
        }
      } finally {
        activatingRef.current = false;
      }
    },
    [onActivateResult, onClose]
  );

  const activateHighlighted = useCallback(() => {
    const candidate = results[activeIndex];
    if (!candidate) {
      return;
    }
    void tryActivate(candidate);
  }, [activeIndex, results, tryActivate]);

  useHotkeys(
    'arrowdown',
    (event) => {
      event.preventDefault();
      if (results.length === 0) {
        return;
      }
      setHighlightedIndex((index) => {
        const current = Math.min(index, results.length - 1);
        return (current + 1) % results.length;
      });
    },
    { enableOnFormTags: ['INPUT'] },
    [results.length]
  );

  useHotkeys(
    'arrowup',
    (event) => {
      event.preventDefault();
      if (results.length === 0) {
        return;
      }
      setHighlightedIndex((index) => {
        const current = Math.min(index, results.length - 1);
        return (current - 1 + results.length) % results.length;
      });
    },
    { enableOnFormTags: ['INPUT'] },
    [results.length]
  );

  useHotkeys(
    'enter',
    (event) => {
      event.preventDefault();
      activateHighlighted();
    },
    { enableOnFormTags: ['INPUT'] },
    [activateHighlighted]
  );

  return (
    <>
      <button
        type="button"
        aria-label="Dismiss Go to"
        data-testid="go-to-backdrop"
        className={backdropStyles}
        onClick={onClose}
      />
      <div
        data-testid="go-to-palette"
        role="dialog"
        aria-label="Go to"
        className={cx(
          paletteStyles,
          darkMode ? paletteDarkStyles : paletteLightStyles
        )}
      >
        <div className={searchStyles}>
          <TextInput
            ref={inputRef}
            aria-label="Search connections"
            placeholder="Search connections"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlightedIndex(0);
              setActivationError(null);
            }}
          />
        </div>
        {activationError ? (
          <Banner
            className={activationErrorStyles}
            data-testid="go-to-activation-error"
            variant={BannerVariant.Danger}
          >
            {activationError}
          </Banner>
        ) : null}
        <div
          data-testid="go-to-results"
          role="listbox"
          aria-label="Go to results"
          className={cx(
            resultsStyles,
            results.length === 0 && resultsEmptyStyles,
            darkMode && resultsDarkStyles
          )}
        >
          {results.map((candidate, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={candidate.id}
                type="button"
                role="option"
                aria-selected={isActive}
                data-testid="go-to-result"
                data-result-id={candidate.id}
                className={cx(
                  resultRowStyles,
                  isActive &&
                    (darkMode
                      ? resultRowActiveDarkStyles
                      : resultRowActiveLightStyles)
                )}
                onMouseEnter={() => {
                  setHighlightedIndex(index);
                }}
                onClick={() => {
                  void tryActivate(candidate);
                }}
              >
                <ResultIcon candidate={candidate} darkMode={darkMode} />
                <span className={resultTextStyles}>
                  <span className={resultPrimaryStyles}>
                    {candidate.primary}
                  </span>
                  {candidate.secondary ? (
                    <span
                      className={cx(
                        resultSecondaryStyles,
                        darkMode && resultSecondaryDarkStyles
                      )}
                    >
                      {candidate.secondary}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

type ToggleSource = 'hotkey' | 'menu';

type CompassGoToProps = {
  candidates: GoToCandidate[];
  onLoadInventory: () => void;
  onActivateResult: (candidate: GoToCandidate) => Promise<ActivateGoToResult>;
};

function CompassGoTo({
  candidates,
  onLoadInventory,
  onActivateResult,
}: CompassGoToProps) {
  const enableGoTo = usePreference('enableGoTo');
  const [isOpen, setIsOpen] = useState(false);
  // Menu accelerator and renderer hotkeys can both fire for one keypress.
  // Allow the same source to re-fire; ignore a second source within 100ms.
  const lastToggleRef = useRef<{ source: ToggleSource | null; at: number }>({
    source: null,
    at: -1,
  });

  const toggleFrom = useCallback((source: ToggleSource) => {
    const now = Date.now();
    const { source: lastSource, at: lastAt } = lastToggleRef.current;
    if (lastSource !== source && lastSource !== null && now - lastAt < 100) {
      return;
    }
    lastToggleRef.current = { source, at: now };
    setIsOpen((open) => !open);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleFromMenu = useCallback(() => {
    toggleFrom('menu');
  }, [toggleFrom]);

  useHotkeys(
    'mod+p',
    (event) => {
      event.preventDefault();
      toggleFrom('hotkey');
    },
    {
      enabled: !!enableGoTo,
      enableOnFormTags: true,
    },
    [enableGoTo, toggleFrom]
  );

  useApplicationMenu({
    menu: enableGoTo
      ? {
          label: '&File',
          submenu: [
            {
              label: 'Go to…',
              accelerator: 'CmdOrCtrl+P',
              click: toggleFromMenu,
            },
          ],
        }
      : undefined,
  });

  if (!enableGoTo || !isOpen) {
    return null;
  }

  return (
    <GoToPalette
      candidates={candidates}
      onClose={close}
      onLoadInventory={onLoadInventory}
      onActivateResult={onActivateResult}
    />
  );
}

const mapState = (state: GoToRootState) => ({
  candidates: state.candidates,
});

const mapDispatch = {
  onLoadInventory: loadInventory,
  onActivateResult: activateResult,
};

export default connect(mapState, mapDispatch)(CompassGoTo);
