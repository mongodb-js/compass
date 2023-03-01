import React, { Component } from 'react';

import { css, cx, palette, withDarkMode } from '@mongodb-js/compass-components';
import type { AceEditor } from '@mongodb-js/compass-editor';
import { Editor, EditorVariant } from '@mongodb-js/compass-editor';

const minEditorHeight = 280;

const editorContainerStyles = css({
  padding: '10px 10px 10px 0',
  height: `${minEditorHeight + 20}px`,
  overflow: 'auto',
  flexBasis: 'auto',
  flexShrink: 1,
  flexGrow: 1,
});

const editorContainerStylesLight = css({
  backgroundColor: palette.gray.light3,
  borderLeft: `3px solid ${palette.gray.light2}`,
});

const editorContainerStylesDark = css({
  backgroundColor: palette.gray.dark4,
  borderLeft: `3px solid ${palette.gray.dark2}`,
});

const editorStyles = css({
  minHeight: `${minEditorHeight}px`,
});

/**
 * The comment block.
 */
const EDITOR_COMMENT = '/** \n* Paste one or more documents here\n*/\n';

type InsertJsonDocumentProps = {
  darkMode?: boolean;
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
    const darkMode = this.props.darkMode;
    let value = this.props.jsonDoc;

    if (this.props.isCommentNeeded) {
      value = `${EDITOR_COMMENT}${this.props.jsonDoc}`;
    }

    return (
      <div
        className={cx(
          editorContainerStyles,
          darkMode ? editorContainerStylesDark : editorContainerStylesLight
        )}
      >
        <Editor
          className={editorStyles}
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
}

export default withDarkMode(InsertJsonDocument);
