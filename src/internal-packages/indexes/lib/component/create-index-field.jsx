const React = require('react');
const ButtonToolbar = require('react-bootstrap').ButtonToolbar;
const DropdownButton = require('react-bootstrap').DropdownButton;
const MenuItem = require('react-bootstrap').MenuItem;
const StatusStore = require('../store/ddl-status-store');
const Action = require('../action/index-actions');

// const debug = require('debug')('mongodb-compass:indexes:create-index-field');

/**
 * Current allowed types for indexes.
 */
const INDEX_TYPES = ['1 (asc)', '-1 (desc)', '2dsphere'];

/**
 * Default values for field name and type as presented in the UI
 */
const DEFAULT_FIELD = {
  name: 'Select a field name',
  type: 'Select a type'
};

/**
 * Component for the index field form.
 */
class CreateIndexField extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hasStartedValidating: false,
      isNameValid: true,
      isTypeValid: true
    };
  }

  componentDidMount() {
    this._unsubscribeStatusStore = StatusStore.listen(this.statusChanged.bind(this));
  }

  componentWillReceiveProps() {
    this.validate(false);
  }

  componentWillUnmount() {
    this._unsubscribeStatusStore();
  }

  /**
   * Create React dropdown items for each element in the fields array.
   *
   * @returns {Array} The React components for each item in the field and type dropdowns.
   */
  getDropdownFields() {
    return this.props.fields.map((elem, index) => (
      <MenuItem key={index}
        disabled={this.props.disabledFields.some(field => (field === elem))}
        eventKey={elem}>{elem}
      </MenuItem>));
  }

  /**
   * Create React dropdown items for each element in the INDEX_TYPES array.
   *
   * @returns {Array} The React components for each item in the field and type dropdowns.
   */
  getDropdownTypes() {
    return INDEX_TYPES.map((elem, index) => (<MenuItem key={index} eventKey={elem}>{elem}</MenuItem>));
  }

  /**
   * Set state to selected field on field change.
   *
   * @param {string} name - The selected name.
   */
  selectName(name) {
    Action.updateFieldName(this.props.idx, name);
  }

  /**
   * Set state to selected type on type change.
   *
   * @param {string} type - The selected type.
   */
  selectType(type) {
    Action.updateFieldType(this.props.idx, type);
  }

  /**
   * Remove this index field
   *
   * @param {object} evt The click event.
   */
  remove(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Action.removeIndexField(this.props.idx);
  }

  statusChanged() {
    this.validate(true);
  }

  validate(force) {
    if (!force && !this.state.hasStartedValidating) {
      return;
    }
    this.setState({
      hasStartedValidating: true,
      isTypeValid: this.props.field.type !== '',
      isNameValid: this.props.field.name !== ''
    });
  }

  /**
   * Render the index field form.
   *
   * @returns {React.Component} The index field form.
   */
  render() {
    const fieldName = this.props.field.name || DEFAULT_FIELD.name;
    const fieldType = this.props.field.type || DEFAULT_FIELD.type;

    const hasNameError = this.state.isNameValid ? '' : 'has-error';
    const hasTypeError = this.state.isTypeValid ? '' : 'has-error';

    return (
      <div className="form-inline row create-index-field">
        <div className="col-md-6" data-test-id="create-index-modal-field-select">
          <ButtonToolbar>
            <DropdownButton
              title={fieldName}
              id="field-name-select-dropdown"
              className={`create-index-field-dropdown-name ${hasNameError}`}
              onSelect={this.selectName.bind(this)}>
              {this.getDropdownFields(this.props.fields)}
            </DropdownButton>
          </ButtonToolbar>
        </div>
        <div className="col-md-4" data-test-id="create-index-modal-type-select">
          <ButtonToolbar>
            <DropdownButton
              title={fieldType}
              id="field-type-select-dropdown"
              className={`create-index-field-dropdown-type ${hasTypeError}`}
              onSelect={this.selectType.bind(this)}>
              {this.getDropdownTypes(INDEX_TYPES)}
            </DropdownButton>
          </ButtonToolbar>
        </div>
        <div className="col-md-2">
          <button disabled={this.props.isRemovable}
            className="btn btn-primary btn-circle"
            onClick={this.remove.bind(this)}>
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
  idx: React.PropTypes.number.isRequired,
  disabledFields: React.PropTypes.array.isRequired,
  isRemovable: React.PropTypes.bool.isRequired
};

module.exports = CreateIndexField;
