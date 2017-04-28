const React = require('react');
const PropTypes = require('prop-types');
const app = require('hadron-app');
const _ = require('lodash');
const FormGroup = require('react-bootstrap').FormGroup;
const InputGroup = require('react-bootstrap').InputGroup;
const FormControl = require('react-bootstrap').FormControl;
const DropdownButton = require('react-bootstrap').DropdownButton;
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
      hidden: op === 'none',
      operator: op,
      value: this.props.value,
      isValid: true,
      hasStartedValidating: false
    };
    this._ENABLE_HP = app.instance && (
      app.instance.build.version >= HP_VERSION);
  }

  /**
   * called whenever the input changes (i.e. user is typing). We don't bubble up the
   * value at this stage yet, but wait until the user blurs the input field.
   *
   * @param {Object} evt   The onChange event
   */
  onInputChange(evt) {
    this.setState({
      value: evt.target.value
    });
  }

  /**
   * called whenever the field is blurred (loses focus). At this point, we want to
   * validate the input and if it is valid, report the value change up to the parent.
   */
  onInputBlur() {
    this.validate(true);
    this.props.onRangeInputBlur({
      value: this.state.value,
      operator: this.state.operator
    });
  }

  /**
   * called when the user chooses a value from the operator dropdown. As there are
   * no invalid values, we can always immediately report up the value/operator change.
   *
   * @param {Object} evtKey    the selected value from the dropdown (e.g. "<=", "none", ...)
   */
  onDropdownSelect(evtKey) {
    this.setState({
      hidden: evtKey === 'none',
      operator: evtKey
    });
    this.props.onRangeInputBlur({
      value: this.state.value,
      operator: evtKey
    });
  }

  /**
   * determines if the input by itself is valid (e.g. a value that can be
   * cast to a number).
   *
   * @param {Boolean} force    forces validation from now on.
   * @return {Boolean}         whether the input is valid or not.
   */
  validate(force) {
    if (!force && !this.state.hasStartedValidating) {
      return true;
    }
    if (this.state.hidden) {
      return true;
    }
    const value = this.state.value;
    const valueTypes = TypeChecker.castableTypes(value, this._ENABLE_HP);

    // Not sure if hadron-type-checker should make NUMBER_TYPES public
    const NUMBER_TYPES = [
      'Long',
      'Int32',
      'Double',
      'Decimal128'
    ];

    const isValid = (_.intersection(valueTypes, NUMBER_TYPES).length > 0);
    this.setState({
      isValid: isValid,
      hasStartedValidating: true
    });
    return isValid;
  }

  _getOperatorString(props) {
    props = props || this.props;

    if (props.hidden) {
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
        'Upper' : 'Lower'} bound`;

    // hidden, only show dropdown
    if (this.state.hidden) {
      return (
        <FormGroup>
          <DropdownButton
            id={`range-input-${this.props.upperBound ? 'upper' : 'lower'}`}
            style={{width: this.props.width}}
            title={this.state.operator}
            onSelect={this.onDropdownSelect.bind(this)}
            disabled={this.props.disabled}>
            {this.renderMenuItems()}
          </DropdownButton>
        </FormGroup>
      );
    }
    // not hidden, render input group with value input and operator dropdown
    const placeholder = `${boundString}`;
    const validationState = this.state.isValid ? null : 'error';
    return (
      <FormGroup validationState={this.props.validationState || validationState}>
        <InputGroup style={{width: this.props.width}}>
          <DropdownButton
            className="range-dropdown"
            id={`range-input-${this.props.upperBound ? 'upper' : 'lower'}`}
            componentClass={InputGroup.Button}
            title={this.state.operator}
            onSelect={this.onDropdownSelect.bind(this)}
            disabled={this.props.disabled}>
            {this.renderMenuItems()}
          </DropdownButton>
          <FormControl
            ref="input"
            type="text"
            placeholder={placeholder}
            value={this.state.value}
            onChange={this.onInputChange.bind(this)}
            onBlur={this.onInputBlur.bind(this)}
            disabled={this.props.disabled}/>
        </InputGroup>
      </FormGroup>
    );
  }
}

RangeInput.propTypes = {
  value: PropTypes.string,  // Can't be required to allow "none" in GUI,
                                  // can't be number to work with Decimal128.
  upperBound: PropTypes.bool,
  validationState: PropTypes.string,
  boundIncluded: PropTypes.bool.isRequired,
  hidden: PropTypes.bool.isRequired,
  onRangeInputBlur: PropTypes.func,
  width: PropTypes.number,
  disabled: PropTypes.bool
};

RangeInput.defaultProps = {
  hidden: false,
  boundIncluded: false,
  upperBound: false,
  validationState: null,
  value: '',
  width: 160,
  disabled: false
};

RangeInput.displayName = 'RangeInput';

module.exports = RangeInput;
