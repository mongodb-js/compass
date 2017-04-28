const React = require('react');
const PropTypes = require('prop-types');
const SummaryStat = require('./summary-stat');
const SummaryIndexStat = require('./summary-index-stat');
const FlexBox = require('./shared/flexbox');

// const debug = require('debug')('mongodb-compass:explain:summary');


class ExplainSummary extends React.Component {

  /**
   * Render Summary Component.
   *
   * @returns {React.Component} The Summary part of the explain view.
   */
  render() {
    const inMemorySort = this.props.inMemorySort ? 'yes' : 'no';
    const BASE_URL = 'https://docs.mongodb.com/master/reference/explain-results/';

    const HELP_URLS = {
      NRETURNED: BASE_URL + '#explain.executionStats.nReturned',
      KEYS_EXAMINED: BASE_URL + '#explain.executionStats.totalKeysExamined',
      DOCS_EXAMINED: BASE_URL + '#explain.executionStats.totalDocsExamined',
      EXECUTION_TIME: BASE_URL + '#explain.executionStats.executionTimeMillis',
      SORT_STAGE: BASE_URL + '#sort-stage',
      INDEX_USED: BASE_URL + '#collection-scan-vs-index-use'
    };

    return (
      <div className="explain-summary">
        <h3>Query Performance Summary</h3>
        <FlexBox alignItems="flex-start">
          <div className="summary-stats">
            <SummaryStat
              dataLink={HELP_URLS.NRETURNED}
              dataTestId="explain-returned-count"
              label="Documents Returned:"
              value={this.props.nReturned}
            />
            <SummaryStat
              dataLink={HELP_URLS.KEYS_EXAMINED}
              dataTestId="explain-examined-keys-count"
              label="Index Keys Examined:"
              value={this.props.totalKeysExamined}
            />
            <SummaryStat
              dataLink={HELP_URLS.DOCS_EXAMINED}
              dataTestId="explain-examined-count"
              label="Documents Examined:"
              value={this.props.totalDocsExamined}
            />
          </div>
          <div className="summary-stats">
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
              dataTestId="explain-index-stats"
              indexType={this.props.indexType}
              index={this.props.index}
            />
          </div>
        </FlexBox>
      </div>
    );
  }
}

ExplainSummary.propTypes = {
  nReturned: PropTypes.number.isRequired,
  totalKeysExamined: PropTypes.number.isRequired,
  totalDocsExamined: PropTypes.number.isRequired,
  executionTimeMillis: PropTypes.number.isRequired,
  inMemorySort: PropTypes.bool.isRequired,
  indexType: PropTypes.oneOf(['MULTIPLE', 'UNAVAILABLE', 'COLLSCAN',
    'COVERED', 'INDEX']).isRequired,
  index: PropTypes.object
};

ExplainSummary.displayName = 'ExplainSummary';

module.exports = ExplainSummary;
