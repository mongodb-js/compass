import React, { useMemo } from 'react';
import {
  Banner,
  BannerVariant,
  Body,
  Button,
  ErrorSummary,
  Icon,
  Link,
  WarningSummary,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import type { AnalysisState } from '../../constants/analysis-states';
import { ANALYSIS_STATE_COMPLETE } from '../../constants/analysis-states';
import { QueryBar } from '@mongodb-js/compass-query-bar';
import { type SchemaAnalysisError } from '../../stores/schema-analysis-reducer';

const schemaToolbarStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[3],
  padding: spacing[3],
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
  error?: SchemaAnalysisError;
  isOutdated: boolean;
  onAnalyzeSchemaClicked: () => void;
  onExportSchemaClicked: () => void;
  onResetClicked: () => void;
  onDismissError: () => void;
  sampleSize: number;
  schemaResultId: string;
};

const SchemaToolbar: React.FunctionComponent<SchemaToolbarProps> = ({
  analysisState,
  error,
  onDismissError,
  isOutdated,
  onAnalyzeSchemaClicked,
  onExportSchemaClicked,
  onResetClicked,
  sampleSize,
  schemaResultId,
}) => {
  const documentsNoun = useMemo(
    () => (sampleSize === 1 ? 'document' : 'documents'),
    [sampleSize]
  );

  const enableExportSchema = usePreference('enableExportSchema');

  return (
    <div className={schemaToolbarStyles}>
      <div className={schemaQueryBarStyles}>
        <QueryBar
          source="schema"
          buttonLabel="Analyze"
          resultId={schemaResultId}
          onApply={onAnalyzeSchemaClicked}
          onReset={onResetClicked}
        />
      </div>
      {analysisState === ANALYSIS_STATE_COMPLETE && !isOutdated && (
        <div className={schemaToolbarActionBarStyles}>
          {enableExportSchema && ANALYSIS_STATE_COMPLETE && (
            <div>
              <Button
                variant="default"
                onClick={onExportSchemaClicked}
                data-testid="open-schema-export-button"
                size="xsmall"
                leftGlyph={<Icon glyph="Export" />}
              >
                Export Schema
              </Button>
            </div>
          )}
          <div
            className={schemaToolbarActionBarRightStyles}
            data-testid="schema-document-count"
          >
            <Body data-testid="schema-analysis-message">
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
        </div>
      )}
      {error?.errorType === 'GENERAL' && (
        <ErrorSummary
          data-testid="schema-toolbar-error-message"
          errors={[`${ERROR_WARNING}: ${error.errorMessage}`]}
          dismissible={true}
          onClose={onDismissError}
        />
      )}
      {error?.errorType === 'TIMEOUT' && (
        <WarningSummary
          data-testid="schema-toolbar-timeout-message"
          warnings={[INCREASE_MAX_TIME_MS_HINT_MESSAGE]}
          dismissible={true}
          onClose={onDismissError}
        />
      )}
      {error?.errorType === 'HIGH_COMPLEXITY' && (
        <Banner
          variant={BannerVariant.Danger}
          data-testid="schema-toolbar-complexity-abort-message"
          dismissible={true}
          onClose={onDismissError}
        >
          The analysis was aborted because the number of fields exceeds 1000.
          Consider breaking up your data into more collections with smaller
          documents, and using references to consolidate the data you
          need.&nbsp;
          <Link href="https://www.mongodb.com/docs/manual/data-modeling/design-antipatterns/bloated-documents/">
            Learn more
          </Link>
        </Banner>
      )}
      {analysisState === ANALYSIS_STATE_COMPLETE && isOutdated && (
        <WarningSummary warnings={[OUTDATED_WARNING_MESSAGE]} />
      )}
    </div>
  );
};

export { SchemaToolbar };
