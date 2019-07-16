const path = require('path');
const React = require('react');
const ReactTooltip = require('react-tooltip');
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

    const options = { properties };

    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), options, (values) => {
      this.props.changeHandler(values);
      this.setState({ values });
    });
  }

  getClassName() {
    const className = 'form-item';

    if (this.props.error) {
      return `${className} form-item-has-error`;
    }

    return className;
  }

  getErrorId() {
    return `form-error-tooltip-${this.props.id}`;
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

  renderError() {
    if (this.props.error) {
      return (
        <i className="fa fa-exclamation-circle" aria-hidden="true" />
      );
    }
  }

  renderErrorTooltip() {
    if (this.props.error) {
      return (
        <ReactTooltip id={this.getErrorId()} />
      );
    }
  }

  renderFileNames() {
    const baseFiles = this.state.values.map((file) => path.basename(file));

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
    const tooltipOptions = this.props.error
      ? {
        'data-for': this.getErrorId(),
        'data-effect': 'solid',
        'data-place': 'bottom',
        'data-offset': "{'bottom': -2}",
        'data-tip': this.props.error,
        'data-type': 'error'
      }
      : {};

    return (
      <div className={this.getClassName()}>
        <label>
          <span className="form-item-label">
            {this.renderError()}
            {this.props.label}
          </span>
          {this.renderInfoSprinkle()}
        </label>
        <button
          id={this.props.id}
          className="form-item-file-button btn btn-sm btn-default"
          onClick={this.onClick.bind(this)}
          {...tooltipOptions}>
          <i className="fa fa-upload" aria-hidden />
          {this.renderButtonText()}
        </button>
        {this.renderErrorTooltip()}
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
  link: PropTypes.string,
  error: PropTypes.string
};

FormFileInput.defaultProps = { values: [] };
FormFileInput.displayName = 'FormFileInput';

module.exports = FormFileInput;
