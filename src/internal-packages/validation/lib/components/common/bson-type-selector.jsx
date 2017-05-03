const React = require('react');
const PropTypes = require('prop-types');
const _ = require('lodash');
const semver = require('semver');
const { OptionSelector } = require('hadron-react-components');

// const debug = require('debug')('mongodb-compass:bson-type-selector');

const BSON_TYPES = [
  {name: 'Double', number: 1, alias: 'double'},
  {name: 'Decimal128', number: 19, alias: 'decimal128'},
  {name: 'String', number: 2, alias: 'string'},
  {name: 'Object', number: 3, alias: 'object'},
  // {name: 'Array', number: 4, alias: 'array'},  // COMPASS-275 server does not support this
  {name: 'Binary data', number: 5, alias: 'binData'},
  {name: 'Undefined', number: 6, alias: 'undefined'},
  {name: 'ObjectId', number: 7, alias: 'objectid'},
  {name: 'Boolean', number: 8, alias: 'bool'},
  {name: 'Date', number: 9, alias: 'date'},
  {name: 'Null', number: 10, alias: 'null'},
  {name: 'Regular Expression', number: 11, alias: 'regex'},
  {name: 'DBPointer', number: 12, alias: 'dbPointer'},
  {name: 'JavaScript', number: 13, alias: 'javascript'},
  {name: 'Symbol', number: 14, alias: 'symbol'},
  {name: 'JavaScript (with scope)', number: 15, alias: 'javascriptWithScope'},
  {name: '32-bit integer', number: 16, alias: 'int'},
  {name: 'Timestamp', number: 17, alias: 'timestamp'},
  {name: '64-bit integer', number: 18, alias: 'long'},
  {name: 'Min key', number: -1, alias: 'minKey'},
  {name: 'Max key', number: 127, alias: 'maxKey'}
];

class BSONTypeSelector extends React.Component {

  constructor(props) {
    super(props);
    // try catch block in case semver typeerrors while remove decimal128
    // if server is < 3.4.x
    let canRemoveDecimal = false;
    try {
      canRemoveDecimal = semver.gt('3.4.0-rc0', this.props.serverVersion);
    } catch (e) {
      canRemoveDecimal = true;
    }

    if (canRemoveDecimal) {
      _.remove(BSON_TYPES, (type) => type.number === 19);
    }

    this.state = {
      type: null
    };
  }

  componentWillMount() {
    if (this.props.typeNumber) {
      this.setState({
        type: BSONTypeSelector.getTypeByNumber(this.props.typeNumber)
      });
    } else if (this.props.typeAlias) {
      this.setState({
        type: BSONTypeSelector.getTypeByAlias(this.props.typeAlias)
      });
    } else if (this.props.typeName) {
      this.setState({
        type: BSONTypeSelector.getTypeByName(this.props.typeName)
      });
    }
  }

  onTypeClicked(typeAlias, evt) {
    const type = BSONTypeSelector.getTypeByAlias(typeAlias);
    this.setState({
      type: type
    });
    this.props.onTypeClicked(type, evt);
  }

  static getTypeByName(typeName) {
    return _.find(BSON_TYPES, 'name', typeName);
  }

  static getTypeByNumber(typeNumber) {
    return _.find(BSON_TYPES, 'number', typeNumber);
  }

  static getTypeByAlias(typeAlias) {
    return _.find(BSON_TYPES, 'alias', typeAlias);
  }

  /**
   * Render BSONSelector component.
   *
   * @returns {React.Component} The view component.
   */
  render() {
    const selectedTypeName = _.get(this.state.type, 'alias', '');
    const typeOptions = _.zipObject(_.map(BSON_TYPES, (type) => {
      return [type.alias, type.name];
    }));

    return (
      <OptionSelector
        id="bson-type-selector"
        options={typeOptions}
        label="BSON Type"
        title={typeOptions[selectedTypeName]}
        onSelect={this.onTypeClicked.bind(this)}
        disabled={this.props.isDisabled}
      />
    );
  }
}

BSONTypeSelector.propTypes = {
  typeNumber: PropTypes.number,
  typeAlias: PropTypes.string,
  typeName: PropTypes.string,
  onTypeClicked: PropTypes.func,
  serverVersion: PropTypes.string,
  isDisabled: PropTypes.bool
};

BSONTypeSelector.displayName = 'BSONTypeSelector';

module.exports = BSONTypeSelector;
