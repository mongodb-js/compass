import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { FlexBox } from 'components/flex-box';
import { SummaryStat } from 'components/summary-stat';
import { SummaryIndexStat } from 'components/summary-index-stat';

import INDEX_TYPES from 'constants/index-types';

import styles from './explain-summary.less';

/**
 * The base url.
 */
const BASE_URL = 'https://docs.mongodb.com/master/reference/explain-results/';

/**
 * Help urls.
 */
const HELP_URLS = {
  NRETURNED: `${BASE_URL}#explain.executionStats.nReturned`,
  KEYS_EXAMINED: `${BASE_URL}#explain.executionStats.totalKeysExamined`,
  DOCS_EXAMINED: `${BASE_URL}#explain.executionStats.totalDocsExamined`,
  EXECUTION_TIME: `${BASE_URL}#explain.executionStats.executionTimeMillis`,
  SORT_STAGE: `${BASE_URL}#sort-stage`,
  INDEX_USED: `${BASE_URL}#collection-scan-vs-index-use`
};

/**
 * The ExplainSummary component.
 */
class ExplainSummary extends Component {
  static displayName = 'ExplainSummaryComponent';

  static propTypes = {
    nReturned: PropTypes.number.isRequired,
    totalKeysExamined: PropTypes.number.isRequired,
    totalDocsExamined: PropTypes.number.isRequired,
    executionTimeMillis: PropTypes.number.isRequired,
    inMemorySort: PropTypes.bool.isRequired,
    indexType: PropTypes.oneOf(INDEX_TYPES).isRequired,
    index: PropTypes.object,
    openLink: PropTypes.func.isRequired
  }

  /**
   * Renders ExplainSummary component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const inMemorySort = this.props.inMemorySort ? 'yes' : 'no';

    return (
      <div className={classnames(styles['explain-summary'])}>
        <h3>Query Performance Summary</h3>
        <FlexBox alignItems="flex-start">
          <div className={classnames(styles['summary-stats'])}>
            <SummaryStat
              dataLink={HELP_URLS.NRETURNED}
              label="Documents Returned:"
              value={this.props.nReturned}
              openLink={this.props.openLink} />
            <SummaryStat
              dataLink={HELP_URLS.KEYS_EXAMINED}
              label="Index Keys Examined:"
              value={this.props.totalKeysExamined}
              openLink={this.props.openLink} />
            <SummaryStat
              dataLink={HELP_URLS.DOCS_EXAMINED}
              label="Documents Examined:"
              value={this.props.totalDocsExamined}
              openLink={this.props.openLink} />
          </div>
          <div className={classnames(styles['summary-stats'])}>
            <SummaryStat
              dataLink={HELP_URLS.EXECUTION_TIME}
              label="Actual Query Execution Time (ms):"
              value={this.props.executionTimeMillis}
              openLink={this.props.openLink} />
            <SummaryStat
              dataLink={HELP_URLS.SORT_STAGE}
              label="Sorted in Memory:"
              value={inMemorySort}
              openLink={this.props.openLink} />
            <SummaryIndexStat
              dataLink={HELP_URLS.INDEX_USED}
              indexType={this.props.indexType}
              index={this.props.index}
              openLink={this.props.openLink} />
          </div>
        </FlexBox>
      </div>
    );
  }
}

export default ExplainSummary;
