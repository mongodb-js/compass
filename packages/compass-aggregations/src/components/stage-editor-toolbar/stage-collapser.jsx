import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { IconButton, Icon } from '@mongodb-js/compass-components';

import { changeStageCollapsed } from '../../modules/pipeline-builder/stage-editor';
export class StageCollapser extends PureComponent {
  static propTypes = {
    index: PropTypes.number.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  onStageCollapseToggled = () => {
    this.props.onChange(this.props.index, this.props.isExpanded);
  };

  render() {
    const { isExpanded } = this.props;

    return (
      <IconButton
        onClick={this.onStageCollapseToggled}
        title={isExpanded ? 'Collapse' : 'Expand'}
      ><Icon glyph={isExpanded ? 'ChevronDown' : 'ChevronRight'} size="small" /></IconButton>
    );
  }
}

export default connect(
  (state, ownProps) => {
    return {
      isExpanded:
        !state.pipelineBuilder.stageEditor.stages[ownProps.index].collapsed
    };
  },
  { onChange: changeStageCollapsed }
)(StageCollapser);
