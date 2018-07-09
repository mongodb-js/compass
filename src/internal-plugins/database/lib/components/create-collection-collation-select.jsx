const React = require('react');
const PropTypes = require('prop-types');
const Select = require('react-select-plus').default;
const { COLLATION_OPTIONS } = require('../constants');

/**
 * Component for the collation select.
 */
class CreateCollectionCollationSelect extends React.Component {
  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = {
      locale: 'simple',
      strength: '3',
      caseLevel: false,
      caseFirst: 'off',
      numericOrdering: false,
      alternate: 'non-ignorable',
      backwards: false,
      normalization: false
    };
  }

  /**
   * Update state with recieved props.
   *
   * @param {Object} nextProps - The next properties.
   */
  componentWillReceiveProps(nextProps) {
    this.setState(Object.assign({}, this.state, nextProps.collation));
  }

  /**
   * Create React dropdown items for each element in the fields array.
   * @param {Array} values - List of values for dropdown.
   *
   * @returns {Array} The React components for each item in the field and type dropdowns.
   */
  getDropdownFieldsSelect(values) {
    return values.map((elem) => ({
      value: (typeof elem === 'object') ? elem.value : elem,
      label: (typeof elem === 'object') ? elem.label : elem
    }));
  }

  /**
   * Render collation select.
   *
   * @returns {React.Component} The collation select.
   */
  render() {
    return COLLATION_OPTIONS.map((element) => {
      return (
        <div key={element.field} className="create-collection-dialog-collation-field">
          <p className="create-collection-dialog-collation-label">{element.label}</p>
          <Select
            value={this.state[element.field]}
            name={element.field}
            placeholder={`Select a ${element.field}`}
            options={this.getDropdownFieldsSelect(element.values)}
            onChange={this.props.onCollationOptionChange.bind(this, this.state, element.field)}
            clearable={false}
            searchable={false}
            className="create-collection-dialog-collation-select" />
        </div>
      );
    });
  }
}

CreateCollectionCollationSelect.displayName = 'CreateCollectionCollationSelect';

CreateCollectionCollationSelect.propTypes = {
  collation: PropTypes.object.isRequired,
  onCollationOptionChange: PropTypes.func.isRequired
};

module.exports = CreateCollectionCollationSelect;
