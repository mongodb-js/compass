const React = require('react');
const PropTypes = require('prop-types');
const DetailViewComponent = require('./detailview-component');
const CurrentOpComponent = require('./current-op-component');
const TopComponent = require('./top-component');
const CurrentOpStore = require('../stores/current-op-store');
const TopStore = require('../stores/top-store');

// const debug = require('debug')('mongodb-compass:server-stats:lists-component');

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
  interval: PropTypes.number.isRequired
};

module.exports = ServerStatsListsComponent;
