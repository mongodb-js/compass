import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Resizable } from 're-resizable';
import { sortableHandle } from 'react-sortable-hoc';
import { connect } from 'react-redux';
import ResizeHandle from '../resize-handle/resize-handle';
import StageEditorToolbar from '../stage-editor-toolbar';
import StageEditor from '../stage-editor';
import StagePreview from '../stage-preview';
import StagePreviewToolbar from '../stage-preview-toolbar';
import styles from './stage.module.less';

const DragHandleToolbar = sortableHandle((props) => {
  return <StageEditorToolbar {...props}></StageEditorToolbar>
})

const resizeableDirections = {
  top: false,
  right: true,
  bottom: false,
  left: false,
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false
};

/**
 * The default CSS opacity for the HTMLElement
 * when not dragging or enabled.
 * @constant {Number}
 */
const DEFAULT_OPACITY = 0.6;

/**
 * Display a single stage in the aggregation pipeline.
 *
 * Decorators added for giving the component drag/drop behaviour.
 */
class Stage extends PureComponent {
  static propTypes = {
    index: PropTypes.number.isRequired,
    isEnabled: PropTypes.bool,
    isExpanded: PropTypes.bool,
    isAutoPreviewing: PropTypes.bool,
    hasServerError: PropTypes.bool,
  };

  /**
   * What the current CSS opacity for the Stage HTMLElement should be.
   * @returns {Number} The opacity value.
   */
  getOpacity() {
    if (this.props.isEnabled) {
      return 1;
    }
    return DEFAULT_OPACITY;
  }

  renderEditor() {
    return (
      <>
        <DragHandleToolbar index={this.props.index} />
        {this.props.isExpanded && (
          <StageEditor index={this.props.index} />
        )}
      </>
    );
  }

  renderResizableEditor() {
    const { isAutoPreviewing } = this.props;
    const editor = this.renderEditor();
    if (!isAutoPreviewing) {
      return <div className={styles['stage-editor-no-preview']}>{editor}</div>;
    }
    return (
      <Resizable
        className={styles['stage-editor']}
        defaultSize={{
          width: '388px',
          height: 'auto',
        }}
        minWidth="260px"
        maxWidth="92%"
        enable={resizeableDirections}
        ref={(c) => {
          this.resizableRef = c;
        }}
        handleWrapperClass={styles['stage-resize-handle-wrapper']}
        handleComponent={{
          right: <ResizeHandle />,
        }}
      >
        {editor}
      </Resizable>
    );
  }

  renderPreview() {
    return (
      <div className={styles['stage-preview-container']}>
        <StagePreviewToolbar index={this.props.index} />
        {this.props.isExpanded && (
          <StagePreview index={this.props.index} />
        )}
      </div>
    );
  }

  /**
   * Render the stage component.
   *
   * @returns {Component} The component.
   */
  render() {
    const opacity = this.getOpacity();
    return (
      <div
        data-testid="stage-container"
        data-stage-index={this.props.index}
        className={classnames(styles['stage-container'], {
          [styles['stage-container-is-first']]: this.props.index === 0
        })}
      >
        <div className={classnames(styles.stage, {
          [styles['stage-errored']]: this.props.hasServerError
        })} style={{ opacity }}>
          {this.renderResizableEditor()}
          {this.props.isAutoPreviewing && this.renderPreview()}
        </div>
      </div>
    );
  }
}

export default connect((state, ownProps) => {
  const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index]
  return {
    isEnabled: !stage.disabled,
    isExpanded: !stage.collapsed,
    hasServerError: !!stage.serverError,
    isAutoPreviewing: state.autoPreview
  };
}, null)(Stage);
