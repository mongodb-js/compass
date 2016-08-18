const React = require('react');
const ReactDOM = require('react-dom');
const d3 = require('d3');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:schema:d3component');

const D3Component = React.createClass({

  propTypes: {
    fieldName: React.PropTypes.string.isRequired,
    type: React.PropTypes.object.isRequired,
    renderMode: React.PropTypes.oneOf(['svg', 'div']),
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    fn: React.PropTypes.func.isRequired,
    query: React.PropTypes.any
  },

  getInitialState() {
    return {
      chart: null
    };
  },

  componentWillMount() {
    this.setState({
      chart: this.props.fn()
    });
  },

  componentDidMount: function() {
    this._redraw();
  },

  componentDidUpdate() {
    this._redraw();
  },

  _getContainer() {
    let options = {
      className: 'minichart',
      ref: 'container'
    };
    const sizeOptions = {
      width: this.props.width,
      height: this.props.height
    };
    if (this.props.renderMode === 'svg') {
      options = _.assign(options, sizeOptions);
      return (
        <svg {...options}>
          <defs>
            <pattern id="diagonal-stripes" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="2.5" height="4" transform="translate(0,0)" fill="white"></rect>
            </pattern>
            <mask id="mask-stripe">
              <rect x="0" y="0" width="100%" height="100%" fill="url(#diagonal-stripes)"></rect>
            </mask>
          </defs>
        </svg>
      );
    }
    options = _.assign(options, {
      style: sizeOptions
    });
    return <div {...options}></div>;
  },

  _redraw() {
    const el = ReactDOM.findDOMNode(this.refs.container);
    this.state.chart
      .width(this.props.width)
      .height(this.props.height);

    this.state.chart.options({
      fieldName: this.props.fieldName,
      unique: this.props.type.unique,
      query: this.props.query
    });

    d3.select(el)
      .datum(this.props.type.values)
      .call(this.state.chart);
  },

  render() {
    const container = this._getContainer();
    return (
      <div className="minichart-wrapper" ref="wrapper">
        {container}
      </div>
    );
  }
});

module.exports = D3Component;
