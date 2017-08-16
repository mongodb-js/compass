const React = require('react');
const PropTypes = require('prop-types');

class FormItemInput extends React.Component {

  render() {
    return (
      <div className="form-item">
        <label>
          <span className="form-item-label">{this.props.label}</span>
        </label>
        <input
          name={this.props.name}
          placeholder={this.props.placeholder}
          onBlur={this.props.blurHandler}
          className="form-control"
          type="text" />
      </div>
    );
  }
}

FormItemInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  blurHandler: PropTypes.func.isRequired,
  placeholder: PropTypes.string
};

FormItemInput.displayName = 'FormItemInput';

module.exports = FormItemInput;
