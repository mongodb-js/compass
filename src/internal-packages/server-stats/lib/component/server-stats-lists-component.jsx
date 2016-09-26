const React = require('react');
// const debug = require('debug')('mongodb-compass:server-stats-lists-component');

const DetailViewComponent = require('./detailview-component');
const CurrentOpComponent = require('./current-op-component');
const TopComponent = require('./top-component');
const CurrentOpStore = require('../store/current-op-store');
const TopStore = require('../store/top-store');


class ServerStatsListsComponent extends React.Component {

  render() {
    return (
      <div className="listview">
        <DetailViewComponent />
        <TopComponent interval={this.props.interval} store={TopStore} />
        <CurrentOpComponent interval={this.props.interval} store={CurrentOpStore} />
      </div>
    );
  }
}

ServerStatsListsComponent.propTypes = {
  interval: React.PropTypes.number.isRequired
};

module.exports = ServerStatsListsComponent;
