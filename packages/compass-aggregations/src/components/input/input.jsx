import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import InputToolbar from 'components/input-toolbar';
import InputWorkspace from 'components/input-workspace';

import styles from './input.less';

class Input extends PureComponent {
  static displayName = 'InputComponent';

  static propTypes = {
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired,
    refreshInputDocuments: PropTypes.func.isRequired,
    documents: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    openLink: PropTypes.func.isRequired,
    count: PropTypes.number.isRequired
  }

  /**
   * Render the input component.
   *
   * @returns {Component} The component.
   */
  render() {
    const workspace = this.props.isExpanded ?
      (<InputWorkspace
        documents={this.props.documents}
        openLink={this.props.openLink}
        isLoading={this.props.isLoading} />) : null;
    return (
      <div className={classnames(styles.input)}>
        <InputToolbar
          toggleInputDocumentsCollapsed={this.props.toggleInputDocumentsCollapsed}
          refreshInputDocuments={this.props.refreshInputDocuments}
          isExpanded={this.props.isExpanded}
          count={this.props.count} />
        {workspace}
      </div>
    );
  }
}

export default Input;
