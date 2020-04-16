import React from 'react';
import PropTypes from 'prop-types';
import path from 'path';
import { remote, shell } from 'electron';
import classnames from 'classnames';

import styles from '../connect.less';

const dialog = remote.dialog;
const BrowserWindow = remote.BrowserWindow;

const OPEN = 'openFile';
const HIDDEN = 'showHiddenFiles';
const MULTI = 'multiSelections';

class FormFileInput extends React.Component {
  static displayName = 'FormFileInput';

  static propTypes = {
    label: PropTypes.string.isRequired,
    changeHandler: PropTypes.func.isRequired,
    id: PropTypes.string,
    values: PropTypes.array,
    multi: PropTypes.bool,
    link: PropTypes.string,
    error: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = { values: props.values };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.values !== this.state.values) {
      this.setState({ values: nextProps.values });
    }
  }

  /**
   * Handles a form item file button click.
   *
   * @param {Object} evt - evt.
   */
  onClick(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    const properties = [OPEN, HIDDEN];

    if (this.props.multi) {
      properties.push(MULTI);
    }

    const options = { properties };

    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), options).then((result) => {
      const values = result.filePaths;
      this.props.changeHandler(values);
      this.setState({ values });
    });
  }

  /**
   * Gets the class name for the input wrapper.
   *
   * @returns {String} The class name.
   */
  getClassName() {
    const className = {
      [styles['form-item']]: true,
      [styles['form-item-has-error']]: this.props.error
    };

    return classnames(className);
  }

  /**
   * Gets ReactTooltip id.
   *
   * @returns {String} ReactTooltip id.
   */
  getErrorId() {
    return `form-error-tooltip-${this.props.id}`;
  }

  /**
   * Opens a tooltip link.
   */
  openLink() {
    shell.openExternal(this.props.link);
  }

  /**
   * Renders a button text.
   *
   * @returns {String}
   */
  renderButtonText() {
    if (this.state.values && this.state.values.length > 0) {
      return this.renderFileNames();
    }

    return this.props.multi ? 'Select files...' : 'Select a file...';
  }

  /**
   * Renders file names.
   *
   * @returns {String}
   */
  renderFileNames() {
    const baseFiles = this.state.values.map((file) => path.basename(file));

    return baseFiles.join(', ');
  }

  /**
   * Renders an info sprinkle.
   *
   * @returns {React.Component}
   */
  renderInfoSprinkle() {
    if (this.props.link) {
      return (
        <i className={classnames(styles.help)} onClick={this.openLink.bind(this)} />
      );
    }
  }

  render() {
    const buttonClassName = `${classnames(styles['form-item-file-button'])} btn btn-sm btn-default`;

    return (
      <div className={this.getClassName()}>
        <label>
          <span>{this.props.label}</span>
          {this.renderInfoSprinkle()}
        </label>
        <button
          id={this.props.id}
          className={buttonClassName}
          onClick={this.onClick.bind(this)} >
          <i className="fa fa-upload" aria-hidden />
          {this.renderButtonText()}
        </button>
      </div>
    );
  }
}

export default FormFileInput;
