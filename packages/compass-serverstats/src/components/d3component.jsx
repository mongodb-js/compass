const React = require('react');
const ReactDOM = require('react-dom');
const d3 = require('d3');

/**
 * Encapsulates behaviour for a react component that wraps a d3 chart.
 */
class D3Component extends React.Component {

  /**
   * Instantiate the D3 component.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { chart: null };
  }

  /**
   * Set the chart state of the component to the provided d3 function.
   */
  componentWillMount() {
    this.setState({ chart: this.props.d3fn() });
  }

  /**
   * Redraw the component after mounting.
   */
  componentDidMount() {
    this.redraw();
  }

  /**
   * Redraw the component on update.
   */
  componentDidUpdate() {
    this.redraw();
  }

  /**
   * Redraw the component.
   */
  redraw() {
    const el = ReactDOM.findDOMNode(this.refs.container);
    this.state.chart.width(this.props.width).height(this.props.height);
    d3.select(el).datum(this.props.data).call(this.state.chart);
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div ref="wrapper" className="d3component">
        <svg ref="container" width={this.props.width} height={this.props.height}></svg>
      </div>
    );
  }
}

D3Component.displayName = 'D3Component';

D3Component.propTypes = {
  data: React.PropTypes.any.isRequired,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  d3fn: React.PropTypes.func.isRequired
};

module.exports = D3Component;
