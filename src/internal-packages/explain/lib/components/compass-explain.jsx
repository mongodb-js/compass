const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const { StatusRow } = require('hadron-react-components');
const ExplainBody = require('./explain-body');
const ViewSwitcher = require('./shared/view-switcher');
const ExplainActions = require('../actions');

const READ_ONLY_WARNING = 'Explain plans on readonly views are not supported.';

const COLLECTION_SCAN_WARNING = 'To prevent unintended collection scans, please'
  + ' enter your query first before applying and viewing your explain plan.';

class CompassExplain extends React.Component {

  constructor(props) {
    super(props);
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
  }

  componentWillMount() {
    this.queryBar = app.appRegistry.getComponent('Query.QueryBar');
  }

  onViewSwitch(label) {
    if (label === 'Visual Tree') {
      ExplainActions.switchToTreeView();
    } else if (label === 'Raw JSON') {
      ExplainActions.switchToJSONView();
    }
  }

  renderWarning(warning) {
    return (
      <StatusRow style="warning">
        {warning}
      </StatusRow>
    );
  }

  renderContent() {
    return (
      <div className="column-container">
        <div className="column main">
          <ExplainBody
            viewType={this.props.viewType}
            rawExplainObject={this.props.rawExplainObject}
            nReturned={this.props.nReturned}
            totalKeysExamined={this.props.totalKeysExamined}
            totalDocsExamined={this.props.totalDocsExamined}
            executionTimeMillis={this.props.executionTimeMillis}
            inMemorySort={this.props.inMemorySort}
            indexType={this.props.indexType}
            index={this.props.index}
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
    let content = null;
    let warning = null;
    let isDisabled = true;

    if (this.CollectionStore.isReadonly()) {
      warning = this.renderWarning(READ_ONLY_WARNING);
    } else if (this.props.explainState === 'initial') {
      warning = this.renderWarning(COLLECTION_SCAN_WARNING);
    } else {
      content = this.renderContent();
      isDisabled = false;
    }

    const activeViewTypeButton = this.props.viewType === 'tree' ?
      'Visual Tree' : 'Raw JSON';

    return (
      <div className="compass-explain">
        <div className="controls-container">
          <this.queryBar />
          <div className="action-bar">
            <ViewSwitcher
              label="View Details As"
              buttonLabels={['Visual Tree', 'Raw JSON']}
              activeButton={activeViewTypeButton}
              disabled={isDisabled}
              dataTestId="explain-view"
              onClick={this.onViewSwitch}
            />
          </div>
          {warning}
        </div>
        {content}
      </div>
    );
  }
}

CompassExplain.propTypes = {
  explainState: PropTypes.oneOf(['initial', 'fetching', 'done']),
  nReturned: PropTypes.number.isRequired,
  totalKeysExamined: PropTypes.number.isRequired,
  totalDocsExamined: PropTypes.number.isRequired,
  executionTimeMillis: PropTypes.number.isRequired,
  inMemorySort: PropTypes.bool.isRequired,
  indexType: PropTypes.oneOf(['MULTIPLE', 'UNAVAILABLE', 'COLLSCAN',
    'COVERED', 'INDEX']).isRequired,
  index: PropTypes.object,
  viewType: PropTypes.oneOf(['tree', 'json']).isRequired,
  rawExplainObject: PropTypes.object.isRequired
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
