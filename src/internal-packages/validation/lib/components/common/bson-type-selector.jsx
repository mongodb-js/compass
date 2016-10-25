const React = require('react');
const _ = require('lodash');
const OptionSelector = require('./option-selector');

// const debug = require('debug')('mongodb-compass:validation');

const BSON_TYPES = [
  {name: 'Double', number: 1, alias: 'double'},
  {name: 'Decimal128', number: 19, alias: 'decimal128'},
  {name: 'String', number: 2, alias: 'string'},
  {name: 'Object', number: 3, alias: 'object'},
  {name: 'Array', number: 4, alias: 'array'},
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
    return _.find(BSON_TYPES, ['name', typeName]);
  }

  static getTypeByNumber(typeNumber) {
    return _.find(BSON_TYPES, ['number', typeNumber]);
  }

  static getTypeByAlias(typeAlias) {
    return _.find(BSON_TYPES, ['alias', typeAlias]);
  }

  /**
   * Render BSONSelector component.
   *
   * @returns {React.Component} The view component.
   */
  render() {
    const selectedTypeName = _.get(this.state.type, 'alias', '');
    // TODO: make recentServer true if server is 3.4 <
    const recentServer = true;
    // remove the decimal version if not recentServer
    const typeOptions = _.fromPairs(_.map(_.filter(BSON_TYPES, (t) => {
      // filter out decimal if server < 3.4
      return !(t.alias === 'decimal128' && !recentServer);
    }), (type) => {
      return [type.alias, type.name];
    }));

    return (
      <OptionSelector
        id="bson-type-selector"
        options={typeOptions}
        label="BSON Type"
        value={selectedTypeName}
        onSelect={this.onTypeClicked.bind(this)}
      />
    );
  }
}

BSONTypeSelector.propTypes = {
  typeNumber: React.PropTypes.number,
  typeAlias: React.PropTypes.string,
  typeName: React.PropTypes.string,
  onTypeClicked: React.PropTypes.func.isRequired
};

BSONTypeSelector.displayName = 'BSONTypeSelector';

module.exports = BSONTypeSelector;
