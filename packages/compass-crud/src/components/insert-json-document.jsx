import React, { Component } from 'react';
import classnames from 'classnames';
import jsBeautify from 'js-beautify';
import PropTypes from 'prop-types';
import Ace from 'react-ace';

import 'brace/ext/language_tools';
import 'mongodb-ace-mode';
import 'mongodb-ace-theme';

import 'brace/mode/json';

import styles from './insert-json-document.less';

/**
 * The comment block.
 */
const EDITOR_COMMENT = '/** \n* Paste one or more documents here\n*/\n';

/**
 * Ace editor settings.
 */
const OPTIONS = {
  tabSize: 2,
  fontSize: 11,
  minLines: 2,
  maxLines: Infinity,
  showGutter: true,
  readOnly: false,
  highlightActiveLine: true,
  highlightGutterLine: true,
  useWorker: false
};

class InsertJsonDocument extends Component {
  componentDidMount() {
    if (this.props.jsonDoc !== '') {
      let value = jsBeautify(this.props.jsonDoc);

      if (this.props.isCommentNeeded) {
        value = `${EDITOR_COMMENT}${value}`;
      }

      this.editor.setValue(value);
    }
  }

  shouldComponentUpdate(nextProps) {
    return (nextProps.jsonDoc !== this.props.jsonDoc);
  }

  onChange(value) {
    this.props.updateComment(value.includes(EDITOR_COMMENT));
    this.props.updateJsonDoc(value.split('*/\n').pop());
  }

  render() {
    let value = this.props.jsonDoc;

    if (this.props.isCommentNeeded) {
      value = `${EDITOR_COMMENT}${this.props.jsonDoc}`;
    }

    return (
      <div className={classnames(styles.editor)}>
        <Ace
          mode="json"
          defaultValue={EDITOR_COMMENT}
          value={value}
          onChange={this.onChange.bind(this)}
          theme="mongodb"
          width="100%"
          editorProps={{$blockScrolling: Infinity}}
          setOptions={OPTIONS}
          onLoad={(editor) => { this.editor = editor; }}/>
      </div>
    );
  }
}

InsertJsonDocument.displayName = 'InsertJsonDocumentComponent';

InsertJsonDocument.propTypes = {
  updateJsonDoc: PropTypes.func,
  jsonDoc: PropTypes.string,
  isCommentNeeded: PropTypes.bool,
  updateComment: PropTypes.func
};

export default InsertJsonDocument;
