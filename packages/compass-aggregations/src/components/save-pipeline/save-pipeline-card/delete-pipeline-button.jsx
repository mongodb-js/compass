import React, { PureComponent } from 'react';
import { IconButton } from 'hadron-react-buttons';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './delete-pipeline-button.module.less';

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
        <IconButton
          title="Delete"
          className={deleteStateButton}
          iconClassName="fa fa-trash-o"
          clickHandler={this.props.clickHandler} />
      </div>
    );
  }
}

export default DeletePipelineButton;
