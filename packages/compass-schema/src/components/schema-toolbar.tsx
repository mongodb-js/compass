import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import {
  Body,
  Button,
  ErrorSummary,
  Icon,
  Link,
  Tooltip,
  WarningSummary,
  css,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { AnalysisState } from '../constants/analysis-states';
import { ANALYSIS_STATE_COMPLETE } from '../constants/analysis-states';
import { QueryBar } from '@mongodb-js/compass-query-bar';
import {
  type SchemaAnalysisError,
  analysisErrorDismissed,
} from '../stores/schema-analysis-reducer';
import type { RootState } from '../stores/store';
import { openExportSchema } from '../stores/schema-export-reducer';

const schemaToolbarStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[400],
  padding: spacing[400],
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
  gap: spacing[200],
  paddingLeft: spacing[200],
});

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
  setShowLegacyExportTooltip: (show: boolean) => void;
  showLegacyExportTooltip: boolean;
};

export const SchemaToolbar: React.FunctionComponent<SchemaToolbarProps> = ({
  analysisState,
  error,
  onDismissError,
  isOutdated,
  onAnalyzeSchemaClicked,
  onExportSchemaClicked,
  onResetClicked,
  sampleSize,
  schemaResultId,
  setShowLegacyExportTooltip,
  showLegacyExportTooltip,
}) => {
  const t = useTranslation();
  const documentsNoun = useMemo(
    () =>
      sampleSize === 1
        ? t('schema.toolbar.documentOne', 'document')
        : t('schema.toolbar.documentOther', 'documents'),
    [sampleSize, t]
  );

  return (
    <div className={schemaToolbarStyles}>
      <div className={schemaQueryBarStyles}>
        <QueryBar
          source="schema"
          buttonLabel={t('schema.toolbar.analyze', 'Analyze')}
          resultId={schemaResultId}
          onApply={onAnalyzeSchemaClicked}
          onReset={onResetClicked}
        />
      </div>
      {analysisState === ANALYSIS_STATE_COMPLETE && !isOutdated && (
        <div className={schemaToolbarActionBarStyles}>
          {ANALYSIS_STATE_COMPLETE && (
            <div>
              <Tooltip
                id="export-schema-tooltip"
                open={showLegacyExportTooltip}
                onClose={() => setShowLegacyExportTooltip(false)}
                triggerEvent="click"
                trigger={
                  <Button
                    variant="default"
                    onClick={onExportSchemaClicked}
                    data-testid="open-schema-export-button"
                    size="xsmall"
                    leftGlyph={<Icon glyph="Export" />}
                  >
                    {t('schema.toolbar.exportSchema', 'Export Schema')}
                  </Button>
                }
              >
                {t(
                  'schema.toolbar.exportTooltip',
                  "Next time, export the schema directly from Compass' Schema tab."
                )}
              </Tooltip>
            </div>
          )}
          <div
            className={schemaToolbarActionBarRightStyles}
            data-testid="schema-document-count"
          >
            <Body data-testid="schema-analysis-message">
              {t(
                'schema.toolbar.sampleBefore',
                'This report is based on a sample of'
              )}
              &nbsp;<b>{sampleSize}</b>&nbsp;
              {documentsNoun}.
            </Body>
            <Link
              aria-label={t(
                'schema.toolbar.samplingDocsAriaLabel',
                'Schema sampling documentation'
              )}
              href={SCHEMA_ANALYSIS_DOCS_LINK}
              target="_blank"
            >
              {t('schema.toolbar.learnMore', 'Learn more')}
            </Link>
          </div>
        </div>
      )}
      {error?.errorType === 'general' && (
        <ErrorSummary
          data-testid="schema-toolbar-error-message"
          errors={[
            `${t(
              'schema.toolbar.analysisError',
              'An error occurred during schema analysis'
            )}: ${error.errorMessage}`,
          ]}
          dismissible={true}
          onClose={onDismissError}
        />
      )}
      {error?.errorType === 'timeout' && (
        <WarningSummary
          data-testid="schema-toolbar-timeout-message"
          warnings={[
            t(
              'schema.toolbar.timeoutHint',
              'Operation exceeded time limit. Please try increasing the maxTimeMS for the query in the filter options.'
            ),
          ]}
          dismissible={true}
          onClose={onDismissError}
        />
      )}
      {analysisState === ANALYSIS_STATE_COMPLETE && isOutdated && (
        <WarningSummary
          warnings={[
            t(
              'schema.toolbar.outdated',
              'The schema content is outdated and no longer in sync with the documents view. Press "Analyze" again to see the schema for the current query.'
            ),
          ]}
        />
      )}
    </div>
  );
};

export default connect(
  (state: RootState) => ({
    analysisState: state.schemaAnalysis.analysisState,
    error: state.schemaAnalysis.error,
    sampleSize: state.schemaAnalysis.schema?.count ?? 0,
    schemaResultId: state.schemaAnalysis.resultId ?? '',
  }),
  {
    onExportSchemaClicked: openExportSchema,
    onDismissError: analysisErrorDismissed,
  }
)(SchemaToolbar);
