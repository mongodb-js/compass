const React = require('react');
const ReactDOM = require('react-dom');
const d3 = require('d3');
const _ = require('lodash');

const D3Component = React.createClass({

  propTypes: {
    data: React.PropTypes.any.isRequired,
    renderMode: React.PropTypes.oneOf(['svg', 'div']),
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    d3fn: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      chart: null
    };
  },

  componentWillMount() {
    this.setState({
      chart: this.props.d3fn()
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
      ref: 'container'
    };
    const sizeOptions = {
      width: this.props.width,
      height: this.props.height
    };
    if (this.props.renderMode === 'svg') {
      options = _.assign(options, sizeOptions);
      return (
          <svg {...options}></svg>
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

    d3.select(el)
      .datum(this.props.data)
      .call(this.state.chart);
  },

  render() {
    const container = this._getContainer();
    return (
      <div ref="wrapper" className="d3component">
        {container}
      </div>
    );
  }
});

module.exports = D3Component;
