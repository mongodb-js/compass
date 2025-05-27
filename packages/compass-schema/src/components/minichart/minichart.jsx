import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import UniqueMiniChart from '../unique-minichart';
import DocumentMinichart from '../document-minichart';
import ArrayMinichart from '../array-minichart';
import CoordinatesMinichart from '../coordinates-minichart';
import D3Component from '../d3-component';
import vizFns from '../../modules';
import CONSTANTS from '../../constants/schema';

class MiniChart extends PureComponent {
  static displayName = 'MiniChartComponent';

  static propTypes = {
    fieldName: PropTypes.string.isRequired,
    fieldValue: PropTypes.any,
    type: PropTypes.object.isRequired,
    nestedDocType: PropTypes.object,
    onQueryChanged: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      containerWidth: null,
    };
    this.resizeListener = this.handleResize.bind(this);
  }

  componentDidMount() {
    // yes, this is not ideal, we are rendering the empty container first to
    // measure the size, then render the component with content a second time,
    // but it is not noticable to the user.
    this.resizeListener();
    window.addEventListener('resize', this.resizeListener);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeListener);
  }

  /**
   * Called when the window size changes or via the resizeMiniCharts action,
   * triggered by index.jsx. Only redraw if the size is > 0.
   */
  handleResize() {
    this.setState(({ containerWidth: prevWidth }) => {
      const { width } = this._mc.getBoundingClientRect();
      // Only update if width changed, otherwise we will be rerendering too
      // often when switching tabs
      if (width > 0 && prevWidth !== width) {
        return { containerWidth: width };
      }
      return null;
    });
  }

  minichartFactory() {
    // cast all numeric types to Number pseudo-type
    const typeName = [
      CONSTANTS.DECIMAL_128,
      CONSTANTS.DOUBLE,
      CONSTANTS.INT_32,
      CONSTANTS.LONG,
    ].includes(this.props.type.name)
      ? CONSTANTS.NUMBER
      : this.props.type.name;

    const fieldName = this.props.fieldName;
    const fieldValue = this.props.fieldValue;

    const hasDuplicates = this.props.type.hasDuplicates;
    const chartFactory = vizFns[typeName.toLowerCase()];
    const width = this.state.containerWidth;

    if (
      [CONSTANTS.STRING, CONSTANTS.NUMBER].includes(typeName) &&
      !hasDuplicates
    ) {
      return (
        <UniqueMiniChart
          key={`${typeName}-${this.props.type.isInArray}`}
          fieldName={fieldName}
          queryValue={fieldValue}
          type={this.props.type}
          width={width}
          onQueryChanged={this.props.onQueryChanged}
        />
      );
    }
    if (typeName === 'Coordinates') {
      return (
        <CoordinatesMinichart
          fieldName={fieldName}
          type={this.props.type}
          onQueryChanged={this.props.onQueryChanged}
        />
      );
    }
    if (typeName === 'Document') {
      return <DocumentMinichart nestedDocType={this.props.nestedDocType} />;
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
    if (!chartFactory) {
      return null;
    }

    return (
      <D3Component
        fieldName={this.props.fieldName}
        type={this.props.type}
        renderMode="svg"
        query={fieldValue}
        width={width}
        height={100}
        chart={chartFactory(this.props.onQueryChanged)}
      />
    );
  }

  render() {
    const minichart = this.state.containerWidth
      ? this.minichartFactory()
      : null;
    return (
      <div
        ref={(chart) => {
          this._mc = chart;
        }}
      >
        {minichart}
      </div>
    );
  }
}

export default MiniChart;
