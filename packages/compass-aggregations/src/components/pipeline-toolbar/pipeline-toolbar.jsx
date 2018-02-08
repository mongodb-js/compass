import React, { PureComponent } from 'react';
import classnames from 'classnames';
import BuilderToolbar from 'components/builder-toolbar';
import PreviewToolbar from 'components/preview-toolbar';

import styles from './pipeline-toolbar.less';

/**
 * The toolbar component.
 */
class PipelineToolbar extends PureComponent {
  static displayName = 'ToolbarComponent';

  /**
   * Renders the toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['pipeline-toolbar'])}>
        <BuilderToolbar {...this.props} />
        <PreviewToolbar />
      </div>
    );
  }
}

export default PipelineToolbar;
