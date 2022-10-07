import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import InputToolbar from '../input-toolbar';
import InputWorkspace from '../input-workspace';

import styles from './input.module.less';

class Input extends PureComponent {
  static displayName = 'InputComponent';

  static propTypes = {
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired,
    refreshInputDocuments: PropTypes.func.isRequired,
    documents: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    count: PropTypes.number
  };

  /**
   * Render the input component.
   *
   * @returns {Component} The component.
   */
  render() {
    const workspace = this.props.isExpanded ? (
      <InputWorkspace
        documents={this.props.documents}
        isLoading={this.props.isLoading}
      />
    ) : null;
    return (
      <div className={styles.input}>
        <InputToolbar
          toggleInputDocumentsCollapsed={
            this.props.toggleInputDocumentsCollapsed
          }
          refreshInputDocuments={this.props.refreshInputDocuments}
          isExpanded={this.props.isExpanded}
          count={this.props.count}
        />
        {workspace}
      </div>
    );
  }
}

export default Input;
