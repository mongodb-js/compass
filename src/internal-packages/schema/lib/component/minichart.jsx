const app = require('hadron-app');
const React = require('react');
const PropTypes = require('prop-types');
const UniqueMinichart = require('./unique');
const _ = require('lodash');
const DocumentMinichart = require('./document');
const ArrayMinichart = require('./array');
const D3Component = require('./d3component');
const vizFns = require('../d3');
const Actions = require('../action');

// const debug = require('debug')('mongodb-compass:schema:minichart');

const { STRING, DECIMAL_128, DOUBLE, LONG, INT_32, NUMBER } = require('../helpers');

class Minichart extends React.Component {
  getInitialState() {
    return {
      containerWidth: null,
      filter: {},
      valid: true,
      userTyping: false
    };
  }

  componentDidMount() {
    // yes, this is not ideal, we are rendering the empty container first to
    // measure the size, then render the component with content a second time,
    // but it is not noticable to the user.
    this.handleResize();
    window.addEventListener('resize', this.handleResize);

    const QueryStore = app.appRegistry.getStore('Query.Store');
    this.unsubscribeQueryStore = QueryStore.listen((store) => {
      this.setState({
        filter: store.filter,
        valid: store.valid,
        userTyping: store.userTyping
      });
    });

    this.unsubscribeMiniChartResize = Actions.resizeMiniCharts.listen(this.handleResize);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.valid && !nextState.userTyping;
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    this.unsubscribeQueryStore();
    this.unsubscribeMiniChartResize();
  }

  /**
   * Called when the window size changes or via the resizeMiniCharts action,
   * triggered by index.jsx. Only redraw if the size is > 0.
   */
  handleResize() {
    const rect = this.refs.minichart.getBoundingClientRect();
    if (rect.width > 0) {
      this.setState({
        containerWidth: rect.width
      });
    }
  }

  minichartFactory() {
    // cast all numeric types to Number pseudo-type
    const typeName = _.includes([ DECIMAL_128, DOUBLE, INT_32, LONG ],
      this.props.type.name) ? NUMBER : this.props.type.name;

    const fieldName = this.props.fieldName;
    const queryClause = this.state.filter[fieldName];
    const hasDuplicates = this.props.type.has_duplicates;
    const fn = vizFns[typeName.toLowerCase()];
    const width = this.state.containerWidth;

    if (_.includes([ STRING, NUMBER ], typeName) && !hasDuplicates) {
      return (
        <UniqueMinichart
          key={typeName}
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
      return (
        <DocumentMinichart
          nestedDocType={this.props.nestedDocType}
        />
      );
    }
    if (typeName === 'Array') {
      return (
        <ArrayMinichart
          type={this.props.type}
          nestedDocType={this.props.nestedDocType}
        />
      );
    }
    if (typeName === 'Undefined') {
      return <div>Undefined</div>;
    }
    if (!fn) {
      return null;
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
  }

  render() {
    const minichart = this.state.containerWidth ? this.minichartFactory() : null;
    return (
      <div ref="minichart">
        {minichart}
      </div>
    );
  }

}

Minichart.propTypes = {
  fieldName: PropTypes.string.isRequired,
  type: PropTypes.object.isRequired,
  nestedDocType: PropTypes.object
};

module.exports = Minichart;
