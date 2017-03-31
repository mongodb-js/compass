const React = require('react');
const Vega = require('react-vega').default;
const vl = require('vega-lite');

// const debug = require('debug')('mongodb-compass:chart:chart');

class Chart extends React.Component {

  /**
   * convert spec from Vega-Lite to Vega if necessary, and store as state.
   *
   * @param {Object} props     props for this component.
   */
  constructor(props) {
    super(props);
    const spec = this._getVegaSpec(props.spec);
    this.state = {
      spec: spec
    };
  }

  /**
   * upon receiving new props, also convert from Vega-Lite to Vega if
   * necessary, and store the new spec as state.
   *
   * @param {Object} nextProps    the next props this component receives.
   */
  componentWillReceiveProps(nextProps) {
    const spec = this._getVegaSpec(nextProps.spec, nextProps);
    this.setState({
      spec: spec,
      specType: nextProps.specType
    });
  }

  /**
   * helper method to convert Vega-Lite to Vega spec, or return the Vega
   * spec directly, depending on the specType.
   *
   * @param {Object} spec    The vega or vega-lite spec
   * @param {Object} props   The current component props, default `this.props`
   * @return {Object} spec   The vega spec
   */
  _getVegaSpec(spec, props) {
    props = props || this.props;
    if (props.specType === 'vega-lite') {
      const liteSpec = Object.assign({}, spec, {
        width: props.width,
        height: props.height,
        data: {values: props.data}
      });
      return vl.compile(liteSpec).spec;
    }
    return spec;
  }

  /**
   * renders the chart as a ReactVega component. Vega-Lite specs have been
   * compiled down to a Vega spec at this point.
   *
   * @return {Component}   the ReactVega component.
   */
  render() {
    // pass data into ReactVega component as dataset with name `source`.
    const data = {source: this.props.data};
    // use (possibly converted) vega spec
    const spec = this.state.spec;
    return (
      <Vega
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
