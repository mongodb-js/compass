import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Editor, EditorVariant } from '@mongodb-js/compass-editor';

import styles from './editor.module.less';

class ExportToLanguageEditor extends PureComponent {
  static displayName = 'EditorComponent';

  static propTypes = {
    language: PropTypes.string,
    value: PropTypes.string.isRequired,
  };

  static defaultProps = {
    language: 'javascript',
  };

  componentDidMount() {
    this.setLanguageMode();
  }

  componentDidUpdate() {
    this.editor.setValue(this.props.value);
    this.setLanguageMode();
    this.editor.clearSelection();
  }

  setLanguageMode() {
    // PHP needs some special handling because `<?php` is not included in the
    // generated snippets
    if (this.props.language === 'php') {
      this.editor.session.setMode({
        path: `ace/mode/${this.props.language}`,
        inline: true,
      });
    } else {
      this.editor.session.setMode(`ace/mode/${this.props.language}`);
    }
  }

  render() {
    const queryStyle = classnames(styles.editor);

    return (
      <div className={queryStyle}>
        <Editor
          variant={EditorVariant.Generic}
          mode={this.props.language}
          text={this.props.value}
          options={{
            minLines: 5,
            highlightActiveLine: false,
            highlightGutterLine: false,
          }}
          readOnly
          onLoad={(editor) => {
            this.editor = editor;
          }}
        />
      </div>
    );
  }
}

export default ExportToLanguageEditor;
