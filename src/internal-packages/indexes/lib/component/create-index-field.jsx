const React = require('react');
const ButtonToolbar = require('react-bootstrap').ButtonToolbar;
const DropdownButton = require('react-bootstrap').DropdownButton;
const MenuItem = require('react-bootstrap').MenuItem;
const Action = require('../action/index-actions');

// const debug = require('debug')('mongodb-compass:component:indexes:create-modal');

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
    /*
    this.defaultName = 'Select a field name';
    this.defaultType = 'Select a type';

    this.state = {
      // default titles shown in dropdown
      name: this.defaultName,
      type: this.defaultType
    };*/
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
   * @param {string} name - The selected name.
   */
  selectName(name) {
    // this.setState({name: name});
    Action.updateFieldName(this.props.idx, name);
  }

  /**
   * Set state to selected type on type change.
   *
   * @param {string} type - The selected type.
   */
  selectType(type) {
    // this.setState({type: type});
    Action.updateFieldType(this.props.idx, type);
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
              title={this.props.field.name}
              id="field-name-select-dropdown"
              className="create-index-field-dropdown-name"
              onSelect={this.selectName.bind(this)}>
              {this.getDropdownOptions(this.props.fields)}
            </DropdownButton>
          </ButtonToolbar>
        </div>
        <div className="col-md-4">
          <ButtonToolbar>
            <DropdownButton
              title={this.props.field.type}
              id="field-type-select-dropdown"
              className="create-index-field-dropdown-type"
              onSelect={this.selectType.bind(this)}>
              {this.getDropdownOptions(INDEX_TYPES)}
            </DropdownButton>
          </ButtonToolbar>
        </div>
        <div className="col-md-2">
          <button disabled="true"
            className="btn btn-success btn-circle">
            <i className="fa fa-minus" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    );
  }
}

CreateIndexField.displayName = 'CreateIndexField';

CreateIndexField.propTypes = {
  fields: React.PropTypes.array.isRequired,
  field: React.PropTypes.object.isRequired,
  idx: React.PropTypes.number.isRequired
};

module.exports = CreateIndexField;
