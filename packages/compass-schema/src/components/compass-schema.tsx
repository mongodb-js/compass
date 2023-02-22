import React, { useCallback, useEffect } from 'react';

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
} from '@mongodb-js/compass-components';

import { lighten, rgba } from 'polished';

const mcBlue0 = palette.blue.light1;
const mcBlue1 = lighten(0.075, mcBlue0);
const mcBlue2 = lighten(0.15, mcBlue0);
const mcBlue3 = lighten(0.225, mcBlue0);
const mcBlue4 = lighten(0.3, mcBlue0);
const mcBlue5 = lighten(0.375, mcBlue0);
const mcBg = palette.gray.light2;
const mcFg = mcBlue0;
const mcFgSelected = palette.yellow.base;
const mcFgUnselected = mcBg;

const rootStyles = css`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex-grow: 1;
  flex-shrink: 1;
`;

const loaderStyles = css`
  height: 100%;
  display: flex;
  justify-content: center;
`;

const schemaStyles = css`
  width: 100%;
  padding: 0 ${spacing[3]}px;
  flex-grow: 1;
  overflow: auto;
`;

const minichartStyles = (darkMode: boolean) => css`
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
    stroke: ${palette.white}
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
        stroke: ${darkMode ? palette.black : palette.white};
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
    stroke: ${palette.white}
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
.map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  float: left;
  svg {
    position: absolute;
    width: 100%;
    height: 100%;
  }
  nav {
    position: absolute;
    top: 40px;
    left: 20px;
    z-index: 1;
  }
  #circle {
    background-color: ${rgba(palette.gray.dark4, 0.1)};
    font-family: Helvetica, sans-serif;
    color: ${palette.blue.light1};
    padding: 5px 8px;
    border-radius: 3px;
    cursor: pointer;
    border: 1px solid ${palette.gray.dark4}
  }
  #circle.active {
    background-color: ${rgba(palette.white, 0.9)};
  }
}
.map:hover + .map-overlay {
  display: block;
}
.map-overlay {
  display: none;
  position: absolute;
  font-weight: bold;
  bottom: 20px;
  left: 25px;
  &-button {
    background-image: linear-gradient(
      -180deg,
      ${palette.white} 0%
      ${palette.gray.light3} 100%
    );
    border: 2px solid ${palette.gray.light2};
    box-shadow: inset 0 -1px 0 0 ${palette.gray.light2};
    border-radius: 5px;
    font-size: 11px;
    padding: 15px 4px;
    width: 80px;
    height: 35px;
    float: left;
  }
  &-text {
    float: left;
    margin-left: 5px;
    line-height: 35px;
  }
}
.schema-date-icon-svg {
  margin-left: -16px;
}
`;

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
          Learn more about schema analysis in Compass
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
  schema: any;
  analysisState: AnalysisState;
  actions: Record<string, any>;
  store: Record<string, any>;
}> = ({ schema, analysisState, actions, store }) => {
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
          <Field
            key={field.name}
            actions={actions}
            localAppRegistry={store.localAppRegistry}
            {...field}
          />
        ))}
      </div>
    </div>
  );
};

const Schema: React.FunctionComponent<{
  actions: Record<string, any>;
  store: Record<string, any>;
  analysisState: AnalysisState;
  outdated?: boolean;
  isActiveTab?: boolean;
  errorMessage?: string;
  maxTimeMS?: number;
  schema?: any;
  count?: number;
  resultId?: string;
}> = ({
  actions,
  store,
  analysisState,
  outdated,
  isActiveTab,
  errorMessage,
  schema,
  resultId,
}) => {
  const darkMode = useDarkMode();

  useEffect(() => {
    if (isActiveTab) {
      actions.resizeMiniCharts();
    }
  }, [isActiveTab, actions]);

  const onApplyClicked = useCallback(() => {
    actions.startAnalysis();
  }, [actions]);

  const onCancelClicked = useCallback(() => {
    actions.stopAnalysis();
  }, [actions]);

  const onResetClicked = useCallback(() => {
    actions.startAnalysis();
  }, [actions]);

  return (
    <div className={rootStyles}>
      <WorkspaceContainer
        toolbar={
          <SchemaToolbar
            localAppRegistry={store.localAppRegistry}
            onAnalyzeSchemaClicked={onApplyClicked}
            onResetClicked={onResetClicked}
            analysisState={analysisState}
            errorMessage={errorMessage || ''}
            isOutdated={!!outdated}
            sampleSize={schema ? schema.count : 0}
            schemaResultId={resultId || ''}
          />
        }
      >
        {analysisState === ANALYSIS_STATE_INITIAL && (
          <InitialScreen onApplyClicked={onApplyClicked} />
        )}
        {analysisState === ANALYSIS_STATE_ANALYZING && (
          <AnalyzingScreen onCancelClicked={onCancelClicked} />
        )}
        {analysisState === ANALYSIS_STATE_COMPLETE && (
          <div
            className={cx(
              schemaStyles,
              darkMode ? minichartStylesDark : minichartStylesLight
            )}
          >
            <div data-testid="schema-field-list">
              <FieldList
                schema={schema}
                analysisState={analysisState}
                actions={actions}
                store={store}
              />
            </div>
          </div>
        )}
      </WorkspaceContainer>
    </div>
  );
};

export default Schema;
