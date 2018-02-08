import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PipelineBuilderToolbar from 'components/pipeline-builder-toolbar';
import PipelinePreviewToolbar from 'components/pipeline-preview-toolbar';

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
        <PipelineBuilderToolbar {...this.props} />
        <PipelinePreviewToolbar />
      </div>
    );
  }
}

export default PipelineToolbar;
