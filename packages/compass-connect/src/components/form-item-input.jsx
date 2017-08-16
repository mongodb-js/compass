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
          onChange={this.props.changeHandler}
          onBlur={this.props.blurHandler}
          value={this.props.value}
          className="form-control"
          type={this.props.type || 'text'} />
      </div>
    );
  }
}

FormItemInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  changeHandler: PropTypes.func.isRequired,
  blurHandler: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]),
  type: PropTypes.string
};

FormItemInput.displayName = 'FormItemInput';

module.exports = FormItemInput;
