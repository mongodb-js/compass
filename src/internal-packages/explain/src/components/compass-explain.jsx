const React = require('react');

const ExplainBody = require('./explain-body');
const ExplainHeader = require('./explain-header');

const ExplainActions = require('../actions');

// const debug = require('debug')('mongodb-compass:compass-explain');

/**
 * Structure of components (Jade notation)
 *
 * .compass-explain
 *   .explain-header
 *     .explain-summary
 *       .summary-stats (5x in FlexBox)
 *       .summary-index-stats (1x in FlexBox)
 *     .view-switcher
 *   .explain-body
 *     .explain-tree     (mutually exclusive with .explain-json)
 *       .explain-stage  (multiple)
 *     .explain-json     (mutually exclusive with .explain-tree)
 */

class CompassExplain extends React.Component {

  componentWillMount() {
    ExplainActions.fetchExplainPlan();
  }

  /**
   * Render Explain.
   *
   * @returns {React.Component} The Explain view.
   */
  render() {
    return (
      <div className="compass-explain">
        <ExplainHeader
          nReturned={this.props.nReturned}
          totalKeysExamined={this.props.totalKeysExamined}
          totalDocsExamined={this.props.totalDocsExamined}
          executionTimeMillis={this.props.executionTimeMillis}
          inMemorySort={this.props.inMemorySort}
          indexType={this.props.indexType}
          index={this.props.index}
          viewType={this.props.viewType}
        />
        <ExplainBody
          viewType={this.props.viewType}
          rawExplainObject={this.props.rawExplainObject}
        />
      </div>
    );
  }

}

CompassExplain.propTypes = {
  explainState: React.PropTypes.oneOf(['initial', 'fetching', 'done']),
  nReturned: React.PropTypes.number.isRequired,
  totalKeysExamined: React.PropTypes.number.isRequired,
  totalDocsExamined: React.PropTypes.number.isRequired,
  executionTimeMillis: React.PropTypes.number.isRequired,
  inMemorySort: React.PropTypes.bool.isRequired,
  indexType: React.PropTypes.string.isRequired,
  index: React.PropTypes.object,
  viewType: React.PropTypes.oneOf(['tree', 'json']),
  rawExplainObject: React.PropTypes.object.isRequired
};

CompassExplain.defaultProps = {
  explainState: 'initial',
  nReturned: 0,
  totalKeysExamined: 0,
  totalDocsExamined: 0,
  executionTimeMillis: 0,
  inMemorySort: false,
  indexType: '',
  index: {},
  viewType: 'tree',
  rawExplainObject: {}
};

CompassExplain.displayName = 'CompassExplain';

module.exports = CompassExplain;
