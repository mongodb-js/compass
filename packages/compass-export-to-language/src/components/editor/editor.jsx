import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import 'ace-builds';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-csharp';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-ruby';
import 'ace-builds/src-noconflict/mode-swift';

import 'mongodb-ace-theme';

import styles from './editor.module.less';

class Editor extends PureComponent {
  static displayName = 'EditorComponent';

  static propTypes = {
    language: PropTypes.string,
    value: PropTypes.string.isRequired
  };

  static defaultProps = {
    language: 'javascript'
  }

  componentDidUpdate() {
    this.editor.setValue(this.props.value);
    this.editor.session.setMode(`ace/mode/${this.props.language}`);
    this.editor.clearSelection();
  }

  render() {
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

    const queryStyle = classnames(styles.editor);

    return (
      <div className={queryStyle}>
        <AceEditor
          mode={this.props.language}
          defaultValue=""
          value={this.props.value}
          theme="mongodb"
          width="100%"
          editorProps={{$blockScrolling: Infinity}}
          setOptions={OPTIONS}
          onLoad={(editor) => { this.editor = editor; }}/>
      </div>
    );
  }
}

export default Editor;
