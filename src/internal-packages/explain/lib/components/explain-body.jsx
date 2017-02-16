const React = require('react');
const ExplainJSON = require('./explain-json');
const ExplainTree = require('./explain-tree');
const ExplainSummary = require('./explain-summary');

// const debug = require('debug')('mongodb-compass:explain:summary');


class ExplainBody extends React.Component {

  /**
   * Render Summary Component.
   *
   * @returns {React.Component} The Summary part of the explain view.
   */
  renderSummary() {
    return (
      <ExplainSummary
        nReturned={this.props.nReturned}
        totalKeysExamined={this.props.totalKeysExamined}
        totalDocsExamined={this.props.totalDocsExamined}
        executionTimeMillis={this.props.executionTimeMillis}
        inMemorySort={this.props.inMemorySort}
        indexType={this.props.indexType}
        index={this.props.index}
      />
    );
  }

  render() {
    let summary = null;
    if (this.props.viewType === 'json') {
      summary = null;
    } else {
      summary = this.renderSummary();
    }

    const DetailsViewClass = this.props.viewType === 'json' ? ExplainJSON : ExplainTree;
    const detailsView = <DetailsViewClass rawExplainObject={this.props.rawExplainObject} />;

    return (
      <div className="explain-body">
        {summary}
        {detailsView}
      </div>
    );
  }
}

ExplainBody.propTypes = {
  viewType: React.PropTypes.oneOf(['tree', 'json']),
  rawExplainObject: React.PropTypes.object.isRequired,
  nReturned: React.PropTypes.number.isRequired,
  totalKeysExamined: React.PropTypes.number.isRequired,
  totalDocsExamined: React.PropTypes.number.isRequired,
  executionTimeMillis: React.PropTypes.number.isRequired,
  inMemorySort: React.PropTypes.bool.isRequired,
  indexType: React.PropTypes.oneOf(['MULTIPLE', 'UNAVAILABLE', 'COLLSCAN',
    'COVERED', 'INDEX']).isRequired,
  index: React.PropTypes.object
};

ExplainBody.defaultProps = {
  nodes: [],
  links: [],
  width: 0,
  height: 0
};

ExplainBody.displayName = 'ExplainBody';

module.exports = ExplainBody;
