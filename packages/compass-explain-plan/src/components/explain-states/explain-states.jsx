import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  ButtonVariant,
  EmptyContent,
  Link,
  WorkspaceContainer,
} from '@mongodb-js/compass-components';
import { ZeroGraphic } from '../zero-graphic';
import { ExplainBody } from '../explain-body';

import INDEX_TYPES from '../../constants/index-types';
import EXPLAIN_STATES from '../../constants/explain-states';

import { ExplainToolbar } from '../explain-toolbar/explain-toolbar';

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
    this.queryBarStore = appRegistry.getStore(this.queryBarRole.storeName);
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
    if (!this.checkIfZeroState()) {
      return null;
    }

    return (
      <EmptyContent
        icon={ZeroGraphic}
        title="Evaluate the performance of your query"
        subTitle="Explain provides key execution metrics that help diagnose slow queries and optimize index usage."
        callToAction={
          <Button
            onClick={this.onExecuteExplainClicked.bind(this)}
            disabled={!this.props.isEditable}
            data-testid="execute-explain-button"
            variant={ButtonVariant.Primary}
            size="small"
          >
            Execute Explain
          </Button>
        }
        callToActionLink={
          <Link href={DOCUMENTATION_LINK} target="_blank">
            Learn more about explain plans
          </Link>
        }
      />
    );
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
      <WorkspaceContainer
        toolbar={
          <ExplainToolbar
            explainErrorMessage={this.props.explain.error?.message}
            localAppRegistry={this.props.appRegistry.localAppRegistry}
            onExecuteExplainClicked={this.onExecuteExplainClicked.bind(this)}
            showOutdatedWarning={
              this.props.explain.explainState === EXPLAIN_STATES.OUTDATED
            }
            resultId={this.props.explain.resultId}
            hasExplainResults={!this.checkIfZeroState()}
            showReadonlyWarning={!this.props.isEditable}
            switchToTreeView={this.props.switchToTreeView}
            switchToJSONView={this.props.switchToJSONView}
            viewType={this.props.explain.viewType}
          />
        }
      >
        {this.renderZeroState()}
        {this.renderContent()}
      </WorkspaceContainer>
    );
  }
}

export default ExplainStates;
