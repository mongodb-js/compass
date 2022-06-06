import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Body,
  Button,
  ErrorSummary,
  Icon,
  Link,
  Toolbar,
  WarningSummary,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { AnalysisState } from '../../constants/analysis-states';
import {
  ANALYSIS_STATE_ERROR,
  ANALYSIS_STATE_TIMEOUT,
  ANALYSIS_STATE_COMPLETE,
} from '../../constants/analysis-states';
import type AppRegistry from 'hadron-app-registry';

const schemaToolbarStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[3],
  padding: spacing[3],
  boxShadow: '0 2px 2px rgb(0 0 0 / 20%)',
  zIndex: 10,
});

const schemaQueryBarStyles = css({
  width: '100%',
  position: 'relative',
});

const schemaToolbarActionBarStyles = css({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
});

const schemaToolbarActionBarRightStyles = css({
  flexShrink: 0,
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: spacing[2],
  paddingLeft: spacing[2],
});

const exportToLanguageButtonStyles = css({
  flexShrink: 0,
});

const ERROR_WARNING = 'An error occurred during schema analysis';
const INCREASE_MAX_TIME_MS_HINT_MESSAGE =
  'Operation exceeded time limit. Please try increasing the maxTimeMS for the query in the filter options.';
const OUTDATED_WARNING_MESSAGE =
  'The schema content is outdated and no longer in sync' +
  ' with the documents view. Press "Analyze" again to see the schema for the' +
  ' current query.';

const SCHEMA_ANALYSIS_DOCS_LINK =
  'https://docs.mongodb.com/compass/current/sampling#sampling';

type SchemaToolbarProps = {
  analysisState: AnalysisState;
  errorMessage: string;
  globalAppRegistry: AppRegistry;
  isOutdated: boolean;
  localAppRegistry: AppRegistry;
  onAnalyzeSchemaClicked: () => void;
  onResetClicked: () => void;
  sampleSize: number;
  schemaResultId: string;
};

const SchemaToolbar: React.FunctionComponent<SchemaToolbarProps> = ({
  analysisState,
  errorMessage,
  globalAppRegistry,
  isOutdated,
  localAppRegistry,
  onAnalyzeSchemaClicked,
  onResetClicked,
  sampleSize,
  schemaResultId,
}) => {
  const queryBarRef = useRef<{
    component: React.ComponentType<any>;
    store: any; // Query bar store is not currently typed.
    actions: any; // Query bar actions are not typed.
  } | null>(null);

  const [queryBarLoaded, setQueryBarLoaded] = useState(false);

  const QueryBarComponent = queryBarLoaded
    ? queryBarRef.current!.component
    : null;

  useEffect(() => {
    const queryBarRole = localAppRegistry.getRole('Query.QueryBar')![0];

    queryBarRef.current = {
      component: queryBarRole.component,
      store: localAppRegistry.getStore(queryBarRole.storeName!),
      actions: localAppRegistry.getAction(queryBarRole.actionName!),
    };

    setQueryBarLoaded(true);
  }, [localAppRegistry]);

  const documentsNoun = useMemo(
    () => (sampleSize === 1 ? 'document' : 'documents'),
    [sampleSize]
  );

  const onExportToLanguageClicked = useCallback(() => {
    const queryState = queryBarRef.current!.store.state;
    localAppRegistry.emit('open-query-export-to-language', {
      filter: queryState.filterString,
      project: queryState.projectString,
      sort: queryState.sortString,
      collation: queryState.collationString,
      skip: queryState.skipString,
      limit: queryState.limitString,
      maxTimeMS: queryState.maxTimeMSString,
    });
    globalAppRegistry.emit('compass:export-to-language:opened', {
      source: 'Schema',
    });
  }, [localAppRegistry, globalAppRegistry]);

  return (
    <Toolbar className={schemaToolbarStyles}>
      <div className={schemaQueryBarStyles}>
        {queryBarLoaded && QueryBarComponent && (
          <QueryBarComponent
            store={queryBarRef.current!.store}
            actions={queryBarRef.current!.actions}
            buttonLabel="Analyze"
            resultId={schemaResultId}
            onApply={onAnalyzeSchemaClicked}
            onReset={onResetClicked}
          />
        )}
      </div>
      <div className={schemaToolbarActionBarStyles}>
        <Button
          className={exportToLanguageButtonStyles}
          variant="primaryOutline"
          size="xsmall"
          leftGlyph={<Icon glyph={'Export'} />}
          onClick={onExportToLanguageClicked}
          data-testid="schema-toolbar-export-button"
        >
          Export to language
        </Button>
        {analysisState === ANALYSIS_STATE_COMPLETE && !isOutdated && (
          <div
            className={schemaToolbarActionBarRightStyles}
            data-testid="schema-document-count"
          >
            <Body>
              This report is based on a sample of&nbsp;<b>{sampleSize}</b>&nbsp;
              {documentsNoun}.
            </Body>
            <Link
              aria-label="Schema sampling documentation"
              href={SCHEMA_ANALYSIS_DOCS_LINK}
              target="_blank"
            >
              Learn more
            </Link>
          </div>
        )}
      </div>
      {analysisState === ANALYSIS_STATE_ERROR && (
        <ErrorSummary errors={[`${ERROR_WARNING}: ${errorMessage}`]} />
      )}
      {analysisState === ANALYSIS_STATE_TIMEOUT && (
        <WarningSummary warnings={[INCREASE_MAX_TIME_MS_HINT_MESSAGE]} />
      )}
      {analysisState === ANALYSIS_STATE_COMPLETE && isOutdated && (
        <WarningSummary warnings={[OUTDATED_WARNING_MESSAGE]} />
      )}
    </Toolbar>
  );
};

export { SchemaToolbar };
