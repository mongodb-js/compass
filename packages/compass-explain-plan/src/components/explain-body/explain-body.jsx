import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { ExplainSummary } from 'components/explain-summary';
import { ExplainJSON } from 'components/explain-json';
import { ExplainTree } from 'components/explain-tree';

import INDEX_TYPES from 'constants/index-types';

import styles from './explain-body.less';

/**
 * The ExplainBody component.
 */
class ExplainBody extends Component {
  static displayName = 'ExplainBodyComponent';

  static propTypes = {
    explain: PropTypes.shape({
      nReturned: PropTypes.number.isRequired,
      totalKeysExamined: PropTypes.number.isRequired,
      totalDocsExamined: PropTypes.number.isRequired,
      executionTimeMillis: PropTypes.number.isRequired,
      inMemorySort: PropTypes.bool.isRequired,
      indexType: PropTypes.oneOf(INDEX_TYPES).isRequired,
      index: PropTypes.object,
      viewType: PropTypes.string.isRequired,
      rawExplainObject: PropTypes.object.isRequired
    }),
    openLink: PropTypes.func.isRequired,
    treeStages: PropTypes.object.isRequired
  }

  /**
   * Renders ExplainSummary Component.
   *
   * @returns {React.Component} The Summary part of the explain view.
   */
  renderSummary() {
    if (this.props.explain.viewType !== 'json') {
      return (
        <ExplainSummary
          {...this.props.explain}
          openLink={this.props.openLink} />
      );
    }
  }

  /**
   * Renders DetailsView Component.
   *
   * @returns {React.Component} The details view part of the explain view.
   */
  renderDetailsView() {
    if (this.props.explain.viewType === 'json') {
      return (
        <ExplainJSON rawExplainObject={this.props.explain.rawExplainObject} />
      );
    }

    return (
      <ExplainTree {...this.props.treeStages} />
    );
  }

  /**
   * Renders ExplainBody component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['explain-body'])}>
        {this.renderSummary()}
        {this.renderDetailsView()}
      </div>
    );
  }
}

export default ExplainBody;
