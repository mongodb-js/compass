const React = require('react');
const PropTypes = require('prop-types');
const ReactDOM = require('react-dom');
const d3 = require('d3');
const bson = require('bson');
const _ = require('lodash');

/**
 * Conversion for display in minicharts for non-promoted BSON types.
 */
const TO_JS_CONVERSIONS = {
  'Double': (values) => values.map((v) => v.value),
  'Int32': (values) => values.map((v) => v.value),
  'Long': (values) => values.map((v) => v.toNumber()),
  'Decimal128': (values) => values.map((v) => v.toString())
};

/**
 * Convert back to BSON types from the raw JS.
 */
const TO_BSON_CONVERSIONS = {
  'Long': (value) => bson.Long.fromNumber(value),
  'Decimal128': (value) => bson.Decimal128.fromString(value),
  'Date': (value) => new Date(value),
  'ObjectID': (value) => bson.ObjectId.createFromHexString(value)
};

/**
 * Default conversion.
 */
const DEFAULT = (value) => { return value; };

// const debug = require('debug')('mongodb-compass:schema:d3component');

class D3Component extends React.Component {
  constructor(props) {
    super(props);
    this.state = { chart: null };
  }

  componentWillMount() {
    this.setState({
      chart: this.props.fn()
    });
  }

  componentDidMount() {
    this._redraw();
  }

  componentDidUpdate() {
    this._redraw();
  }

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
              <rect width="2.5" height="4" transform="translate(0,0)" fill="white" />
            </pattern>
            <mask id="mask-stripe">
              <rect x="0" y="0" width="100%" height="100%" fill="url(#diagonal-stripes)" />
            </mask>
          </defs>
        </svg>
      );
    }
    options = _.assign(options, {
      style: sizeOptions
    });
    return <div {...options} />;
  }

  _redraw() {
    const el = ReactDOM.findDOMNode(this.refs.container);
    this.state.chart
      .width(this.props.width)
      .height(this.props.height);

    // @todo: Durran add the original type here.
    this.state.chart.options({
      fieldName: this.props.fieldName,
      unique: this.props.type.unique,
      query: this.props.query,
      promoter: TO_BSON_CONVERSIONS[this.props.type.bsonType] || DEFAULT
    });

    if (TO_JS_CONVERSIONS.hasOwnProperty(this.props.type.bsonType)) {
      d3.select(el)
        .datum(TO_JS_CONVERSIONS[this.props.type.bsonType](this.props.type.values))
        .call(this.state.chart);
    } else {
      d3.select(el)
        .datum(this.props.type.values)
        .call(this.state.chart);
    }
  }

  render() {
    const container = this._getContainer();
    return (
      <div className="minichart-wrapper" ref="wrapper">
        {container}
      </div>
    );
  }
}

D3Component.propTypes = {
  fieldName: PropTypes.string.isRequired,
  type: PropTypes.object.isRequired,
  renderMode: PropTypes.oneOf(['svg', 'div']),
  width: PropTypes.number,
  height: PropTypes.number,
  fn: PropTypes.func.isRequired,
  query: PropTypes.any
};

module.exports = D3Component;
