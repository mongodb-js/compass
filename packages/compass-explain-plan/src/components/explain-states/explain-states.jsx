import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ZeroState, StatusRow } from 'hadron-react-components';
import { TextButton } from 'hadron-react-buttons';
import { ZeroGraphic } from 'components/zero-graphic';
import { ExplainBody } from 'components/explain-body';

import styles from './explain-states.less';

/**
 * Warning for the status row.
 */
const READ_ONLY_WARNING = 'Explain plans on readonly views are not supported.';

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
    isZeroState: PropTypes.bool.isRequired,
    changeZeroState: PropTypes.func.isRequired,
    zeroStateChanged: PropTypes.func.isRequired,
    isEditable: PropTypes.bool.isRequired,
    openLink: PropTypes.func.isRequired
  }

  /**
   * Checks if the zero state window should be displayed.
   *
   * @returns {Boolean}
   */
  checkIfZeroState() {
    return (this.props.isZeroState || !this.props.isEditable);
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
                  clickHandler={this.props.changeZeroState} />
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
   * Render ExplainPlan component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['explain-states'])}>
        {this.renderBanner()}
        {this.renderZeroState()}
        {this.renderContent()}
      </div>
    );
  }
}

export default ExplainStates;
