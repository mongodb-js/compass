import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Link,
} from '@mongodb-js/compass-components';
import { ZeroState } from 'hadron-react-components';
import { ZeroGraphic } from '../zero-graphic';
import { ExplainBody } from '../explain-body';

import INDEX_TYPES from '../../constants/index-types';
import EXPLAIN_STATES from '../../constants/explain-states';

import styles from './explain-states.module.less';
import { ExplainToolbar } from '../explain-toolbar/explain-toolbar';

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
   * Renders ExplainPlan component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <>
        <ExplainToolbar
          explainErrorMessage={this.props.explain.error?.message}
          localAppRegistry={this.props.appRegistry.localAppRegistry}
          onExecuteExplainClicked={this.onExecuteExplainClicked.bind(this)}
          onExportToLanguageClicked={this.onExportToLanguageClicked.bind(this)}
          showOutdatedWarning={
            this.props.explain.explainState === EXPLAIN_STATES.OUTDATED
          }
          showReadonlyWarning={!this.props.isEditable}
          switchToTreeView={this.props.switchToTreeView}
          switchToJSONView={this.props.switchToJSONView}
          viewType={this.props.explain.viewType}
        />
        {this.renderZeroState()}
        {this.renderContent()}
      </>
    );
  }
}

export default ExplainStates;
