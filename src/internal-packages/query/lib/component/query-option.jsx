const React = require('react');
const PropTypes = require('prop-types');
const { InfoSprinkle } = require('hadron-react-components');
const { shell } = require('electron');

class QueryOption extends React.Component {

  renderTextInput(className) {
    return (
      <input
        id={`querybar-option-input-${this.props.label}`}
        className={className}
        type="text"
        value={this.props.value}
        onChange={this.props.onChange}
        placeholder={this.props.placeholder}
      />
    );
  }

  renderCheckboxInput(className) {
    return (
      <input
        id={`querybar-option-input-${this.props.label}`}
        className={className}
        type="checkbox"
        checked={this.props.value}
        onChange={this.props.onChange}
      />
    );
  }

  render() {
    let outerClass = `querybar-option querybar-option-is-${this.props.inputType}-type`;
    let innerClass = `querybar-option-input input-${this.props.label}`;
    if (this.props.hasError) {
      outerClass += ' querybar-option-has-error';
    }
    if (this.props.hasToggle) {
      innerClass += ' querybar-option-has-toggle';
    }
    const renderFunction = this.props.inputType === 'boolean' ?
      this.renderCheckboxInput.bind(this) : this.renderTextInput.bind(this);

    return (
      <div className={outerClass}>
        <div className="querybar-option-label">
          {this.props.label}
        </div>
        { renderFunction(innerClass) }
      </div>
    );
  }
}

QueryOption.propTypes = {
  placeholder: PropTypes.string,
  label: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  inputType: PropTypes.oneOf(['numeric', 'boolean', 'document']).isRequired,
  value: PropTypes.any,
  hasToggle: PropTypes.bool,
  hasError: PropTypes.bool,
  validationFunc: PropTypes.func,
  onChange: PropTypes.func
};

QueryOption.defaultProps = {
  placeholder: '',
  value: '',
  hasToggle: false
};

QueryOption.displayName = 'QueryOption';

module.exports = QueryOption;
