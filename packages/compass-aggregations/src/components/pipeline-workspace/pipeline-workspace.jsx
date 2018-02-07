import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import Stage from 'components/stage';

import styles from './pipeline-workspace.less';

/**
 * The pipeline workspace component.
 */
@DragDropContext(HTML5Backend)
class PipelineWorkspace extends PureComponent {
  static displayName = 'PipelineWorkspace';

  static propTypes = {
    stages: PropTypes.array.isRequired
  }

  /**
   * Renders the pipeline workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const stages = this.props.stages.map((stage, i) => {
      return (<Stage {...this.props} stage={stage} index={i} key={stage.id} />);
    });
    return (
      <div className={classnames(styles['pipeline-workspace'])}>
        {stages}
      </div>
    );
  }
}

export default PipelineWorkspace;
