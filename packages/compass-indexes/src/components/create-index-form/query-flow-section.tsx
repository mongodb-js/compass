import {
  Button,
  palette,
  InsightsChip,
  Body,
  cx,
  useFocusRing,
  ParagraphSkeleton,
} from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';
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
  SuggestedIndexFetchedProps,
} from '../../modules/create-index';
import { connect } from 'react-redux';
import { parseFilter } from 'mongodb-query-parser';

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
    background: `${palette.white} !important`,
    borderRadius: editorContainerRadius,
  },
  '& .cm-content': {
    padding: spacing[600],
    paddingBottom: spacing[1400],
  },
});

const indexSuggestionsLoaderStyles = css({
  marginBottom: spacing[600],
  padding: spacing[600],
  background: palette.gray.light3,
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: editorContainerRadius,
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
}: {
  schemaFields: { name: string; description?: string }[];
  serverVersion: string;
  dbName: string;
  collectionName: string;
  onSuggestedIndexButtonClick: ({
    dbName,
    collectionName,
    inputQuery,
  }: SuggestedIndexFetchedProps) => Promise<void>;
  indexSuggestions: Record<string, number> | null;
  fetchingSuggestionsState: IndexSuggestionState;
  initialQuery: Document | null;
}) => {
  const [inputQuery, setInputQuery] = React.useState(
    JSON.stringify(initialQuery ?? '', null, 2)
  );
  const [hasNewChanges, setHasNewChanges] = React.useState(
    initialQuery !== null
  );
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

  const handleSuggestedIndexButtonClick = useCallback(() => {
    const sanitizedInputQuery = inputQuery.trim();

    void onSuggestedIndexButtonClick({
      dbName,
      collectionName,
      inputQuery: sanitizedInputQuery,
    });

    setHasNewChanges(false);
  }, [inputQuery, dbName, collectionName, onSuggestedIndexButtonClick]);

  const handleQueryInputChange = useCallback((text: string) => {
    setInputQuery(text);
    setHasNewChanges(true);
  }, []);

  const isFetchingIndexSuggestions = fetchingSuggestionsState === 'fetching';

  // Validate query upon typing
  useMemo(() => {
    let _isShowSuggestionsButtonDisabled = !hasNewChanges;
    try {
      parseFilter(inputQuery);

      if (!inputQuery.startsWith('{') || !inputQuery.endsWith('}')) {
        _isShowSuggestionsButtonDisabled = true;
      }
    } catch (e) {
      _isShowSuggestionsButtonDisabled = true;
    } finally {
      setIsShowSuggestionsButtonDisabled(_isShowSuggestionsButtonDisabled);
    }
  }, [hasNewChanges, inputQuery]);

  return (
    <>
      {initialQuery && (
        <div className={insightStyles}>
          <InsightsChip />
          <p>
            We prefilled the query input below based on your recently run query
          </p>
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
            text={inputQuery}
            onChangeText={(text) => handleQueryInputChange(text)}
            placeholder="Type a query: { field: 'value' }"
            completer={completer}
            className={codeEditorStyles}
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
          className={indexSuggestionsLoaderStyles}
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
              />
            </div>
          </>
        )
      )}
    </>
  );
};

const mapState = ({ createIndex }: RootState) => {
  const { indexSuggestions, sampleDocs, fetchingSuggestionsState } =
    createIndex;
  return {
    indexSuggestions,
    sampleDocs,
    fetchingSuggestionsState,
  };
};

const mapDispatch = {
  onSuggestedIndexButtonClick: fetchIndexSuggestions,
};

export default connect(mapState, mapDispatch)(QueryFlowSection);
