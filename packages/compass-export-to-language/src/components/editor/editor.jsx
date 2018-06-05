import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';

import 'brace/mode/javascript';
import 'brace/mode/csharp';
import 'brace/mode/python';
import 'brace/mode/java';

import 'mongodb-ace-theme';

import styles from './editor.less';

class Editor extends PureComponent {
  static displayName = 'EditorComponent';

  static propTypes = {
    outputQuery: PropTypes.string.isRequired,
    inputQuery: PropTypes.string.isRequired,
    outputLang: PropTypes.string.isRequired,
    queryError: PropTypes.string,
    input: PropTypes.bool
  };

  // need to be able to stringify and add spaces to prettify the object
  componentDidMount() {
    if (this.props.input && this.props.inputQuery !== '') {
      this.editor.setValue(JSON.stringify(JSON.parse(this.props.inputQuery), null, 2));
      this.editor.clearSelection();
    }
  }

  componentDidUpdate() {
    if (!this.props.input) {
      this.editor.session.setMode('ace/mode/' + this.props.outputLang || 'javascript');
      this.editor.setValue(this.props.outputQuery);
      this.editor.clearSelection();
    }

    // set this again in case it's missing
    if (this.props.input && this.props.inputQuery !== '') {
      this.editor.setValue(JSON.stringify(JSON.parse(this.props.inputQuery), null, 2));
      this.editor.clearSelection();
    }
  }

  render() {
    const OPTIONS = {
      tabSize: 2,
      fontSize: 11,
      minLines: 5,
      maxLines: Infinity,
      showGutter: true,
      focus: false,
      readOnly: true,
      highlightActiveLine: false,
      highlightGutterLine: false,
      useWorker: false
    };

    const queryStyle = this.props.queryError
      ? classnames(styles['editor-error'])
      : classnames(styles.editor);

    const value = this.props.input ? '' : this.props.outputQuery;

    return (
      <div className={queryStyle}>
        <AceEditor
          mode="javascript"
          defaultValue=""
          value={value}
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
