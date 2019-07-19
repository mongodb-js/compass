import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
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
    error: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.state = { values: props.values };
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

    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), options, (values) => {
      this.props.changeHandler(values);
      this.setState({ values });
    });
  }

  /**
   * Gets a proper class name for a state with error and without.
   *
   * @param {Object} recent - A recent connection.
   *
   * @returns {String} - A class name
   */
  getClassName() {
    const classnamesProps = [styles['form-item']];

    if (this.props.error) {
      classnamesProps.push(styles['form-item-has-error']);
    }

    return classnames(...classnamesProps);
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
   * Renders an error component.
   *
   * @returns {React.Component}
   */
  renderError() {
    if (this.props.error) {
      return (
        <i className="fa fa-exclamation-circle" aria-hidden="true" />
      );
    }
  }

  /**
   * Renders an error tooltip.
   *
   * @returns {React.Component}
   */
  renderErrorTooltip() {
    if (this.props.error) {
      return (
        <ReactTooltip id={this.getErrorId()} />
      );
    }
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
    const buttonClassName = `${classnames(styles['form-item-file-button'])} btn btn-sm btn-default`;

    return (
      <div className={this.getClassName()}>
        <label>
          <span className={classnames(styles['form-item-label'])}>
            {this.renderError()}
            {this.props.label}
          </span>
          {this.renderInfoSprinkle()}
        </label>
        <button
          id={this.props.id}
          className={buttonClassName}
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

export default FormFileInput;
