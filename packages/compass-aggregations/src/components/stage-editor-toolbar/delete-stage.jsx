import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { IconButton, Icon } from '@mongodb-js/compass-components';

import { removeStage } from '../../modules/pipeline-builder/stage-editor';
export class DeleteStage extends PureComponent {
  static propTypes = {
    index: PropTypes.number.isRequired,
    onStageDeleteClick: PropTypes.func.isRequired,
  };

  onStageDeleted = () => {
    this.props.onStageDeleteClick(this.props.index);
  };

  render() {
    const title = 'Delete Stage';

    return (
      <IconButton
        data-testid="delete-stage"
        onClick={this.onStageDeleted}
        title={title}
        aria-label={title}
      >
        <Icon glyph="Trash" size="small" />
      </IconButton>
    );
  }
}

export default connect(null, { onStageDeleteClick: removeStage })(DeleteStage);
