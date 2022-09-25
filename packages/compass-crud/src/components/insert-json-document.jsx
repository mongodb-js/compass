import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import { Editor, EditorVariant } from '@mongodb-js/compass-components';

import styles from './insert-json-document.module.less';

/**
 * The comment block.
 */
const EDITOR_COMMENT = '/** \n* Paste one or more documents here\n*/\n';

class InsertJsonDocument extends Component {
  componentDidMount() {
    if (this.props.jsonDoc !== '') {
      let value = this.props.jsonDoc;

      if (this.props.isCommentNeeded) {
        value = `${EDITOR_COMMENT}${value}`;
      }

      this.editor.setValue(value);
    }
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.jsonDoc !== this.props.jsonDoc;
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
      <div className={classnames(styles['editor-container'])}>
        <Editor
          className={classnames(styles.editor)}
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

InsertJsonDocument.displayName = 'InsertJsonDocumentComponent';

InsertJsonDocument.propTypes = {
  updateJsonDoc: PropTypes.func,
  jsonDoc: PropTypes.string,
  isCommentNeeded: PropTypes.bool,
  updateComment: PropTypes.func,
};

export default InsertJsonDocument;
