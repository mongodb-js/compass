import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import classnames from 'classnames';
import toJavascriptString from 'javascript-stringify';

import styles from './query-viewer.less';

import 'brace/mode/javascript';
import 'mongodb-ace-theme';

/**
 * Options for the ACE editor.
 */
const OPTIONS = {
  tabSize: 2,
  fontSize: 11,
  minLines: 5,
  maxLines: Infinity,
  showGutter: true,
  readOnly: true,
  highlightActiveLine: false,
  highlightGutterLine: false,
  useWorker: false
};

/**
 * Show a query in the modal.
 */
class QueryViewer extends PureComponent {
  static displayName = 'QueryViewerComponent';

  static propTypes = {
    query: PropTypes.object.isRequired
  }

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
          value={toJavascriptString(this.props.query.filter, null, '  ')}
          editorProps={{ $blockScrolling: Infinity }}
          setOptions={OPTIONS} />
      </div>
    );
  }
}

export default QueryViewer;
