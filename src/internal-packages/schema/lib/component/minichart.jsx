const app = require('ampersand-app');
const React = require('react');
const UniqueMinichart = require('./unique');
const _ = require('lodash');
// const DocumentMinichart = require('./document');
// const ArrayMinichart = require('./array');
const D3Component = require('./d3component');
const vizFns = require('../d3');

// const debug = require('debug')('mongodb-compass:schema:minichart');

const Minichart = React.createClass({

  propTypes: {
    fieldName: React.PropTypes.string.isRequired,
    type: React.PropTypes.object.isRequired
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

    const QueryStore = app.appRegistry.getStore('QueryStore');
    this.unsubscribeQueryStore = QueryStore.listen((store) => {
      this.setState({
        query: store.query
      });
    });
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    this.unsubscribeQueryStore();
  },

  handleResize() {
    const rect = this.refs.minichart.getBoundingClientRect();
    this.setState({
      containerWidth: rect.width
    });
  },

  minichartFactory() {
    /* eslint camelcase: 0 */
    const typeName = this.props.type.name;
    const fieldName = this.props.fieldName;
    const queryClause = this.state.query[fieldName];
    const has_duplicates = this.props.type.has_duplicates;
    const fn = vizFns[typeName.toLowerCase()];
    const width = this.state.containerWidth;

    if (_.includes(['String', 'Number'], typeName) && !has_duplicates) {
      return (
        <UniqueMinichart
          fieldName={fieldName}
          query={queryClause}
          type={this.props.type}
          width={width}
        />
      );
    }
    if (typeName === 'Coordinates') {
      const height = width / 1.618; // = golden ratio
      return (
        <D3Component
          fieldName={fieldName}
          type={this.props.type}
          renderMode="div"
          query={queryClause}
          width={width}
          height={height}
          fn={vizFns.coordinates}
        />
      );
    }
    if (typeName === 'Document') {
      return <div>Document Placeholder Minichart</div>;
    }
    if (typeName === 'Array') {
      return <div>Array Placeholder Minichart</div>;
    }
    if (typeName === 'Undefined') {
      return <div>Undefined</div>;
    }
    if (!fn) {
      return <div>Unknown Type</div>;
    }
    return (
      <D3Component
        fieldName={this.props.fieldName}
        type={this.props.type}
        renderMode="svg"
        query={queryClause}
        width={width}
        height={100}
        fn={fn}
      />
    );
  },

  render() {
    const minichart = this.state.containerWidth ? this.minichartFactory() : null;
    return (
      <div ref="minichart">
        {minichart}
      </div>
    );
  }

});

module.exports = Minichart;
