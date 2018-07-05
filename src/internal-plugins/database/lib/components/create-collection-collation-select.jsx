const React = require('react');
const PropTypes = require('prop-types');
const Select = require('react-select-plus').default;

/**
 * Collation options for selects.
 */
const COLLATION_OPTIONS = [
  {
    field: 'locale',
    label: 'Locale',
    values: [
      {value: 'af', label: 'af'},
      {value: 'sq', label: 'sq'},
      {value: 'ar@collation=compat', label: 'ar - Arabic - compat'},
      {value: 'simple', label: 'simple'}
    ],
    required: true
  },
  {field: 'strength', label: 'Strength', values: ['1', '2', '3', '4', '5']},
  {field: 'caseLevel', label: 'Use Case-Level', values: ['true', 'false']},
  {field: 'caseFirst', label: 'Case First', values: ['upper', 'lower', 'off']},
  {field: 'numericOrdering', label: 'Numeric Ordering', values: ['true', 'false']},
  {field: 'alternate', label: 'Alternate', values: ['non-ignorable', 'shifted']},
  {field: 'maxVariable', label: 'Max-Variable', values: ['punct', 'space']},
  {field: 'backwards', label: 'Backwards', values: ['true', 'false']},
  {field: 'normalization', label: 'Normalization', values: ['true', 'false']}
];

/**
 * Component for the collation select.
 */
class CreateCollectionCollationSelect extends React.Component {
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
            value={this.props.collation[element.field]}
            name={element.field}
            placeholder={`Select a ${element.field}`}
            options={this.getDropdownFieldsSelect(element.values)}
            onChange={this.props.onCollationOptionChange.bind(this, element.field)}
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
