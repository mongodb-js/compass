import React, { Component } from 'react';
import PropTypes from 'prop-types';

import type { AceEditor } from '@mongodb-js/compass-editor';
import { Editor, EditorVariant } from '@mongodb-js/compass-editor';

import styles from './insert-json-document.module.less';

/**
 * The comment block.
 */
const EDITOR_COMMENT = '/** \n* Paste one or more documents here\n*/\n';

type InsertJsonDocumentProps = {
  jsonDoc: string;
  isCommentNeeded: boolean;
  updateComment: (value: boolean) => void;
  updateJsonDoc: (value: string) => void;
};

class InsertJsonDocument extends Component<InsertJsonDocumentProps> {
  editor?: AceEditor;

  componentDidMount() {
    if (this.props.jsonDoc !== '') {
      let value = this.props.jsonDoc;

      if (this.props.isCommentNeeded) {
        value = `${EDITOR_COMMENT}${value}`;
      }

      this.editor?.setValue(value);
    }
  }

  shouldComponentUpdate(nextProps: InsertJsonDocumentProps) {
    return nextProps.jsonDoc !== this.props.jsonDoc;
  }

  onChange(value: string) {
    this.props.updateComment(value.includes(EDITOR_COMMENT));
    this.props.updateJsonDoc(value.split('*/\n').pop() as string);
  }

  render() {
    let value = this.props.jsonDoc;

    if (this.props.isCommentNeeded) {
      value = `${EDITOR_COMMENT}${this.props.jsonDoc}`;
    }

    return (
      <div className={styles['editor-container']}>
        <Editor
          className={styles.editor}
          variant={EditorVariant.EJSON}
          defaultValue={EDITOR_COMMENT}
          text={value}
          onChangeText={this.onChange.bind(this)}
          options={{
            highlightActiveLine: true,
            highlightGutterLine: true,
          }}
          onLoad={(editor) => {
            this.editor = editor;
          }}
        />
      </div>
    );
  }

  static displayName = 'InsertJsonDocumentComponent';

  static propTypes = {
    updateJsonDoc: PropTypes.func,
    jsonDoc: PropTypes.string,
    isCommentNeeded: PropTypes.bool,
    updateComment: PropTypes.func,
  };
}

export default InsertJsonDocument;
