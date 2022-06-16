import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Link,
} from '@mongodb-js/compass-components';
import { ZeroState, StatusRow, ViewSwitcher } from 'hadron-react-components';
import { ZeroGraphic } from '../zero-graphic';
import { ExplainBody } from '../explain-body';

import INDEX_TYPES from '../../constants/index-types';
import EXPLAIN_STATES from '../../constants/explain-states';
import EXPLAIN_VIEWS from '../../constants/explain-views';

import styles from './explain-states.module.less';
import { ExplainToolbar } from '../explain-toolbar/explain-toolbar';

/**
 * Readonly warning for the status row.
 */
const READ_ONLY_WARNING = 'Explain plans on readonly views are not supported.';

/**
 * Outdated warning for the status row.
 */
const OUTDATED_WARNING = `The explain content is outdated and no longer in sync
with the documents view. Press "Explain" again to see the explain plan for
the current query.`;

/**
 * Header for zero state.
 */
const HEADER = 'Evaluate the performance of your query';

/**
 * Additional text for zero state.
 */
const SUBTEXT =
  'Explain provides key execution metrics that help diagnose slow queries and optimize index usage.';

/**
 * Link to the explain plan documentation.
 */
const DOCUMENTATION_LINK =
  'https://docs.mongodb.com/compass/master/query-plan/';

/**
 * The ExplainStates component.
 */
class ExplainStates extends Component {
  static displayName = 'ExplainStatesComponent';

  static propTypes = {
    isEditable: PropTypes.bool.isRequired,
    explain: PropTypes.shape({
      nReturned: PropTypes.number.isRequired,
      totalKeysExamined: PropTypes.number.isRequired,
      totalDocsExamined: PropTypes.number.isRequired,
      executionTimeMillis: PropTypes.number.isRequired,
      inMemorySort: PropTypes.bool.isRequired,
      indexType: PropTypes.oneOf(INDEX_TYPES).isRequired,
      index: PropTypes.object,
      viewType: PropTypes.string.isRequired,
      originalExplainData: PropTypes.object.isRequired,
      explainState: PropTypes.string.isRequired,
      error: PropTypes.object,
      resultId: PropTypes.number.isRequired,
    }),
    exportToLanguage: PropTypes.func.isRequired,
    fetchExplainPlan: PropTypes.func.isRequired,
    changeExplainPlanState: PropTypes.func.isRequired,
    switchToTreeView: PropTypes.func.isRequired,
    switchToJSONView: PropTypes.func.isRequired,
    query: PropTypes.any,
    treeStages: PropTypes.object.isRequired,
    appRegistry: PropTypes.object.isRequired,
    queryExecuted: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    const appRegistry = props.appRegistry.localAppRegistry;
    this.queryBarRole = appRegistry.getRole('Query.QueryBar')[0];
    this.queryBar = this.queryBarRole.component;
    this.queryBarStore = appRegistry.getStore(this.queryBarRole.storeName);
    this.queryBarActions = appRegistry.getAction(this.queryBarRole.actionName);
  }

  componentDidUpdate() {
    this.props.queryExecuted();
  }

  /**
   * On view switch handler.
   *
   * @param {String} label - The label.
   */
  onViewSwitch(label) {
    if (label === 'Visual Tree') {
      this.props.switchToTreeView();
    } else if (label === 'Raw JSON') {
      this.props.switchToJSONView();
    }
  }

  /**
   * Executes the explain plan.
   */
  onExecuteExplainClicked() {
    this.props.changeExplainPlanState(EXPLAIN_STATES.EXECUTED);
    this.props.fetchExplainPlan(this.queryBarStore.state);
  }

  onExportToLanguageClicked() {
    this.props.exportToLanguage(this.queryBarStore.state);
  }

  /**
   * Checks if the zero state window should be displayed.
   *
   * @returns {Boolean}
   */
  checkIfZeroState() {
    return (
      this.props.explain.explainState === EXPLAIN_STATES.INITIAL ||
      !this.props.isEditable
    );
  }

  /**
   * Render banner with information.
   *
   * @returns {React.Component} The component.
   */
  renderBanner() {
    if (!this.props.isEditable) {
      return <StatusRow style="warning">{READ_ONLY_WARNING}</StatusRow>;
    }

    if (this.props.explain.explainState === EXPLAIN_STATES.OUTDATED) {
      return <StatusRow style="warning">{OUTDATED_WARNING}</StatusRow>;
    }

    if (this.props.explain.error) {
      return (
        <StatusRow style="error">{this.props.explain.error.message}</StatusRow>
      );
    }
  }

  /**
   * Render the schema validation component zero state.
   *
   * @returns {React.Component} The component.
   */
  renderZeroState() {
    if (this.checkIfZeroState()) {
      return (
        <div key="zero-state" className={styles['zero-state-container']}>
          <ZeroGraphic />
          <ZeroState header={HEADER} subtext={SUBTEXT}>
            <div>
              <Button
                onClick={this.onExecuteExplainClicked.bind(this)}
                disabled={!this.props.isEditable}
                data-test-id="execute-explain-button"
                variant={ButtonVariant.Primary}
                size={ButtonSize.Large}
              >
                Execute Explain
              </Button>
            </div>
            <Link
              className={styles['zero-state-link']}
              href={DOCUMENTATION_LINK}
              target="_blank"
            >
              Learn more about explain plans
            </Link>
          </ZeroState>
        </div>
      );
    }
  }

  /**
   * Render ExplainPlan component content.
   *
   * @returns {React.Component} The component.
   */
  renderContent() {
    if (!this.checkIfZeroState()) {
      return <ExplainBody key="explain-body" {...this.props} />;
    }
  }

  /**
   * Renders QueryBar component.
   *
   * @returns {React.Component} The component.
   */
  renderQueryBar() {
    return (
      <this.queryBar
        store={this.queryBarStore}
        actions={this.queryBarActions}
        buttonLabel="Explain"
        resultId={this.props.explain.resultId}
        onApply={this.onExecuteExplainClicked.bind(this)}
        onReset={this.onExecuteExplainClicked.bind(this)}
      />
    );
  }

  /**
   * Renders ViewSwitcher component.
   *
   * @returns {React.Component} The component.
   */
  renderViewSwitcher() {
    const activeViewTypeButton =
      this.props.explain.viewType === EXPLAIN_VIEWS.tree
        ? 'Visual Tree'
        : 'Raw JSON';

    return (
      <div className={styles['action-bar']}>
        <ViewSwitcher
          label="View Details As"
          dataTestId="explain-states"
          buttonLabels={['Visual Tree', 'Raw JSON']}
          activeButton={activeViewTypeButton}
          disabled={this.checkIfZeroState()}
          onClick={this.onViewSwitch.bind(this)}
        />
      </div>
    );
  }

  /**
   * Renders ExplainPlan component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const useNewToolbars = process?.env?.COMPASS_SHOW_NEW_TOOLBARS;
    return (
      <>
        {useNewToolbars ? (
          <ExplainToolbar
            explainErrorMessage={this.props.explain.error?.message}
            localAppRegistry={this.props.appRegistry.localAppRegistry}
            onExecuteExplainClicked={this.onExecuteExplainClicked.bind(this)}
            onExportToLanguageClicked={this.onExportToLanguageClicked.bind(
              this
            )}
            showOutdatedWarning={
              this.props.explain.explainState === EXPLAIN_STATES.OUTDATED
            }
            showReadonlyWarning={!this.props.isEditable}
            switchToTreeView={this.props.switchToTreeView}
            switchToJSONView={this.props.switchToJSONView}
            viewType={this.props.explain.viewType}
          />
        ) : (
          <div
            key="controls-container"
            className={styles['controls-container']}
          >
            {this.renderBanner()}
            {this.renderQueryBar()}
            {this.renderViewSwitcher()}
          </div>
        )}
        {this.renderZeroState()}
        {this.renderContent()}
      </>
    );
  }
}

export default ExplainStates;
