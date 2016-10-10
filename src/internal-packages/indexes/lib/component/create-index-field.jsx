const React = require('react');
const ButtonToolbar = require('react-bootstrap').ButtonToolbar;
const DropdownButton = require('react-bootstrap').DropdownButton;
const MenuItem = require('react-bootstrap').MenuItem;
const Action = require('../action/index-actions');

/**
 * Current allowed types for indexes.
 */
const INDEX_TYPES = ['1 (asc)', '-1 (desc)', '2dsphere'];

/**
 * Component for the index field form.
 */
class CreateIndexField extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = {
      // default titles shown in dropdown
      field: 'Add a Field',
      type: '1 (asc)'
    };
  }

  /**
   * Create React dropdown items for each element in the given array.
   *
   * @param {Array} arr - The array of options.
   *
   * @returns {Array} The React components for each item in the field and type dropdowns.
   */
  getDropdownOptions(arr) {
    return arr.map((elem, index) => (<MenuItem key={index} eventKey={elem}>{elem}</MenuItem>));
  }

  /**
   * Set state to selected field on field change.
   *
   * @param {string} field - The selected field.
   */
  handleFieldSelect(field) {
    this.setState({field: field});
  }

  /**
   * Fire add field action to add field and type to add index form.
   *
   * @param {Object} evt - The click event.
   */
  handleSubmit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if (this.state.field !== 'Add a Field') {
      Action.updateField(this.state.field, this.state.type, 'add');
    }
  }

  /**
   * Set state to selected type on type change.
   *
   * @param {string} type - The selected type.
   */
  handleTypeSelect(type) {
    this.setState({type: type});
  }

  /**
   * Render the index field form.
   *
   * @returns {React.Component} The index field form.
   */
  render() {
    return (
      <div className="form-inline row create-index-field">
        <div className="col-md-6">
          <ButtonToolbar>
            <DropdownButton
              title={this.state.field}
              id="field-name-select-dropdown"
              className="create-index-field-dropdown-name"
              onSelect={this.handleFieldSelect.bind(this)}>
              {this.getDropdownOptions(this.props.fields)}
            </DropdownButton>
          </ButtonToolbar>
        </div>
        <div className="col-md-4">
          <ButtonToolbar>
            <DropdownButton
              title={this.state.type}
              id="field-type-select-dropdown"
              className="create-index-field-dropdown-type"
              onSelect={this.handleTypeSelect.bind(this)}>
              {this.getDropdownOptions(INDEX_TYPES)}
            </DropdownButton>
          </ButtonToolbar>
        </div>
        <div className="col-md-2">
          <button
            onClick={this.handleSubmit.bind(this)}
            className="btn btn-success btn-circle create-index-field-button">
            <i className="fa fa-plus" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    );
  }
}

CreateIndexField.displayName = 'CreateIndexField';

CreateIndexField.propTypes = {
  fields: React.PropTypes.array.isRequired
};

module.exports = CreateIndexField;
