import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import InputBuilder from 'components/input-builder';
import InputPreview from 'components/input-preview';

import styles from './input-workspace.less';

/**
 * The input workspace component.
 */
class InputWorkspace extends PureComponent {
  static displayName = 'InputWorkspace';

  static propTypes = {
    documents: PropTypes.array.isRequired,
    openLink: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired
  }

  /**
   * Renders the input workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['input-workspace'])}>
        <InputBuilder openLink={this.props.openLink} />
        <InputPreview documents={this.props.documents} isLoading={this.props.isLoading} />
      </div>
    );
  }
}

export default InputWorkspace;
