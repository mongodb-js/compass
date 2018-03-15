import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './pipeline-preview-toolbar.less';

/**
 * The pipeline preview toolbar component.
 */
class PipelinePreviewToolbar extends PureComponent {
  static displayName = 'PipelinePreviewToolbarComponent';

  static propTypes = {
    nameChanged: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    isValid: PropTypes.bool.isRequired
  }

  onNameChange = (evt) => {
    this.props.nameChanged(evt.target.value);
  }

  /**
   * Renders the pipeline preview toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const inputClassName = classnames({
      [ styles['pipeline-preview-toolbar-name']]: true,
      [ styles['pipeline-preview-toolbar-name-is-invalid']]: !this.props.isValid
    });
    return (
      <div className={classnames(styles['pipeline-preview-toolbar'])}>
        <input
          placeholder="Enter a pipeline name to save..."
          onChange={this.onNameChange}
          className={inputClassName}
          type="text"
          value={this.props.name} />
        <div className={classnames(styles['pipeline-preview-toolbar-spacer'])}></div>
      </div>
    );
  }
}

export default PipelinePreviewToolbar;
