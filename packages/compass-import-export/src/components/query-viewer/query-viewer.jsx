import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import getShellJS from '../../utils/get-shell-js';

import styles from './query-viewer.module.less';

import 'ace-builds';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'mongodb-ace-theme';

/**
 * Options for the ACE editor.
 */
const OPTIONS = {
  tabSize: 2,
  fontSize: 11,
  minLines: 5,
  maxLines: Infinity,
  showGutter: false,
  readOnly: true,
  fixedWidthGutter: false,
  highlightActiveLine: false,
  highlightGutterLine: false,
  useWorker: false,
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
        <AceEditor
          mode="javascript"
          theme="mongodb"
          width="100%"
          value={getShellJS(this.props.ns, this.props.query)}
          editorProps={{ $blockScrolling: Infinity }}
          setOptions={OPTIONS}
        />
      </div>
    );
  }
}

export default QueryViewer;
