const React = require('react');
const app = require('ampersand-app');
const ExplainBody = require('./explain-body');
const QueryActions = require('../actions');
const ExplainHeader = require('./explain-header');
const _ = require('lodash');
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

const READ_ONLY_WARNING = 'Explain plans on readonly views are not supported.';

const COLLECTION_SCAN_WARNING = 'To prevent unintended collection scans, please'
  + ' enter your query first, then press "Explain" to view the explain plan.';

const OUTDATED_WARNING = 'The explain content is outdated and no longer in sync'
  + ' with the query. Press "Explain" again to see the explain plan of the'
  + ' current query.';

class CompassExplain extends React.Component {

  constructor(props) {
    super(props);
    this.statusRow = app.appRegistry.getComponent('App.StatusRow');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
  }

  componentWillMount() {
    this.queryBar = app.appRegistry.getComponent('Query.QueryBar');
  }

  onApplyClicked() {
    QueryActions.fetchExplainPlan();
  }

  onResetClicked() {
    QueryActions.reset();
  }

  renderBanner() {
    let banner = null;
    if (this.CollectionStore.isReadonly()) {
      banner = <this.statusRow style="warning">{READ_ONLY_WARNING}</this.statusRow>;
    } else if (this.props.explainState === 'initial') {
      banner = <this.statusRow style="warning">{COLLECTION_SCAN_WARNING}</this.statusRow>;
    } else if (this.props.explainState === 'outdated') {
      banner = <this.statusRow style="warning">{OUTDATED_WARNING}</this.statusRow>;
    }
    return banner;
  }

  renderContent() {
    if (!_.includes(['done', 'outdated'], this.props.explainState)) {
      return null;
    }
    // if content is outdated, add extra space for the message
    let className = 'column-container with-refinebar';
    if (this.props.explainState === 'outdated') {
      className += '-and-message';
    }
    return (
      <div className={className}>
        <div className="column main">
          <ExplainHeader
            viewType={this.props.viewType}
            nReturned={this.props.nReturned}
            totalKeysExamined={this.props.totalKeysExamined}
            totalDocsExamined={this.props.totalDocsExamined}
            executionTimeMillis={this.props.executionTimeMillis}
            inMemorySort={this.props.inMemorySort}
            indexType={this.props.indexType}
            index={this.props.index}
          />
          <ExplainBody
            viewType={this.props.viewType}
            rawExplainObject={this.props.rawExplainObject}
          />
        </div>
      </div>
    );
  }

  /**
   * Render Explain.
   *
   * @returns {React.Component} The Explain view.
   */
  render() {
    return (
      <div className="compass-explain header-margin">
        <this.queryBar
          buttonLabel="Explain"
          onApply={this.onApplyClicked.bind(this)}
          onReset={this.onResetClicked.bind(this)}
        />
        {this.renderBanner()}
        {this.renderContent()}
      </div>
    );
  }
}

CompassExplain.propTypes = {
  explainState: React.PropTypes.oneOf(['initial', 'fetching', 'done', 'outdated']),
  nReturned: React.PropTypes.number.isRequired,
  totalKeysExamined: React.PropTypes.number.isRequired,
  totalDocsExamined: React.PropTypes.number.isRequired,
  executionTimeMillis: React.PropTypes.number.isRequired,
  inMemorySort: React.PropTypes.bool.isRequired,
  indexType: React.PropTypes.oneOf(['MULTIPLE', 'UNAVAILABLE', 'COLLSCAN',
    'COVERED', 'INDEX']).isRequired,
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
  indexType: 'UNAVAILABLE',
  index: null,
  viewType: 'tree',
  rawExplainObject: {}
};

CompassExplain.displayName = 'CompassExplain';

module.exports = CompassExplain;
