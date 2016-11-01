const React = require('react');
const app = require('ampersand-app');
const _ = require('lodash');
const FormGroup = require('react-bootstrap').FormGroup;
const InputGroup = require('react-bootstrap').InputGroup;
const FormControl = require('react-bootstrap').FormControl;
const DropdownButton = require('react-bootstrap').DropdownButton;
const ControlLabel = require('react-bootstrap').ControlLabel;
const MenuItem = require('react-bootstrap').MenuItem;
const TypeChecker = require('hadron-type-checker');

// const debug = require('debug')('mongodb-compass:validation:action-selector');

/**
  * The version at which high precision values are available.
  */
const HP_VERSION = '3.4.0';

/**
 * A RangeInput represents a numeric lower or upper bound and the value of the
 * lower or upper bound, if the bound exists.
 *
 * The `validationState` of this RangeInput can be set to 'error' either:
 *  - by the RangeInput validating the `value` prop is not of type `number`, or
 *  - by the RangeInput's parent `RuleCategoryRange` component validating the
 *    combined range expression, such as `5 < x < 5` is displayed as red/error
 *    even though the RangeInputs `5 < x` and `5 > x` are individually valid.
 */
class RangeInput extends React.Component {

  constructor(props) {
    super(props);
    const op = this._getOperatorString(props);
    this.state = {
      disabled: op === 'none',
      operator: op,
      value: this.props.value,
      validationState: null
    };
    this._ENABLE_HP = app.instance && (
      app.instance.build.version >= HP_VERSION);
  }

  componentWillMount() {
    // Render any existing schema errors in red
    this.validate();
  }

  onInputChange(evt) {
    this.setState({
      value: evt.target.value
    });
  }

  onInputBlur() {
    this.validate();
  }

  onDropdownSelect(evtKey) {
    this.setState({
      disabled: evtKey === 'none',
      operator: evtKey
    });
    this.validate();
  }

  validate() {
    const value = this.state.value;
    const valueTypes = TypeChecker.castableTypes(value, this._ENABLE_HP);

    // Not sure if hadron-type-checker should make NUMBER_TYPES public
    const NUMBER_TYPES = [
      'Long',
      'Int32',
      'Double',
      'Decimal128'
    ];

    if (!_.intersection(valueTypes, NUMBER_TYPES).length) {
      this.setState({
        validationState: 'error'
      });
    } else {
      this.setState({
        validationState: null
      });
    }
    // Get the parent to update both RangeInput component states
    if (this.props.onRangeInputBlur) {
      _.defer(this.props.onRangeInputBlur);
    }
  }

  _getOperatorString(props) {
    props = props || this.props;

    if (props.disabled) {
      return 'none';
    }
    if (props.upperBound) {
      return props.boundIncluded ? '<=' : '<';
    }
    return props.boundIncluded ? '>=' : '>';
  }

  renderMenuItems() {
    if (this.props.upperBound) {
      return [
        <MenuItem key="<" eventKey="<" href="#">&lt;</MenuItem>,
        <MenuItem key="<=" eventKey="<=" href="#">&lt;=</MenuItem>,
        <MenuItem key="none" eventKey="none" href="#">none</MenuItem>
      ];
    }
    return [
      <MenuItem key=">" eventKey=">" href="#">&gt;</MenuItem>,
      <MenuItem key=">=" eventKey=">=" href="#">&gt;=</MenuItem>,
      <MenuItem key="none" eventKey="none" href="#">none</MenuItem>
    ];
  }


  /**
   * Render validation range input component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const boundString = `${this.props.upperBound ?
        'upper' : 'lower'} bound`.toUpperCase();

    // disabled, only show dropdown
    if (this.state.disabled) {
      return (
        <FormGroup>
          <DropdownButton
            id={`range-input-${this.props.upperBound ? 'upper' : 'lower'}`}
            style={{width: this.props.width}}
            title={this.state.operator}
            onSelect={this.onDropdownSelect.bind(this)}>
            {this.renderMenuItems()}
          </DropdownButton>
        </FormGroup>
      );
    }
    // not disabled, render input group with value input and operator dropdown
    const placeholder = `${boundString}`.toLowerCase();

    return (
      <FormGroup validationState={this.props.validationState || this.state.validationState}>
        <InputGroup style={{width: this.props.width}}>
          <DropdownButton
            id={`range-input-${this.props.upperBound ? 'upper' : 'lower'}`}
            componentClass={InputGroup.Button}
            title={this.state.operator}
            onSelect={this.onDropdownSelect.bind(this)}>
            {this.renderMenuItems()}
          </DropdownButton>
          <FormControl
            ref="input"
            type="text"
            placeholder={placeholder}
            value={this.state.value}
            onChange={this.onInputChange.bind(this)}
            onBlur={this.onInputBlur.bind(this)}/>
        </InputGroup>
      </FormGroup>
    );
  }
}

RangeInput.propTypes = {
  value: React.PropTypes.string,  // Can't be required to allow "none" in GUI,
                                  // can't be number to work with Decimal128.
  upperBound: React.PropTypes.bool,
  validationState: React.PropTypes.string,
  boundIncluded: React.PropTypes.bool.isRequired,
  disabled: React.PropTypes.bool.isRequired,
  onRangeInputBlur: React.PropTypes.func,
  width: React.PropTypes.number
};

RangeInput.defaultProps = {
  disabled: false,
  boundIncluded: false,
  upperBound: false,
  validationState: null,
  value: '',
  width: 160
};

RangeInput.displayName = 'RangeInput';

module.exports = RangeInput;
