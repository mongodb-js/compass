import React, { useMemo, useRef } from 'react';
import type { Signal } from '@mongodb-js/compass-components';
import {
  css,
  cx,
  useFocusRing,
  palette,
  spacing,
  SignalPopover,
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
  createQueryAutocompleter,
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
  borderRadius: spacing[1],
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
    borderRadius: spacing[1],
    border: `1px solid ${palette.red.base}`,
    pointerEvents: 'none',
  },
  '&:focus-within': {
    borderColor: palette.gray.base,
  },
});

const queryBarEditorOptionInsightsStyles = css({
  alignSelf: 'flex-start',
  // To align the icon in the middle of the first line of the editor input
  // (<input height> - <insight badge height>) / 2
  paddingTop: 3,
  paddingBottom: 3,
  paddingLeft: 3,
  paddingRight: 3,

  // We make container the size of the collapsed insight to avoid additional
  // shrinking of the editor content when hoveing over the icon. In this case
  // it's okay for the content to be hidden by the expanded badge as user is
  // interacting with the badge
  width: spacing[4],
  height: spacing[4],
  overflow: 'visible',
  display: 'flex',
  justifyContent: 'flex-end',
});

const insightsBadgeStyles = css({
  flex: 'none',
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
  placeholder?: string | HTMLElement;
  serverVersion?: string;
  value?: string;
  ['data-testid']?: string;
  insights?: Signal | Signal[];
  disabled?: boolean;
  savedQueries: SavedQuery[];
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
  insights,
  disabled = false,
  savedQueries,
  onApplyQuery,
}) => {
  const showInsights = usePreference('showInsights');
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorRef>(null);
  const isQueryHistoryAutocompleteEnabled = usePreference(
    'enableQueryHistoryAutocomplete'
  );

  const focusRingProps = useFocusRing({
    outer: true,
    focusWithin: true,
    hover: true,
  });

  const darkMode = useDarkMode();

  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;

  const commands = useMemo<Command[]>(() => {
    return [
      {
        key: 'Enter',
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

  const completer = useMemo(() => {
    return isQueryHistoryAutocompleteEnabled
      ? createQueryWithHistoryAutocompleter({
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
            const optionFormField =
              formFields[optionName as keyof QueryFormFields];
            if (optionFormField?.string) {
              // When we did apply something we want to move the cursor to the end of the input.
              editorRef.current?.cursorDocEnd();
            }
          },
          theme: darkMode ? 'dark' : 'light',
        })
      : createQueryAutocompleter({
          fields: schemaFields,
          serverVersion,
        });
  }, [
    maxTimeMSPreference,
    savedQueries,
    schemaFields,
    serverVersion,
    onApplyQuery,
    isQueryHistoryAutocompleteEnabled,
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
          if (isQueryHistoryAutocompleteEnabled && editorRef.current?.editor)
            editorRef.current?.startCompletion();
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
      />
      {showInsights && insights && (
        <div className={queryBarEditorOptionInsightsStyles}>
          <SignalPopover
            className={insightsBadgeStyles}
            signals={insights}
          ></SignalPopover>
        </div>
      )}
    </div>
  );
};

export function getOptionBasedQueries(
  optionName: QueryOptionOfTypeDocument,
  type: 'recent' | 'favorite',
  queries: (RecentQuery | FavoriteQuery)[]
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

const mapStateToProps = (
  state: RootState,
  ownProps: Pick<OptionEditorProps, 'optionName'>
) => ({
  namespace: state.queryBar.namespace,
  serverVersion: state.queryBar.serverVersion,
  savedQueries: [
    ...getOptionBasedQueries(
      ownProps.optionName,
      'recent',
      state.queryBar.recentQueries
    ),
    ...getOptionBasedQueries(
      ownProps.optionName,
      'favorite',
      state.queryBar.favoriteQueries
    ),
  ],
});

const mapDispatchToProps = {
  onApplyQuery: applyFromHistory,
};

export default connect(mapStateToProps, mapDispatchToProps)(OptionEditor);
