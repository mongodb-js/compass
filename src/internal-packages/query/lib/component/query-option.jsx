const React = require('react');
const PropTypes = require('prop-types');
// const FontAwesome = require('react-fontawesome');

class QueryOption extends React.Component {
  render() {
    let outerClass = `querybar-option querybar-option-is-${this.props.inputType}-type`;
    let innerClass = `querybar-option-input input-${this.props.label}`;
    if (this.props.hasError) {
      outerClass += ' querybar-option-has-error';
    }
    if (this.props.hasToggle) {
      innerClass += ' querybar-option-has-toggle';
    }
    return (
      <div className={outerClass}>
        <div className="querybar-option-label">
          { /** TODO (thomasr) include when documentation exists to link out to.
            /* <FontAwesome className="querybar-option-label-info" name="info-circle" />
             */ }
          {this.props.label}
        </div>
        <input
          id={`querybar-option-input-${this.props.label}`}
          className={innerClass}
          type="text"
          value={this.props.value}
          onChange={this.props.onChange}
          placeholder={this.props.placeholder}
        />
      </div>
    );
  }
}

QueryOption.propTypes = {
  placeholder: PropTypes.string,
  label: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  inputType: PropTypes.oneOf(['numeric', 'document']).isRequired,
  value: PropTypes.string,
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
