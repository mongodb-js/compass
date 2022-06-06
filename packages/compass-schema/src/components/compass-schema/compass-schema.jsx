/* eslint react/no-multi-comp:0 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StatusRow, ZeroState } from 'hadron-react-components';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  CancelLoader,
  Link,
} from '@mongodb-js/compass-components';
import Field from '../field';
import AnalysisCompleteMessage from '../analysis-complete-message';
import ZeroGraphic from '../zero-graphic';
import get from 'lodash.get';

import styles from './compass-schema.module.less';
import {
  ANALYSIS_STATE_INITIAL,
  ANALYSIS_STATE_ANALYZING,
  ANALYSIS_STATE_ERROR,
  ANALYSIS_STATE_COMPLETE,
  ANALYSIS_STATE_TIMEOUT,
} from '../../constants/analysis-states';
import { SchemaToolbar } from '../schema-toolbar/schema-toolbar';

const ERROR_WARNING = 'An error occurred during schema analysis';
const OUTDATED_WARNING =
  'The schema content is outdated and no longer in sync' +
  ' with the documents view. Press "Analyze" again to see the schema for the' +
  ' current query.';

const INCREASE_MAX_TIME_MS_HINT =
  'Operation exceeded time limit. Please try increasing the maxTimeMS for the query in the filter options.';

const HEADER = 'Explore your schema';

const SUBTEXT =
  'Quickly visualize your schema to understand the frequency, types and ranges of' +
  '\xa0fields in your data set.';

const DOCUMENTATION_LINK = 'https://docs.mongodb.com/compass/master/schema/';

/**
 * Component for the entire schema view component.
 */
class Schema extends Component {
  static displayName = 'SchemaComponent';

  static propTypes = {
    actions: PropTypes.object,
    store: PropTypes.object.isRequired,
    analysisState: PropTypes.oneOf([
      ANALYSIS_STATE_INITIAL,
      ANALYSIS_STATE_ANALYZING,
      ANALYSIS_STATE_ERROR,
      ANALYSIS_STATE_COMPLETE,
      ANALYSIS_STATE_TIMEOUT,
    ]),
    outdated: PropTypes.bool,
    isActiveTab: PropTypes.bool,
    errorMessage: PropTypes.string,
    maxTimeMS: PropTypes.number,
    schema: PropTypes.any,
    count: PropTypes.number,
    resultId: PropTypes.number,
  };

  constructor(props) {
    super(props);
    const appRegistry = props.store.localAppRegistry;
    this.queryBarRole = appRegistry.getRole('Query.QueryBar')[0];
    this.queryBar = this.queryBarRole.component;
    this.queryBarStore = appRegistry.getStore(this.queryBarRole.storeName);
    this.queryBarActions = appRegistry.getAction(this.queryBarRole.actionName);
  }

  componentDidUpdate(prevProps) {
    // when the namespace changes and the schema tab is not active, the
    // tab is "display:none" and its width 0. That also means the the minichart
    // auto-sizes to 0. Therefore, when the user switches back to the tab,
    // making it "display:block" again and giving it a proper non-zero size,
    // the minicharts have to be re-rendered.
    //
    if (
      prevProps.isActiveTab !== this.props.isActiveTab &&
      this.props.isActiveTab
    ) {
      this.props.actions.resizeMiniCharts();
    }
  }

  onApplyClicked() {
    this.props.actions.startAnalysis();
  }

  onCancelClicked() {
    this.props.actions.stopAnalysis();
  }

  onResetClicked() {
    this.props.actions.startAnalysis();
  }

  renderBanner() {
    const analysisState = this.props.analysisState;

    if (analysisState === ANALYSIS_STATE_ERROR) {
      return (
        <StatusRow style="error">
          {ERROR_WARNING}: {this.props.errorMessage}
        </StatusRow>
      );
    }

    if (analysisState === ANALYSIS_STATE_TIMEOUT) {
      return <StatusRow style="warning">{INCREASE_MAX_TIME_MS_HINT}</StatusRow>;
    }

    if (analysisState === ANALYSIS_STATE_COMPLETE) {
      return this.props.outdated ? (
        <StatusRow style="warning">{OUTDATED_WARNING}</StatusRow>
      ) : (
        <AnalysisCompleteMessage
          sampleSize={this.props.schema ? this.props.schema.count : 0}
        />
      );
    }

    return null;
  }

  renderFieldList() {
    if (this.props.analysisState !== ANALYSIS_STATE_COMPLETE) {
      return;
    }

    return get(this.props.schema, 'fields', []).map((field) => {
      return (
        <Field
          key={field.name}
          actions={this.props.actions}
          localAppRegistry={this.props.store.localAppRegistry}
          {...field}
        />
      );
    });
  }

  renderInitialScreen() {
    return (
      <div className={styles['schema-zero-state']}>
        <ZeroGraphic />
        <ZeroState header={HEADER} subtext={SUBTEXT}>
          <div>
            <Button
              onClick={this.onApplyClicked.bind(this)}
              data-test-id="analyze-schema-button"
              variant={ButtonVariant.Primary}
              size={ButtonSize.Large}
            >
              Analyze Schema
            </Button>
          </div>
          <Link
            className={styles['schema-zero-state-link']}
            href={DOCUMENTATION_LINK}
            target="_blank"
          >
            Learn more about schema analysis in Compass
          </Link>
        </ZeroState>
      </div>
    );
  }

  renderAnalyzing() {
    return (
      <div className={styles.loader}>
        <CancelLoader
          data-testid="analyzing-documents"
          progressText="Analyzing Documents"
          cancelText="Stop"
          onCancel={this.onCancelClicked.bind(this)}
        />
      </div>
    );
  }

  /**
   * Renders the zero state during the initial state; renders the schema if not.
   * @returns {React.Component} Zero state or fields.
   */
  renderContent() {
    if (this.props.analysisState === ANALYSIS_STATE_INITIAL) {
      return this.renderInitialScreen();
    }

    if (this.props.analysisState === ANALYSIS_STATE_ANALYZING) {
      return this.renderAnalyzing();
    }

    return <div className="schema-field-list">{this.renderFieldList()}</div>;
  }

  /**
   * Render the schema
   *
   * @returns {React.Component} The schema view.
   */
  render() {
    const useNewToolbar = process?.env?.COMPASS_SHOW_NEW_TOOLBARS === 'true';

    return (
      <div className={styles.root}>
        {useNewToolbar ? (
          <SchemaToolbar
            globalAppRegistry={this.props.store.globalAppRegistry}
            localAppRegistry={this.props.store.localAppRegistry}
            onAnalyzeSchemaClicked={this.onApplyClicked.bind(this)}
            onResetClicked={this.onResetClicked.bind(this)}
            analysisState={this.props.analysisState}
            errorMessage={this.props.errorMessage}
            isOutdated={this.props.outdated}
            sampleSize={this.props.schema ? this.props.schema.count : 0}
            schemaResultId={this.props.resultId}
          />
        ) : (
          <div className="controls-container">
            <this.queryBar
              store={this.queryBarStore}
              actions={this.queryBarActions}
              buttonLabel="Analyze"
              resultId={this.props.resultId}
              onApply={this.onApplyClicked.bind(this)}
              onReset={this.onResetClicked.bind(this)}
            />
            {this.renderBanner()}
          </div>
        )}
        <div className={styles.schema}>{this.renderContent()}</div>
      </div>
    );
  }
}

export default Schema;
