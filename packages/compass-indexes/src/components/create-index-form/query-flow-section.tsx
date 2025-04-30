import {
  Button,
  palette,
  Body,
  cx,
  useFocusRing,
} from '@mongodb-js/compass-components';
import React, { useMemo, useCallback } from 'react';
import { EJSON } from 'bson';
import { css, spacing } from '@mongodb-js/compass-components';
import {
  CodemirrorMultilineEditor,
  createQueryAutocompleter,
} from '@mongodb-js/compass-editor';
import MDBCodeViewer from './mdb-code-viewer';
import * as mql from 'mongodb-mql-engines';
import type { RootState } from '../../modules';
import { suggestedIndexFetched } from '../../modules/create-index';
import type {
  IndexSuggestionState,
  SuggestedIndexFetchedProps,
} from '../../modules/create-index';
import { connect } from 'react-redux';

const inputQueryContainerStyles = css({
  marginBottom: spacing[600],
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

const QueryFlowSection = ({
  schemaFields,
  serverVersion,
  dbName,
  collectionName,
  onSuggestedIndexButtonClick,
  indexSuggestions,
}: {
  schemaFields: { name: string; description?: string }[];
  serverVersion: string;
  dbName: string;
  collectionName: string;
  onSuggestedIndexButtonClick: ({
    indexSuggestions,
    error,
    indexSuggestionsState,
  }: SuggestedIndexFetchedProps) => void;
  indexSuggestions: Record<string, number> | null;
}) => {
  const [inputQuery, setInputQuery] = React.useState('');
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

  const handleSuggestedIndexButtonClick = useCallback(async () => {
    try {
      const sanitizedInputQuery = inputQuery.trim();
      const namespace = mql.analyzeNamespace(
        { database: dbName, collection: collectionName },
        []
      );
      const query = mql.parseQuery(
        EJSON.parse(sanitizedInputQuery, { relaxed: false }),
        namespace
      );
      const results = await mql.suggestIndex([query]);

      if (results?.index) {
        onSuggestedIndexButtonClick({
          indexSuggestions: results.index,
          error: null,
          indexSuggestionsState: 'success',
        });
      } else {
        onSuggestedIndexButtonClick({
          indexSuggestions: null,
          error:
            'No suggested index found. Please choose Start with an Index at the top to continue.',
          indexSuggestionsState: 'error',
        });
      }
    } catch (error) {
      onSuggestedIndexButtonClick({
        indexSuggestions: null,
        error: 'Error parsing query. Please follow query structure.',
        indexSuggestionsState: 'error',
      });
    }
  }, [inputQuery, dbName, collectionName, onSuggestedIndexButtonClick]);

  return (
    <>
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
            onChangeText={(text) => setInputQuery(text)}
            placeholder="Type a query: { field: 'value' }"
            completer={completer}
            className={codeEditorStyles}
          />
        </div>

        <div className={editorActionContainerStyles}>
          <Button
            onClick={() => {
              void handleSuggestedIndexButtonClick();
            }}
            className={suggestedIndexButtonStyles}
            size="small"
          >
            Show suggested index
          </Button>
        </div>
      </div>
      {indexSuggestions && (
        <>
          <Body baseFontSize={16} weight="medium" className={headerStyles}>
            Suggested Index
          </Body>{' '}
          <div className={suggestedIndexContainerStyles}>
            {/* TODO in CLOUDP-311786, replace hardcoded values with actual data */}
            <MDBCodeViewer
              dataTestId="query-flow-section-suggested-index"
              dbName={dbName}
              collectionName={collectionName}
              indexNameTypeMap={indexSuggestions}
            />
          </div>
        </>
      )}
    </>
  );
};

const mapState = ({ createIndex }: RootState) => {
  const { indexSuggestions } = createIndex;
  return {
    indexSuggestions,
  };
};

const mapDispatch = {
  onSuggestedIndexButtonClick: suggestedIndexFetched,
};

export default connect(mapState, mapDispatch)(QueryFlowSection);
