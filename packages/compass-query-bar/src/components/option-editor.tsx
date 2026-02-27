import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  css,
  cx,
  useFocusRing,
  palette,
  spacing,
  rafraf,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type {
  Command,
  EditorRef,
  SavedQuery,
} from '@mongodb-js/compass-editor';
import {
  CodemirrorInlineEditor as InlineEditor,
  createQueryWithHistoryAutocompleter,
} from '@mongodb-js/compass-editor';
import { connect } from '../stores/context';
import { usePreference } from 'compass-preferences-model/provider';
import { lenientlyFixQuery } from '../query/leniently-fix-query';
import type { RootState } from '../stores/query-bar-store';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import { applyFromHistory } from '../stores/query-bar-reducer';
import { getQueryAttributes } from '../utils';
import type {
  BaseQuery,
  QueryFormFields,
  QueryProperty,
} from '../constants/query-properties';
import { QUERY_PROPERTIES } from '../constants/query-properties';
import { mapQueryToFormFields } from '../utils/query';
import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';
import type {
  FavoriteQuery,
  RecentQuery,
} from '@mongodb-js/my-queries-storage';
import type { QueryOptionOfTypeDocument } from '../constants/query-option-definition';

type AutoCompleteQuery<T extends { _lastExecuted: Date }> = Partial<T> & {
  _lastExecuted: Date;
};
type AutoCompleteRecentQuery = AutoCompleteQuery<RecentQuery>;
type AutoCompleteFavoriteQuery = AutoCompleteQuery<FavoriteQuery>;

const editorContainerStyles = css({
  position: 'relative',
  display: 'flex',
  width: '100%',
  minWidth: spacing[7],
  // To match codemirror editor with leafygreen inputs.
  paddingTop: 1,
  paddingBottom: 1,
  paddingLeft: 4,
  paddingRight: 0,
  border: '1px solid transparent',
  borderRadius: spacing[100],
  overflow: 'visible',
});

const editorWithErrorStyles = css({
  '&:after': {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    zIndex: 2,
    borderRadius: spacing[100],
    border: `1px solid ${palette.red.base}`,
    pointerEvents: 'none',
  },
  '&:focus-within': {
    borderColor: palette.gray.base,
  },
});

// Matches BaseEditor's default lineHeight prop value.
const EDITOR_LINE_HEIGHT = 16;
const MAX_EDITOR_LINES = 50;

// The initial rendered height of the editor container (single line of content
// + cm-content padding + container padding/border). Acts as the floor for
// the resize grip — the editor should never shrink below this.
const MIN_EDITOR_HEIGHT = 28;
const MAX_EDITOR_HEIGHT = MAX_EDITOR_LINES * EDITOR_LINE_HEIGHT;

function clampHeight(h: number) {
  return Math.max(MIN_EDITOR_HEIGHT, Math.min(MAX_EDITOR_HEIGHT, h));
}

// Matches the LeafyGreen "Resize" glyph — two diagonal lines in the corner.
const resizeGripSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">` +
    `<path fill-rule="evenodd" clip-rule="evenodd" ` +
    `d="M14.7706 5.71967C15.0631 6.01256 15.0631 6.48744 14.7706 6.78033` +
    `L6.77898 14.7803C6.4864 15.0732 6.01202 15.0732 5.71944 14.7803` +
    `C5.42685 14.4874 5.42685 14.0126 5.71944 13.7197L13.711 5.71967` +
    `C14.0036 5.42678 14.478 5.42678 14.7706 5.71967Z" ` +
    `fill="${palette.gray.base}"/>` +
    `<path fill-rule="evenodd" clip-rule="evenodd" ` +
    `d="M14.7806 10.2197C15.0731 10.5126 15.0731 10.9874 14.7806 11.2803` +
    `L11.2842 14.7803C10.9917 15.0732 10.5173 15.0732 10.2247 14.7803` +
    `C9.93212 14.4874 9.93212 14.0126 10.2247 13.7197L13.721 10.2197` +
    `C14.0136 9.92678 14.488 9.92678 14.7806 10.2197Z" ` +
    `fill="${palette.gray.base}"/>` +
    `</svg>`
);

const resizeGripStyles = css({
  position: 'absolute',
  bottom: 0,
  right: 0,
  width: 16,
  height: 16,
  padding: 0,
  border: 'none',
  background: 'transparent',
  backgroundImage: `url("data:image/svg+xml,${resizeGripSvg}")`,
  backgroundSize: '100% 100%',
  cursor: 'ns-resize',
  opacity: 0.6,
  zIndex: 100,
  outline: 'none',
  transition: 'opacity 150ms ease',
  '&:hover, &:focus-visible': {
    opacity: 1,
  },
});

type OptionEditorProps = {
  optionName: QueryOptionOfTypeDocument;
  namespace: string;
  id?: string;
  hasError?: boolean;
  /**
   * When `true` will insert an empty document in the input on focus and put
   * cursor in the middle of the inserted string. Default is `true`
   */
  insertEmptyDocOnFocus?: boolean;
  onChange: (value: string) => void;
  onApply?(): void;
  onBlur?(): void;
  placeholder?: string | (() => HTMLElement);
  serverVersion?: string;
  value?: string;
  ['data-testid']?: string;
  disabled?: boolean;
  recentQueries: AutoCompleteRecentQuery[];
  favoriteQueries: AutoCompleteFavoriteQuery[];
  onApplyQuery: (query: BaseQuery, fieldsToPreserve: QueryProperty[]) => void;
};

export const OptionEditor: React.FunctionComponent<OptionEditorProps> = ({
  optionName,
  namespace,
  id,
  hasError = false,
  insertEmptyDocOnFocus = true,
  onChange,
  onApply,
  onBlur,
  placeholder,
  serverVersion = '3.6.0',
  value = '',
  ['data-testid']: dataTestId,
  disabled = false,
  recentQueries,
  favoriteQueries,
  onApplyQuery,
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorRef>(null);

  const focusRingProps = useFocusRing({
    outer: true,
    focusWithin: true,
    hover: true,
  });

  const darkMode = useDarkMode();

  // Tracks the user's manual resize height in pixels. When null, the editor
  // auto-grows with content (no cap). Once the user drags the resize grip,
  // this holds the pixel height for the container.
  const [userHeight, setUserHeight] = useState<number | null>(null);

  const handleGripMouseDown = useCallback(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setUserHeight((prev) =>
        clampHeight((prev ?? MIN_EDITOR_HEIGHT) + event.movementY)
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleGripKeyDown = useCallback((event: React.KeyboardEvent) => {
    const step = EDITOR_LINE_HEIGHT;
    let handled = true;

    switch (event.key) {
      case 'ArrowDown':
        setUserHeight((prev) =>
          clampHeight((prev ?? MIN_EDITOR_HEIGHT) + step)
        );
        break;
      case 'ArrowUp':
        setUserHeight((prev) =>
          clampHeight((prev ?? MIN_EDITOR_HEIGHT) - step)
        );
        break;
      case 'End':
        setUserHeight(MAX_EDITOR_HEIGHT);
        break;
      case 'Home':
        setUserHeight(MIN_EDITOR_HEIGHT);
        break;
      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
    }
  }, []);

  // When the user has manually resized, cap maxLines high so the container's
  // CSS height is the actual constraint. Otherwise omit it to preserve the
  // original auto-grow behavior (editor grows with content, no cap).
  const maxLines = userHeight !== null ? MAX_EDITOR_LINES : undefined;

  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;

  const commands = useMemo<Command[]>(() => {
    return [
      {
        key: 'Mod-Enter',
        run() {
          onApplyRef.current?.();
          return true;
        },
        preventDefault: true,
      },
    ];
  }, []);

  const schemaFields = useAutocompleteFields(namespace);
  const maxTimeMSPreference = usePreference('maxTimeMS');

  const savedQueries = useMemo(() => {
    return [
      ...getOptionBasedQueries(optionName, 'recent', recentQueries),
      ...getOptionBasedQueries(optionName, 'favorite', favoriteQueries),
    ];
  }, [optionName, recentQueries, favoriteQueries]);

  const completer = useMemo(() => {
    return createQueryWithHistoryAutocompleter({
      queryProperty: optionName,
      savedQueries,
      options: {
        fields: schemaFields,
        serverVersion,
      },
      onApply: (query: SavedQuery['queryProperties']) => {
        // When we are applying a query from `filter` field, we want to apply the whole query,
        // otherwise we want to preserve the other fields that are already in the current query.
        const fieldsToPreserve =
          optionName === 'filter'
            ? []
            : QUERY_PROPERTIES.filter((x) => x !== optionName);
        onApplyQuery(query, fieldsToPreserve);
        if (!query[optionName]) {
          return;
        }
        const formFields = mapQueryToFormFields(
          { maxTimeMS: maxTimeMSPreference },
          {
            ...DEFAULT_FIELD_VALUES,
            ...query,
          }
        );
        const optionFormField = formFields[optionName as keyof QueryFormFields];
        if (optionFormField?.string) {
          // When we did apply something we want to move the cursor to the end of the input.
          editorRef.current?.cursorDocEnd();
        }
      },
      theme: darkMode ? 'dark' : 'light',
    });
  }, [
    maxTimeMSPreference,
    savedQueries,
    schemaFields,
    serverVersion,
    onApplyQuery,
    darkMode,
    optionName,
  ]);

  const onFocus = () => {
    if (insertEmptyDocOnFocus) {
      rafraf(() => {
        if (
          editorRef.current?.editorContents === '' ||
          editorRef.current?.editorContents === '{}'
        ) {
          editorRef.current?.applySnippet('\\{${}}');
          if (editorRef.current?.editor) editorRef.current?.startCompletion();
        }
      });
    }
  };

  const onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (insertEmptyDocOnFocus && editorRef.current) {
      const { main: currentSelection } =
        editorRef.current.editor?.state.selection ?? {};
      const currentContents = editorRef.current.editorContents;
      // Only try to fix user paste if we are handling editor state similar to
      // what happens after we auto-inserted empty brackets on initial focus, do
      // not mess with user input in any other case
      if (
        currentContents === '{}' &&
        currentSelection &&
        currentSelection.from === 1 &&
        currentSelection.to === 1
      ) {
        const pasteContents = event.clipboardData.getData('text');
        const snippet = lenientlyFixQuery(`{${pasteContents}}`);
        if (snippet) {
          event.preventDefault();
          editorRef.current.applySnippet(snippet);
        }
      }
    }
  };

  return (
    <div
      className={cx(
        editorContainerStyles,
        !disabled && focusRingProps.className,
        hasError && editorWithErrorStyles
      )}
      ref={editorContainerRef}
      style={
        userHeight !== null
          ? { height: userHeight, minHeight: MIN_EDITOR_HEIGHT }
          : undefined
      }
    >
      <InlineEditor
        ref={editorRef}
        id={id}
        text={value}
        onChangeText={onChange}
        placeholder={placeholder}
        completer={completer}
        commands={commands}
        data-testid={dataTestId}
        disabled={disabled}
        onFocus={onFocus}
        onPaste={onPaste}
        onBlur={onBlur}
        maxLines={maxLines}
      />
      {!disabled && optionName === 'filter' && (
        <div
          role="slider"
          aria-orientation="vertical"
          aria-valuenow={userHeight ?? MIN_EDITOR_HEIGHT}
          aria-valuemin={MIN_EDITOR_HEIGHT}
          aria-valuemax={MAX_EDITOR_HEIGHT}
          aria-label="Resize query editor"
          tabIndex={0}
          className={resizeGripStyles}
          onMouseDown={handleGripMouseDown}
          onKeyDown={handleGripKeyDown}
        />
      )}
    </div>
  );
};

export function getOptionBasedQueries(
  optionName: QueryOptionOfTypeDocument,
  type: 'recent' | 'favorite',
  queries: (AutoCompleteRecentQuery | AutoCompleteFavoriteQuery)[]
) {
  return (
    queries
      .map((query) => ({
        type,
        lastExecuted: query._lastExecuted,
        // For query that's being autocompeted from the main `filter`, we want to
        // show whole query to the user, so that when its applied, it will replace
        // the whole query (filter, project, sort etc).
        // For other options, we only want to show the query for that specific option.
        queryProperties: getQueryAttributes(
          optionName !== 'filter' ? { [optionName]: query[optionName] } : query
        ),
      }))
      // Filter the query if:
      // - its empty
      // - its an `update` query
      // - its a duplicate
      .filter((query, i, arr) => {
        const queryIsUpdate = 'update' in query.queryProperties;
        const queryIsEmpty = Object.keys(query.queryProperties).length === 0;
        if (queryIsEmpty || queryIsUpdate) {
          return false;
        }
        return (
          i ===
          arr.findIndex(
            (t) =>
              JSON.stringify(t.queryProperties) ===
              JSON.stringify(query.queryProperties)
          )
        );
      })
      .sort((a, b) => a.lastExecuted.getTime() - b.lastExecuted.getTime())
  );
}

const mapStateToProps = ({
  queryBar: { namespace, serverVersion, recentQueries, favoriteQueries },
}: RootState) => ({
  namespace,
  serverVersion,
  recentQueries,
  favoriteQueries,
});

const mapDispatchToProps = {
  onApplyQuery: applyFromHistory,
};

export default connect(mapStateToProps, mapDispatchToProps)(OptionEditor);
