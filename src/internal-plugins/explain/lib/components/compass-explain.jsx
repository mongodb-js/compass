const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const { StatusRow, ViewSwitcher, ZeroState } = require('hadron-react-components');
const { TextButton } = require('hadron-react-buttons');
const ExplainBody = require('./explain-body');
const _ = require('lodash');

const READ_ONLY_WARNING = 'Explain plans on readonly views are not supported.';

const OUTDATED_WARNING = 'The explain content is outdated and no longer in sync'
  + ' with the documents view. Press "Explain" again to see the explain plan for'
  + ' the current query.';

const HEADER = 'Evaluate the performance of your query';

const SUBTEXT = 'Explain provides key execution metrics that help diagnose slow queries'
  + ' and optimize index usage.';

const DOCUMENTATION_LINK = 'https://docs.mongodb.com/compass/master/query-plan/';

class CompassExplain extends React.Component {

  constructor(props) {
    super(props);
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
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
    } else if (this.props.explainState === 'outdated') {
      banner = <StatusRow style="warning">{OUTDATED_WARNING}</StatusRow>;
    } else if (this.props.error) {
      banner = <StatusRow style="error">{this.props.error.message}</StatusRow>;
    }
    return banner;
  }

  renderZeroState() {
    if (this.props.explainState === 'initial') {
      return (
        <ZeroState header={HEADER} subtext={SUBTEXT}>
          <TextButton
            className="btn btn-primary btn-lg"
            text="Execute Explain"
            clickHandler={this.onApplyClicked.bind(this)} />
          <a className="btn btn-info btn-lg" href={DOCUMENTATION_LINK}>
            Learn More
          </a>
        </ZeroState>
      );
    }
  }

  renderContent() {
    if (this.props.error || !_.includes(['done', 'outdated'], this.props.explainState)) {
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
            <ViewSwitcher
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
        {this.renderZeroState()}
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
  actions: PropTypes.object,
  error: PropTypes.object
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
  rawExplainObject: {},
  error: null
};

CompassExplain.displayName = 'CompassExplain';

module.exports = CompassExplain;
