const React = require('react');
<<<<<<< HEAD
// const FontAwesome = require('react-fontawesome');

class QueryOption extends React.Component {
  render() {
    let outerClass = `querybar-option querybar-option-is-${this.props.inputType}-type`;
    let innerClass = `querybar-option-input input-${this.props.label}`;
    if (this.props.hasError) {
      outerClass += ' querybar-option-has-error';
    }
=======

class QueryOption extends React.Component {
  render() {
    const outerClass = `querybar-option querybar-option-is-${this.props.inputType}-type`;
    let innerClass = `querybar-option-input input-${this.props.label}`;
>>>>>>> COMPASS-630 COMPASS-631 implement advanced query bar
    if (this.props.hasToggle) {
      innerClass += ' querybar-option-has-toggle';
    }
    return (
      <div className={outerClass}>
        <div className="querybar-option-label">
<<<<<<< HEAD
          { /** TODO (thomasr) include when documentation exists to link out to.
            /* <FontAwesome className="querybar-option-label-info" name="info-circle" />
             */ }
=======
>>>>>>> COMPASS-630 COMPASS-631 implement advanced query bar
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

<<<<<<< HEAD
=======

>>>>>>> COMPASS-630 COMPASS-631 implement advanced query bar
QueryOption.propTypes = {
  placeholder: React.PropTypes.string,
  label: React.PropTypes.string.isRequired,
  link: React.PropTypes.string.isRequired,
  inputType: React.PropTypes.oneOf(['numeric', 'document']).isRequired,
  value: React.PropTypes.string,
  hasToggle: React.PropTypes.bool,
<<<<<<< HEAD
  hasError: React.PropTypes.bool,
=======
>>>>>>> COMPASS-630 COMPASS-631 implement advanced query bar
  validationFunc: React.PropTypes.func,
  onChange: React.PropTypes.func
};

QueryOption.defaultProps = {
  placeholder: '',
  value: '',
  hasToggle: false
};

QueryOption.displayName = 'QueryOption';

module.exports = QueryOption;
