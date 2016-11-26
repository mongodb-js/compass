const React = require('react');
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

    return (
      <div className="explain-summary">
        <h3>Query Performance Summary</h3>
        <FlexBox alignItems="flex-start">
          <div className="summary-stats">
            <SummaryStat
              dataLink="nReturned"
              dataTestId="explain-returned-count"
              label="Documents Returned:"
              value={this.props.nReturned}
            />
            <SummaryStat
              dataLink="totalKeysExamined"
              dataTestId="explain-examined-keys-count"
              label="Index Keys Examined:"
              value={this.props.totalKeysExamined}
            />
            <SummaryStat
              dataLink="totalDocsExamined"
              dataTestId="explain-examined-count"
              label="Documents Examined:"
              value={this.props.totalDocsExamined}
            />
          </div>
          <div className="summary-stats">
            <SummaryStat
              dataLink="executionTimeMillis"
              label="Actual Query Execution Time (ms):"
              value={this.props.executionTimeMillis}
            />
            <SummaryStat
              dataLink="sortStage"
              label="Sorted in Memory:"
              value={inMemorySort}
            />
            <SummaryIndexStat
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
  nReturned: React.PropTypes.number.isRequired,
  totalKeysExamined: React.PropTypes.number.isRequired,
  totalDocsExamined: React.PropTypes.number.isRequired,
  executionTimeMillis: React.PropTypes.number.isRequired,
  inMemorySort: React.PropTypes.bool.isRequired,
  indexType: React.PropTypes.oneOf(['MULTIPLE', 'UNAVAILABLE', 'COLLSCAN',
    'COVERED', 'INDEX']).isRequired,
  index: React.PropTypes.object
};

ExplainSummary.displayName = 'ExplainSummary';

module.exports = ExplainSummary;
