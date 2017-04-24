const React = require('react');
const VegaLite = require('react-vega-lite').default;
const Vega = require('react-vega').default;

const _ = require('lodash');
// const debug = require('debug')('mongodb-compass:chart:chart');

class Chart extends React.Component {

  /**
   * renders the chart as a ReactVega / ReactVegaLite component.
   *
   * @return {Component}   the ReactVega component.
   */
  render() {
    // pass data into ReactVega/Lite component as dataset with name `source`.
    const data = {values: this.props.data};
    // add width and height to the spec
    const spec = _.assign({}, this.props.spec, _.pick(this.props, ['width', 'height']));

    const ChartClass = this.props.specType === 'vega-lite' ? VegaLite : Vega;
    return (
      <ChartClass
        spec={spec}
        data={data}
        width={this.props.width}
        height={this.props.height}
        padding={this.props.padding}
        className={this.props.className}
        renderer={this.props.renderer}
      />
    );
  }
}

Chart.propTypes = {
  specType: React.PropTypes.oneOf(['vega', 'vega-lite']),
  data: React.PropTypes.array.isRequired,
  width: React.PropTypes.number.isRequired,
  height: React.PropTypes.number.isRequired,
  padding: React.PropTypes.object,
  className: React.PropTypes.string,
  renderer: React.PropTypes.oneOf(['svg', 'canvas']),
  spec: React.PropTypes.object.isRequired
};

Chart.defaultProps = {
  data: [],
  renderer: 'svg',
  className: 'chart',
  specType: 'vega-lite'
};

Chart.displayName = 'Chart';

module.exports = Chart;
