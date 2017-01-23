const React = require('react');
const app = require('ampersand-app');
const ExplainBody = require('./explain-body');
const ExplainHeader = require('./explain-header');

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
  + ' enter your query first before applying and viewing your explain plan.';

class CompassExplain extends React.Component {

  constructor(props) {
    super(props);
    this.statusRow = app.appRegistry.getComponent('App.StatusRow');
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
  }

  componentWillMount() {
    this.queryBar = app.appRegistry.getComponent('Query.QueryBar');
  }

  renderWarning(warning) {
    return (
      <this.statusRow style="warning">
        {warning}
      </this.statusRow>
    );
  }

  renderContent() {
    return (
      <div className="column-container">
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
    let content;
    let warning;

    if (this.CollectionStore.isReadonly()) {
      warning = this.renderWarning(READ_ONLY_WARNING);
    } else if (this.props.explainState === 'initial') {
      warning = this.renderWarning(COLLECTION_SCAN_WARNING);;
    } else {
      content = this.renderContent();
    }

    return (
      <div className="compass-explain">
        <div className="controls-container">
          <this.queryBar />
          {warning}
        </div>
        {content}
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
