import React, { useCallback } from 'react';
import type { Schema as MongodbSchema } from 'mongodb-schema';
import { connect } from 'react-redux';
import type { AnalysisState } from '../constants/analysis-states';
import {
  ANALYSIS_STATE_INITIAL,
  ANALYSIS_STATE_ANALYZING,
  ANALYSIS_STATE_COMPLETE,
} from '../constants/analysis-states';

import { SchemaToolbar } from './schema-toolbar/schema-toolbar';
import Field from './field';
import { ZeroGraphic } from './zero-graphic';

import {
  Button,
  CancelLoader,
  css,
  cx,
  DocumentIcon,
  EmptyContent,
  Link,
  palette,
  spacing,
  useDarkMode,
  WorkspaceContainer,
  lighten,
  Banner,
  Body,
  Badge,
  Icon,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { getAtlasPerformanceAdvisorLink } from '../utils';
import { useIsLastAppliedQueryOutdated } from '@mongodb-js/compass-query-bar';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import type { RootState } from '../stores/store';
import { startAnalysis, stopAnalysis } from '../stores/schema-analysis-reducer';
import { openExportSchema } from '../stores/schema-export-reducer';
import ExportSchemaModal from './export-schema-modal';

const rootStyles = css({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  flexGrow: 1,
  flexShrink: 1,
});

const loaderStyles = css({
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
});

const schemaStyles = css({
  width: '100%',
  flexGrow: 1,
  overflow: 'auto',
});

const contentStyles = css({
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
  height: '100%',
});

const insightsBadgeStyles = css({
  verticalAlign: 'middle',
});

const minichartStyles = (darkMode: boolean) => {
  const mcBlue0 = palette.blue.light1;
  const mcBlue1 = lighten(0.075, mcBlue0);
  const mcBlue2 = lighten(0.15, mcBlue0);
  const mcBlue3 = lighten(0.225, mcBlue0);
  const mcBlue4 = lighten(0.3, mcBlue0);
  const mcBlue5 = lighten(0.375, mcBlue0);
  const mcBg = darkMode ? palette.gray.light1 : palette.gray.light2;
  const mcFg = mcBlue0;
  const mcFgSelected = palette.yellow.base;
  const mcFgUnselected = mcBg;
  const fewRectStroke = darkMode ? palette.black : palette.white;

  return css`
    div.minichart.unique {
      font-size: 12px;
      dl.dl-horizontal {
        margin-left: -32px;
        overflow: hidden;
        display: grid;
        grid-template-columns: 36px auto;
        grid-template-areas: 'sidebar content';
        dt {
          color: ${palette.gray.base};
        }
        dd {
          overflow: auto;
          max-height: 112px;
          ul li {
            margin: 5px;
            margin-top: 0;
            display: inline-block;
          }
        }
      }
    }
    .minichart-wrapper {
      svg.minichart {
        margin-left: -40px;
      }
    }
    .layer,
    .layer svg {
      position: absolute;
    }
    .layer svg.marker {
      width: 20px;
      height: 20px;
      circle {
        fill: ${mcFg};
        stroke: ${palette.white};
        stroke-width: 1.5px;
        &.selected {
          fill: ${mcFgSelected};
        }
      }
    }
    .layer svg.selection {
      visibility: hidden;
      circle {
        fill: ${mcFgSelected};
        fill-opacity: 0.2;
        stroke: ${mcFgSelected};
        stroke-width: 2px;
      }
    }
    svg.minichart {
      font-size: 10px;
      text {
        fill: ${palette.gray.base};
        font-weight: bold;
      }
      .glass {
        opacity: 0;
      }
      g.brush rect.extent {
        fill: ${mcFgSelected};
        fill-opacity: 0.2;
      }
      .hour,
      .weekday {
        .bar {
          cursor: default !important;
        }
      }
      .bar {
        shape-rendering: crispEdges;
        cursor: crosshair;
        rect.bg {
          fill: ${mcBg};
        }
        rect.fg {
          fill: ${mcFg};
          &.selected {
            fill: ${mcFgSelected};
          }
          &.half-selected {
            fill: ${mcFgSelected};
            mask: url(#mask-stripe);
          }
          &.unselected {
            fill: ${mcFgUnselected};
          }
        }
        &.few {
          rect {
            stroke: ${fewRectStroke};
            stroke-width: 2px;
          }
          rect.fg-0 {
            fill: ${mcBlue0};
          }
          rect.fg-1 {
            fill: ${mcBlue1};
          }
          rect.fg-2 {
            fill: ${mcBlue2};
          }
          rect.fg-3 {
            fill: ${mcBlue3};
          }
          rect.fg-4 {
            fill: ${mcBlue4};
          }
          rect.fg-5 {
            fill: ${mcBlue5};
          }
          rect.fg.selected {
            fill: ${mcFgSelected};
          }
          rect.fg.unselected {
            fill: ${mcFgUnselected};
          }
          text {
            fill: ${palette.white};
            font-size: 12px;
          }
        }
      }
      .line {
        stroke: ${mcFg};
        &.selected {
          stroke: ${mcFgSelected};
        }
      }
      .legend {
        text {
          fill: ${palette.gray.light1};
        }
        line {
          stroke: ${palette.gray.light2};
        }
        shape-rendering: crispEdges;
      }
      .axis path,
      .axis line {
        fill: none;
        stroke: ${palette.gray.light2};
        shape-rendering: crispEdges;
      }
      .circle {
        fill: ${mcFg};
        stroke: ${palette.white};
        stroke-width: 1.5px;
        &.selected {
          fill: ${mcFgSelected};
        }
      }
    }
    .tooltip-wrapper {
      line-height: 120%;
      max-width: 400px;
    }
  `;
};

const minichartStylesLight = minichartStyles(false);
const minichartStylesDark = minichartStyles(true);

const InitialScreen: React.FunctionComponent<{
  onApplyClicked: () => void;
}> = ({ onApplyClicked }) => {
  return (
    <EmptyContent
      icon={ZeroGraphic}
      title="Explore your schema"
      subTitle="Quickly visualize your schema to understand the frequency, types and ranges of fields in your data set."
      callToAction={
        <Button
          onClick={onApplyClicked}
          data-testid="analyze-schema-button"
          variant="primary"
          size="small"
        >
          Analyze Schema
        </Button>
      }
      callToActionLink={
        <Link
          href="https://docs.mongodb.com/compass/master/schema/"
          target="_blank"
        >
          Learn more about schema analysis
        </Link>
      }
    />
  );
};

const AnalyzingScreen: React.FunctionComponent<{
  onCancelClicked: () => void;
}> = ({ onCancelClicked }) => {
  return (
    <div className={loaderStyles}>
      <CancelLoader
        data-testid="analyzing-documents"
        progressText="Analyzing Documents"
        cancelText="Stop"
        onCancel={onCancelClicked}
      />
    </div>
  );
};

const FieldList: React.FunctionComponent<{
  schema: MongodbSchema | null;
  analysisState: AnalysisState;
}> = ({ schema, analysisState }) => {
  const darkMode = useDarkMode();

  if (analysisState !== ANALYSIS_STATE_COMPLETE) {
    return null;
  }

  const fields = schema?.fields ?? [];

  if (fields.length === 0) {
    return (
      <EmptyContent
        icon={DocumentIcon}
        title="No results"
        subTitle="Try modifying your query to get results."
      />
    );
  }

  return (
    <div
      className={cx(
        schemaStyles,
        darkMode ? minichartStylesDark : minichartStylesLight
      )}
    >
      <div data-testid="schema-field-list">
        {fields.map((field: any) => (
          <Field key={field.name} {...field} />
        ))}
      </div>
    </div>
  );
};

const nbsp = '\u00a0';
const title = 'Atlas’ Performance Advisor.';
const PerformanceAdvisorBanner = () => {
  const connectionInfo = useConnectionInfo();
  const track = useTelemetry();
  return (
    <Banner variant="info">
      <Body weight="medium">Looking for schema anti-patterns?</Body>
      In its place, you may refer to Data Explorer’s performance insights{' '}
      <Badge className={insightsBadgeStyles} variant="blue">
        <Icon glyph="Bulb" size="small" />
        Insight
      </Badge>
      {nbsp}or{nbsp}
      {connectionInfo.atlasMetadata ? (
        <Link
          href={getAtlasPerformanceAdvisorLink(connectionInfo.atlasMetadata)}
          onClick={() =>
            track('Performance Advisor Clicked', {}, connectionInfo)
          }
          hideExternalIcon
        >
          {title}
        </Link>
      ) : (
        title
      )}
    </Banner>
  );
};

const Schema: React.FunctionComponent<{
  analysisState: AnalysisState;
  errorMessage?: string;
  maxTimeMS?: number;
  schema: MongodbSchema | null;
  count?: number;
  resultId?: string;
  onExportSchemaClicked: () => void;
  onStartAnalysis: () => Promise<void>;
  onStopAnalysis: () => void;
}> = ({
  analysisState,
  errorMessage,
  schema,
  resultId,
  onExportSchemaClicked,
  onStartAnalysis,
  onStopAnalysis,
}) => {
  const onApplyClicked = useCallback(() => {
    void onStartAnalysis();
  }, [onStartAnalysis]);

  const outdated = useIsLastAppliedQueryOutdated('schema');

  const enablePerformanceAdvisorBanner = usePreference(
    'enablePerformanceAdvisorBanner'
  );

  const enableExportSchema = usePreference('enableExportSchema');

  return (
    <>
      <div className={rootStyles}>
        <WorkspaceContainer
          toolbar={
            <SchemaToolbar
              onAnalyzeSchemaClicked={onApplyClicked}
              onExportSchemaClicked={onExportSchemaClicked}
              onResetClicked={onApplyClicked}
              analysisState={analysisState}
              errorMessage={errorMessage || ''}
              isOutdated={!!outdated}
              sampleSize={schema ? schema.count : 0}
              schemaResultId={resultId || ''}
            />
          }
        >
          <div className={contentStyles}>
            {enablePerformanceAdvisorBanner && <PerformanceAdvisorBanner />}
            {analysisState === ANALYSIS_STATE_INITIAL && (
              <InitialScreen onApplyClicked={onApplyClicked} />
            )}
            {analysisState === ANALYSIS_STATE_ANALYZING && (
              <AnalyzingScreen onCancelClicked={onStopAnalysis} />
            )}
            {analysisState === ANALYSIS_STATE_COMPLETE && (
              <FieldList schema={schema} analysisState={analysisState} />
            )}
          </div>
        </WorkspaceContainer>
      </div>
      {enableExportSchema && <ExportSchemaModal />}
    </>
  );
};

export default connect(
  (state: RootState) => ({
    analysisState: state.schemaAnalysis.analysisState,
    errorMessage: state.schemaAnalysis.errorMessage,
    schema: state.schemaAnalysis.schema,
    resultId: state.schemaAnalysis.resultId,
  }),
  {
    onStartAnalysis: startAnalysis,
    onStopAnalysis: stopAnalysis,
    onExportSchemaClicked: openExportSchema,
  }
)(Schema);
