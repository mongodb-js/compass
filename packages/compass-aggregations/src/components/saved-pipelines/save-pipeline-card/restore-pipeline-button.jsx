import React, { PureComponent } from 'react';
import { TextButton } from 'hadron-react-buttons';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './restore-pipeline-button.module.less';

/**
 * restore pipeline open button
 */
class RestorePipelineButton extends PureComponent {
  static displayName = 'RestorePipelineButtonComponent';

  static propTypes = {
    clickHandler: PropTypes.func.isRequired
  }

  render() {
    const restoreStateButton = classnames({
      'btn': true,
      'btn-xs': true,
      'btn-default': true,
      [ styles['restore-pipeline-button'] ]: true
    });

    return (
      <div className={classnames(styles['restore-pipeline'])}>
        <TextButton
          text="Open"
          className={restoreStateButton}
          clickHandler={this.props.clickHandler} />
      </div>
    );
  }
}

export default RestorePipelineButton;
