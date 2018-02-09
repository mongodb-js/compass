import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import InputToolbar from 'components/input-toolbar';
import InputWorkspace from 'components/input-workspace';

import styles from './input.less';

class Input extends Component {
  static displayName = 'InputComponent';

  static propTypes = {
    inputDocuments: PropTypes.object.isRequired
  }

  /**
   * Render the input component.
   *
   * @returns {Component} The component.
   */
  render() {
    const workspace = this.props.inputDocuments.isExpanded ?
      <InputWorkspace {...this.props} /> : null;
    return (
      <div className={classnames(styles.input)}>
        <InputToolbar {...this.props} />
        {workspace}
      </div>
    );
  }
}

export default Input;
