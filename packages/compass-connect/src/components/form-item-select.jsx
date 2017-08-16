const React = require('react');
const PropTypes = require('prop-types');

class FormItemSelect extends React.Component {
  render() {
    return (
      <div className="form-item">
        <label>
          <span className="form-item-label">{this.props.label}</span>
        </label>
        <select
          name={this.props.name}
          onChange={this.props.changeHandler}
          className="form-control"
          type="text">
          {this.props.options.map((option, i) => {
            const select = Object.keys(option);
            return <option key={i} value={select}>{option[select]}</option>;
          })}
        </select>
      </div>
    );
  }
}

FormItemSelect.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  changeHandler: PropTypes.func.isRequired
};

FormItemSelect.displayName = 'FormItemSelect';

module.exports = FormItemSelect;
