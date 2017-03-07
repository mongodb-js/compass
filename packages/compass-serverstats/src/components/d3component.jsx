const React = require('react');
const ReactDOM = require('react-dom');
const d3 = require('d3');
const Actions = require('../actions');

const LINE_COLORS = ['#45BAAB', '#23B1FF', '#6F72FF', '#A33A35', '#FFA900', '#C7E82F'];

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
    const data = this.props.data;
    const maxTime = data.localTime ? data.localTime[data.localTime.length - 1] : new Date();
    const minTime = data.xLength ? new Date(maxTime.getTime() - (data.xLength * 1000)) : maxTime;

    if (!data.localTime) {
      return;
    }

    this.state.chart
      .width(this.props.width)
      .height(this.props.height)
      .title(data.labels ? data.labels.title : 'Loading...')
      .animationDelay(data.paused ? null : 1000)
      .singlePointTime(1000)

      .xDomain([minTime, maxTime])
      .xVal((d, i) => data.localTime[i])
      .xValues((selectionData) => selectionData.localTime)

      .yDomain(data.yDomain || [0, 0])
      .yVal((d) => d)
      .yValues((selectionData) => selectionData.dataSets)
      .yUnits(data.labels ? data.labels.yAxis : '')
      .yData((yValue) => yValue.count)
      .yLabel((yValue) => yValue.line)
      .yFormat(d3.format('s'))

      .y2Domain(data.secondScale ? [0, data.secondScale.currentMax] : null)
      .y2Val((d) => d)
      .y2Values((selectionData) => selectionData.secondScale ? [selectionData.secondScale] : [])
      .y2Units(data.secondScale ? data.secondScale.units : '')
      .y2Data((y2Value) => y2Value.count)
      .y2Label((y2Value) => y2Value.line)
      .y2Format(d3.format('s'))

      .defined((d, i) => !data.skip[i])
      .color(d3.scale.ordinal().range(LINE_COLORS))
      .strokeWidth(2)
      .on('mouseover', Actions.mouseOver)
      .on('mouseout', Actions.mouseOut);

    d3.select(el)
      .datum(this.props.data)
      .call(this.state.chart);
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div ref="wrapper" className="d3component">
        <div ref="container"></div>
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
