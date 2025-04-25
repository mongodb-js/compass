import {
  Button,
  palette,
  Body,
  cx,
  useFocusRing,
} from '@mongodb-js/compass-components';
import React, { useMemo } from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import {
  CodemirrorMultilineEditor,
  createQueryAutocompleter,
} from '@mongodb-js/compass-editor';
import MDBCodeViewer from './mdb-code-viewer';

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
}: {
  schemaFields: { name: string; description?: string }[];
  serverVersion: string;
  dbName: string;
  collectionName: string;
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
              // TODO in CLOUDP-311786
            }}
            className={suggestedIndexButtonStyles}
            size="small"
          >
            Show suggested index
          </Button>
        </div>
      </div>
      <Body baseFontSize={16} weight="medium" className={headerStyles}>
        Suggested Index
      </Body>{' '}
      <div className={suggestedIndexContainerStyles}>
        {/* TODO in CLOUDP-311786, replace hardcoded values with actual data */}
        <MDBCodeViewer
          dataTestId="query-flow-section-suggested-index"
          dbName={dbName}
          collectionName={collectionName}
          indexNameTypeMap={{ 'awards.win': '1', 'imdb.rating': '1' }}
        />
      </div>
    </>
  );
};

export default QueryFlowSection;
