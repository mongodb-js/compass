const React = require('react');
const Vega = require('react-vega').default;
const vl = require('vega-lite');

// const debug = require('debug')('compass-charts:chart');
const _ = require('lodash');

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
    const spec = this._getVegaSpec(nextProps.spec);
    this.setState({
      spec: spec
    });
  }

  /**
   * helper method to convert Vega-Lite to Vega spec, or return the Vega
   * spec directly, depending on the specType.
   *
   * @param {Object} spec    The vega or vega-lite spec
   * @return {Object} spec   The vega spec
   */
  _getVegaSpec(spec) {
    if (this.props.specType === 'vega-lite') {
      _.assign(spec, _.pick(this.props, ['width', 'height', 'data']));
      return vl.compile(spec).spec;
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
    const props = _.omit(this.props, ['specType']);
    props.spec = this.state.spec;
    return <Vega {...props} />;
  }
}

Chart.propTypes = {
  specType: React.PropTypes.oneOf(['vega', 'vega-lite']),
  data: React.PropTypes.object.isRequired,
  width: React.PropTypes.number.isRequired,
  height: React.PropTypes.number.isRequired,
  padding: React.PropTypes.object,
  className: React.PropTypes.string,
  renderer: React.PropTypes.oneOf(['svg', 'canvas']),
  spec: React.PropTypes.object.isRequired
};

Chart.defaultProps = {
  data: [],
  width: 300,
  height: 300,
  renderer: 'canvas',
  className: 'chart',
  specType: 'vega-lite'
};

Chart.displayName = 'Chart';

module.exports = Chart;
