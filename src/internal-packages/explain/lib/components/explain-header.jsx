const React = require('react');
const ExplainSummary = require('./explain-summary');
const app = require('hadron-app');

const ViewSwitcher = require('./shared/view-switcher');

const ExplainActions = require('../actions');


class ExplainHeader extends React.Component {

  constructor(props) {
    super(props);
    this.StatusRow = app.appRegistry.getComponent('App.StatusRow');
  }

  onViewSwitch(label) {
    if (label === 'Visual Tree') {
      ExplainActions.switchToTreeView();
    } else if (label === 'Raw JSON') {
      ExplainActions.switchToJSONView();
    }
  }

  render() {
    const activeViewTypeButton = this.props.viewType === 'tree' ?
      'Visual Tree' : 'Raw JSON';

    return (
      <div className="explain-header">
        <ExplainSummary
          nReturned={this.props.nReturned}
          totalKeysExamined={this.props.totalKeysExamined}
          totalDocsExamined={this.props.totalDocsExamined}
          executionTimeMillis={this.props.executionTimeMillis}
          inMemorySort={this.props.inMemorySort}
          indexType={this.props.indexType}
          index={this.props.index}
        />
        <this.StatusRow>
          <ViewSwitcher
            label="View Details As"
            buttonLabels={['Visual Tree', 'Raw JSON']}
            activeButton={activeViewTypeButton}
            onClick={this.onViewSwitch}
          />
        </this.StatusRow>
      </div>
    );
  }

}

ExplainHeader.propTypes = {
  nReturned: React.PropTypes.number.isRequired,
  totalKeysExamined: React.PropTypes.number.isRequired,
  totalDocsExamined: React.PropTypes.number.isRequired,
  executionTimeMillis: React.PropTypes.number.isRequired,
  inMemorySort: React.PropTypes.bool.isRequired,
  indexType: React.PropTypes.oneOf(['MULTIPLE', 'UNAVAILABLE', 'COLLSCAN',
    'COVERED', 'INDEX']).isRequired,
  index: React.PropTypes.object,
  viewType: React.PropTypes.oneOf(['tree', 'json']).isRequired
};

ExplainHeader.displayName = 'ExplainHeader';

module.exports = ExplainHeader;
