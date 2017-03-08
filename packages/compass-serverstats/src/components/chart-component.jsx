const React = require('react');
const D3Component = require('./d3component');
const chartFn = require('../d3/').realTimeLineChart;

/**
 * Represents the component that renders serverStatus charts.
 */
class ChartComponent extends React.Component {

  /**
   * The server stats component should be initialized with a 'store'
   * property, that triggers with the result of a { serverStatus: 1 }
   * command. Should also have a 'dispatcher' property.
   *
   * @param {Object} props - The component properties.
   */
  constructor(props) {
    super(props);
    this.state = { error: null, data: {}};
    this.dispatcher = this.props.dispatcher;
  }

  /**
   * When the component mounts, the component will subscribe to the
   * provided store, so that each time the store triggers the component
   * can update its state.
   */
  componentDidMount() {
    this.unsubscribeFromStore = this.props.store.listen(this.refresh.bind(this));
  }

  /**
   * When the component unmounts, we unsubscribe from the store and stop the
   * timer.
   */
  componentWillUnmount() {
    this.unsubscribeFromStore();
  }

  /**
   * Refreshes the component state with the new server status data that was
   * received from the store.
   *
   * @param {Error} error - The error, if any occured.
   * @param {Object} data - The javascript object for the result of the command.
   */
  refresh(error, data) {
    this.setState({ error: error, data: data });
  }

  /**
   * Renders the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className="chart">
        <D3Component
          data={this.state.error ? {} : this.state.data}
          width={520}
          height={145}
          d3fn={chartFn}
          dispatcher={this.dispatcher}/>
      </div>
    );
  }

}

ChartComponent.propTypes = {
  store: React.PropTypes.any.isRequired,
  dispatcher: React.PropTypes.any.isRequired
};

ChartComponent.displayName = 'ChartComponent';

module.exports = ChartComponent;
