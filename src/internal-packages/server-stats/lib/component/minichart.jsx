const React = require('react');
const D3Component = require('./d3component');
const vizFns = require('../d3');

const Minichart = React.createClass({

  propTypes: {
    data: React.PropTypes.any.isRequired,
    graph_type: React.PropTypes.string.isRequired
  },
  getInitialState() {
    return {
      containerWidth: null,
      query: {}
    };
  },

  componentDidMount() {
    const rect = this.refs.minichart.getBoundingClientRect();

    /* eslint react/no-did-mount-set-state: 0 */

    // yes, this is not ideal, we are rendering the empty container first to
    // measure the size, then render the component with content a second time,
    // but it is not noticable to the user.
    this.setState({
      containerWidth: rect.width
    });
    window.addEventListener('resize', this.handleResize);
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    this.unsubscribeQueryStore();
  },

  handleResize() {
    const rect = this.refs.minichart.getBoundingClientRect(); // built in func for browser DOM elements
    this.setState({
      containerWidth: rect.width
    });
  },

  minichartFactory() {
    /* eslint camelcase: 0 */
    const fn = vizFns[this.props.graph_type];
    return (
      <D3Component
        data={this.props.data}
        renderMode="svg"
        width={520}
        height={160}
        d3fn={fn}
      />
    );
  },

  render() {
    const minichart = this.state.containerWidth ? this.minichartFactory() : null;
    return (
      <div ref="minichart" className="minichart">
        {minichart}
      </div>
    );
  }

});

module.exports = Minichart;
