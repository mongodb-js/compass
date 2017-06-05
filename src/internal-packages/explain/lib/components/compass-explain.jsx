const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const { StatusRow } = require('hadron-react-components');
const ExplainBody = require('./explain-body');
const _ = require('lodash');

const READ_ONLY_WARNING = 'Explain plans on readonly views are not supported.';

const COLLECTION_SCAN_WARNING = 'To prevent unintended collection scans, please'
  + ' enter your query first, then press "Explain" to view the explain plan.';

const OUTDATED_WARNING = 'The explain content is outdated and no longer in sync'
  + ' with the documents view. Press "Explain" again to see the explain plan for'
  + ' the current query.';

class CompassExplain extends React.Component {

  constructor(props) {
    super(props);
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
    this.ViewSwitcher = app.appRegistry.getComponent('App.ViewSwitcher');
  }

  componentWillMount() {
    this.queryBar = app.appRegistry.getComponent('Query.QueryBar');
  }

  onApplyClicked() {
    this.props.actions.fetchExplainPlan();
  }

  onResetClicked() {
    this.props.actions.reset();
  }

  onViewSwitch(label) {
    if (label === 'Visual Tree') {
      this.props.actions.switchToTreeView();
    } else if (label === 'Raw JSON') {
      this.props.actions.switchToJSONView();
    }
  }

  renderBanner() {
    let banner = null;
    if (this.CollectionStore.isReadonly()) {
      banner = <StatusRow style="warning">{READ_ONLY_WARNING}</StatusRow>;
    } else if (this.props.explainState === 'initial') {
      banner = <StatusRow style="warning">{COLLECTION_SCAN_WARNING}</StatusRow>;
    } else if (this.props.explainState === 'outdated') {
      banner = <StatusRow style="warning">{OUTDATED_WARNING}</StatusRow>;
    }
    return banner;
  }

  renderContent() {
    if (!_.includes(['done', 'outdated'], this.props.explainState)) {
      return null;
    }

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
    const isDisabled = this.CollectionStore.isReadonly();

    const activeViewTypeButton = this.props.viewType === 'tree' ?
      'Visual Tree' : 'Raw JSON';

    return (
      <div className="compass-explain">
        <div className="controls-container">
          <this.queryBar
            buttonLabel="Explain"
            onApply={this.onApplyClicked.bind(this)}
            onReset={this.onResetClicked.bind(this)}
          />
          <div className="action-bar">
            <this.ViewSwitcher
              label="View Details As"
              buttonLabels={['Visual Tree', 'Raw JSON']}
              activeButton={activeViewTypeButton}
              disabled={isDisabled}
              dataTestId="explain-view"
              onClick={this.onViewSwitch.bind(this)}
            />
          </div>
          {this.renderBanner()}
        </div>
        {this.renderContent()}
      </div>
    );
  }
}

CompassExplain.propTypes = {
  explainState: PropTypes.oneOf(['initial', 'fetching', 'done', 'outdated']),
  nReturned: PropTypes.number.isRequired,
  totalKeysExamined: PropTypes.number.isRequired,
  totalDocsExamined: PropTypes.number.isRequired,
  executionTimeMillis: PropTypes.number.isRequired,
  inMemorySort: PropTypes.bool.isRequired,
  indexType: PropTypes.oneOf(['MULTIPLE', 'UNAVAILABLE', 'COLLSCAN',
    'COVERED', 'INDEX']).isRequired,
  index: PropTypes.object,
  viewType: PropTypes.oneOf(['tree', 'json']).isRequired,
  rawExplainObject: PropTypes.object.isRequired,
  actions: PropTypes.object
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
