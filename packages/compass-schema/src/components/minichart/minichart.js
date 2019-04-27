import React, { Component } from 'react';
import PropTypes from 'prop-types';
import UniqueMiniChart from 'components/unique-minichart';
import DocumentMinichart from 'components/document-minichart';
import ArrayMinichart from 'components/array-minichart';
import D3Component from 'components/d3component';
import _ from 'lodash';
import vizFns from '../d3';
import { STRING, DECIMAL_128, DOUBLE, LONG, INT_32, NUMBER } from 'constants';

class MiniChart extends Component {
  static displayName = 'MiniChartComponent';

  static propTypes = {
    fieldName: PropTypes.string.isRequired,
    actions: PropTypes.object.isRequired,
    type: PropTypes.object.isRequired,
    nestedDocType: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.state = {
      containerWidth: null,
      filter: {},
      valid: true,
      userTyping: false
    };
    this.resizeListener = this.handleResize.bind(this);
  }

  componentDidMount() {
    // yes, this is not ideal, we are rendering the empty container first to
    // measure the size, then render the component with content a second time,
    // but it is not noticable to the user.
    this.resizeListener();
    window.addEventListener('resize', this.resizeListener);

    const QueryStore = global.hadronApp.appRegistry.getStore('Query.Store');
    const onQueryChanged = (store) => {
      this.setState({
        filter: store.filter,
        valid: store.valid,
        userTyping: store.userTyping
      });
    };

    // Also populate initial values
    onQueryChanged(QueryStore.state);

    this.unsubscribeQueryStore = QueryStore.listen(onQueryChanged);
    this.unsubscribeMiniChartResize = this.props.actions.resizeMiniCharts.listen(this.resizeListener);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.valid && !nextState.userTyping;
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeListener);
    this.unsubscribeQueryStore();
    this.unsubscribeMiniChartResize();
  }

  /**
   * Called when the window size changes or via the resizeMiniCharts action,
   * triggered by index.jsx. Only redraw if the size is > 0.
   */
  handleResize() {
    const rect = this._mc.getBoundingClientRect();
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
    const queryValue = this.state.filter[fieldName];
    const hasDuplicates = this.props.type.has_duplicates;
    const fn = vizFns[typeName.toLowerCase()];
    const width = this.state.containerWidth;

    if (_.includes([ STRING, NUMBER ], typeName) && !hasDuplicates) {
      return (
        <UniqueMiniChart
          key={typeName}
          fieldName={fieldName}
          queryValue={queryValue}
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
          query={queryValue}
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
        query={queryValue}
        width={width}
        height={100}
        fn={fn}
      />
    );
  }

  render() {
    const minichart = this.state.containerWidth ? this.minichartFactory() : null;
    return (
      <div ref={(chart) => { this._mc = chart; }}>
        {minichart}
      </div>
    );
  }

}

export default MiniChart;
