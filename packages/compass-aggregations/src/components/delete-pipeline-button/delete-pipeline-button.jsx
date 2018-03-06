import React, { PureComponent } from 'react';
import { TextButton } from 'hadron-react-buttons';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './delete-pipeline-button.less';

/**
 * delete pipeline open button
 */
class DeletePipelineButton extends PureComponent {
  static displayName = 'DeletePipelineButtonComponent';

  static propTypes = {
    clickHandler: PropTypes.func.isRequired
  }

  render() {
    const deleteStateButton = classnames({
      'btn': true,
      'btn-xs': true,
      'btn-default': true,
      [ styles['delete-pipeline-button'] ]: true
    });

    return (
      <div className={classnames(styles['delete-pipeline'])}>
        <TextButton
          text="Delete"
          className={deleteStateButton}
          clickHandler={this.props.clickHandler} />
      </div>
    );
  }
}

export default DeletePipelineButton;
