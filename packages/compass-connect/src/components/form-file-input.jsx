const path = require('path');
const React = require('react');
const PropTypes = require('prop-types');

class FormFileInput extends React.Component {

  constructor(props) {
    super(props);
    this.state = { value: props.value };
  }

  onFileChanged() {
    const filePath = this.refs.file.files[0].path;
    this.setState({ value: filePath });
    this.props.changeHandler(filePath);
  }

  render() {
    return (
      <div className="form-item">
        <label>
          <span className="form-item-label">{this.props.label}</span>
        </label>
        <label className="form-item-file-label" htmlFor={this.props.name}>
          <i className="fa fa-upload" aria-hidden />
          {this.state.value ? path.basename(this.state.value) : 'Select a file...'}
        </label>
        <input
          ref="file"
          className="file-input"
          name={this.props.name}
          id={this.props.name}
          onChange={this.onFileChanged.bind(this)}
          value={this.props.value}
          type="file" />
      </div>
    );
  }
}

FormFileInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  changeHandler: PropTypes.func.isRequired,
  value: PropTypes.string
};

FormFileInput.displayName = 'FormFileInput';

module.exports = FormFileInput;
