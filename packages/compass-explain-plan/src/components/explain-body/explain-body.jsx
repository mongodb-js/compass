import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { ExplainSummary } from 'components/explain-summary';

import styles from './explain-body.less';

/**
 * Index types.
 */
const INDEX_TYPES = ['MULTIPLE', 'UNAVAILABLE', 'COLLSCAN', 'COVERED', 'INDEX'];

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
      viewType: PropTypes.string.isRequired
    }),
    openLink: PropTypes.func.isRequired,
    appRegistry: PropTypes.object
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
          openLink={this.props.openLink}
          appRegistry={this.props.appRegistry} />
      );
    }
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
      </div>
    );
  }
}

export default ExplainBody;
