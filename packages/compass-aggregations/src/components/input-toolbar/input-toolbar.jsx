import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import InputBuilderToolbar from '../input-builder-toolbar';
import InputPreviewToolbar from '../input-preview-toolbar';

import styles from './input-toolbar.module.less';

/**
 * The input toolbar component.
 */
class InputToolbar extends PureComponent {
  static displayName = 'InputToolbarComponent';

  static propTypes = {
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired,
    refreshInputDocuments: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    count: PropTypes.number
  };

  /**
   * Renders the input toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={styles['input-toolbar']}>
        <InputBuilderToolbar
          toggleInputDocumentsCollapsed={
            this.props.toggleInputDocumentsCollapsed
          }
          refreshInputDocuments={this.props.refreshInputDocuments}
          isExpanded={this.props.isExpanded}
          count={this.props.count}
        />
        <InputPreviewToolbar />
      </div>
    );
  }
}

export default InputToolbar;
