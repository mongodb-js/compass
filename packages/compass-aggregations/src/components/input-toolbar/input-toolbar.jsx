import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import InputBuilderToolbar from 'components/input-builder-toolbar';
import InputPreviewToolbar from 'components/input-preview-toolbar';

import styles from './input-toolbar.less';

/**
 * The input toolbar component.
 */
class InputToolbar extends PureComponent {
  static displayName = 'InputToolbarComponent';

  static propTypes = {
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired,
    refreshInputDocuments: PropTypes.func.isRequired,
    inputDocuments: PropTypes.object.isRequired
  }

  /**
   * Renders the input toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['input-toolbar'])}>
        <InputBuilderToolbar
          toggleInputDocumentsCollapsed={this.props.toggleInputDocumentsCollapsed}
          refreshInputDocuments={this.props.refreshInputDocuments}
          isExpanded={this.props.inputDocuments.isExpanded}
          count={this.props.inputDocuments.count} />
        <InputPreviewToolbar />
      </div>
    );
  }
}

export default InputToolbar;
