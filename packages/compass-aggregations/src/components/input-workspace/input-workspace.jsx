import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Resizable } from 're-resizable';

import InputBuilder from '../input-builder';
import InputPreview from '../input-preview';
import ResizeHandle from '../resize-handle';

import styles from './input-workspace.module.less';

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
 * The input workspace component.
 */
class InputWorkspace extends PureComponent {
  static displayName = 'InputWorkspace';

  static propTypes = {
    documents: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired
  }

  /**
   * Renders the input workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={styles['input-workspace']}>
        <Resizable
          defaultSize={{
            width: '388px',
            height: 'auto'
          }}
          minWidth="220px"
          maxWidth="92%"
          enable={resizeableDirections}
          ref={c => { this.resizableRef = c; }}
          handleWrapperClass={styles['stage-resize-handle-wrapper']}
          handleComponent={{
            right: <ResizeHandle />,
          }}
        >
          <InputBuilder />
        </Resizable>
        <InputPreview documents={this.props.documents} isLoading={this.props.isLoading} />
      </div>
    );
  }
}

export default InputWorkspace;
