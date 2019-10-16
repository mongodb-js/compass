import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import jsBeautify from 'js-beautify';


import 'brace/mode/javascript';
import 'brace/mode/csharp';
import 'brace/mode/python';
import 'brace/mode/java';

import 'mongodb-ace-theme';

import styles from './editor.less';

class Editor extends PureComponent {
  static displayName = 'EditorComponent';

  // input query can be an object(empty query) or a string(an actual query) so
  // check for any
  static propTypes = {
    outputLang: PropTypes.string.isRequired,
    transpiledExpression: PropTypes.string.isRequired,
    error: PropTypes.string,
    imports: PropTypes.string.isRequired,
    showImports: PropTypes.bool.isRequired,
    isInput: PropTypes.bool, // display input or output
    from: PropTypes.string.isRequired // filter for query, agg for agg
  };

  // need to be able to stringify and add spaces to prettify the object
  componentDidMount() {
    if (this.props.isInput && this.props.from !== '') {
      this.editor.setValue(jsBeautify(this.props.from));
      this.editor.clearSelection();
    }
  }

  componentDidUpdate() {
    if (!this.props.isInput) {
      if (this.props.error) {
        this.editor.setValue('');
        this.editor.session.setMode('ace/mode/' + this.props.outputLang || 'javascript');
        this.editor.clearSelection();
      } else {
        const output = this.props.showImports && this.props.imports !== '' ?
          this.props.imports + '\n' + this.props.transpiledExpression :
          this.props.transpiledExpression;
        this.editor.setValue(output);
        this.editor.session.setMode('ace/mode/' + this.props.outputLang || 'javascript');
        this.editor.clearSelection();
      }
    } else if (this.props.from !== '') {
      this.editor.setValue(jsBeautify(this.props.from, null, 2));
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
      readOnly: true,
      highlightActiveLine: false,
      highlightGutterLine: false,
      useWorker: false
    };

    const queryStyle = classnames(styles.editor);
    const output = this.props.showImports && this.props.imports !== '' ? this.props.imports + '\n' + this.props.transpiledExpression : this.props.transpiledExpression;

    const to = this.props.error ? '' : output;
    const value = this.props.isInput ? this.props.from : to;

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
