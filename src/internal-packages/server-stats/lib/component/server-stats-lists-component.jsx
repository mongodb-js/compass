const React = require('react');
const debug = require('debug')('mongodb-compass:server-stats-lists-component');

const DEFAULT = 'default';
const DETAILS = 'details';

const DetailViewComponent = require('./detailview-component');
const CurrentOpComponent = require('./current-op-component');
const TopComponent = require('./top-component');
const CurrentOpStore = require('../store/current-op-store');
const TopStore = require('../store/top-store');


class ServerStatsListsComponent extends React.Component {
  constructor() {
    super();
    this.state = { mode: DEFAULT, data: {} };
  }

  /**
   * When a user clicks on the line item in the slow operations table.
   *
   * @param {Object} data - The javascript object for the result of the command.
   */
  showOperationDetails(data) {
    debug("SHOWING DEETS", data);
    this.setState({ mode: DETAILS, data: data});
  }

  /**
   * When the user clicks on the 'x close' button in the operation details table.
   */
  hideOperationDetails() {
    debug("HIDING DEETS");
    this.setState({ mode: DEFAULT, data: {} });
  }

  renderChildren() {
    if (this.state.mode === DETAILS) {
      return (
        <div className="listview">
          <DetailViewComponent
            closeHandler={this.hideOperationDetails.bind(this)}
            data={this.state.data}/>
        </div>
      );
    }
    return (
      <div className="listview">
        <TopComponent interval={this.props.interval} store={TopStore}/>
        <CurrentOpComponent interval={this.props.interval}
                            store={CurrentOpStore}
                            clickHandler={this.showOperationDetails.bind(this)}/>
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderChildren()}
      </div>
    );
  }
}

ServerStatsListsComponent.propTypes = {
  interval: React.PropTypes.number.isRequired
};

module.exports = ServerStatsListsComponent;
