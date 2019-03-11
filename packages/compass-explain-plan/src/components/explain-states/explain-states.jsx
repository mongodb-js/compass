import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ZeroState, StatusRow, ViewSwitcher } from 'hadron-react-components';
import { TextButton } from 'hadron-react-buttons';
import { ZeroGraphic } from 'components/zero-graphic';
import { ExplainBody } from 'components/explain-body';
import QueryBar from '@mongodb-js/compass-query-bar';

import INDEX_TYPES from 'constants/index-types';

import styles from './explain-states.less';

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
const SUBTEXT = 'Explain provides key execution metrics that help diagnose slow queries and optimize index usage.';

/**
 * Link to the explain plan documentation.
 */
const DOCUMENTATION_LINK = 'https://docs.mongodb.com/compass/master/query-plan/';

/**
 * The ExplainStates component.
 */
class ExplainStates extends Component {
  static displayName = 'ExplainStatesComponent';

  static propTypes = {
    isEditable: PropTypes.bool.isRequired,
    openLink: PropTypes.func.isRequired,
    explain: PropTypes.shape({
      nReturned: PropTypes.number.isRequired,
      totalKeysExamined: PropTypes.number.isRequired,
      totalDocsExamined: PropTypes.number.isRequired,
      executionTimeMillis: PropTypes.number.isRequired,
      inMemorySort: PropTypes.bool.isRequired,
      indexType: PropTypes.oneOf(INDEX_TYPES).isRequired,
      index: PropTypes.object,
      viewType: PropTypes.string.isRequired,
      rawExplainObject: PropTypes.object.isRequired,
      explainState: PropTypes.string.isRequired,
      error: PropTypes.object
    }),
    fetchExplainPlan: PropTypes.func.isRequired,
    changeExplainPlanState: PropTypes.func.isRequired,
    switchToTreeView: PropTypes.func.isRequired,
    switchToJSONView: PropTypes.func.isRequired,
    query: PropTypes.any
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
   * Checks if the zero state window should be displayed.
   *
   * @returns {Boolean}
   */
  checkIfZeroState() {
    return (this.props.explain.explainState === 'initial' || !this.props.isEditable);
  }

  /**
   * Opens the documentation.
   */
  openDocumentation() {
    this.props.openLink(DOCUMENTATION_LINK);
  }

  /**
   * Render banner with information.
   *
   * @returns {React.Component} The component.
   */
  renderBanner() {
    if (!this.props.isEditable) {
      return (<StatusRow style="warning">{READ_ONLY_WARNING}</StatusRow>);
    }

    if (this.props.explain.explainState === 'outdated') {
      return (<StatusRow style="warning">{OUTDATED_WARNING}</StatusRow>);
    }

    if (this.props.explain.error) {
      return (<StatusRow style="error">{this.props.explain.error.message}</StatusRow>);
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
        <div className={classnames(styles['zero-state-container'])}>
          <ZeroGraphic />
          <ZeroState header={HEADER} subtext={SUBTEXT}>
            <div className={classnames(styles['zero-state-action'])}>
              <div>
                <TextButton
                  className={`btn btn-primary btn-lg ${
                    !this.props.isEditable ? 'disabled' : ''
                  }`}
                  text="Execute Explain"
                  clickHandler={this.props.changeExplainPlanState.bind(this, 'fetching')} />
              </div>
              <a
                className={classnames(styles['zero-state-link'])}
                onClick={this.openDocumentation.bind(this)}
              >
                Learn more about explain plans
              </a>
            </div>
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
      return (
        <div className={classnames(styles['content-container'])}>
          <ExplainBody {...this.props} />
        </div>
      );
    }
  }

  /**
   * Renders QueryBar component.
   *
   * @returns {React.Component} The component.
   */
  renderQueryBar() {
    return (
      <QueryBar
        buttonLabel="Explain"
        onApply={this.props.changeExplainPlanState.bind(this, 'fetching')}
        onReset={this.props.changeExplainPlanState.bind(this, 'initial')}
      />
    );
  }

  /**
   * Renders ViewSwitcher component.
   *
   * @returns {React.Component} The component.
   */
  renderViewSwitcher() {
    const activeViewTypeButton = this.props.explain.viewType === 'tree'
      ? 'Visual Tree'
      : 'Raw JSON';

    return (
      <div className={classnames(styles['action-bar'])}>
        <ViewSwitcher
          label="View Details As"
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
    return (
      <div className={classnames(styles['explain-states'])}>
        <div className={classnames(styles['controls-container'])}>
          {this.renderBanner()}
          {this.renderQueryBar()}
          {this.renderViewSwitcher()}
        </div>
        {this.renderZeroState()}
        {this.renderContent()}
      </div>
    );
  }
}

export default ExplainStates;
