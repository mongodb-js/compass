import React, { Component } from 'react';
import { connect } from 'react-redux';
import { pick } from 'lodash';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ZeroState, StatusRow } from 'hadron-react-components';
import { TextButton } from 'hadron-react-buttons';
import { ZeroGraphic } from 'components/zero-graphic';
import { namespaceChanged } from 'modules/namespace';
import { openLink } from 'modules/link';
import { changeZeroState, zeroStateChanged } from 'modules/zero-state';

import styles from './explain-plan.less';

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

class ExplainPlan extends Component {
  static displayName = 'ExplainPlanComponent';

  static propTypes = {
    isZeroState: PropTypes.bool.isRequired,
    changeZeroState: PropTypes.func.isRequired,
    zeroStateChanged: PropTypes.func.isRequired,
    isEditable: PropTypes.bool.isRequired,
    openLink: PropTypes.func.isRequired
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
    if (this.props.isZeroState || !this.props.isEditable) {
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
    if (!this.props.isZeroState && this.props.isEditable) {
      return (
        <div className={classnames(styles['content-container'])}>
          ExplainPlan component content
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
      <div className={classnames(styles.root)}>
        {this.renderBanner()}
        {this.renderZeroState()}
        {this.renderContent()}
      </div>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => pick(
  state,
  [
    'serverVersion',
    'namespace',
    'isZeroState',
    'isEditable'
  ]
);

/**
 * Connect the redux store to the component (dispatch)
 */
const MappedExplainPlan = connect(
  mapStateToProps,
  {
    namespaceChanged,
    openLink,
    zeroStateChanged,
    changeZeroState
  },
)(ExplainPlan);

export default MappedExplainPlan;
export { ExplainPlan };
