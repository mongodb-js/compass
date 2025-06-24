import {
  Button,
  palette,
  InsightsChip,
  Body,
  cx,
  useFocusRing,
  ParagraphSkeleton,
  useDarkMode,
} from '@mongodb-js/compass-components';
import React, { useMemo, useCallback } from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import {
  CodemirrorMultilineEditor,
  createQueryAutocompleter,
} from '@mongodb-js/compass-editor';
import MDBCodeViewer from './mdb-code-viewer';
import type { RootState } from '../../modules';
import { fetchIndexSuggestions } from '../../modules/create-index';
import type {
  IndexSuggestionState,
  QueryUpdatedProps,
  SuggestedIndexFetchedProps,
} from '../../modules/create-index';
import { queryUpdated } from '../../modules/create-index';
import { connect } from 'react-redux';
import { parseFilter } from 'mongodb-query-parser';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

const inputQueryContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
});

const headerStyles = css({
  marginBottom: spacing[200],
});

const suggestedIndexContainerStyles = css({
  flexDirection: 'column',
  display: 'flex',
  marginBottom: spacing[600],
});

const editorActionContainerStyles = css({
  position: 'relative',
});

const suggestedIndexButtonStyles = css({
  position: 'absolute',
  right: spacing[600],
  bottom: spacing[600],
  marginBottom: spacing[400],
});

const editorContainerRadius = spacing[300];

const codeEditorContainerStyles = css({
  border: `1px solid ${palette.gray.base}`,
  borderRadius: editorContainerRadius,
  marginBottom: spacing[600],
});

const codeEditorStyles = css({
  borderRadius: editorContainerRadius,
  '& .cm-editor': {
    borderRadius: editorContainerRadius,
  },
  '& .cm-content': {
    padding: spacing[600],
    paddingBottom: spacing[1400],
  },
});

const lightModeCodeEditorStyles = css({
  '& .cm-editor': {
    background: `${palette.white} !important`,
  },
});

const indexSuggestionsLoaderStyles = css({
  marginBottom: spacing[600],
  padding: spacing[600],
  borderRadius: editorContainerRadius,
});

const indexSuggestionsLoaderLightStyles = css({
  background: palette.gray.light3,
  border: `1px solid ${palette.gray.light2}`,
});

const insightStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  marginBottom: spacing[200],
  height: spacing[500],
});

const QueryFlowSection = ({
  schemaFields,
  serverVersion,
  dbName,
  collectionName,
  onSuggestedIndexButtonClick,
  indexSuggestions,
  fetchingSuggestionsState,
  initialQuery,
  query,
  hasQueryChanges,
  onQueryUpdated,
}: {
  schemaFields: { name: string; description?: string }[];
  serverVersion: string;
  dbName: string;
  collectionName: string;
  onSuggestedIndexButtonClick: ({
    query,
  }: SuggestedIndexFetchedProps) => Promise<void>;
  indexSuggestions: Record<string, number> | null;
  fetchingSuggestionsState: IndexSuggestionState;
  initialQuery: string | null;
  query: string;
  hasQueryChanges: boolean;
  onQueryUpdated: ({ query }: QueryUpdatedProps) => void;
}) => {
  const track = useTelemetry();
  const darkMode = useDarkMode();

  const [isShowSuggestionsButtonDisabled, setIsShowSuggestionsButtonDisabled] =
    React.useState(true);

  const completer = useMemo(
    () =>
      createQueryAutocompleter({
        fields: schemaFields,
        serverVersion,
      }),
    [schemaFields, serverVersion]
  );

  const focusRingProps = useFocusRing({
    outer: true,
    focusWithin: true,
    hover: true,
    radius: editorContainerRadius,
  });

  const generateSuggestedIndexes = useCallback(() => {
    const sanitizedInputQuery = query.trim();

    void onSuggestedIndexButtonClick({
      query: sanitizedInputQuery,
    });
  }, [query, onSuggestedIndexButtonClick]);

  const handleSuggestedIndexButtonClick = () => {
    generateSuggestedIndexes();
    track('Suggested Index Button Clicked', {
      context: 'Create Index Modal',
    });
  };

  const handleQueryInputChange = useCallback(
    (text: string) => {
      onQueryUpdated({ query: text });
    },
    [onQueryUpdated]
  );

  const isFetchingIndexSuggestions = fetchingSuggestionsState === 'fetching';

  useMemo(() => {
    let _isShowSuggestionsButtonDisabled = !hasQueryChanges;
    try {
      parseFilter(query);

      if (!query.startsWith('{') || !query.endsWith('}')) {
        _isShowSuggestionsButtonDisabled = true;
      }
    } catch {
      _isShowSuggestionsButtonDisabled = true;
    } finally {
      setIsShowSuggestionsButtonDisabled(_isShowSuggestionsButtonDisabled);
    }
  }, [hasQueryChanges, query]);

  return (
    <>
      {initialQuery && (
        <div className={insightStyles}>
          <InsightsChip />
          <span>
            We prefilled the query input below based on your recently run query
          </span>
        </div>
      )}
      <Body baseFontSize={16} weight="medium" className={headerStyles}>
        Input Query
      </Body>
      <div className={inputQueryContainerStyles}>
        <div
          className={cx(focusRingProps.className, codeEditorContainerStyles)}
        >
          <CodemirrorMultilineEditor
            data-testid="query-flow-section-code-editor"
            language="javascript-expression"
            showLineNumbers={false}
            minLines={5}
            showFoldGutter={false}
            showAnnotationsGutter={false}
            copyable={false}
            formattable={false}
            text={query}
            onChangeText={(text) => handleQueryInputChange(text)}
            placeholder="Type a query: { field: 'value' }"
            completer={completer}
            className={cx(
              codeEditorStyles,
              !darkMode && lightModeCodeEditorStyles
            )}
          />
        </div>

        <div className={editorActionContainerStyles}>
          <Button
            onClick={handleSuggestedIndexButtonClick}
            className={suggestedIndexButtonStyles}
            size="small"
            disabled={isShowSuggestionsButtonDisabled}
          >
            Show suggested index
          </Button>
        </div>
      </div>

      {(isFetchingIndexSuggestions || indexSuggestions) && (
        <Body baseFontSize={16} weight="medium" className={headerStyles}>
          Suggested Index
        </Body>
      )}

      {isFetchingIndexSuggestions ? (
        <ParagraphSkeleton
          data-testid="query-flow-section-code-loader"
          className={cx(
            indexSuggestionsLoaderStyles,
            !darkMode && indexSuggestionsLoaderLightStyles
          )}
        />
      ) : (
        indexSuggestions && (
          <>
            <div className={suggestedIndexContainerStyles}>
              <MDBCodeViewer
                dataTestId="query-flow-section-suggested-index"
                dbName={dbName}
                collectionName={collectionName}
                indexNameTypeMap={indexSuggestions}
                onCopy={() => {
                  track('Index Suggestions Copied', {
                    context: 'Create Index Modal',
                  });
                }}
              />
            </div>
          </>
        )
      )}
    </>
  );
};

const mapState = ({ createIndex }: RootState) => {
  const {
    indexSuggestions,
    sampleDocs,
    fetchingSuggestionsState,
    query,
    initialQuery,
    hasQueryChanges,
  } = createIndex;
  return {
    indexSuggestions,
    sampleDocs,
    fetchingSuggestionsState,
    query,
    initialQuery,
    hasQueryChanges,
  };
};

const mapDispatch = {
  onSuggestedIndexButtonClick: fetchIndexSuggestions,
  onQueryUpdated: queryUpdated,
};

export default connect(mapState, mapDispatch)(QueryFlowSection);
