const React = require('react');
const PropTypes = require('prop-types');
const Select = require('react-select-plus').default;
const { COLLATION_OPTIONS } = require('../constants');
const _ = require('lodash');

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
    const unifiedValues = values.map((elem) => ({
      value: (typeof elem === 'object') ? elem.value : elem,
      label: (typeof elem === 'object') ? elem.label : elem
    }));

    return _.sortBy(unifiedValues, 'value');
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
            onChange={this.props.onCollationOptionChange.bind(this, this.state, element.field)}
            className="create-collection-dialog-collation-select"
            clearable={false} />
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
