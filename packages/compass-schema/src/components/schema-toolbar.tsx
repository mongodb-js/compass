import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  BannerVariant,
  Body,
  Button,
  ErrorSummary,
  Icon,
  Link,
  Tooltip,
  WarningSummary,
  aiIconColor,
  aiIconGlyph,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import type { AnalysisState } from '../constants/analysis-states';
import { ANALYSIS_STATE_COMPLETE } from '../constants/analysis-states';
import { QueryBar } from '@mongodb-js/compass-query-bar';
import {
  type SchemaAnalysisError,
  analysisErrorDismissed,
} from '../stores/schema-analysis-reducer';
import {
  DISTINCT_FIELDS_ABORT_THRESHOLD,
  openSchemaInChat,
} from '../modules/schema-analysis';
import type { RootState } from '../stores/store';
import { openExportSchema } from '../stores/schema-export-reducer';

const schemaToolbarStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[400],
  padding: spacing[400],
});

const openInChatStyles = css({
  marginLeft: spacing[200],
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
  setShowLegacyExportTooltip: (show: boolean) => void;
  showLegacyExportTooltip: boolean;
  onOpenSchemaInChat: () => void;
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
  onOpenSchemaInChat,
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
                    Export Schema
                  </Button>
                }
              >
                Next time, export the schema directly from Compass&apos; Schema
                tab.
              </Tooltip>
              <Button
                className={openInChatStyles}
                variant="default"
                onClick={onOpenSchemaInChat}
                // data-testid="open-schema-export-button"
                size="xsmall"
                leftGlyph={<Icon color={aiIconColor} glyph={aiIconGlyph} />}
              >
                Open in Chat
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
      {error?.errorType === 'general' && (
        <ErrorSummary
          data-testid="schema-toolbar-error-message"
          errors={[`${ERROR_WARNING}: ${error.errorMessage}`]}
          dismissible={true}
          onClose={onDismissError}
        />
      )}
      {error?.errorType === 'timeout' && (
        <WarningSummary
          data-testid="schema-toolbar-timeout-message"
          warnings={[INCREASE_MAX_TIME_MS_HINT_MESSAGE]}
          dismissible={true}
          onClose={onDismissError}
        />
      )}
      {error?.errorType === 'highComplexity' && (
        <Banner
          variant={BannerVariant.Danger}
          data-testid="schema-toolbar-complexity-abort-message"
          dismissible={true}
          onClose={onDismissError}
        >
          The analysis was aborted because the number of fields exceeds{' '}
          {DISTINCT_FIELDS_ABORT_THRESHOLD}. Consider breaking up your data into
          more collections with smaller documents, and using references to
          consolidate the data you need.&nbsp;
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
    onOpenSchemaInChat: openSchemaInChat,
  }
)(SchemaToolbar);
