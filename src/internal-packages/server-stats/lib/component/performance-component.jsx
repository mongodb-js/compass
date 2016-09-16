const React = require('react');
// const debug = require('debug')('mongodb-compass:server-stats-performance-component');

const GraphsComponent = require('./server-stats-graphs-component');
const ListsComponent = require('./server-stats-lists-component');

class PerformanceComponent extends React.Component {
  render() {
    return (
      <section className="rt-perf">
        <section className="rt__graphs-out">
          <GraphsComponent interval={this.props.interval} />
        </section>
        <section className="rt__lists-out">
          <ListsComponent interval={this.props.interval} />
        </section>
      </section>
    );
  }
}

PerformanceComponent.propTypes = {
  interval: React.PropTypes.number.isRequired
};

module.exports = PerformanceComponent;
