import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import getShellJS from '../../utils/get-shell-js';
import { Editor, EditorVariant } from '@mongodb-js/compass-components';

import styles from './query-viewer.module.less';

/**
 * Options for the ACE editor.
 */
const OPTIONS = {
  minLines: 5,
  showGutter: false,
  fixedWidthGutter: false,
  highlightActiveLine: false,
  highlightGutterLine: false
};

/**
 * Show a query in the modal.
 */
class QueryViewer extends PureComponent {
  static displayName = 'QueryViewerComponent';

  static propTypes = {
    query: PropTypes.object.isRequired,
    disabled: PropTypes.bool.isRequired,
    ns: PropTypes.string.isRequired,
  };

  /**
   * Render the query viewer component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['query-viewer'])}>
        <Editor
          text={getShellJS(this.props.ns, this.props.query)}
          variant={EditorVariant.Shell}
          options={OPTIONS}
          readOnly
        />
      </div>
    );
  }
}

export default QueryViewer;
