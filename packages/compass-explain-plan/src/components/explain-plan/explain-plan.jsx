import React, { Component } from 'react';
import { connect } from 'react-redux';
import { pick } from 'lodash';
import classnames from 'classnames';
import { namespaceChanged } from 'modules/namespace';
import { openLink } from 'modules/link';
import {
  switchToTreeView,
  switchToJSONView,
  fetchExplainPlan,
  changeExplainPlanState,
  explainStateChanged
} from 'modules/explain';
import ExplainStates from 'components/explain-states';
import { queryExecuted } from 'modules/query';

import styles from './explain-plan.less';

/**
 * The root ExplainPlan component.
 */
class ExplainPlan extends Component {
  static displayName = 'ExplainPlanComponent';

  /**
   * Renders ExplainPlan component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.root)}>
        <ExplainStates {...this.props} />
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
const mapStateToProps = (state) => pick(
  state,
  [
    'serverVersion',
    'namespace',
    'isEditable',
    'explain',
    'treeStages',
    'appRegistry'
  ]
);

/**
 * Connects the redux store to the component (dispatch)
 */
const MappedExplainPlan = connect(
  mapStateToProps,
  {
    namespaceChanged,
    openLink,
    switchToTreeView,
    switchToJSONView,
    fetchExplainPlan,
    changeExplainPlanState,
    explainStateChanged,
    queryExecuted
  },
)(ExplainPlan);

export default MappedExplainPlan;
export { ExplainPlan };
