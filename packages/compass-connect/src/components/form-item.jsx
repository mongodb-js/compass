const React = require('react');
const PropTypes = require('prop-types');

class FormItem extends React.Component {

  render() {
    return (
      <div className="form-item">
        <label>
          <span className="form-item-label">{this.props.label}</span>
        </label>
        <input
          name={this.props.name}
          placeholder={this.props.placeholder}
          className="form-control"
          type="text" />
      </div>
    );
  }
}

FormItem.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string
};

FormItem.displayName = 'FormItem';

module.exports = FormItem;
