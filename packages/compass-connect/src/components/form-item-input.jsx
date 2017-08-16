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
  placeholder: PropTypes.string,
  value: PropTypes.string,
  type: PropTypes.string
};

FormItemInput.displayName = 'FormItemInput';

module.exports = FormItemInput;
