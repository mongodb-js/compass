import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import Stage from 'components/stage';
import Input from 'components/input';

import styles from './pipeline-workspace.less';

/**
 * The pipeline workspace component.
 */
@DragDropContext(HTML5Backend)
class PipelineWorkspace extends PureComponent {
  static displayName = 'PipelineWorkspace';

  static propTypes = {
    pipeline: PropTypes.array.isRequired,
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired,
    refreshInputDocuments: PropTypes.func.isRequired,
    inputDocuments: PropTypes.object.isRequired
  }

  /**
   * Renders the pipeline workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const inputDocuments = this.props.inputDocuments;
    const stages = this.props.pipeline.map((stage, i) => {
      return (<Stage {...this.props} stage={stage} index={i} key={stage.id} />);
    });
    console.log(this.props);
    return (
      <div className={classnames(styles['pipeline-workspace'])}>
        <Input
          toggleInputDocumentsCollapsed={this.props.toggleInputDocumentsCollapsed}
          refreshInputDocuments={this.props.refreshInputDocuments}
          documents={inputDocuments.documents}
          isLoading={inputDocuments.isLoading}
          isExpanded={inputDocuments.isExpanded}
          count={inputDocuments.count} />
        {stages}
      </div>
    );
  }
}

export default PipelineWorkspace;
