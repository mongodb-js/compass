import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FlexBox } from '../flex-box';
import { SummaryStat } from '../summary-stat';
import { SummaryIndexStat } from '../summary-index-stat';

import INDEX_TYPES from '../../constants/index-types';

import styles from './explain-summary.module.less';

import { KeylineCard, Subtitle } from '@mongodb-js/compass-components';

/**
 * The base url.
 */
const BASE_URL = 'https://docs.mongodb.com/master/reference/explain-results/';

/**
 * Help urls.
 */
const HELP_URLS = {
  NRETURNED: `${BASE_URL}#mongodb-data-explain.executionStats.nReturned`,
  KEYS_EXAMINED: `${BASE_URL}#mongodb-data-explain.executionStats.totalKeysExamined`,
  DOCS_EXAMINED: `${BASE_URL}#mongodb-data-explain.executionStats.totalDocsExamined`,
  EXECUTION_TIME: `${BASE_URL}#mongodb-data-explain.executionStats.executionTimeMillis`,
  SORT_STAGE: `${BASE_URL}#sort-stage`,
  INDEX_USED: `${BASE_URL}#collection-scan`,
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
  };

  /**
   * Renders ExplainSummary component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const inMemorySort = this.props.inMemorySort ? 'yes' : 'no';

    return (
      <KeylineCard>
        <div
          className={styles['explain-summary']}
          data-testid="explain-summary"
        >
          <Subtitle>Query Performance Summary</Subtitle>
          <FlexBox alignItems="flex-start">
            <div className={styles['summary-stats']}>
              <SummaryStat
                dataTestId="documents-returned-summary"
                dataLink={HELP_URLS.NRETURNED}
                label="Documents Returned:"
                value={this.props.nReturned}
              />
              <SummaryStat
                dataLink={HELP_URLS.KEYS_EXAMINED}
                label="Index Keys Examined:"
                value={this.props.totalKeysExamined}
              />
              <SummaryStat
                dataLink={HELP_URLS.DOCS_EXAMINED}
                label="Documents Examined:"
                value={this.props.totalDocsExamined}
              />
            </div>
            <div className={styles['summary-stats']}>
              <SummaryStat
                dataLink={HELP_URLS.EXECUTION_TIME}
                label="Actual Query Execution Time (ms):"
                value={this.props.executionTimeMillis}
              />
              <SummaryStat
                dataLink={HELP_URLS.SORT_STAGE}
                label="Sorted in Memory:"
                value={inMemorySort}
              />
              <SummaryIndexStat
                dataLink={HELP_URLS.INDEX_USED}
                indexType={this.props.indexType}
                index={this.props.index}
              />
            </div>
          </FlexBox>
        </div>
      </KeylineCard>
    );
  }
}

export default ExplainSummary;
