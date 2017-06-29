const app = require('hadron-app');
const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');
const hasDistinctValue = require('../../../query/lib/util').hasDistinctValue;

const { DECIMAL_128, DOUBLE, LONG, INT_32 } = require('../helpers');

// const debug = require('debug')('mongodb-compass:minichart:unique');

class ValueBubble extends React.Component {
  onBubbleClicked(e) {
    const QueryAction = app.appRegistry.getAction('Query.Actions');
    const action = e.shiftKey ?
      QueryAction.toggleDistinctValue : QueryAction.setValue;
    action({
      field: this.props.fieldName,
      value: this.props.value,
      unsetIfSet: true
    });
  }

  /**
   * converts the passed in value into a string, supports the 4 numeric
   * BSON types as well.
   *
   * @param {Any} value     value to be converted to a string
   * @return {String}       converted value
   */
  _extractStringValue(value) {
    if (_.has(value, '_bsontype')) {
      if (_.includes([ DECIMAL_128, LONG ], value._bsontype)) {
        return value.toString();
      }
      if (_.includes([ DOUBLE, INT_32 ], value._bsontype)) {
        return String(value.value);
      }
    }
    if (_.isString(value)) {
      return value;
    }
    return String(value);
  }

  render() {
    const value = this._extractStringValue(this.props.value);
    const selectedClass = hasDistinctValue(this.props.query, this.props.value) ?
      'selected' : 'unselected';
    return (
      <li className="bubble">
        <code className={`selectable ${selectedClass}`} onClick={this.onBubbleClicked.bind(this)}>
          {value}
        </code>
      </li>
    );
  }
}

ValueBubble.propTypes = {
  fieldName: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
  query: PropTypes.any
};

/* eslint react/no-multi-comp: 0 */
class UniqueMiniChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sample: _.sample(this.props.type.values, 20) };
  }

  onRefresh(e) {
    e.stopPropagation();
    e.preventDefault();
    this.setState({
      sample: _.sample(this.props.type.values, 20)
    });
  }

  /**
   * Render a single field;
   *
   * @returns {React.Component} A react component for a single field
   */
  render() {
    if (!this.props.type.values) {
      return <div></div>;
    }
    const sample = this.state.sample || [];
    const fieldName = this.props.fieldName.toLowerCase();
    const typeName = this.props.type.name.toLowerCase();
    const randomValueList = sample.map((value, i) => {
      return (
        <ValueBubble
          key={`${fieldName}-${typeName}-${i}`}
          value={value}
          query={this.props.query}
          fieldName={this.props.fieldName}
        />
      );
    });
    const style = {
      width: this.props.width
    };

    return (
      <div className="minichart unique" style={style}>
        <dl className="dl-horizontal">
          <dt>
            <i onClick={this.onRefresh.bind(this)} className="mms-icon-continuous" />
          </dt>
          <dd>
            <ul className="list-inline">
              {randomValueList}
            </ul>
          </dd>
        </dl>
      </div>
    );
  }
}

UniqueMiniChart.propTypes = {
  fieldName: PropTypes.string.isRequired,
  type: PropTypes.object.isRequired,
  width: PropTypes.number,
  query: PropTypes.any
};

module.exports = UniqueMiniChart;
