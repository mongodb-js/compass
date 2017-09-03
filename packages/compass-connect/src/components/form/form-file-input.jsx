const path = require('path');
const React = require('react');
const { remote, shell } = require('electron');
const dialog = remote.dialog;
const BrowserWindow = remote.BrowserWindow;
const PropTypes = require('prop-types');

const OPEN = 'openFile';
const HIDDEN = 'showHiddenFiles';
const MULTI = 'multiSelections';

class FormFileInput extends React.Component {

  constructor(props) {
    super(props);
    this.state = { values: props.values };
  }

  onClick(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const properties = [ OPEN, HIDDEN ];
    if (this.props.multi) {
      properties.push(MULTI);
    }
    const options = { properties: properties };
    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), options, (files) => {
      this.props.changeHandler(files);
      this.setState({ values: files });
    });
  }

  openLink() {
    shell.openExternal(this.props.link);
  }

  renderButtonText() {
    if (this.state.values && this.state.values.length > 0) {
      return this.renderFileNames();
    }
    return this.props.multi ? 'Select files...' : 'Select a file...';
  }

  renderFileNames() {
    const baseFiles = this.state.values.map((file) => {
      return path.basename(file);
    });
    return baseFiles.join(', ');
  }

  renderInfoSprinkle() {
    if (this.props.link) {
      return (
        <i className="help" onClick={this.openLink.bind(this)} />
      );
    }
  }

  render() {
    return (
      <div className="form-item">
        <label>
          <span className="form-item-label">{this.props.label}</span>
          {this.renderInfoSprinkle()}
        </label>
        <button
          id={this.props.id}
          className="form-item-file-button btn btn-sm btn-default"
          onClick={this.onClick.bind(this)}>
          <i className="fa fa-upload" aria-hidden />
          {this.renderButtonText()}
        </button>
      </div>
    );
  }
}

FormFileInput.propTypes = {
  label: PropTypes.string.isRequired,
  changeHandler: PropTypes.func.isRequired,
  id: PropTypes.string,
  values: PropTypes.array,
  multi: PropTypes.bool,
  link: PropTypes.string
};

FormFileInput.defaultProps = {
  values: []
};

FormFileInput.displayName = 'FormFileInput';

module.exports = FormFileInput;
